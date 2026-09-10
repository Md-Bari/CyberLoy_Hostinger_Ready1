# CyberLoy Frontend

This directory contains the clean, standalone Vite + React frontend application for CyberLoy.

## Prerequisites
- **Node.js**: v18+ or v20+
- **npm**: v9+

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Open local URL (http://localhost:3035) in your browser.

## Production Build

To build static assets for production (e.g. for Hostinger `public_html` deployment):

```bash
npm run build
```

The compiled static files and `.htaccess` will be placed inside the `dist/` directory.

### Hostinger Deployment Instructions
1. Build production assets: `npm run build`
2. Open the `frontend/dist/` folder.
3. Upload all contents of `frontend/dist/` directly into your domain's `public_html/` folder on Hostinger.
