import { IntoPattern, Path } from '../src/lib/ericchase/Platform/FilePath.js';
import { Processor_UpdateManifestCache } from './lib-browser-extension/processors/Dev-UpdateManifestCache.js';
import { Step_BrowserExtension_Bundle } from './lib-browser-extension/steps/Step-BrowserExtension-Bundle.js';
import { Builder } from './lib/Builder.js';
import { Processor_BasicWriter } from './lib/processors/FS-BasicWriter.js';
import { Processor_HTML_CustomComponent } from './lib/processors/HTML-CustomComponent.js';
import { Processor_HTML_ImportConverter } from './lib/processors/HTML-ImportConverter.js';
import { Processor_TypeScript_GenericBundlerImportRemapper } from './lib/processors/TypeScript-GenericBundler-ImportRemapper.js';
import { pattern, Processor_TypeScript_GenericBundler } from './lib/processors/TypeScript-GenericBundler.js';
import { Processor_TypeScript_GenericTranspiler } from './lib/processors/TypeScript-GenericTranspiler.js';
import { Step_Bun_Run } from './lib/steps/Bun-Run.js';
import { Step_DevServer } from './lib/steps/Dev-Server.js';
import { Step_CleanDirectory } from './lib/steps/FS-CleanDirectory.js';
import { Step_Format } from './lib/steps/FS-Format.js';

// Use command line arguments to set watch mode.
const builder = new Builder(Bun.argv[2] === '--watch' ? 'watch' : 'build');

// These steps are run during the startup phase only.
builder.setStartUpSteps(
  Step_Bun_Run({ cmd: ['bun', 'install'] }, 'quiet'),
  Step_CleanDirectory(builder.dir.out),
  Step_Format('quiet'),
  //
);

// These steps are run before each processing phase.
builder.setBeforeProcessingSteps();

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
builder.setProcessorModules(
  Processor_HTML_CustomComponent(),
  Processor_HTML_ImportConverter(),
  // Transpile the manifest file; no need to write it out.
  Processor_TypeScript_GenericTranspiler([IntoPattern(builder.dir.src, 'manifest.ts')], [], { target: 'browser' }),
  Processor_UpdateManifestCache(Path(builder.dir.src, 'manifest.ts')),
  // Bundle the modules.
  Processor_TypeScript_GenericBundler({}),
  Processor_TypeScript_GenericBundlerImportRemapper(),
  // Write non-bundle files and non-library files.
  Processor_BasicWriter(['**/*'], ['**/*{.ts,.tsx,.jsx}', IntoPattern(builder.dir.lib, '**/*'), '**/*{.bat,.svg}']),
  // Write bundled files.
  Processor_BasicWriter([`**/*${pattern.moduleoriife}`], []),
  //
);

// These steps are run after each processing phase.
builder.setAfterProcessingSteps(
  // During "dev" mode (when "--watch" is passed as an argument), the server
  // will start running with hot refreshing if enabled in your index file.
  Step_DevServer(),
  Step_BrowserExtension_Bundle('release'),
  //
);

// These steps are run during the shutdown phase only.
builder.setCleanUpSteps();

await builder.start();
