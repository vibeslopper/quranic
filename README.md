# Quranic

Quranic is a lightweight static site for separate Quran-learning games. Its first game, Surah learning, practises the numbers, names, meanings, Arabic forms, and order of the 114 surahs.

## Build the CSS

Place the Tailwind CSS v4 standalone CLI in the repository root as `tailwindcss` (it is a local build tool, not a site dependency), then run:

```sh
./tailwindcss -i ./src/input.css -o ./output.css --minify
```

Commit the generated `output.css`. Tailwind scans `index.html` and the game HTML/JavaScript listed in `tailwind.config.js`; keep class names written out in full in those files. The raw source HTML files are not scanned. The CLI is only used to build CSS; the deployed site remains static.

## Run locally

Build the CSS, then open `index.html` directly in a browser or serve this folder with any static web server. There is no JavaScript build step, and the page makes no runtime data or CDN requests.

## Deploy to GitHub Pages

1. Commit the site files, including the generated `output.css`.
2. Push the repository to the `main` branch.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/ (root)**, then save.
6. Wait for GitHub Pages to publish the site and open the URL shown in the Pages settings.

The empty `.nojekyll` file tells GitHub Pages not to run Jekyll over the site.
