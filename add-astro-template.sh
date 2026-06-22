#!/usr/bin/env bash
set -e

# Create directories
mkdir -p src/pages src/components src/data scripts public/assets public/images/original public/images/thumbs .github/workflows

# README.md
cat > README.md <<'EOF'
# Portfolio (Astro) template

This repository contains a minimal Astro-based portfolio site for an illustrator.

Quick start

1. Add your images to public/images/original (create the directory).
2. Edit src/data/images.json to list your images with title and date.
3. Commit and push. GitHub Actions will build and deploy to GitHub Pages automatically.

Notes

- This is configured to use GitHub Actions and peaceiris/actions-gh-pages to publish the site.
- Thumbnails are generated during the build using scripts/generate-thumbs.js and sharp.
- If you don't want to include large images in the repo, add them manually in the GitHub UI or use an external host.
EOF

# package.json
cat > package.json <<'EOF'
{
  "name": "portfolio-astro",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "prebuild": "node scripts/generate-thumbs.js",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^4.0.0",
    "sharp": "^0.32.0"
  }
}
EOF

# scripts/generate-thumbs.js (skip if no images)
cat > scripts/generate-thumbs.js <<'EOF'
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = path.join(__dirname, '..', 'public', 'images', 'original');
const outDir = path.join(__dirname, '..', 'public', 'images', 'thumbs');

if (!fs.existsSync(srcDir)) {
  console.log('No images/original directory found — skipping thumbnail generation.');
  process.exit(0);
}
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const files = fs.readdirSync(srcDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  if (files.length === 0) {
    console.log('No images found in public/images/original — skipping.');
    return;
  }
  for (const f of files) {
    const inPath = path.join(srcDir, f);
    const outPath = path.join(outDir, f.replace(/\.(jpg|jpeg)$/i, '.jpg'));
    try {
      await sharp(inPath)
        .resize({ width: 800 })
        .jpeg({ quality: 80 })
        .toFile(outPath);
      console.log('thumb:', f);
    } catch (e) {
      console.error('failed:', f, e.message || e);
    }
  }
})();
EOF

# src/pages/index.astro
cat > src/pages/index.astro <<'EOF'
---
import Gallery from '../components/Gallery.astro';
---

<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Portfolio</title>
  </head>
  <body style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
    <main style="max-width:1100px;margin:36px auto;padding:0 18px;">
      <Gallery/>
    </main>
  </body>
</html>
EOF

# src/components/Gallery.astro
cat > src/components/Gallery.astro <<'EOF'
---
import images from '../data/images.json';
---

<style>
.gallery { display:grid; grid-template-columns: repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
.thumb { cursor:pointer; width:100%; height:150px; object-fit:cover; border-radius:6px; }
.header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.contact-btn { background:#111; color:#fff; padding:8px 12px; border-radius:6px; text-decoration:none; }
</style>

<div class="header">
  <h2>Portfolio</h2>
  <a class="contact-btn" href="mailto:you@example.com">依頼・お問い合わせ</a>
</div>

<div class="gallery">
  {images.map(image => (
    <img
      class="thumb"
      src={`/images/thumbs/${image.file}`}
      alt={image.title}
      data-full={`/images/original/${image.file}`}
      data-title={image.title}
      data-date={image.date}
      loading="lazy"
    />
  ))}
</div>

<script type="module" src="/assets/lightbox.js"></script>
EOF

# src/data/images.json
cat > src/data/images.json <<'EOF'
[
  {
    "file": "sample01.jpg",
    "title": "サンプル作品01",
    "date": "2026-01-10"
  }
]
EOF

# public/assets/lightbox.js
cat > public/assets/lightbox.js <<'EOF'
// Very small lightbox script (vanilla JS)
const createModal = () => {
  const modal = document.createElement('div');
  modal.style = `
    position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    background:rgba(0,0,0,0.8); z-index:9999; padding:20px;
  `;
  modal.innerHTML = `
    <div style="max-width:90%; max-height:90%; position:relative; color:#fff;">
      <img id="lb-img" style="max-width:100%; max-height:80vh; display:block; margin:0 auto; border-radius:6px;" />
      <div id="lb-meta" style="margin-top:8px; text-align:center;"></div>
      <button id="lb-close" style="position:absolute; right:0; top:-40px; background:none; border:none; color:#fff; font-size:28px; cursor:pointer;">&times;</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#lb-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  return modal;
};

document.addEventListener('click', (e) => {
  const t = e.target.closest && e.target.closest('img[data-full]');
  if (!t) return;
  const modal = createModal();
  const img = modal.querySelector('#lb-img');
  const meta = modal.querySelector('#lb-meta');
  img.src = t.dataset.full;
  meta.innerHTML = `<strong>${t.dataset.title || ''}</strong><div style="font-size:0.9em; opacity:0.9">${t.dataset.date || ''}</div>`;
});
EOF

# .github/workflows/deploy.yml
cat > .github/workflows/deploy.yml <<'EOF'
name: Build and Deploy to GitHub Pages
on:
  push:
    branches: [ "main" ]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Generate thumbnails (prebuild)
        run: node scripts/generate-thumbs.js
      - name: Build site
        run: npm run build
      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
EOF

# .gitignore
cat > .gitignore <<'EOF'
node_modules/
.dist/
.dist
.DS_Store
.env
EOF

# astro.config.mjs
cat > astro.config.mjs <<'EOF'
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sui23g.github.io/portforio',
});
EOF

echo "Template files created."
echo "Note: public/images/original exists but empty. Add images there and update src/data/images.json before merging."
