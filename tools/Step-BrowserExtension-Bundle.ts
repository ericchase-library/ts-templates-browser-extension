import { Debounce } from 'src/lib/ericchase/Utility/Debounce.js';
import { Logger } from 'src/lib/ericchase/Utility/Logger.js';
import { BuilderInternal, Step } from 'tools/lib/Builder.js';

const logger = Logger(Step_BrowserExtension_Bundle.name);

export function Step_BrowserExtension_Bundle(): Step {
  return new CStep_BrowserExtension_Bundle();
}

class CStep_BrowserExtension_Bundle implements Step {
  logger = logger.newChannel();

  onchange() {
    try {
      logger.log('bundle the browsers');
    } catch (error) {}
  }
  unwatch?: () => void;

  async run(builder: BuilderInternal) {
    if (builder.watchmode === true) {
      const onchange = Debounce(() => this.onchange(), 1000);
      this.unwatch = builder.platform.Directory.watch(builder.dir.out, onchange);
    }
  }
}
