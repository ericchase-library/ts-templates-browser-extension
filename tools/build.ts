import { BunPlatform_Args_Has } from '../src/lib/ericchase/BunPlatform_Args_Has.js';
import { NODE_PATH } from '../src/lib/ericchase/NodePlatform.js';
import { Step_Dev_Format } from './core-dev/step/Step_Dev_Format.js';
import { Step_Dev_Project_Sync_Config } from './core-dev/step/Step_Dev_Project_Sync_Config.js';
import { Processor_HTML_Custom_Component_Processor } from './core-web/processor/Processor_HTML_Custom_Component_Processor.js';
import { Step_Dev_Server } from './core-web/step/Step_Dev_Server.js';
import { Builder } from './core/Builder.js';
import { Processor_Set_Writable } from './core/processor/Processor_Set_Writable.js';
import { PATTERN, Processor_TypeScript_Generic_Bundler } from './core/processor/Processor_TypeScript_Generic_Bundler.js';
import { Processor_TypeScript_Generic_Transpiler } from './core/processor/Processor_TypeScript_Generic_Transpiler.js';
import { Step_Bun_Run } from './core/step/Step_Bun_Run.js';
import { Step_FS_Clean_Directory } from './core/step/Step_FS_Clean_Directory.js';
import { Processor_Browser_Extension_Update_Manifest_Cache } from './lib-browser-extension/processors/Processor_Browser_Extension_Update_Manifest_Cache.js';
import { Step_Browser_Extension_Bundle } from './lib-browser-extension/steps/Step_Browser_Extension_Bundle.js';

if (BunPlatform_Args_Has('--dev')) {
  Builder.SetMode(Builder.MODE.DEV);
}
Builder.SetVerbosity(Builder.VERBOSITY._1_LOG);

// These steps are run during the startup phase only.
Builder.SetStartUpSteps(
  Step_Bun_Run({ cmd: ['bun', 'update', '--latest'], showlogs: false }),
  Step_Bun_Run({ cmd: ['bun', 'install'], showlogs: false }),
  Step_FS_Clean_Directory(Builder.Dir.Out),
  Step_Dev_Project_Sync_Config({ project_path: './' }),
  Step_Dev_Format({ showlogs: false }),
  //
);

// These steps are run before each processing phase.
Builder.SetBeforeProcessingSteps();

// Basic setup for a typescript powered project. Typescript files that match
// "*.module.ts" and "*.iife.ts" are bundled and written to the out folder.
// The other typescript files do not produce bundles. Module ("*.module.ts")
// files will not bundle other module files. Instead, they'll import whatever
// exports are needed from other module files. IIFE ("*.iife.ts") files, on
// the other hand, produce fully contained bundles. They do not import anything
// from anywhere. Use them accordingly.

// HTML custom components are a lightweight alternative to web components made
// possible by the processors below.

// The processors are run for every file that added them during every
// processing phase.
Builder.SetProcessorModules(
  // Process the custom html components.
  Processor_HTML_Custom_Component_Processor(),
  // Transpile the manifest file; no need to write it out.
  Processor_TypeScript_Generic_Transpiler({ include_patterns: [NODE_PATH.join(Builder.Dir.Src, 'manifest.ts')] }, { target: 'browser' }),
  Processor_Browser_Extension_Update_Manifest_Cache({ manifest_path: NODE_PATH.join(Builder.Dir.Src, 'manifest.ts') }),
  // Bundle the modules.
  Processor_TypeScript_Generic_Bundler({ target: 'browser' }),
  // Write non-bundle files and non-library files.
  Processor_Set_Writable({ include_patterns: ['**/*'], exclude_patterns: ['**/*.ts', '**/*{.bat,.svg}'] }, { include_libdir: false }),
  // Write bundled files.
  Processor_Set_Writable({ include_patterns: [`**/*${PATTERN.MODULE_IIFE}`] }, { include_libdir: true }),
  //
);

// These steps are run after each processing phase.
Builder.SetAfterProcessingSteps(
  // During "dev" mode (when "--watch" is passed as an argument), the server
  // will start running with hot refreshing if enabled in your index file.
  Step_Dev_Server(),
  Step_Browser_Extension_Bundle({ release_dir: 'release' }),
  //
);

// These steps are run during the shutdown phase only.
Builder.SetCleanUpSteps();

await Builder.Start();
