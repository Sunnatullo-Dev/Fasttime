import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        // Step 2 – Update BrowserWindow icon configuration
        icon: path.join(__dirname, process.platform === 'win32' ? 'assets/icon.ico' : 'assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    // Load from local Vite/Server or Dist
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:3000');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    // Clear cache issues - Step 4
    mainWindow.webContents.session.clearCache();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
