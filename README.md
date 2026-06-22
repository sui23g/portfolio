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
