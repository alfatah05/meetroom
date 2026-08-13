# Deploy

## GitHub Pages (recommended)

1. Push repo (termasuk `.github/workflows/build.yml`).
2. **Wajib:** Repo → **Settings** → **Pages** → Source = **GitHub Actions**.
3. Push ke `main`/`master` (atau re-run workflow di tab Actions).
4. URL site ada di Settings → Pages setelah deploy sukses.

Kalau error `Get Pages site failed` / `Not Found` → Pages belum diaktifkan (langkah 2).

### Base path untuk project site

Kalau URL-nya `https://USERNAME.github.io/REPO_NAME/`, set di `vite.config.ts`:

```ts
base: process.env.GITHUB_PAGES === "true" ? "/REPO_NAME/" : "./",
```

dan di workflow build step tambahkan:

```yaml
env:
  GITHUB_PAGES: "true"
```

## Shared Hosting (Apache/Nginx)

1. `npm install`
2. `npm run build`
3. Upload **semua isi** folder `dist/` ke public_html (atau document root).
4. Pastikan file `.htaccess` ada di root upload (dari `public/.htaccess`).
5. Apache: mod_rewrite harus aktif.
6. Nginx contoh:

```
location / {
  try_files $uri $uri/ /index.html;
}
```

Tidak butuh Node.js di server.
