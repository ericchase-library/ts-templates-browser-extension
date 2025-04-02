import AdmZip from 'adm-zip';
import { CPath, GetSanitizedFileName, Path } from '../../../src/lib/ericchase/Platform/FilePath.js';
import { Logger } from '../../../src/lib/ericchase/Utility/Logger.js';
import { BuilderInternal, Step } from '../../lib/Builder.js';
import { Step_MirrorDirectory } from '../../lib/steps/FS-MirrorDirectory.js';
import { getManifestBrowsers, getPerBrowserManifest, getPerBrowserPackageManifest, MANIFEST_REQUIRED } from '../ManifestCache.js';

const logger = Logger(Step_BrowserExtension_Bundle.name);

export function Step_BrowserExtension_Bundle(release_dirpath: CPath | string): Step {
  return new CStep_BrowserExtension_Bundle(Path(release_dirpath));
}

class CStep_BrowserExtension_Bundle implements Step {
  channel = logger.newChannel();

  constructor(readonly release_dirpath: CPath) {}
  async onRun(builder: BuilderInternal): Promise<void> {
    this.channel.log('Bundle Extension');
    const tasks: Promise<void>[] = [];
    for (const browser_name of getManifestBrowsers()) {
      tasks.push(
        (async () => {
          // build the temp folder
          const dirpath = Path(this.release_dirpath, browser_name, 'temp');
          await Step_MirrorDirectory({ from: builder.dir.out, to: dirpath, include_patterns: ['**/*'] }).onRun?.(builder);
          // inject environment variables
          const envpath = Path(dirpath, builder.dir.lib.slice(1), 'lib.env.module.js');
          const envtext = await builder.platform.File.readText(envpath);
          await builder.platform.File.writeText(envpath, envtext.replace(`var BrowserName = "chrome";`, `var BrowserName = "${browser_name}";`));
          // build the zip
          const admZip = new AdmZip();
          admZip.addLocalFolder(dirpath.raw);
          admZip.addFile('manifest.json', Buffer.from(JSON.stringify(getPerBrowserPackageManifest(browser_name), null, 2), 'utf8'));
          await admZip.writeZipPromise(Path(this.release_dirpath, browser_name, `${GetSanitizedFileName(MANIFEST_REQUIRED.name)}-v${MANIFEST_REQUIRED.version}.zip`).raw);
          // replace bundle manifest with debug manifest
          await builder.platform.File.writeText(Path(dirpath, 'manifest.json'), JSON.stringify(getPerBrowserManifest(browser_name), null, 2));
        })(),
      );
    }
    await Promise.all(tasks);
  }
}
