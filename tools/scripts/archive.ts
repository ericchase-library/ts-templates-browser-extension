import { RunSync } from '../../src/lib/ericchase/Platform/Bun/Child Process.js';
import { command_map } from '../dev.js';
import { Cache_FileStats_Lock, Cache_FileStats_Unlock } from '../lib/cache/FileStatsCache.js';
import { Cache_Unlock, TryLock, TryLockEach } from '../lib/cache/LockCache.js';
import { build_mode, buildStep_Archive, buildStep_Clean, buildStep_Copy, buildStep_Manifest, buildStep_ProcessHTMLFiles, buildStep_Rename, buildStep_SetupBundler } from './build.js';

TryLockEach([command_map.archive, command_map.build, command_map.format]);

build_mode.archive = true;

const args = Bun.argv.slice(2);
const quick_run = args.includes('fast');

if (quick_run) {
  build_mode.silent = true;
  if (Cache_FileStats_Lock()) {
    await buildStep_Clean();
    await buildStep_SetupBundler();
    await buildStep_ProcessHTMLFiles();
    await buildStep_Copy();
    await buildStep_Manifest();
    await buildStep_Rename();
    await buildStep_Archive();
    Cache_FileStats_Unlock();
  }
  Cache_Unlock(command_map.format);
} else {
  TryLock(command_map.format);
  RunSync.Bun('update');
  Cache_Unlock(command_map.format);
  RunSync.BunRun('format', 'silent');
  TryLock(command_map.format);
  if (Cache_FileStats_Lock()) {
    await buildStep_Clean();
    await buildStep_SetupBundler();
    await buildStep_ProcessHTMLFiles();
    await buildStep_Copy();
    await buildStep_Manifest();
    await buildStep_Rename();
    Cache_FileStats_Unlock();
  }
  Cache_Unlock(command_map.format);
  RunSync.BunRun('format');
  TryLock(command_map.format);
  if (Cache_FileStats_Lock()) {
    await buildStep_Archive();
    Cache_FileStats_Unlock();
  }
}
