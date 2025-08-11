class UIManager {
  constructor() {
    this.elements = {};
    this.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    this.adultMode = false;
  }

  init() {
    this.elements = {
      activeModuleName: document.getElementById('active-module-name'),
      browserToggle: document.getElementById('browser-toggle'),
      adultToggle: document.getElementById('adult-toggle'),
      adblockToggle: document.getElementById('adblock-toggle'),
      downloadBtn: document.getElementById('download-btn'),
      videoBtn: document.getElementById('download-video-btn'),
      videoProgress: document.getElementById('video-progress'),
      progressBar: document.getElementById('video-progress-bar'),
      urlInput: document.getElementById('url-input'),
      moduleCount: document.getElementById('module-count'),
      modeDisplay: document.getElementById('mode-display'),
      sidebarRight: document.querySelector('.sidebar-right'),
      mainContent: document.querySelector('.main-content'),
      welcomeHeader: document.querySelector('.welcome-header'),
      browserContent: document.getElementById('browser-content'),
      moduleButtonsContainer: document.getElementById('module-buttons'),
    };
  }

  showWelcomePage() {
    if (this.elements.welcomeHeader) {
      this.elements.welcomeHeader.style.display = 'flex';
      this.elements.welcomeHeader.style.visibility = 'visible';
    }
    if (this.elements.browserContent) {
      this.elements.browserContent.style.display = 'none';
    }
    if (this.elements.activeModuleName) {
      this.elements.activeModuleName.textContent = 'None';
    }
  }

  hideWelcomePage() {
    if (this.elements.welcomeHeader) {
      this.elements.welcomeHeader.style.display = 'none';
    }
    if (this.elements.browserContent) {
      this.elements.browserContent.style.display = 'block';
    }
  }

  updateUI(state) {
    const { currentUrl, isDownloading, modules, activeModule, adultModeEnabled, adBlockEnabled, browserViewEnabled } = state;

    if (this.elements.activeModuleName) this.elements.activeModuleName.textContent = activeModule || 'None';
    if (this.elements.urlInput) this.elements.urlInput.value = currentUrl || '';
    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.disabled = !currentUrl || isDownloading;
      this.elements.downloadBtn.innerHTML = isDownloading ? `<i class="fas fa-stop-circle"></i> Stop` : `<i class="fas fa-download"></i> Download`;
    }

    this.elements.browserToggle?.classList.toggle('active', browserViewEnabled);
    this.elements.adultToggle?.classList.toggle('active', adultModeEnabled);
    this.elements.adblockToggle?.classList.toggle('active', adBlockEnabled);

    if (this.elements.moduleCount) this.elements.moduleCount.textContent = `${this.getFilteredModules(modules, adultModeEnabled).length} loaded`;
    if (this.elements.modeDisplay) this.elements.modeDisplay.textContent = adultModeEnabled ? 'Adult' : 'Regular';

    this.renderModuleButtons(modules, window.app.selectModule.bind(window.app), adultModeEnabled);
    this.updateSidebar();
  }

  updateSidebar() {
    if (this.elements.sidebarRight) this.elements.sidebarRight.classList.toggle('collapsed', this.sidebarCollapsed);
    if (this.elements.mainContent) this.elements.mainContent.classList.toggle('expanded', this.sidebarCollapsed);
  }

  getFilteredModules(modules, adultModeEnabled) {
    return modules.filter(module => adultModeEnabled || !module.adult);
  }

  renderModuleButtons(modules, onSelectModule, adultModeEnabled) {
    if (!this.elements.moduleButtonsContainer) return;

    const activeModule = window.app.moduleStateManager.getActive();
    this.elements.moduleButtonsContainer.innerHTML = '';
    this.getFilteredModules(modules, adultModeEnabled).forEach(module => {
      const button = document.createElement('button');
      button.className = 'module-button';
      button.textContent = module.name === 'Blank' ? 'BL' : module.name.substring(0, 2).toUpperCase();
      button.title = module.name;
      button.onclick = () => onSelectModule(module);
      if (module.name === activeModule) button.classList.add('active');
      this.elements.moduleButtonsContainer.appendChild(button);
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
    this.updateSidebar();
    window.electronAPI.invoke('update-layout', !this.sidebarCollapsed);
  }
}

module.exports = UIManager;
