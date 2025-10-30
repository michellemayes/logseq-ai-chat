import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { setupIpcHandlers } from './ipc/handlers';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
    frame: process.platform !== 'darwin', // Keep frame on Windows/Linux, hidden on macOS
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (isDev) {
    // In development, load from Vite dev server
    // Wait a bit for Vite to start
    const loadDevURL = () => {
      mainWindow?.loadURL('http://localhost:5173').catch(() => {
        // Retry after a delay if Vite isn't ready yet
        setTimeout(loadDevURL, 1000);
      });
    };
    
    // Wait for Vite server to be ready
    setTimeout(() => {
      loadDevURL();
    }, 1000);

    // Dev tools disabled - remove openDevTools() call
  } else {
    // In production, load from built files
    // When packaged, app.getAppPath() returns the app.asar path
    // The dist-react folder should be alongside the app
    const indexPath = join(app.getAppPath(), '..', 'dist-react', 'index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load production index:', err);
      // Fallback: try relative to __dirname
      const fallbackPath = join(__dirname, '..', 'dist-react', 'index.html');
      mainWindow?.loadFile(fallbackPath);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

