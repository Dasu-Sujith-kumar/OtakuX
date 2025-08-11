class DownloadManager {
  constructor() {
    this.downloadPath = '/Users/Downloads';
    this.history = [];
    this.selectedQuality = null;
    this.videoTitle = '';
    this.currentUrl = '';

    window.electronAPI.onVideoProgress((event, progress) => {
      this.updateProgress(progress);
    });
  }

  setDownloadPath(path) {
    this.downloadPath = path;
  }

  getCurrentUrl() {
    return this.currentUrl;
  }

  setCurrentUrl(url) {
    this.currentUrl = url;
  }

  setVideoTitle(title) {
    this.videoTitle = title;
  }

  setSelectedQuality(quality) {
    this.selectedQuality = quality;
  }

  async downloadManga(module) {
    if (!module || !this.currentUrl) {
      window.app.modalManager.showDownloadStatus('Error', 'Please select a module and enter a URL first.');
      return;
    }

    window.app.moduleStateManager.setDownloading(module, true);
    window.app.updateUI();

    try {
      window.app.modalManager.showDownloadStatus('Download Started', `Download has started from ${module}.`);

      const result = await window.electronAPI.downloadManga(module, this.currentUrl, {
        downloadPath: this.downloadPath,
      });

      if (result.success) {
        this.history.push({ name: this.currentUrl, status: 'completed' });
      } else {
        window.app.modalManager.showDownloadStatus('Download Failed', `Failed to download from ${module}: ${result.error}`);
        this.history.push({ name: this.currentUrl, status: 'error', error: result.error });
      }
    } catch (error) {
      window.app.modalManager.showDownloadStatus('Download Failed', `An error occurred: ${error.message || 'Unknown error'}`);
      this.history.push({ name: this.currentUrl, status: 'error', error: error.message });
    } finally {
        window.app.moduleStateManager.setDownloading(module, false);
        this.renderHistory();
        window.app.updateUI();
    }
  }

  async downloadVideoWithQuality() {
    const module = window.app.moduleStateManager.getActive();
    if (!this.selectedQuality) {
      window.app.modalManager.showDownloadStatus('Error', 'Please select a video quality first.');
      return;
    }

    const historyItem = {
      name: this.videoTitle || this.currentUrl,
      status: 'in progress',
      progress: 0,
      url: this.currentUrl,
      id: Date.now(),
    };
    this.history.push(historyItem);
    this.renderHistory();

    window.app.moduleStateManager.setDownloading(module, true);
    window.app.updateUI();

    try {
      window.app.modalManager.showDownloadStatus('Download Started', `Video download has started for: ${historyItem.name}`);
      const result = await window.electronAPI.downloadVideo({
        url: this.currentUrl,
        format: this.selectedQuality,
        downloadPath: this.downloadPath,
      });
      const item = this.history.find(h => h.id === historyItem.id);
      if (result && result.success) {
        if (item) item.status = 'completed';
      } else {
        if (item) item.status = 'error';
        // Handle the specific "in progress" error gracefully
        if (result.error && result.error.includes('already in progress')) {
            window.app.modalManager.showDownloadStatus('Download in Progress', result.error);
            // Remove the history item we optimistically added
            this.history = this.history.filter(h => h.id !== historyItem.id);
        } else {
            window.app.modalManager.showDownloadStatus('Download Failed', `Video download failed: ${result && result.error ? result.error : 'Unknown error'}`);
        }
      }
    } catch (error) {
      const item = this.history.find(h => h.id === historyItem.id);
      if (item) item.status = 'error';
      window.app.modalManager.showDownloadStatus('Download Failed', `Video download failed: ${error.message || 'Unknown error'}`);
    } finally {
      window.app.moduleStateManager.setDownloading(module, false);
      this.renderHistory();
      window.app.updateUI();
    }
  }

  updateProgress(progress) {
    const item = [...this.history].reverse().find(h => h.status === 'in progress' && h.url === progress.url);
    if (item) {
      item.progress = progress.percent;
      item.totalSize = progress.sizeStr || '';
      item.speed = progress.speedStr || '';
      item.eta = progress.eta || '';
      if (progress.percent >= 100) {
        item.status = 'completed';
        const module = window.app.moduleStateManager.getActive();
        window.app.moduleStateManager.setDownloading(module, false);
      }
      this.renderHistory();
    }
    window.app.uiManager.videoProgress = progress.percent;
    window.app.uiManager.videoSpeed = progress.speedStr || '';
    window.app.updateUI();
  }

  renderHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    historyList.innerHTML = '';
    if (this.history.length === 0) {
      historyList.innerHTML = '<div style="color:#888;text-align:center;padding:24px 0;">No downloads yet.</div>';
      return;
    }

    this.history.forEach(item => {
      const div = document.createElement('div');
      let className = 'history-item';
      if (item.status === 'error') className += ' error';
      if (item.status === 'completed') className += ' completed';
      div.className = className;

      let extraInfo = '';
      if (item.status === 'in progress') {
        extraInfo = ` | ${Math.round(item.progress)}%`;
        if (item.totalSize) extraInfo += ` | ${item.totalSize}`;
        if (item.speed) extraInfo += ` | ${item.speed}`;
        if (item.eta) extraInfo += ` | ETA: ${item.eta}`;
      } else if (item.status === 'error' && item.error) {
        extraInfo = ` | Error: ${item.error}`;
      }

      div.innerHTML = `
        <span>${item.name}</span>
        <span class="history-status">
          ${item.status}${extraInfo}
        </span>
      `;
      historyList.appendChild(div);
    });
  }

  clearCompletedHistory() {
    this.history = this.history.filter(h => h.status !== 'completed');
    this.renderHistory();
  }

  clearAllHistory() {
    this.history = [];
    this.renderHistory();
  }
}

module.exports = DownloadManager;
