const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const { getPage, downloadFile } = require('./http.js');

async function download({ url, downloadPath }) {
  try {
    const html = await getPage(url);
    const $ = cheerio.load(html);

    // Extract title from the page. Let's try the h1 post-title first.
    let title = $('h1.post-title').text().trim();
    if (!title) {
      // Fallback to the HTML title tag
      title = $('title').text().trim();
    }
    // Sanitize title for folder name
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const mangaDir = path.join(downloadPath, sanitizedTitle);
    await fs.ensureDir(mangaDir);

    console.log(`Starting download for: ${title}`);
    console.log(`Saving to: ${mangaDir}`);

    const imgUrls = [];
    $('img.object-cover').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('https://') && !src.includes('EndDesign')) {
        imgUrls.push(src);
      }
    });

    if (imgUrls.length === 0) {
      console.log('No images found on the page.');
      return { success: false, error: 'No images found.' };
    }

    console.log(`🖼️ Found ${imgUrls.length} chapter images`);

    const downloadPromises = imgUrls.map((imgUrl, index) => {
      const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
      const filePath = path.join(mangaDir, `${(index + 1).toString().padStart(3, '0')}${ext}`);
      return downloadFile(imgUrl, filePath)
        .then(() => console.log(`✅ Saved image ${index + 1}: ${filePath}`))
        .catch(err => console.error(`❌ Error downloading image: ${imgUrl}`, err));
    });

    await Promise.all(downloadPromises);

    console.log(`Download complete for: ${title}`);
    return { success: true, count: imgUrls.length };

  } catch (error) {
    console.error(`❌ Error in Asura downloader: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = { download };
