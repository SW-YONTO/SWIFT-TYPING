const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  quitAndInstall: () => ipcRenderer.send('quit-and-install'),
  
  onCheckingForUpdate: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('checking-for-update', subscription);
    return () => ipcRenderer.removeListener('checking-for-update', subscription);
  },
  onUpdateAvailable: (callback) => {
    const subscription = (event, info) => callback(info);
    ipcRenderer.on('update-available', subscription);
    return () => ipcRenderer.removeListener('update-available', subscription);
  },
  onUpdateNotAvailable: (callback) => {
    const subscription = (event, info) => callback(info);
    ipcRenderer.on('update-not-available', subscription);
    return () => ipcRenderer.removeListener('update-not-available', subscription);
  },
  onDownloadProgress: (callback) => {
    const subscription = (event, progress) => callback(progress);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.removeListener('download-progress', subscription);
  },
  onUpdateDownloaded: (callback) => {
    const subscription = (event, info) => callback(info);
    ipcRenderer.on('update-downloaded', subscription);
    return () => ipcRenderer.removeListener('update-downloaded', subscription);
  },
  onUpdateError: (callback) => {
    const subscription = (event, error) => callback(error);
    ipcRenderer.on('update-error', subscription);
    return () => ipcRenderer.removeListener('update-error', subscription);
  }
});
