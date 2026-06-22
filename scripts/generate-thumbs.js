// scripts/generate-thumbs.js
// Usage: node scripts/generate-thumbs.js
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const sharp = require('sharp');

const CANDIDATE_BASES = ['public/images'];
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

function isImage(name) { return IMAGE_RE.test(name); }

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) await fsp.mkdir(dir, { recursive: true });
}

async function main() {
  // find base directory
  let base = null;
  for (const b of CANDIDATE_BASES) {
    if (fs.existsSync(b)) { base = b; break; }
  }
  if (!base) {
    console.log('No images directory found. Create one of:', CANDIDATE_BASES.join(', '));
    process.exit(0);
  }

  const baseDir = path.resolve(base);
  const originalDir = path.join(baseDir, 'original');
  const thumbsDir = path.join(baseDir, 'thumbs');

  // If original doesn't exist but base has images, copy them into original/
  if (!fs.existsSync(originalDir)) {
    const baseFiles = (await fsp.readdir(baseDir)).filter(f => fs.lstatSync(path.join(baseDir, f)).isFile() && isImage(f));
    if (baseFiles.length > 0) {
      await ensureDir(originalDir);
      for (const f of baseFiles) {
        const src = path.join(baseDir, f);
        const dst = path.join(originalDir, f);
        let doCopy = true;
        if (fs.existsSync(dst)) {
          const [sStat, dStat] = await Promise.all([fsp.stat(src), fsp.stat(dst)]);
          if (dStat.mtimeMs >= sStat.mtimeMs) doCopy = false;
        }
        if (doCopy) {
          await fsp.copyFile(src, dst);
          console.log(`copied ${f} -> ${path.relative(process.cwd(), dst)}`);
        }
      }
    } else {
      console.log('No images found in', baseDir, 'and no original/ folder — nothing to do.');
      process.exit(0);
    }
  }

  await ensureDir(thumbsDir);

  const originals = (await fsp.readdir(originalDir)).filter(f => {
    const p = path.join(originalDir, f);
    return fs.lstatSync(p).isFile() && isImage(f);
  });

  if (originals.length === 0) {
    console.log('No images found in', originalDir);
    return;
  }

  for (const filename of originals) {
    const srcPath = path.join(originalDir, filename);
    const ext = path.extname(filename).toLowerCase();
    // keep extension for most, but normalize jpeg extension to .jpg
    const outName = filename.replace(/\.(jpeg|jpe)$/i, '.jpg');
    const outPath = path.join(thumbsDir, outName);

    try {
      const sStat = await fsp.stat(srcPath);
      if (fs.existsSync(outPath)) {
        const dStat = await fsp.stat(outPath);
        if (dStat.mtimeMs >= sStat.mtimeMs) {
          console.log(`skip (up-to-date): ${filename}`);
          continue;
        }
      }

      let transformer = sharp(srcPath).resize({ width: 800, withoutEnlargement: true });

      if (/\.(jpe?g)$/i.test(ext)) {
        transformer = transformer.jpeg({ quality: 80 });
      } else if (/\.webp$/i.test(ext)) {
        transformer = transformer.webp({ quality: 80 });
      } else if (/\.png$/i.test(ext)) {
        // keep png output but can tune compression if needed
        transformer = transformer.png({ compressionLevel: 9 });
      }

      await transformer.toFile(outPath);
      console.log(`thumb generated: ${outName}`);
    } catch (err) {
      console.error(`failed: ${filename} -> ${err.message}`);
    }
  }

  console.log('done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});