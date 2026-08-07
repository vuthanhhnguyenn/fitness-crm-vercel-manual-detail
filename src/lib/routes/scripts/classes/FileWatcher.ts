import { spawn } from 'child_process';
import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';

export class FileWatcher implements AsyncDisposable {
  #appPath: string;
  watcher: FSWatcher;

  constructor() {
    this.#appPath = path.resolve(process.cwd(), 'src/app');
    this.watcher = chokidar.watch(this.#appPath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.start();
  }

  start() {
    this.watcher.on('ready', () => {
      console.log('[INFO] Watcher ready');
    });

    this.watcher.on('add', (path) => {
      console.log(`[ADD] File ${path} has been added`);
      spawn('tsx', ['src/lib/routes/scripts/generate-routes.ts']);
    });

    this.watcher.on('unlink', (path) => {
      console.log(`[UNLINK] File ${path} has been removed`);
      spawn('tsx', ['src/lib/routes/scripts/generate-routes.ts']);
    });

    this.watcher.on('error', (error) => {
      console.error(`[ERROR] Watcher error: ${error}`);
    });
  }

  async #cleanup() {
    try {
      this.watcher.close();
      console.log('[INFO] Watcher closed');
    } catch (error) {
      console.error(`[ERROR] Watcher error: ${error}`);
    }
  }

  [Symbol.asyncDispose]() {
    return this.#cleanup();
  }
}
