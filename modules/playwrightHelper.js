const { chromium } = require('playwright');

async function getVideoInfoWithPlaywright(url) {
  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      // Enable video streaming detection
      recordVideo: { dir: 'videos/' }
    });
    
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for video element to appear
    await page.waitForSelector('video', { timeout: 15000 });

    // Extract video source URL using multiple methods
    const videoUrl = await page.evaluate(() => {
      // Try direct video source
      const video = document.querySelector('video');
      if (video && (video.src || video.currentSrc)) {
        return video.src || video.currentSrc;
      }
      
      // Try videojs players
      const videojsPlayers = Array.from(document.querySelectorAll('.video-js'));
      for (const player of videojsPlayers) {
        if (player.player && player.player.currentSource) {
          return player.player.currentSource().src;
        }
      }
      
      // Try JW Player
      const jwPlayers = Array.from(document.querySelectorAll('.jwplayer'));
      for (const player of jwPlayers) {
        if (player.getConfig && player.getConfig().file) {
          return player.getConfig().file;
        }
      }
      
      return null;
    });

    if (!videoUrl) {
      throw new Error('Could not extract video URL from page');
    }

    // Get page title for filename
    const title = await page.title();

    return {
      success: true,
      title,
      formats: [{
        id: 'direct',
        resolution: 'unknown',
        size: 0,
        ext: 'mp4',
        note: 'Direct stream (Playwright fallback)',
        directUrl: videoUrl
      }]
    };
  } catch (error) {
    console.error('Playwright fallback failed:', error);
    return { 
      success: false, 
      error: `Playwright fallback failed: ${error.message}` 
    };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  getVideoInfoWithPlaywright
};