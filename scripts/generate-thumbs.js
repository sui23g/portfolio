// scripts/generate-thumbs.js
// Reads images from ./images/original and writes thumbnails to ./images/thumbs
// Usage: node scripts/generate-thumbs.js

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.resolve('public/images/original');
const OUT_DIR = path.resolve('public/images/thumbs');
const IMAGE_RE = /\.(jpe?g|png|webp|gif)$/i;
const THUMB_WIDTH = 800; // 必要に応じて変更

function isImage(name) { return IMAGE_RE.test(name); }

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) await fsp.mkdir(dir, { recursive: true });
}

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.log('No images/original directory found — skipping thumbnail generation.');
    return;
  }

  await ensureDir(OUT_DIR);

  const entries = await fsp.readdir(SRC_DIR, { withFileTypes: true });
  const files = entries.filter(e => e.isFile() && isImage(e.name)).map(e => e.name);

  if (files.length === 0) {
    console.log('No images found in images/original — skipping.');
    return;
  }

  for (const filename of files) {
    const srcPath = path.join(SRC_DIR, filename);
    // normalize jpeg extension to .jpg for output
    const outName = filename.replace(/\.(jpeg|jpe)$/i, '.jpg');
    const outPath = path.join(OUT_DIR, outName);

    try {
      const sStat = await fsp.stat(srcPath);
      if (fs.existsSync(outPath)) {
        const dStat = await fsp.stat(outPath);
        if (dStat.mtimeMs >= sStat.mtimeMs) {
          console.log(`skip (up-to-date): ${filename}`);
          continue;
        }
      }

      let transformer = sharp(srcPath).resize({ width: THUMB_WIDTH, withoutEnlargement: true });

      const ext = path.extname(filename).toLowerCase();
      if (/\.(jpe?g)$/i.test(ext)) {
        transformer = transformer.jpeg({ quality: 80 });
      } else if (/\.webp$/i.test(ext)) {
        transformer = transformer.webp({ quality: 80 });
      } else if (/\.png$/i.test(ext)) {
        transformer = transformer.png({ compressionLevel: 9 });
      } else if (/\.gif$/i.test(ext)) {
        // For GIFs, convert to animated webp if you prefer, or keep as png (here we convert single-frame)
        // To fully preserve animated GIFs you'd need a different tool. We'll produce a webp (lossy) version.
        transformer = transformer.webp({ quality: 80 });
      }

      await transformer.toFile(outPath);
      console.log(`thumb generated: ${outName}`);
    } catch (err) {
      console.error(`failed: ${filename} -> ${err.message || err}`);
    }
  }

  console.log('done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});