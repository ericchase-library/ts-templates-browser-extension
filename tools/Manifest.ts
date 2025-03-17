import { Worker } from 'node:worker_threads';
import { JSONMerge } from 'src/lib/ericchase/Algorithm/JSON/Merge.js';
import { CPath } from 'src/lib/ericchase/Platform/FilePath.js';
import { CPlatformProvider } from 'src/lib/ericchase/Platform/PlatformProvider.js';
import { Builder } from 'tools/lib/Builder.js';

export class Manifest {
  MANIFEST_REQUIRED: Record<string, any> = {};
  MANIFEST_OPTIONAL: Record<string, any> = {};
  PER_BROWSER_MANIFEST_OPTIONAL: Record<string, any> = {};
  PER_BROWSER_MANIFEST_PACKAGE: Record<string, any> = {};

  browser_names = new Set<string>();
  version = '0.0.0';

  constructor(
    readonly builder: Builder,
    readonly path: CPath,
    readonly platform: CPlatformProvider,
  ) {}

  async reload() {
    const worker_script = `
import { isMainThread, parentPort } from 'node:worker_threads';

var MANIFEST_REQUIRED = {};
var MANIFEST_OPTIONAL = {};
var PER_BROWSER_MANIFEST_OPTIONAL = {};
var PER_BROWSER_MANIFEST_PACKAGE = {};

${await this.builder.platform.File.readText(this.path)}

if (isMainThread) throw new Error('Worker only');

parentPort?.postMessage({
  data: {
    MANIFEST_OPTIONAL: MANIFEST_OPTIONAL ?? {},
    MANIFEST_REQUIRED: MANIFEST_REQUIRED ?? {},
    PER_BROWSER_MANIFEST_OPTIONAL: PER_BROWSER_MANIFEST_OPTIONAL ?? {},
    PER_BROWSER_MANIFEST_PACKAGE: PER_BROWSER_MANIFEST_PACKAGE ?? {},
  },
});
    `;

    try {
      const module: any = await new Promise((resolve, reject) => {
        const worker = new Worker(worker_script, { eval: true });
        worker.on('message', (msg) => {
          if (msg.error) {
            reject(msg.error);
          } else {
            resolve(msg.data);
          }
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
          code ? reject(code) : null;
        });
        worker.postMessage(this.builder.dir.src.getRelative(__filename));
      });

      this.MANIFEST_REQUIRED = module.MANIFEST_REQUIRED ?? {};
      this.MANIFEST_OPTIONAL = module.MANIFEST_OPTIONAL ?? {};
      this.PER_BROWSER_MANIFEST_OPTIONAL = module.PER_BROWSER_MANIFEST_OPTIONAL ?? {};
      this.PER_BROWSER_MANIFEST_PACKAGE = module.PER_BROWSER_MANIFEST_PACKAGE ?? {};

      this.browser_names = new Set(Object.keys(this.PER_BROWSER_MANIFEST_OPTIONAL)).union(new Set(Object.keys(this.PER_BROWSER_MANIFEST_PACKAGE)));
      const { version } = this.MANIFEST_REQUIRED;
      this.version = version;
    } catch (error) {
      console.error(error);
    }
  }

  getPerBrowserManifest(name: string) {
    return JSONMerge(
      this.MANIFEST_REQUIRED,
      this.MANIFEST_OPTIONAL,
      this.PER_BROWSER_MANIFEST_OPTIONAL[name] ?? {},
      //
    );
  }

  getPerBrowserPackageManifest(name: string) {
    return JSONMerge(
      this.MANIFEST_REQUIRED,
      this.MANIFEST_OPTIONAL,
      this.PER_BROWSER_MANIFEST_OPTIONAL[name] ?? {},
      this.PER_BROWSER_MANIFEST_PACKAGE[name] ?? {},
      //
    );
  }
}
