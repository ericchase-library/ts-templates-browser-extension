import { Broadcast } from '../../src/lib/ericchase/Design Pattern/Observer/Broadcast.js';
import { RunSync } from '../../src/lib/ericchase/Platform/Bun/Child Process.js';
import { GlobScanner } from '../../src/lib/ericchase/Platform/Bun/Glob.js';
import { CleanDirectory, RenameFile } from '../../src/lib/ericchase/Platform/Node/Fs.js';
import { Path, SanitizeFileName } from '../../src/lib/ericchase/Platform/Node/Path.js';
import { AssertString } from '../../src/lib/ericchase/Utility/Assert.js';
import { ConsoleLogWithDate, ConsoleNewline } from '../../src/lib/ericchase/Utility/Console.js';
import { ToSnakeCase } from '../../src/lib/ericchase/Utility/String.js';
import { command_map } from '../dev.js';
import { archive } from '../lib/archive.js';
import { BuildRunner, copy, IntoPatterns, processHTML } from '../lib/build.js';
import { Cache_FileStats_Lock, Cache_FileStats_Reset, Cache_FileStats_Unlock } from '../lib/cache/FileStatsCache.js';
import { Cache_Unlock, TryLock, TryLockEach } from '../lib/cache/LockCache.js';
import { IIFEWrapperPreprocessor } from '../lib/preprocessors/FilePreprocessor_IIFEWrapper.js';
import { ImportConverterPreprocessor } from '../lib/preprocessors/HTMLPreprocessor_ImportConverter.js';
import { Manifest } from './load-manifest.js';

// user config
const source_extensions = ['.ts', '.tsx']; // extensions for source files for building
const module_suffixes = ['.module']; // bundled into modules      ie. `name.module.ts`
const script_suffixes = ['.script']; // bundled into iife scripts ie. `name.script.ts`

// directories
export const out_dir = new Path('build'); // browser folders will appear here
export const src_dir = new Path('src'); // all addon files go here
export const lib_dir = new Path('lib'); // for exclusions
export const pkg_dir = new Path('release'); // folder for packaged addons

// manifest
export const manifest_path = src_dir.appendSegment('manifest.ts');
const manifest = new Manifest(manifest_path);
const manifest_mark = manifest.GetManifestMark();

// temp directories
export const tmp_dir = out_dir.newBase(`${out_dir.base}_temp`); // temp folder for build process

// computed patterns
const source_patterns = IntoPatterns('**/*', source_extensions); // for build
const module_patterns = IntoPatterns('**/*', module_suffixes, source_extensions); // for build
const script_patterns = IntoPatterns('**/*', script_suffixes, source_extensions);
const external_import_patterns = IntoPatterns('*', module_suffixes, '.js'); // for build: external
const lib_patterns = [lib_dir.appendSegment('**/*').standard_path];

// preprocessors
const iife_wrapper = new IIFEWrapperPreprocessor(script_suffixes.map((suffix) => `${suffix}.js`));
const import_converter = new ImportConverterPreprocessor(
  ...source_extensions.map((ext) => [ext, '.js'] as const), //
);
const file_renamer: (readonly [string, string])[] = [];

// build mode
export const build_mode = {
  archive: false,
  silent: false,
  watch: false,
};

// bundler
const bundler = new BuildRunner();
bundler.broadcast.subscribe(() => {
  for (const line of bundler.output) {
    if (line.length > 0) {
      onLog(`bund: ${line}`);
    }
  }
  bundler.output = [];
});

// step: clean
export async function buildStep_Clean() {
  bundler.killAll();
  Cache_FileStats_Reset();
  await CleanDirectory(out_dir);
  await CleanDirectory(tmp_dir);
}

// step: setup bundler
export async function buildStep_SetupBundler() {
  const sourcemap = build_mode.watch === true ? 'inline' : 'none';
  const external = [...external_import_patterns];
  const watch = build_mode.watch;
  // modules
  for (const entry of new GlobScanner().scan(src_dir, ...module_patterns).path_groups) {
    bundler.add({ entrypoint: entry, outdir: tmp_dir, sourcemap, external, watch });
  }
  // scripts
  for (const entry of new GlobScanner().scan(src_dir, ...script_patterns).path_groups) {
    bundler.add({ entrypoint: entry, outdir: tmp_dir, sourcemap, external: [], watch });
  }
  if (build_mode.watch === false) {
    await Promise.allSettled([...bundler.subprocess_map].map(([_, process]) => process.exited));
  }
}

