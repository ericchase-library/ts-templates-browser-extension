import { Path } from 'src/lib/ericchase/Platform/FilePath.js';
import { Builder, BuilderInternal, Step } from 'tools/lib/Builder.js';
import { Step_Bun_Run } from 'tools/lib/steps/Bun-Run.js';
import { Step_Project_PullLib } from 'tools/lib/steps/Dev-Project-PullLib.js';

// This script pulls base lib files from another project. I use it for quickly
// updating templates and concrete projects.

const builder = new Builder();

builder.setStartupSteps([
  Step_Bun_Run({ cmd: ['bun', 'install'] }, 'quiet'),
  Step_Project_PullLib('C:/Code/Base/Javascript-Typescript/Project@Template'),
  //
]);

builder.setCleanupSteps([
  // Easier to do this than modify the PullLib step.
  new (class DeleteUnwantedLib implements Step {
    async end(builder: BuilderInternal) {}
    async run(builder: BuilderInternal) {
      builder.platform.Directory.delete(Path('database'));
      builder.platform.Directory.delete(Path(builder.dir.lib, 'database'));
      builder.platform.Directory.delete(Path('server'));
      builder.platform.Directory.delete(Path(builder.dir.lib, 'server'));
    }
  })(),
  //
]);

await builder.start();
