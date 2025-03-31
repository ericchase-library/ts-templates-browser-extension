import { CPath, Path } from '../src/lib/ericchase/Platform/FilePath.js';
import { Logger } from '../src/lib/ericchase/Utility/Logger.js';
import { BuilderInternal, ProcessorModule, ProjectFile } from './lib/Builder.js';
import { updateManifest } from './ManifestCache.js';

const logger = Logger(Processor_UpdateManifestCache.name);

export function Processor_UpdateManifestCache(manifest_path: CPath | string): ProcessorModule {
  return new CProcessor_UpdateManifestCache(Path(manifest_path));
}

class CProcessor_UpdateManifestCache implements ProcessorModule {
  channel = logger.newChannel();

  constructor(readonly manifest_path: CPath) {}
  async onAdd(builder: BuilderInternal, files: Set<ProjectFile>): Promise<void> {
    for (const file of files) {
      if (file.src_path.equals(this.manifest_path)) {
        file.addProcessor(this, this.onProcess);
      }
    }
  }

  async onProcess(builder: BuilderInternal, file: ProjectFile): Promise<void> {
    this.channel.log('Update Manifest Cache');
    await updateManifest(builder, file);
  }
}
