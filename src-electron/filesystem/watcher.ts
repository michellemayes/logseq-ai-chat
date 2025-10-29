import { watch } from 'chokidar';
import { BrowserWindow } from 'electron';
import { scanLogSeqDirectory } from './scanner';
import { buildIndex } from '../graph/index';

let watcher: ReturnType<typeof watch> | null = null;
let debounceTimer: NodeJS.Timeout | null = null;
const DEBOUNCE_MS = 500;

export function watchLogSeqDirectory(path: string): void {
  if (watcher) {
    watcher.close();
  }

  watcher = watch(path, {
    ignored: /(^|[/\\])\../u,
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('all', async (event, filePath) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      try {
        const files = await scanLogSeqDirectory(path);
        buildIndex(files, path);
        
        const windows = BrowserWindow.getAllWindows();
        windows.forEach((win) => {
          win.webContents.send('file-change', { event, filePath });
        });
      } catch (error) {
        console.error('Error re-indexing:', error);
      }
    }, DEBOUNCE_MS);
  });
}

