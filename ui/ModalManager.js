const { isValidUrl, formatBytes } = require('./utils.js');

class ModalManager {
  constructor() {
    this.elements = {};
  }

  init() {
    this.elements.pathModal = document.getElementById('download-path-modal');
    this.elements.selectPathBtn = document.getElementById('select-path-btn');
    this.elements.closePathModal = document.getElementById('close-path-modal');
    this.elements.pathOptions = document.querySelectorAll('.path-option');
    this.elements.customPathInput = document.querySelector('.custom-path-input');
    this.elements.customPathField = document.getElementById('custom-path');
    this.elements.selectPathConfirm = document.getElementById('select-path-confirm');
    this.elements.cancelPathBtn = document.getElementById('cancel-path-btn');
    this.elements.downloadPathInput = document.getElementById('download-path');

    this.elements.historyModal = document.getElementById('history-modal');
    this.elements.historyBtn = document.getElementById('history-btn');
    this.elements.closeHistoryModal = document.getElementById('close-history-modal');
    this.elements.clearCompletedBtn = document.getElementById('clear-completed-btn');
    this.elements.clearAllBtn = document.getElementById('clear-all-btn');

    this.elements.videoQualityModal = document.getElementById('video-quality-modal');
    this.elements.videoBtn = document.getElementById('download-video-btn');
    this.elements.closeQualityModal = document.getElementById('close-quality-modal');
    this.elements.startVideoDownload = document.getElementById('start-video-download');
    this.elements.qualityOptionsContainer = this.elements.videoQualityModal?.querySelector('.quality-options');
    this.elements.videoModalTitle = this.elements.videoQualityModal?.querySelector('.modal-title');

    this.elements.statusModal = document.getElementById('download-status-modal');
    this.elements.closeStatusModal = document.getElementById('close-status-modal');
    this.elements.okStatusBtn = document.getElementById('ok-status-btn');
    this.elements.statusTitle = document.getElementById('download-status-title');
    this.elements.statusMessage = document.getElementById('download-status-message');

    this.initDownloadPathModal();
    this.initHistoryModal();
    this.initVideoQualityModal();
    this.initDownloadStatusModal();
  }

  showModal(modal) {
    if (modal) {
      modal.classList.remove('hidden');
      window.electronAPI.invoke('hide-browser-view');
    }
  }

  hideModal(modal) {
    if (modal) {
      modal.classList.add('hidden');
      window.electronAPI.invoke('show-browser-view');
    }
  }

  initDownloadStatusModal() {
    if (this.elements.closeStatusModal) this.elements.closeStatusModal.onclick = () => this.hideModal(this.elements.statusModal);
    if (this.elements.okStatusBtn) this.elements.okStatusBtn.onclick = () => this.hideModal(this.elements.statusModal);
  }

  showDownloadStatus(title, message) {
    if (this.elements.statusTitle) this.elements.statusTitle.textContent = title;
    if (this.elements.statusMessage) this.elements.statusMessage.textContent = message;
    this.showModal(this.elements.statusModal);
  }

  initDownloadPathModal() {
    if (this.elements.selectPathBtn) this.elements.selectPathBtn.onclick = () => this.showModal(this.elements.pathModal);
    if (this.elements.closePathModal) this.elements.closePathModal.onclick = () => this.hideModal(this.elements.pathModal);
    if (this.elements.cancelPathBtn) this.elements.cancelPathBtn.onclick = () => this.hideModal(this.elements.pathModal);

    this.elements.pathOptions.forEach(opt => {
      opt.onclick = () => {
        this.elements.pathOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.elements.customPathInput.classList.toggle('hidden', opt.dataset.path !== 'custom');
      };
    });

    if (this.elements.selectPathConfirm) {
      this.elements.selectPathConfirm.onclick = async () => {
        let selected = document.querySelector('.path-option.selected');
        let path = selected ? selected.dataset.path : null;
        if (!path) {
          path = `${window.electronAPI.getUserDownloadsPath ? await window.electronAPI.getUserDownloadsPath() : 'C:\\Users\\sujit\\Downloads'}`;
        }
        if (path === 'custom') {
          path = this.elements.customPathField.value.trim() || await window.electronAPI.selectDownloadFolder();
        }
        if (path) {
          window.app.downloadManager.setDownloadPath(path);
          this.elements.downloadPathInput.value = path;
          this.hideModal(this.elements.pathModal);
        } else {
          alert('Please select a valid download folder.');
        }
      };
    }

    if (this.elements.downloadPathInput) {
      this.elements.downloadPathInput.value = window.app.downloadManager.downloadPath;
    }
  }

