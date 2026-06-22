---
name: Add Astro portfolio template
about: Adds an Astro-based portfolio template with thumbnail generation and GitHub Actions deployment to Pages.

Files added:
- README.md
- package.json
- scripts/generate-thumbs.js
- src/pages/index.astro
- src/components/Gallery.astro
- src/data/images.json
- public/assets/lightbox.js
- .github/workflows/deploy.yml
- .gitignore
- astro.config.mjs

Notes:
- The workflow publishes to gh-pages using peaceiris/actions-gh-pages.
- Add images to public/images/original and update src/data/images.json to show your works.
---

This PR was created by GitHub Copilot to add a ready-to-use Astro portfolio template. Please review and merge.
