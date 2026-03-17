# 🚀 OSAI v8.0 - Setup & Installation Guide

## Complete Installation Instructions

### Prerequisites

- **Node.js:** Version 18.0.0 or higher
- **npm:** Version 9.0.0 or higher
- **Git:** For version control
- **Modern Browser:** Chrome 80+, Firefox 75+, Safari 14+, Edge 80+

---

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd c:\Projects\OSAI
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

This will:
- Start Vite dev server on `https://localhost:8080`
- Enable Hot Module Replacement (HMR)
- Open browser automatically

### 3. Access Application

Navigate to: **https://localhost:8080**

> **Note:** HTTPS is required for camera access. Vite automatically generates SSL certificates.

---

## Detailed Installation

### Option A: Full Development Setup

#### Step 1: Clone/Navigate to Project

```bash
cd c:\Projects\OSAI
```

#### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- **Runtime:** TensorFlow.js, COCO-SSD, MobileNet, Tesseract.js, jsQR
- **Dev Tools:** Vite, Jest, ESLint, Prettier, TypeScript

#### Step 3: Verify Installation

```bash
npm run doctor
```

Checks:
- Node.js version ✓
- npm version ✓
- Required files ✓
- Permissions ✓

#### Step 4: Start Development

```bash
npm run dev
```

---

### Option B: Production Build

#### Step 1: Build Application

```bash
npm run build
```

Output:
- `dist/` directory with optimized files
- Minified JavaScript and CSS
- Optimized assets
- Source maps for debugging

#### Step 2: Preview Production Build

```bash
npm run preview
```

Access at: `https://localhost:8081`

#### Step 3: Deploy to Production Server

Copy `dist/` contents to your web server:

```bash
# Example: Deploy to nginx
sudo cp -r dist/* /var/www/osai/
```

---

### Option C: Simple HTTP Server (No Build)

For quick testing without build tools:

```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx http-server -p 8080 -c-1

# Using PHP
php -S localhost:8080
```

> **Note:** Camera access may require HTTPS. Use localhost for testing.

---

## Development Commands

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with HMR
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm run test:ci          # CI/CD mode

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix issues
npm run format           # Prettier format

# Analysis
npm run analyze          # Bundle size analysis
npm run security-audit   # npm audit
```

---

## Project Structure

```
OSAI/
├── index.html                    # Main HTML file
├── package.json                  # Dependencies & scripts
├── vite.config.js               # Build configuration
├── jest.config.js               # Test configuration
├── .eslintrc.json              # Linting rules
├── .prettierrc                 # Formatting rules
│
├── Core Infrastructure (NEW)
│   ├── error-boundary.js       # Error handling
│   ├── security-manager.js     # Security
│   ├── state-manager.js        # State management
│   ├── memory-manager.js       # Memory management
│   ├── lazy-loader.js          # Lazy loading
│   ├── worker-manager.js       # Web Workers
│   └── ai-worker.js            # AI processing worker
│
├── UX Enhancement (NEW)
│   ├── onboarding.js           # User onboarding
│   └── help-system.js          # Help & shortcuts
│
├── Testing (NEW)
│   ├── __tests__/
│   │   ├── error-boundary.test.js
│   │   └── state-manager.test.js
│   ├── jest.config.js
│   └── jest.setup.js
│
├── Type Definitions (NEW)
│   └── types.js                # JSDoc types
│
├── Existing Modules
│   ├── app.js                  # Main application
│   ├── camera.js               # Camera access
│   ├── comprehensive-detection.js
│   ├── enhanced-ai.js
│   ├── measurement.js
│   ├── object-detection.js
│   ├── ocr.js
│   ├── barcode-scanner.js
│   └── ... (20+ more modules)
│
├── Styles
│   ├── styles.css              # Main styles
│   └── enterprise-header.css   # Header styles
│
├── Assets
│   ├── icons/                  # App icons
│   ├── OSAI.png               # Logo
│   └── Logo_OmniSight.png     # Alternative logo
│
└── Documentation
    ├── README.md              # This file
    ├── INSTALL.md             # Installation guide
    ├── TRANSFORMATION_REPORT.md
    └── ... (15+ docs)
