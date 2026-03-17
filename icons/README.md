# MeasureCount Pro - Icons

This directory contains app icons for the PWA.

## Files

- `icon-192.svg` - SVG icon (192x192)
- `icon-512.svg` - SVG icon (512x512)
- `icon-192.png` - PNG icon (192x192) - *generate this*
- `icon-512.png` - PNG icon (512x512) - *generate this*

## How to Generate PNG Icons

### Option 1: Using the Generator Page
1. Open `generate-icons.html` in a browser
2. Click "Download All Icons" button
3. Save the downloaded PNG files to this directory

### Option 2: Using Online Tools
1. Go to an SVG to PNG converter (e.g., cloudconvert.com, svgtopng.com)
2. Upload `icon-192.svg` and convert to 192x192 PNG
3. Upload `icon-512.svg` and convert to 512x512 PNG
4. Save the files to this directory

### Option 3: Using Node.js with Sharp
```bash
npm install -g sharp-cli
sharp icon-192.svg -o icon-192.png
sharp icon-512.svg -o icon-512.png
```

### Option 4: Using ImageMagick
```bash
convert icon-192.svg icon-192.png
convert icon-512.svg icon-512.png
```

## Note

The app will work without PNG icons (SVG is used as fallback in some browsers), 
but for full PWA compatibility, you should generate the PNG versions.
