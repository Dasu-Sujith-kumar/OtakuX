const { ipcMain, app, dialog } = require('electron');
const YtDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const path = require('path');
const { getVideoInfoWithPlaywright } = require('./modules/playwrightHelper.js');

let ytDlpPath;
let isDownloadingVideo = false; // Add a lock flag

function initializeYtDlp() {
    ytDlpPath = path.join(app.getPath('userData'), 'yt-dlp');
    if (process.platform === 'win32') {
        ytDlpPath += '.exe';
    }
}

async function ensureYtDlpBinary() {
    if (!fs.existsSync(ytDlpPath)) {
        console.log('Downloading yt-dlp binary...');
        await YtDlpWrap.downloadFromGithub(ytDlpPath);
        console.log('yt-dlp binary downloaded to', ytDlpPath);
    }
}

function setupYtDlpHandlers(mainWindow) {
    ipcMain.handle('get-video-formats', async (event, url) => {
        try {
            await ensureYtDlpBinary();
            const ytDlp = new YtDlpWrap(ytDlpPath);
            const metadata = await ytDlp.getVideoInfo([url, '--no-playlist']);
            const { title, formats } = metadata;

            const videoFormats = formats
                .filter(f => f.resolution)
                .map(f => ({
                    id: f.format_id,
                    resolution: f.resolution,
                    size: f.filesize || f.filesize_approx,
                    ext: f.ext,
                    note: f.format_note,
                    vcodec: f.vcodec,
                    acodec: f.acodec
                }));

            return { success: true, title, formats: videoFormats };
        } catch (error) {
            console.error(`Failed to get video formats for ${url} with yt-dlp:`, error);
            console.log('Trying Playwright fallback...');
            return await getVideoInfoWithPlaywright(url);
        }
    });

    ipcMain.handle('download-video', async (event, { url, format, downloadPath }) => {
        if (isDownloadingVideo) {
            return { success: false, error: 'Another video download is already in progress. Please wait.' };
        }

        isDownloadingVideo = true;

        return new Promise(async (resolve) => {
            try {
                await ensureYtDlpBinary();
                const ytDlp = new YtDlpWrap(ytDlpPath);

                const finalDownloadPath = downloadPath || path.join(app.getPath('downloads'), 'videos');
                if (!fs.existsSync(finalDownloadPath)) {
                    fs.mkdirSync(finalDownloadPath, { recursive: true });
                }

                let formatString = format.id;
                if (format.id === 'direct') {
                    url = format.directUrl;
                    formatString = 'best';
                } else if (format.acodec === 'none') {
                    formatString = `${format.id}+bestaudio/best`;
                }

                const args = [
                    url,
                    '--no-playlist',
                    '-o', path.join(finalDownloadPath, '%(title)s.%(ext)s'),
                    '--format', formatString,
                    '--merge-output-format', 'mp4',
                    '--progress'
                ];

                let errorOccurred = false;
                let downloadCompleted = false;
                const ytDlpProcess = ytDlp.exec(args);

                ytDlpProcess.on('progress', (progress) => {
                    if (progress.status === 'downloading') {
                        if (progress.fragment_index && progress.fragment_count) {
                            progress.percent = (progress.fragment_index / progress.fragment_count) * 100;
                        } else if (progress.percent === undefined && progress.raw) {
                            const match = progress.raw.match(/(\d+\.?\d*)%/);
                            if (match) {
                                progress.percent = parseFloat(match[1]);
                            }
                        }
                    }

                    if (progress.percent >= 100) {
                        downloadCompleted = true;
                    }

                    let speedStr = '';
                    if (typeof progress.speed === 'number' && !isNaN(progress.speed) && progress.speed > 0) {
                        const k = 1024;
                        const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
                        let i = Math.floor(Math.log(progress.speed) / Math.log(k));
                        i = Math.max(0, Math.min(i, sizes.length - 1));
                        speedStr = `${(progress.speed / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
                    }
                    progress.speedStr = speedStr;

                    progress.url = url;
                    const { BrowserWindow } = require('electron');
                    BrowserWindow.getAllWindows().forEach(win => {
                      win.webContents.send('video-progress', progress);
                    });
                });

                ytDlpProcess.on('ytDlpEvent', (eventType, eventData) => {
                    if (mainWindow) {
                        mainWindow.webContents.send('video-event', { eventType, eventData });
                    }
                });

                ytDlpProcess.on('error', (error) => {
                    if (!errorOccurred) {
                        errorOccurred = true;
                        console.error('yt-dlp error:', error);
                        resolve({ success: false, error: error.message || 'Download failed due to an error.' });
                    }
                });

                ytDlpProcess.on('close', (code) => {
                    isDownloadingVideo = false;
                    if (errorOccurred) {
                        return;
                    }
                    if (code !== 0) {
                        resolve({ success: false, error: `Download failed with exit code ${code}.` });
                    } else {
                        if (downloadCompleted) {
                            resolve({ success: true });
                        } else {
                            resolve({ success: false, error: 'Download finished unexpectedly without reaching 100%.' });
                        }
                    }
                });
            } catch (error) {
                isDownloadingVideo = false;
                resolve({ success: false, error: error.message });
            }
        });
    });
}


module.exports = {
    initializeYtDlp,
    setupYtDlpHandlers,
};