import { JSONGet } from '../src/lib/ericchase/Algorithm/JSON.js';
import { RunSync } from '../src/lib/ericchase/Platform/Bun/Child Process.js';
import { Path } from '../src/lib/ericchase/Platform/Node/Path.js';
import { StdinRawModeReader } from '../src/lib/ericchase/Platform/Node/Process.js';
import { KEYS } from '../src/lib/ericchase/Platform/Node/Shell.js';
import { ConsoleError } from '../src/lib/ericchase/Utility/Console.js';
import { HelpMessage } from '../src/lib/ericchase/Utility/HelpMessage.js';
import { PrepareMessage } from '../src/lib/ericchase/Utility/PrepareMessage.js';
import { has7z } from './lib/archive.js';
import { TryLock } from './lib/cache/LockCache.js';

export const command_map = {
  build: new Path('tools/scripts/build.ts').path,
  dev: new Path('tools/scripts/dev.ts').path,
  format: new Path('tools/lib/format.ts').path,
  watch: new Path('tools/scripts/watch.ts').path,
  // archive
  archive: new Path('tools/scripts/archive.ts').path,
  package: new Path('tools/scripts/archive.ts').path,
  zip: new Path('tools/scripts/archive.ts').path,
  // assets
  assets: new Path('tools/scripts/build-assets.ts').path,
};

if (Bun.argv[1] === __filename) {
  const command = Bun.argv.at(2);
  const command_args = Bun.argv.slice(3);

  if (command === undefined || command.trim() === 'watch') {
    const help_message = `
      Keypress Commands:
        'q' to quit
        'r' to restart the watcher
        'b' to restart the watcher after a full rebuild

      SIGINT [Ctrl-C] Will Force Quit.
    `;
    const help = new HelpMessage(PrepareMessage(help_message, 4, 1, 1));

    const stdin = new StdinRawModeReader();

    // CLI: Force Quit Watcher
    stdin.addHandler(async (text) => {
      if (text === KEYS.SIGINT) {
        await stdin.stop();
        watcher_process?.stdin.write(`${KEYS.SIGINT}`);
        await Bun.sleep(25);
        watcher_process?.kill();
        await watcher_process?.exited;
        process.exit();
      }
    });

    TryLock(command_map.dev);

    function run_watcher() {
      return Bun.spawn(['bun', command_map.watch], { stdin: 'pipe', stdout: 'inherit' });
    }

    let watcher_process = run_watcher();

    stdin.addHandler(async (text, actions) => {
      const q = text === 'q';
      const r = text === 'r';
      const b = text === 'b';

      if (q || r || b) {
        ConsoleError('Waiting for Watcher to Exit');
        actions.stopHandlerChain();
        watcher_process.stdin.write(`${KEYS.SIGINT}`);
        await watcher_process.exited;
      }

      switch (text) {
        // CLI: Safe Shutdown
        case 'q': {
          await stdin.stop();
          process.exit();
          break;
        }
        // CLI: Restart Watcher
        case 'r': {
          ConsoleError('Starting Watcher');
          watcher_process = run_watcher();
          break;
        }
        // CLI: Run Full Build
        case 'b': {
          ConsoleError('Full Rebuild');
          RunSync.BunRun('build');
          ConsoleError('Starting Watcher');
          watcher_process = run_watcher();
          break;
        }
        // Passthrough Keys
        // case 'h': // Toggle Hot Reloading
        //   watcher_process.stdin.write(text);
        //   break;
        default:
          help.print();
          break;
      }
    });

    stdin.start();
  } else {
    const script = JSONGet(command_map, command);
    if (script) {
      if (script === command_map.archive) {
        if (has7z() === false) {
          const message = `
            Archiving 7z is not installed or could not be found.
            The npm archiver package can be used instead.
            To install npm archiver and continue, press "y".
          `;
          ConsoleError(PrepareMessage(message, 0, 1, 1));
          await new Promise<void>((resolve) => {
            const stdin = new StdinRawModeReader();
            stdin.addHandler(async (text) => {
              if (text === 'y') {
                RunSync.Bun('add', '-d', 'archiver');
              }
              await stdin.stop();
              resolve();
            });
          });
        }
      }
      RunSync.Bun(script, ...command_args);
    } else {
      ConsoleError(`Invalid Command > ${command}`);
    }
  }
}
