const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');

async function downloadColaManga({ url, startChapter = 1, endChapter = 1, title = 'ColaManga' }) {
  if (!url || typeof url !== 'string') {
    throw new Error('No URL provided to ColaManga downloader. Received: ' + url);
  }
  const browser = await chromium.launch({
    headless: true, // Use non-headless for debugging and anti-bot
    ignoreHTTPSErrors: true,
    args: [
      '--disable-features=IsolateOrigins,site-per-process',
      '--flag-switches-begin --ignore-certificate-errors --flag-switches-end'
    ]
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    locale: 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': url.startsWith('http') ? url : 'https://colamanga.com/'
    }
  });
  const page = await context.newPage();
  // Anti-bot: spoof navigator.webdriver, window.chrome, permissions, and plugins
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    // Permissions spoof
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });
  const summary = [];

  for (let chapterNum = startChapter; chapterNum <= endChapter; chapterNum++) {
    const urlNum = chapterNum + 1;
    const chapterUrl = `${url}${urlNum}.html`;
    const chapterFolder = path.join(__dirname, '..', 'downloads', title, `chapter_${chapterNum}`);
    await fs.ensureDir(chapterFolder);

    console.log(`\n🌐 Opening: ${chapterUrl}`);
    try {
      await page.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (err) {
      console.error(`❌ Failed to load ${chapterUrl}: ${err.message}`);
      summary.push({ chapter: chapterNum, success: false, error: err.message });
      continue;
    }

    await autoScroll(page);
    await page.waitForTimeout(1500);

    await page.evaluate(async () => {
      const divs = Array.from(document.querySelectorAll('.mh_comicpic'));
      for (const div of divs) {
        div.scrollIntoView({ behavior: 'instant', block: 'center' });
        await new Promise(r => setTimeout(r, 300));
      }
    });

    await page.waitForTimeout(1000);

    const blobImgs = await page.evaluate(async () => {
      const results = [];
      const imgs = Array.from(document.querySelectorAll('.mh_comicpic img'));
      for (const img of imgs) {
        if (img.src && img.src.startsWith('blob:')) {
          try {
            await new Promise(resolve => {
              if (img.complete && img.naturalWidth !== 0) return resolve();
              const timeout = setTimeout(resolve, 4000);
              img.onload = () => { clearTimeout(timeout); resolve(); };
              img.onerror = () => { clearTimeout(timeout); resolve(); };
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            results.push({ dataUrl });
          } catch (_) {}
        }
      }
      return results;
    });

    console.log(`📸 Found blob images: ${blobImgs.length}`);
    let imgIndex = 1;
    for (const img of blobImgs) {
      const match = img.dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
      if (!match) continue;

      const ext = match[2] === 'jpeg' ? '.jpg' : `.${match[2]}`;
      const buffer = Buffer.from(match[3], 'base64');
      const filePath = path.join(chapterFolder, `${imgIndex}${ext}`);
      await fs.writeFile(filePath, buffer);
      console.log(`✅ Saved image ${imgIndex}: ${filePath}`);
      imgIndex++;
    }

    summary.push({ chapter: chapterNum, success: true, images: blobImgs.length });
  }

  await browser.close();
  return {
    success: true,
    chapters: summary.length,
    summary,
    message: `Downloaded ${summary.filter(c => c.success).length} chapters.`
  };
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const step = 300;
      const interval = setInterval(() => {
        window.scrollBy(0, step);
        total += step;
        if (total >= document.body.scrollHeight) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  });
}

module.exports = { download: downloadColaManga };