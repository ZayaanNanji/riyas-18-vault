# Riyas 18 Neon Vault

A static, offline-first birthday puzzle vault for Riyas' 18th. Hostable on GitHub Pages.

## Run Locally

You need a local web server so the Service Worker and modules work.

Option 1 (Python):

```bash
python -m http.server 8080
```

Option 2 (Node):

```bash
npx serve .
```

Then open: `http://localhost:8080/`

## Replace Videos

Each level unlocks three videos. Files are resolved by naming convention:

```
assets/videos/A_L01_1.mp4
assets/videos/A_L01_2.mp4
assets/videos/A_L01_3.mp4
```

Repeat for all games and levels:

- Game A: `A_L01_1.mp4` to `A_L01_3.mp4`
- Game B: `B_L01_1.mp4` to `B_L01_3.mp4`
- Game C: `C_L01_1.mp4` to `C_L01_3.mp4`
- Game D: `D_L01_1.mp4` to `D_L01_3.mp4`

If a file is missing, the Vault shows a friendly message but keeps the unlock state.

## Deploy on GitHub Pages

1. Push this repo to GitHub (branch `main`).
2. Go to **Settings -> Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` and the workflow in `.github/workflows/pages.yml` will deploy.

Your site will be available at:

```
https://<username>.github.io/<repo>/
```

## PWA / Offline

After the first load, all core assets and level data are cached in `sw.js`. Turn on airplane mode and the site still runs.

## Notes

- The placeholder video is `assets/videos/placeholder.mp4`.
- Replace the placeholder image in `assets/images/video-placeholder.svg` if you want custom thumbnails.