  initHistoryModal() {
    if (this.elements.historyBtn) this.elements.historyBtn.onclick = () => {
      window.app.downloadManager.renderHistory();
      this.showModal(this.elements.historyModal);
    };
    if (this.elements.closeHistoryModal) this.elements.closeHistoryModal.onclick = () => this.hideModal(this.elements.historyModal);
    if (this.elements.clearCompletedBtn) this.elements.clearCompletedBtn.onclick = () => window.app.downloadManager.clearCompletedHistory();
    if (this.elements.clearAllBtn) this.elements.clearAllBtn.onclick = () => window.app.downloadManager.clearAllHistory();
  }

  initVideoQualityModal() {
    if (this.elements.videoBtn) this.elements.videoBtn.onclick = () => this.showVideoQualityModal();
    if (this.elements.closeQualityModal) this.elements.closeQualityModal.onclick = () => this.hideModal(this.elements.videoQualityModal);
    if (this.elements.startVideoDownload) {
      this.elements.startVideoDownload.onclick = () => {
        this.hideModal(this.elements.videoQualityModal);
        window.app.downloadManager.downloadVideoWithQuality();
      };
    }
  }

  async showVideoQualityModal() {
    const url = window.app.downloadManager.getCurrentUrl();
    if (!url || !isValidUrl(url)) {
      alert('Please enter a valid video URL first.');
      return;
    }

    this.elements.videoModalTitle.textContent = 'Fetching Formats...';
    this.elements.qualityOptionsContainer.innerHTML = '<div class="loader"></div>';
    this.showModal(this.elements.videoQualityModal);

    if (!window.electronAPI.getVideoFormats) {
      this.elements.videoModalTitle.textContent = 'Error';
      this.elements.qualityOptionsContainer.innerHTML = '<p>window.electronAPI.getVideoFormats is not available.</p>';
      return;
    }

    const result = await window.electronAPI.getVideoFormats(url);
    if (result.success) {
      this.elements.videoModalTitle.textContent = 'Select Video Quality';
      window.app.downloadManager.setVideoTitle(result.title);
      this.elements.qualityOptionsContainer.innerHTML = '';

      if (!result.formats || result.formats.length === 0) {
        this.elements.qualityOptionsContainer.innerHTML = '<p>No suitable video formats found.</p>';
        return;
      }

      result.formats.slice().sort((a, b) => {
        const getRes = r => {
          if (!r) return [0,0];
          const m = r.match(/(\d+)x(\d+)/);
          return m ? [parseInt(m[1]), parseInt(m[2])] : [0,0];
        };
        const [aw, ah] = getRes(a.resolution);
        const [bw, bh] = getRes(b.resolution);
        if (ah !== bh) return bh - ah;
        if (aw !== bw) return bw - aw;
        return (b.size||0) - (a.size||0);
      }).forEach(format => {
        const option = document.createElement('div');
        option.className = 'quality-option';
        option.dataset.quality = format.id;
        let extInfo = '';
        if (format.ext === 'mp4') extInfo = 'MP4: Most compatible, works on all devices.';
        if (format.ext === 'webm') extInfo = 'WEBM: Modern format, smaller size, may not play everywhere.';
        option.innerHTML = `<span>${format.resolution} (${format.ext})</span> <span class="quality-badge">${format.size ? formatBytes(format.size) : 'N/A'}</span><br><span class="quality-desc">${format.note || ''} ${extInfo}</span>`;
        option.onclick = () => {
          this.elements.qualityOptionsContainer.querySelectorAll('.quality-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          window.app.downloadManager.setSelectedQuality(format);
        };
        this.elements.qualityOptionsContainer.appendChild(option);
      });

      if (this.elements.qualityOptionsContainer.firstChild) {
        this.elements.qualityOptionsContainer.firstChild.click();
      }
    } else {
      this.elements.videoModalTitle.textContent = 'Error';
      this.elements.qualityOptionsContainer.innerHTML = `<p>Failed to get video formats: ${result.error}</p>`;
    }
  }
}

module.exports = ModalManager;
