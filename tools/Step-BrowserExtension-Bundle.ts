import { Path } from 'src/lib/ericchase/Platform/FilePath.js';
import { Logger } from 'src/lib/ericchase/Utility/Logger.js';
import { ToSnakeCase } from 'src/lib/ericchase/Utility/String.js';
import { BuilderInternal, Step } from 'tools/lib/Builder.js';
import { Step_ArchiveDirectory } from 'tools/lib/steps/FS-ArchiveDirectory.js';
import { Step_MirrorDirectory } from 'tools/lib/steps/FS-MirrorDirectory.js';
import { getManifestBrowsers, getPerBrowserManifest, getPerBrowserPackageManifest, MANIFEST_REQUIRED } from 'tools/ManifestCache.js';

const logger = Logger(Step_BrowserExtension_Bundle.name);

export function Step_BrowserExtension_Bundle(): Step {
  return new CStep_BrowserExtension_Bundle();
}

class CStep_BrowserExtension_Bundle implements Step {
  channel = logger.newChannel();

  async end(builder: BuilderInternal) {}
  async run(builder: BuilderInternal) {
    this.channel.log('Bundle Extension');
    const tasks: Promise<void>[] = [];
    for (const browser of getManifestBrowsers()) {
      tasks.push(
        (async () => {
          const path = Path('release', browser, 'temp');
          // copy the built extension files
          await Step_MirrorDirectory({ from: builder.dir.out, to: path, include_patterns: ['**/*'], exclude_patterns: ['manifest.json'] }).run(builder);
          // write the per browser package manifest
          await builder.platform.File.writeText(Path(path, 'manifest.json'), JSON.stringify(getPerBrowserPackageManifest(browser)));
          // package the extension
          await Step_ArchiveDirectory(path, Path('release', browser, `${ToSnakeCase(MANIFEST_REQUIRED.name)}-v${MANIFEST_REQUIRED.version}.zip`)).run(builder);
          // write the per browser non-package manifest for debugging purposes
          await builder.platform.File.writeText(Path(path, 'manifest.json'), JSON.stringify(getPerBrowserManifest(browser)));
        })(),
      );
    }
    await Promise.all(tasks);
  }
}