```

---

## Configuration

### Environment Variables

Create `.env` file for custom configuration:

```env
# App Configuration
OSAI_APP_NAME=OSAI Enterprise Vision
OSAI_VERSION=8.0.0
OSAI_API_URL=https://api.example.com

# Feature Flags
OSAI_FEATURE_ANALYTICS=true
OSAI_FEATURE_CLOUD_SYNC=false

# Build Options
OSAI_BUILD_ANALYZE=true
```

### Browser Configuration

For camera access, ensure:
- HTTPS enabled (or localhost)
- Camera permissions granted
- Modern browser with WebRTC support

---

## Testing

### Run All Tests

```bash
npm test
```

### Test Specific Module

```bash
npm test -- error-boundary
npm test -- state-manager
```

### Test with Coverage

```bash
npm run test:coverage
```

Opens HTML report in browser showing:
- Line coverage
- Function coverage
- Branch coverage
- Uncovered lines

### Write New Tests

Create `__tests__/module-name.test.js`:

```javascript
describe('MyModule', () => {
    test('should do something', () => {
        // Your test here
        expect(true).toBe(true);
    });
});
```

---

## Troubleshooting

### Camera Not Working

**Problem:** Camera permission denied or not accessible

**Solutions:**
1. Ensure HTTPS (or localhost)
2. Check browser permissions
3. Verify camera not used by other app
4. Try different camera (front/back)

```bash
# Check camera access
navigator.mediaDevices.getUserMedia({ video: true })
    .then(() => console.log('Camera OK'))
    .catch(err => console.error('Camera error:', err));
```

### Build Fails

**Problem:** Build errors or missing dependencies

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Tests Fail

**Problem:** Test failures after changes

**Solutions:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests in verbose mode
npm test -- --verbose
```

### Performance Issues

**Problem:** Slow loading or laggy UI

**Solutions:**
1. Enable lazy loading for features
2. Reduce model cache size
3. Check memory usage in DevTools
4. Disable unused features

---

## Deployment

### Deploy to Netlify

1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Enable HTTPS automatically

### Deploy to Vercel

1. Import project
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

### Deploy to Self-Hosted Server

#### nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name osai.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/osai/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName osai.example.com
    
    DocumentRoot /var/www/osai/dist
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    <Directory /var/www/osai/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

---

## PWA Installation

### Desktop (Windows/Mac/Linux)

1. Open app in Chrome/Edge
2. Click install icon in address bar
3. Or: Menu → More tools → Create shortcut
4. Check "Open as window"
5. Click Create

### Mobile (Android/iOS)

**Android:**
1. Open in Chrome
2. Menu → Add to Home screen
3. Confirm installation
4. App appears on home screen

**iOS:**
1. Open in Safari
2. Share → Add to Home Screen
3. Confirm addition
4. App appears on home screen

---

## Development Tips

### Hot Module Replacement

Vite HMR automatically updates changed modules:

1. Edit any `.js` or `.css` file
2. Changes appear instantly in browser
3. State preserved for CSS changes

### Debugging

**Browser DevTools:**
- Sources tab for breakpoints
- Console for logs
- Network tab for requests
- Application tab for storage

**Source Maps:**
- Enabled in development
- Shows original code in debugger
- Production builds include maps

### Performance Profiling

```javascript
// Measure execution time
console.time('detection');
await detectObjects();
console.timeEnd('detection');

// Check memory usage
console.log(performance.memory);
```

---

## Support

### Documentation

- `README.md` - Overview
- `INSTALL.md` - Installation
- `TRANSFORMATION_REPORT.md` - Changes
- `AI_CAPABILITIES.md` - AI features

### Getting Help

1. Check browser console for errors
2. Review documentation
3. Run tests to verify setup
4. Check network tab for failed requests

### Common Issues

| Issue | Solution |
|-------|----------|
| Camera not loading | Check HTTPS, permissions |
| Models not loading | Check CDN access, internet |
| Build fails | Clear cache, reinstall |
| Tests fail | Update mocks, check imports |

---

## Next Steps

After installation:

1. ✅ Complete onboarding tour
2. ✅ Test all features
3. ✅ Run test suite
4. ✅ Review documentation
5. ✅ Customize settings
6. ✅ Deploy to production

---

**OSAI v8.0 - Enterprise Ready**

For questions or issues, refer to documentation or check browser console.
