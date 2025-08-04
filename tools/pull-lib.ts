import { NODE_PATH } from '../src/lib/ericchase/NodePlatform.js';
import { Builder } from './core/Builder.js';
import { Processor_Set_Writable } from './core/processor/Processor_Set_Writable.js';
import { Step_FS_Mirror_Directory } from './core/step/Step_FS_Mirror_Directory.js';

Builder.SetStartUpSteps(
  Step_FS_Mirror_Directory({
    from: NODE_PATH.join('C:/Code/Base/JavaScript-TypeScript/Templates/Browser-Extension', 'tools/lib-browser-extension'),
    to: NODE_PATH.join(Builder.Dir.Tools, 'lib-browser-extension'),
    include_patterns: ['**/*'],
  }),
  //
);

Builder.SetProcessorModules(
  Processor_Set_Writable({ exclude_patterns: ['**/*'] }),
  //
);

await Builder.Start();
