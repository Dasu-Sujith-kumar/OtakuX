const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [
  'youtube.com', 'www.youtube.com', 'youtu.be', '*.googlevideo.com',
  'instagram.com', '*.instagram.com',
  'facebook.com', '*.facebook.com',
  'twitter.com', 'x.com', '*.twitter.com', '*.x.com',
  '*.google.com'
];

let blocker = null;
let adBlockEnabled = true;

async function initializeAdblocker(app) {
  try {
    blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
      path: path.join(app.getPath('userData'), 'adblocker-engine.bin'),
      read: fs.promises.readFile,
      write: fs.promises.writeFile,
    });
  } catch (e) {
    console.error('Adblocker initialization failed:', e);
    blocker = null;
  }
}

function setupAdblocker(ipcMain, browserViewManager) {
  ipcMain.handle('get-adblock-enabled', () => adBlockEnabled);

  ipcMain.handle('set-adblock-enabled', async (event, enabled) => {
    console.log('[adblocker.js] set-adblock-enabled called. enabled:', enabled);
    adBlockEnabled = enabled;
    // If a view exists, update its session immediately; otherwise, just update the global state
    if (blocker && browserViewManager && browserViewManager.view && browserViewManager.view.webContents) {
      const session = browserViewManager.view.webContents.session;
      console.log('[adblocker.js] Updating session:', session && session.constructor && session.constructor.name);
      if (enabled) {
        console.log('[adblocker.js] Enabling adblocker in session');
        blocker.enableBlockingInSession(session, { allowlist: ALLOWLIST });
      } else if (blocker.isBlockingEnabled(session)) {
        console.log('[adblocker.js] Disabling adblocker in session');
        blocker.disableBlockingInSession(session);
      }
      // Soft reload: just reload the current page for better performance
      const webContents = browserViewManager.view.webContents;
      webContents.reload();
      console.log('[adblocker.js] Reloaded view after adblock toggle');
    } else {
      console.log('[adblocker.js] No view yet or view is not ready; adblocker state will be applied to future views.');
    }
    return true;
  });
}

function enableAdblockerInView(view) {
    const session = view.webContents.session;
    if (blocker && adBlockEnabled) {
        blocker.enableBlockingInSession(session, { allowlist: ALLOWLIST });
    } else if (blocker && !adBlockEnabled && blocker.isBlockingEnabled(session)) {
        blocker.disableBlockingInSession(session);
    }
}

module.exports = {
  initializeAdblocker,
  setupAdblocker,
  enableAdblockerInView,
};