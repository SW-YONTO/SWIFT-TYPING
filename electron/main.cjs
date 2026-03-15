const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  // Set the app user model ID for Windows BEFORE creating window (critical for taskbar icon)
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.swifttyping.app');
  }

  // Get the correct icon path based on environment
  const possiblePaths = [
    path.join(__dirname, '../public/ICONS/SWIFTLOGO.ico'),  // Dev/testing - public folder
    path.join(__dirname, '../public/ICONS/icon.png'),       // Dev/testing fallback
    path.join(__dirname, '../dist/ICONS/SWIFTLOGO.ico'),    // Production packaged - dist folder
    path.join(__dirname, '../dist/ICONS/icon.png'),         // Production packaged fallback
    path.join(process.resourcesPath || '', 'SWIFTLOGO.ico'), // Production resources outside asar
    path.join(process.resourcesPath || '', 'icon.ico')
  ];

  // Use first existing path
  const iconPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];

  // Load icon using nativeImage for better Windows compatibility
  let appIcon = null;
  if (fs.existsSync(iconPath)) {
    appIcon = nativeImage.createFromPath(iconPath);
    console.log('Icon loaded:', iconPath, '| Empty:', appIcon.isEmpty());
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    fullscreen: true,
    autoHideMenuBar: true,
    title: 'Swift Typing',
    icon: appIcon || iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      zoomFactor: 1.0,
    },
  });

  // Also set the window icon explicitly for taskbar
  if (appIcon && !appIcon.isEmpty()) {
    mainWindow.setIcon(appIcon);
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
