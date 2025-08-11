const { BrowserView, shell } = require('electron');

class BrowserViewManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.view = null;
    this.sidebarVisible = false;
  }

  create(url) {
    if (this.view) {
      this.destroy();
    }

    const path = require('path');
    let webPreferences = {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'antibot-preload.js')
    };
    this.view = new BrowserView({ webPreferences });

    this.view.webContents.setWindowOpenHandler(({ url }) => {
      console.log(`[BrowserViewManager] New window requested for: ${url}`);
      shell.openExternal(url);
      return { action: 'deny' };
    });

    const sendUrl = () => {
      const currentUrl = this.view.webContents.getURL();
      this.mainWindow.webContents.send('browser-url-changed', currentUrl);
    };
    this.view.webContents.on('did-navigate', sendUrl);
    this.view.webContents.on('did-navigate-in-page', sendUrl);
    this.view.webContents.on('did-finish-load', sendUrl);

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
    this.view.webContents.setUserAgent(userAgent);

    this.mainWindow.addBrowserView(this.view);
    this.view.webContents.loadURL(url);
    this.update();
  }

  destroy() {
    if (this.view) {
      try {
        this.mainWindow.removeBrowserView(this.view);
        this.view.webContents.destroy();
      } catch (error) {
        console.error('Error destroying browser view:', error);
      }
      this.view = null;
    }
  }

  getBounds() {
    const [width, height] = this.mainWindow.getContentSize();
    const sidebarWidth = this.sidebarVisible ? 320 : 0;
    const headerHeight = 70;
    const leftOffset = 64;

    return {
      x: leftOffset,
      y: headerHeight,
      width: width - leftOffset - sidebarWidth,
      height: height - headerHeight,
    };
  }

  update() {
    if (this.view) {
      this.view.setBounds(this.getBounds());
    }
  }

  setSidebarVisible(visible) {
    this.sidebarVisible = visible;
    this.update();
  }

  show() {
    if (this.view) {
      this.update();
    }
  }

  hide() {
    if (this.view) {
      this.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    }
  }
}

module.exports = BrowserViewManager;
