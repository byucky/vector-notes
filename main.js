const { app, BrowserWindow } = require('electron');
const path = require('path');

// Import the main process handlers - this will register all IPC handlers
const electronMain = require('./dist/electron/electron/main.js');

function createWindow() {
    const win = new BrowserWindow({ 
        width: 1800, 
        height: 1200,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'dist/electron/electron/preload.js')
        }
    });
    
    // Load the Angular app
    win.loadFile('dist/vector-notes/browser/index.html');
    
    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        win.webContents.openDevTools();
    }
}

// This will be called when Electron has finished initialization
app.whenReady().then(async () => {
    // Initialize the database
    if (electronMain.initializeDatabase) {
        await electronMain.initializeDatabase();
    }
    
    createWindow();
    
    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Close the database when the app is about to quit
app.on('will-quit', () => {
    if (electronMain.cleanupDatabase) {
        electronMain.cleanupDatabase();
    }
});