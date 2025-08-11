const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const BrowserViewManager = require('./BrowserViewManager.js');
const { initializeAdblocker, setupAdblocker, enableAdblockerInView } = require('./adblocker.js');
const { initializeYtDlp, setupYtDlpHandlers } = require('./ytDlpHandler.js');

let mainWindow;
let browserViewManager;

app.whenReady().then(async () => {
  initializeYtDlp();
  await initializeAdblocker(app);
  createWindow();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },
  // For Windows, use .ico; for Linux/macOS, .png is fine. Using inside-logo as requested.
  icon: path.join(__dirname, 'assets/inside-logo.ico'),
    titleBarStyle: 'default',
    show: false
  });

  browserViewManager = new BrowserViewManager(mainWindow);

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Hide the Electron menu bar
  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  mainWindow.on('resize', () => browserViewManager.update());
  mainWindow.on('enter-full-screen', () => browserViewManager.update());
  mainWindow.on('leave-full-screen', () => browserViewManager.update());

  mainWindow.on('close', () => {
    browserViewManager.destroy();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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

// IPC Handlers
setupAdblocker(ipcMain, browserViewManager);
setupYtDlpHandlers(mainWindow);

ipcMain.handle('open-browser', (event, url) => {
  browserViewManager.create(url);
  enableAdblockerInView(browserViewManager.view);
});

ipcMain.handle('close-browser', () => {
  try {
    if (browserViewManager.view) {
      browserViewManager.destroy();
      return { success: true };
    }
    return { success: false, error: 'No active browser view' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-layout', (event, sidebarVisible) => {
  browserViewManager.setSidebarVisible(sidebarVisible);
});

ipcMain.handle('hide-browser-view', () => browserViewManager.hide());
ipcMain.handle('show-browser-view', () => browserViewManager.show());

ipcMain.handle('get-browser-url', () => {
  if (browserViewManager.view) {
    return browserViewManager.view.webContents.getURL();
  }
  return null;
});

ipcMain.handle('navigate-browser', (event, action) => {
  if (browserViewManager.view) {
    const webContents = browserViewManager.view.webContents;
    switch (action) {
      case 'back':
        if (webContents.canGoBack()) webContents.goBack();
        break;
      case 'forward':
        if (webContents.canGoForward()) webContents.goForward();
        break;
      case 'refresh':
        webContents.reload();
        break;
    }
  }
});

ipcMain.handle('download-manga', async (event, { module, url, options }) => {
  try {
    const downloaderModule = require(`./modules/${module.toLowerCase()}.js`);
    const result = await downloaderModule.download({ url, ...options });
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-download-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return !canceled ? filePaths[0] : null;
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});

app.on('select-client-certificate', (event, webContents, url, list, callback) => {
  event.preventDefault();
  if (list && list.length > 0) {
    callback(list[0]);
  } else {
    callback();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});