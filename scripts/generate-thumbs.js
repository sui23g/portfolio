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
