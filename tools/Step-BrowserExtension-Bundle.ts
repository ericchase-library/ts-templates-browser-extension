import AdmZip from 'adm-zip';
import { CPath, GetSanitizedFileName, Path } from '../src/lib/ericchase/Platform/FilePath.js';
import { Logger } from '../src/lib/ericchase/Utility/Logger.js';
import { BuilderInternal, Step } from './lib/Builder.js';
import { Step_MirrorDirectory } from './lib/steps/FS-MirrorDirectory.js';
import { getManifestBrowsers, getPerBrowserManifest, getPerBrowserPackageManifest, MANIFEST_REQUIRED } from './ManifestCache.js';

const logger = Logger(Step_BrowserExtension_Bundle.name);

export function Step_BrowserExtension_Bundle(release_dirpath: CPath | string): Step {
  return new CStep_BrowserExtension_Bundle(Path(release_dirpath));
}

class CStep_BrowserExtension_Bundle implements Step {
  channel = logger.newChannel();

  constructor(readonly release_dirpath: CPath) {}
  async end(builder: BuilderInternal) {}
  async run(builder: BuilderInternal) {
    this.channel.log('Bundle Extension');
    const tasks: Promise<void>[] = [];
    for (const browser of getManifestBrowsers()) {
      tasks.push(
        (async () => {
          // build the zip
          const admZip = new AdmZip();
          admZip.addLocalFolder(builder.dir.out.raw);
          admZip.addFile('manifest.json', Buffer.from(JSON.stringify(getPerBrowserPackageManifest(browser), null, 2), 'utf8'));
          await admZip.writeZipPromise(Path(this.release_dirpath, browser, `${GetSanitizedFileName(MANIFEST_REQUIRED.name)}-v${MANIFEST_REQUIRED.version}.zip`).raw);
          // const stats = await builder.platform.Path.getStats(this.outpath);
          // if (stats.isFile() === true) {
          //   this.channel.log(`ZIP: [${stats.size}] ${this.outpath.raw}`);
          // }
        })(),
        (async () => {
          // build the temp addon folder for debugging
          const dirpath = Path(this.release_dirpath, browser, 'temp');
          await Step_MirrorDirectory({ from: builder.dir.out, to: dirpath, include_patterns: ['**/*'] }).run(builder);
          await builder.platform.File.writeText(Path(dirpath, 'manifest.json'), JSON.stringify(getPerBrowserManifest(browser), null, 2));
        })(),
      );
    }
    await Promise.all(tasks);
  }
}
