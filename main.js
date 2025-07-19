const { app, BrowserWindow } = require('electron');
const path = require('path');

// Import the main process handlers
require('./dist/electron/electron/main.js');

function createWindow() {
    const win = new BrowserWindow({ 
        width: 1800, 
        height: 1200,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'dist/electron/electron/preload.js') // Make sure this points to the compiled preload script
        }
    });
    
    win.loadFile('dist/vector-notes/browser/index.html');
}

app.whenReady().then(() => {
    createWindow()
});