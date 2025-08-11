const UIManager = require('./UIManager.js');
const ModalManager = require('./ModalManager.js');
const DownloadManager = require('./DownloadManager.js');
const ModuleStateManager = require('./ModuleStateManager.js');

class App {
  constructor() {
    this.modules = [
      { name: 'Blank', url: 'https://www.google.com' },
      { name: 'Colamanga', url: 'https://colamanga.com' },
      { name: 'Asura', url: 'https://asuracomic.net/' },
      { name: 'ErosScan', url: 'https://erosvoids.xyz/' },
      { name: 'nHentai', url: 'https://nhentai.net', adult: true },
      { name: 'Hentai2Read', url: 'https://hentai2read.com/', adult: true },
      { name: 'MangaDex', url: 'https://mangadex.org' },
      { name: 'Hitomi', url: 'https://hitomi.la', adult: true }
    ];

    window.app = this;

    this.moduleStateManager = new ModuleStateManager();
    this.uiManager = new UIManager();
    this.downloadManager = new DownloadManager();
    this.modalManager = new ModalManager();

    this.adultModeEnabled = false;
    this.adBlockEnabled = true;
    this.browserViewEnabled = true;

    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    // Sync initial sidebar state with the main process first to avoid race conditions
    const sidebarVisible = !this.uiManager.sidebarCollapsed;
    window.electronAPI.invoke('update-layout', sidebarVisible);

    this.uiManager.init();
    this.modalManager.init();
    this.setupEventListeners();
    this.updateUI();
  }

  async selectModule(module) {
    const oldModuleName = this.moduleStateManager.getActive();
    if (oldModuleName === module.name) return;

    if (oldModuleName && this.moduleStateManager.isDownloading(oldModuleName)) {
      this.modalManager.showDownloadStatus('Download in Progress', `A download for ${oldModuleName} is still in progress. Please wait for it to finish.`);
      return;
    }

    if (oldModuleName) {
      const oldUrl = await window.electronAPI.getBrowserUrl();
      this.moduleStateManager.saveState(oldModuleName, { url: oldUrl });
    }

    this.moduleStateManager.setActive(module.name);

    const savedState = this.moduleStateManager.loadState(module.name);
    const urlToLoad = savedState ? savedState.url : module.url;

    this.uiManager.hideWelcomePage();
    this.downloadManager.setCurrentUrl(urlToLoad);
    window.electronAPI.openBrowser(urlToLoad);
    this.updateUI();
  }

  updateUI() {
    const activeModule = this.moduleStateManager.getActive();
    this.uiManager.updateUI({
      currentUrl: this.downloadManager.getCurrentUrl(),
      isDownloading: activeModule ? this.moduleStateManager.isDownloading(activeModule) : false,
      modules: this.modules,
      activeModule: activeModule,
      adultModeEnabled: this.adultModeEnabled,
      adBlockEnabled: this.adBlockEnabled,
      browserViewEnabled: this.browserViewEnabled,
    });
  }

  setupEventListeners() {
    this.uiManager.renderModuleButtons(this.modules, (module) => this.selectModule(module));

    document.getElementById('logo-btn').addEventListener('click', () => {
      this.moduleStateManager.setActive(null);
      this.uiManager.showWelcomePage();
      this.downloadManager.setCurrentUrl('');
      window.electronAPI.closeBrowser();
      document.getElementById('url-edit').value = '';
      document.getElementById('url-input').value = '';
      this.updateUI();
    });

    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      this.uiManager.toggleSidebar();
    });

    document.getElementById('browser-back').onclick = () => window.electronAPI.navigateBrowser('back');
    document.getElementById('browser-forward').onclick = () => window.electronAPI.navigateBrowser('forward');
    document.getElementById('browser-refresh').onclick = () => window.electronAPI.navigateBrowser('refresh');
    document.getElementById('close-browser').onclick = () => window.electronAPI.closeBrowser();
    document.getElementById('go-btn').onclick = () => {
      const url = document.getElementById('url-edit').value;
      window.electronAPI.openBrowser(url);
    };

    document.getElementById('adult-toggle').onclick = () => {
      this.adultModeEnabled = !this.adultModeEnabled;
      this.uiManager.renderModuleButtons(this.modules, (module) => this.selectModule(module));
      this.updateUI();
    };
    document.getElementById('adblock-toggle').onclick = async () => {
      this.adBlockEnabled = !this.adBlockEnabled;
      this.updateUI();
      await window.electronAPI.setAdBlockEnabled(this.adBlockEnabled);
    };
    document.getElementById('browser-toggle').onclick = () => {
      this.browserViewEnabled = !this.browserViewEnabled;
      if (this.browserViewEnabled) {
        window.electronAPI.invoke('show-browser-view');
      } else {
        window.electronAPI.invoke('hide-browser-view');
      }
      this.updateUI();
    };

    document.getElementById('url-input').oninput = (e) => this.downloadManager.setCurrentUrl(e.target.value);
    document.getElementById('paste-btn').onclick = async () => {
      const url = await window.electronAPI.getBrowserUrl();
      if (url) {
        document.getElementById('url-input').value = url;
        this.downloadManager.setCurrentUrl(url);
      }
    };

    document.getElementById('download-btn').onclick = () => {
      this.downloadManager.downloadManga(this.moduleStateManager.getActive());
    };

    window.electronAPI.onBrowserUrlChanged((event, newUrl) => {
      document.getElementById('url-edit').value = newUrl;
      this.downloadManager.setCurrentUrl(newUrl);
      const activeModule = this.moduleStateManager.getActive();
      if (activeModule) {
        this.moduleStateManager.saveState(activeModule, { url: newUrl });
      }
      this.updateUI();
    });
  }
}

module.exports = App;
