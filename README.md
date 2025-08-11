

# 🎯 OtakuX — Multi-Site Manga & Video Downloader Browser

![Status](https://img.shields.io/badge/status-under%20development-yellow?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0a-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen?logo=node.js)
![Electron.js](https://img.shields.io/badge/Electron.js-Desktop%20App-blue?logo=electron)
![License](https://img.shields.io/github/license/Dasu-Sujith-kumar/OtakuX?color=green)

> **OtakuX** is a custom-built multi-site browser with integrated manga and video downloading features.  
> This is the **first alpha release (v1.0a)**, designed for speed, modularity, and offline archiving.

---

## ✨ Features

### 🌐 Application
- **Multi-Site Browser** — Browse multiple supported content sites in one place.
- **Modular Architecture** — Easily add, remove, or update scraping modules.
- **Manga Downloader** — Download manga chapters in high quality.
- **Video Downloader** — Download videos with **quality selection** powered by `yt-dlp`.
- **Automatic Video Download Fallback** — If `yt-dlp` fails, a built-in Playwright-based downloader will be used automatically.

### 📥 Download Management
- **Download History** — Track and re-download past items.
- **Custom Save Location** — Choose your download folder.
- **Video Quality Selection** — Pick your preferred resolution before download.

### 🖥 User Interface
- **Left Sidebar Navigation** — Switch between modules quickly.
- **Right Control Panel** — Adjust settings and manage downloads.
- **Custom Browser Controls** — Back, forward, refresh, and direct URL navigation.

---

## 🛠 Known Limitations / Planned Improvements
- Some scraping modules are outdated and require recoding.
- Only **one download at a time** is supported (multi-download planned).
- UI needs enhancements for better aesthetics and responsiveness.
- Download progress bar does not yet show **accurate speed, size, and ETA**.
- In rare cases, `yt-dlp` may show incorrect file sizes.

---

## 📦 Installation (From Source)

### Requirements
Before running OtakuX, make sure you have:
- **Node.js 18+**
- **Python 3.x** (required for `yt-dlp`)
- **Git**
- All Python dependencies from `requirements.txt`

Install Python dependencies:
```bash
pip install -r requirements.txt
````

---

### Clone & Install

```bash
# Clone the repo
git clone https://github.com/Dasu-Sujith-kumar/OtakuX.git
cd OtakuX

# Install Node.js dependencies
npm install

# Start the app
npm start
```

---

## 💾 Windows Setup (EXE)

[![Download OtakuX](https://img.shields.io/badge/⬇_Download-OtakuX.exe-blue?style=for-the-badge)](https://github.com/Dasu-Sujith-kumar/OtakuX/releases)

1. Click the button above to visit the **latest release page**.
2. Download the `.exe` setup file.
3. Run the installer and follow the setup wizard.
4. Launch **OtakuX** from your desktop or start menu.

---

## 📂 Project Structure

```
OtakuX/
├── modules/           # Site-specific scrapers
├── backend/           # Download and scraping logic
├── ui/                # Electron + frontend source
├── styles/            # CSS styles
├── requirements.txt   # Python dependencies
├── package.json
└── README.md
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## ⭐ Support

If you like **OtakuX**, consider giving it a star ⭐ on GitHub to support development.

 
## Badges

Add badges from somewhere like: [shields.io](https://shields.io/)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
[![AGPL License](https://img.shields.io/badge/license-AGPL-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)

