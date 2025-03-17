import { CPath } from 'src/lib/ericchase/Platform/FilePath.js';
import { Logger } from 'src/lib/ericchase/Utility/Logger.js';
import { BuilderInternal, ProcessorModule, ProjectFile } from 'tools/lib/Builder.js';

const logger = Logger(Processor_TypeScript_BuildManifest.name);

export function Processor_TypeScript_BuildManifest(path: CPath): ProcessorModule {
  return new CProcessor_TypeScript_BuildManifest(path);
}

class CProcessor_TypeScript_BuildManifest implements ProcessorModule {
  logger = logger.newChannel();

  constructor(readonly path: CPath) {}

  async onAdd(builder: BuilderInternal, files: Set<ProjectFile>) {
    for (const file of files) {
      if (file.src_path.equals(this.path)) {
        console.log(file.src_path.raw);
        file.out_path.ext = '.js';
        file.addProcessor(this, this.onProcessFile);
      }
    }
  }
  async onRemove(builder: BuilderInternal, files: Set<ProjectFile>): Promise<void> {}

  async onProcessFile(builder: BuilderInternal, file: ProjectFile): Promise<void> {
    const build_results = await Bun.build({
      entrypoints: [file.src_path.raw],
      external: [],
      format: 'esm',
      minify: {
        identifiers: false,
        syntax: false,
        whitespace: false,
      },
      sourcemap: 'none',
      target: 'browser',
    });
    if (build_results.success === true) {
      for (const artifact of build_results.outputs) {
        switch (artifact.kind) {
          case 'entry-point':
            file.setText(await artifact.text());
            await file.write();
            break;
        }
      }
    } else {
      this.logger.errorWithDate(`ERROR: Processor: ${__filename}, File: ${file.src_path}`);
      for (const log of build_results.logs) {
        this.logger.log(log.message);
      }
      this.logger.log();
    }
  }
}
