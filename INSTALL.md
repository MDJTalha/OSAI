# 📲 MeasureCount Pro - Installation Guide

## App Name: **MeasureCount Pro**

> AR-Powered Measurement & AI Item Counting Application

---

## 📱 Mobile Installation (PWA)

### Android Devices

**Method 1: Install Prompt**
1. Open the app in Chrome browser
2. Wait for the install prompt to appear at the top
3. Tap **"Install"** button
4. App will be added to your home screen

**Method 2: Browser Menu**
1. Open the app in Chrome browser
2. Tap the **three-dot menu** (⋮)
3. Tap **"Install app"** or **"Add to Home screen"**
4. Confirm by tapping **"Install"** or **"Add"**

**Method 3: Using the Install Button**
1. Tap the **📲 install icon** in the header
2. Follow the prompts to install

---

### iOS Devices (iPhone/iPad)

1. Open the app in **Safari** browser
2. Tap the **Share button** (square with arrow up)
3. Scroll down and tap **"Add to Home Screen"**
4. Enter a name (or keep "MeasureCount Pro")
5. Tap **"Add"** in the top right corner
6. App icon will appear on your home screen

**Note:** iOS requires Safari for PWA installation. Chrome on iOS does not support PWA installation.

---

## 🖥️ Windows Desktop Installation

### Method 1: Using Install Script

1. Run `install-windows.bat` (double-click)
2. Follow the prompts
3. Desktop shortcut will be created
4. App will open in a standalone window

### Method 2: Manual Installation (Chrome/Edge)

**Using Microsoft Edge:**
1. Open the app in Edge browser
2. Click the **three-dot menu** (⋯)
3. Go to **Apps** → **Install MeasureCount Pro**
4. Click **"Install"**
5. App will be available in Start Menu and Desktop

**Using Google Chrome:**
1. Open the app in Chrome browser
2. Click the **install icon** in the address bar (⊕)
3. Click **"Install"**
4. App will be available in Start Menu and Desktop

---

## 📦 Features

- **📐 AR Measurement** - Measure objects using your camera
- **🔢 Count Same Items** - Count identical objects with AI
- **🏷️ Count Different Items** - Classify and count different object types
- **📊 Results & History** - Save, export, and share your measurements
- **📱 PWA Support** - Works offline after installation
- **🌙 Dark Mode** - Easy on the eyes

---

## 🔧 System Requirements

### Mobile
- **Android:** Chrome browser (version 80+)
- **iOS:** Safari browser (iOS 11.3+)
- **Camera:** Required for measurement features

### Desktop
- **Windows:** 10 or later
- **Browser:** Edge (Chromium) or Chrome (version 80+)
- **Internet:** Required for initial load, works offline after

---

## 📁 Files Overview

| File | Description |
|------|-------------|
| `index.html` | Main application HTML |
| `styles.css` | Application styles |
| `app.js` | Main application logic |
| `camera.js` | Camera module |
| `measurement.js` | AR measurement module |
| `object-detection.js` | AI object detection |
| `utils.js` | Utility functions |
| `sw.js` | Service worker (offline support) |
| `manifest.json` | PWA manifest |
| `icons/` | App icons |

---

## 🐛 Troubleshooting

### App doesn't install on mobile
- Make sure you're using a supported browser (Chrome on Android, Safari on iOS)
- Check that you have enough storage space
- Try clearing browser cache and reloading

### Camera not working
- Grant camera permission when prompted
- Check browser settings for camera access
- Ensure no other app is using the camera

### App not working offline
- Make sure the service worker is registered (check browser console)
- Clear cache and reload the app
- Reinstall the PWA

---

## 📞 Support

For issues or questions, please check the browser console for error messages.

---

**Version:** 1.0.0  
**App Name:** MeasureCount Pro  
**© 2024 MeasureCount Pro**
