# GitHub Actions

## `build.yml`

- **Trigger:** push/PR ke `main` atau `master`, atau manual (*Actions → Build → Run workflow*)
- **Jobs:**
  - `build` — `npm ci` + `npm run build` di Node 20 & 22
  - Upload artifact `council-dist` (isi folder `dist/`)
  - `deploy-pages` — deploy ke **GitHub Pages** (hanya push ke main/master)

## Setup repo

1. Push project ke GitHub (termasuk folder `.github/workflows/`).
2. Pastikan ada `package-lock.json` (dari `npm install`) agar `npm ci` jalan.
3. **GitHub Pages (opsional):**
   - Repo → **Settings** → **Pages**
   - Source: **GitHub Actions**
4. Kalau Pages 404 pada refresh route: Vite sudah `base: "./"`; untuk project site di `username.github.io/repo/`, set di `vite.config.ts`:

```ts
base: process.env.GITHUB_PAGES === "true" ? "/REPO_NAME/" : "./",
```

dan di workflow build step:

```yaml
- run: npm run build
  env:
    GITHUB_PAGES: "true"
```

## Artifact

Setelah build sukses: **Actions** → pilih run → **council-dist** → Download (bisa di-upload ke shared hosting).
