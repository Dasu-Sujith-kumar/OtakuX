const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  getBrowserUrl: () => ipcRenderer.invoke('get-browser-url'),
  openBrowser: (url) => ipcRenderer.invoke('open-browser', url),
  navigateBrowser: (action) => ipcRenderer.invoke('navigate-browser', action),
  closeBrowser: () => ipcRenderer.invoke('close-browser'),
  downloadManga: (module, url, options) => ipcRenderer.invoke('download-manga', { module, url, options }),
  selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),
  setAdBlockEnabled: (enabled) => ipcRenderer.invoke('set-adblock-enabled', enabled),
  getVideoFormats: (url) => ipcRenderer.invoke('get-video-formats', url),
  downloadVideo: (options) => ipcRenderer.invoke('download-video', options),
  onBrowserUrlChanged: (callback) => ipcRenderer.on('browser-url-changed', callback),
  onVideoProgress: (callback) => ipcRenderer.on('video-progress', callback),
});