// step: process html
export async function buildStep_ProcessHTMLFiles() {
  const processed_html_paths = await processHTML({
    out_dir: tmp_dir,
    to_process: new GlobScanner().scan(src_dir, '**/*.html'),
    to_exclude: new GlobScanner().scan(src_dir, ...lib_patterns),
    preprocessors: [import_converter],
  });
  for (const path of processed_html_paths.paths) {
    onLog(`html: ${path}`);
  }
}

// step: copy
export async function buildStep_Copy() {
  const browser_dirs = manifest.GetBrowserDirectories(out_dir);
  const src_copied_paths = await copy({
    out_dirs: [...browser_dirs],
    to_copy: new GlobScanner().scan(src_dir, '**/*'),
    to_exclude: new GlobScanner().scan(src_dir, '**/*.html', ...source_patterns, ...lib_patterns),
  });
  const tmp_copied_paths = await copy({
    out_dirs: [...browser_dirs],
    to_copy: new GlobScanner().scan(tmp_dir, '**/*'), // exclude nothing
    preprocessors: [iife_wrapper],
  });
  const copied_paths = new Set([
    ...src_copied_paths.paths, //
    ...tmp_copied_paths.paths,
  ]);
  for (const path of copied_paths) {
    onLog(`copy: ${path}`);
  }
  if (build_mode.watch === false) {
    onLog(`${copied_paths.size} files copied.`);
  }
}

// step: manifest
export async function buildStep_Manifest() {
  if (manifest_mark.updated === true) {
    manifest_mark.reset();
    for (const { browser_name, browser_manifest } of manifest.GetBrowserManifests(build_mode.archive)) {
      await Bun.write(out_dir.appendSegment(browser_name).appendSegment('manifest.json').path, JSON.stringify(browser_manifest));
    }
    onLog(`copy: ${manifest_path.path}`);
  }
}

// step: rename
export async function buildStep_Rename() {
  for (const [from, to] of file_renamer) {
    for (const path_group of new GlobScanner().scan(out_dir, `**/*${from}`).path_groups) {
      const path = path_group.path;
      await RenameFile(path_group, new Path(path.slice(0, path.lastIndexOf(from)) + to));
      onLog(`move: ${path}`);
    }
  }
}

// step: archive
export async function buildStep_Archive() {
  const name = manifest.GetManifestItem('MANIFEST_REQUIRED', 'name');
  const version = manifest.GetManifestItem('MANIFEST_REQUIRED', 'version');
  if (AssertString(name) && AssertString(version)) {
    const tasks: Promise<void>[] = [];
    for (const browser_name of manifest.GetBrowserNames()) {
      const archive_name = SanitizeFileName(`${ToSnakeCase(name)}-v${version}.zip`);
      tasks.push(
        archive({
          in_dir: out_dir.appendSegment(browser_name),
          out_path: pkg_dir.appendSegment(browser_name).appendSegment(archive_name),
        }),
      );
    }
    await Promise.allSettled(tasks);
  }
}

// logger
export const on_log = new Broadcast<void>();
export function onLog(data: string) {
  if (build_mode.silent === false) {
    ConsoleLogWithDate(data);
    on_log.send();
  }
}

// direct run
if (Bun.argv[1] === __filename) {
  TryLockEach([command_map.build, command_map.format]);

  RunSync.Bun('update');
  Cache_Unlock(command_map.format);
  RunSync.BunRun('format', 'silent');
  TryLock(command_map.format);

  ConsoleNewline();
  if (Cache_FileStats_Lock()) {
    await buildStep_Clean();
    await buildStep_SetupBundler();
    await buildStep_ProcessHTMLFiles();
    await buildStep_Copy();
    await buildStep_Manifest();
    await buildStep_Rename();
  }
  Cache_FileStats_Unlock();
  ConsoleNewline();

  Cache_Unlock(command_map.format);
  RunSync.BunRun('format');
}
