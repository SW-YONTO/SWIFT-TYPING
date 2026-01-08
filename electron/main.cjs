const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  // Get the correct icon path based on environment
  // Use PNG for better cross-platform support
  let iconPath;
  
  if (isDev) {
    // Development: use PNG from public folder
    iconPath = path.join(__dirname, '../public/favicon_io/android-chrome-512x512.png');
  } else {
    // Production: try multiple locations
    const fs = require('fs');
    const possiblePaths = [
      path.join(process.resourcesPath, 'icon.png'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'icon.png'),
      path.join(__dirname, '../public/favicon_io/android-chrome-512x512.png')
    ];
    
    // Use first existing path
    iconPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    fullscreen: true,
    autoHideMenuBar: true,
    title: 'Swift Typing',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      // Disable default zoom behavior so our app can handle it
      zoomFactor: 1.0,
    },
  });

  // Set the app user model ID for Windows (important for taskbar icon)
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.swifttyping.app');
  }

  // Disable Electron's default zoom keyboard shortcuts
  // This allows our React app to handle Ctrl++/- for font size
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && (input.key === '+' || input.key === '=' || input.key === '-' || input.key === '0')) {
      // Let the event through to the renderer (don't block it)
      // But prevent Electron's default zoom
    }
  });

  // Prevent zoom via webContents
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1);

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Enter fullscreen mode (F11)
  mainWindow.setFullScreen(true);
  
  // Hide menu bar
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
