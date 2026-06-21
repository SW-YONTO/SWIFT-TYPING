const { app, BrowserWindow, nativeImage, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const https = require('https');
const isDev = process.env.NODE_ENV === 'development';

// Set the app user model ID BEFORE ready event (critical for Windows taskbar/search icon)
if (process.platform === 'win32') {
  app.setAppUserModelId('com.swifttyping.app');
}

let mainWindow;

function createWindow() {
  // Get the correct icon path based on environment
  // In production (asar), extraResource files go to process.resourcesPath
  // In dev, use public/ICONS directly
  const possiblePaths = isDev
    ? [
        path.join(__dirname, '../public/ICONS/SWIFTLOGO.ico'),
        path.join(__dirname, '../public/ICONS/icon.png'),
      ]
    : [
        path.join(process.resourcesPath, 'SWIFTLOGO.ico'),
        path.join(process.resourcesPath, 'icon.png'),
      ];

  const iconPath = possiblePaths.find(p => fs.existsSync(p));

  // Load icon using nativeImage for better Windows compatibility
  let appIcon = null;
  if (iconPath && fs.existsSync(iconPath)) {
    appIcon = nativeImage.createFromPath(iconPath);
    console.log('Icon loaded:', iconPath, '| Empty:', appIcon.isEmpty());
  } else {
    console.warn('WARNING: No icon file found! Searched:', possiblePaths);
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    fullscreen: true,
    autoHideMenuBar: true,
    title: 'Swift Typing',
    icon: appIcon || iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
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

// Auto Updater IPC and Event configuration
autoUpdater.autoDownload = false; // Let the user trigger the download

// Helper function to query GitHub Releases API in development mode
function checkUpdatesDevMode() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('checking-for-update');
  }

  const options = {
    hostname: 'api.github.com',
    path: '/repos/SW-YONTO/SWIFT-TYPING/releases/latest',
    headers: {
      'User-Agent': 'Swift-Typing-Electron-App'
    }
  };

  https.get(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        if (res.statusCode !== 200) {
          throw new Error(`GitHub API returned status ${res.statusCode}`);
        }

        const release = JSON.parse(data);
        const latestVersion = release.tag_name.replace(/^v/, '');
        const currentVersion = app.getVersion();

        const isNewer = compareVersions(latestVersion, currentVersion) > 0;

        if (isNewer) {
          mainWindow.webContents.send('update-available', {
            version: latestVersion,
            releaseDate: release.published_at,
            note: release.body
          });
        } else {
          mainWindow.webContents.send('update-not-available', {
            version: latestVersion
          });
        }
      } catch (err) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('update-error', err.message || 'Error checking for updates');
        }
      }
    });
  }).on('error', (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-error', err.message || 'Network error checking for updates');
    }
  });
}

function compareVersions(v1, v2) {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (p1[i] > p2[i]) return 1;
    if (p1[i] < p2[i]) return -1;
  }
  return 0;
}

// Listeners from frontend
ipcMain.on('check-for-updates', () => {
  if (isDev || !app.isPackaged) {
    checkUpdatesDevMode();
  } else {
    autoUpdater.checkForUpdates().catch(err => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-error', err.message || 'Error checking for updates');
      }
    });
  }
});

ipcMain.on('download-update', () => {
  if (isDev || !app.isPackaged) {
    const { shell } = require('electron');
    shell.openExternal('https://github.com/SW-YONTO/SWIFT-TYPING/releases/latest');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-not-available'); // reset state
    }
  } else {
    autoUpdater.downloadUpdate().catch(err => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-error', err.message || 'Error downloading update');
      }
    });
  }
});

ipcMain.on('quit-and-install', () => {
  autoUpdater.quitAndInstall();
});

// Auto Updater events forwarded to Renderer
autoUpdater.on('checking-for-update', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('checking-for-update');
  }
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-not-available', info);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

autoUpdater.on('error', (err) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-error', err.message || 'Error in update process');
  }
});
