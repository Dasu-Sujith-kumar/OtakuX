const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

/**
 * Fetches the HTML content of a webpage.
 * @param {string} url The URL of the webpage.
 * @returns {Promise<string>} The HTML content of the page.
 */
async function getPage(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': new URL(url).origin
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching page ${url}:`, error.message);
    throw new Error(`Failed to fetch page: ${url}`);
  }
}

/**
 * Downloads a file from a URL to a specified path.
 * @param {string} url The URL of the file to download.
 * @param {string} filepath The path where the file should be saved.
 * @returns {Promise<void>}
 */
async function downloadFile(url, filepath) {
  try {
    const writer = fs.createWriteStream(filepath);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Referer': new URL(url).origin
      }
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error downloading file ${url}:`, error.message);
    // In case of error, clean up the partially downloaded file
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    throw new Error(`Failed to download file: ${url}`);
  }
}

module.exports = {
  getPage,
  downloadFile
};
