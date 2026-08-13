# GitHub Actions

## `build.yml`

- **Trigger:** push/PR ke `main` atau `master`, atau manual (*Actions → Build → Run workflow*)
- **Jobs:**
  - `build` — `npm ci` + `npm run build` di Node 22 & 24
  - Upload artifact `council-dist` (isi folder `dist/`) dari Node 22
  - `deploy-pages` — deploy ke **GitHub Pages** (hanya push ke main/master)

## Setup repo (WAJIB untuk GitHub Pages)

1. Push project ke GitHub (termasuk folder `.github/workflows/`).
2. Pastikan ada `package-lock.json` (dari `npm install`) agar `npm ci` jalan.
3. **Aktifkan GitHub Pages** (langkah yang sering terlewat):
   - Buka repo di GitHub → **Settings** → **Pages**
   - Di bagian **Build and deployment** → **Source** pilih **GitHub Actions**
   - Simpan. Tidak perlu pilih branch.
4. Push lagi (atau re-run workflow di tab Actions). Setelah sukses, URL site muncul di Settings → Pages.

> Error `Get Pages site failed` / `Not Found` = Pages belum di-set ke **GitHub Actions**. Aktifkan dulu seperti di atas, baru re-run workflow.

## Base path (project site)

Kalau site-nya di `https://USERNAME.github.io/REPO_NAME/` (bukan user/org site), set base path:

Di `vite.config.ts`:

```ts
base: process.env.GITHUB_PAGES === "true" ? "/REPO_NAME/" : "./",
```

Dan di workflow, ubah step build:

```yaml
- name: Typecheck & production build
  run: npm run build
  env:
    GITHUB_PAGES: "true"
```

Ganti `REPO_NAME` dengan nama repository-mu.

## Artifact

Setelah build sukses: **Actions** → pilih run → **council-dist** → Download (bisa di-upload ke shared hosting).
