# Deploy ke Shared Hosting (dev.nbil.my.id/meetroom)

## Kenapa blank hitam?
Browser gagal load CSS/JS (404). Halaman hanya menampilkan background gelap dari HTML inline.
Penyebab umum: file `index.html` dan folder `assets/` tidak cocok (hash nama file beda), atau ditaruh di path yang salah.

## Cara build (di laptop / CI)

```bash
npm install
npm run build
```

Hasil ada di folder `dist/`.

Config saat ini:
- `base: "./"` → asset path relatif (`./assets/...`)
- HashRouter → URL pakai `#/`, refresh tidak 404

## Cara upload (PENTING — jangan timpa setengah-setengah)

1. Di server, buka folder yang melayani URL `https://dev.nbil.my.id/meetroom/`
   (biasanya `public_html/meetroom/` atau sejenisnya).

2. **Hapus SEMUA isi folder itu dulu** (terutama folder `assets/` lama).
   File CSS/JS Vite punya hash di nama file. Kalau tidak dihapus, file lama + baru campur
   dan `index.html` bisa menunjuk ke nama yang tidak ada → 404.

3. Upload **semua isi** folder `dist/` ke folder `meetroom/` itu:
   ```
   meetroom/
     index.html
     favicon.svg
     icons.svg
     .htaccess
     assets/
       index-XXXXX.js
       index-XXXXX.css
       ...
   ```

4. Pastikan struktur sama seperti di `dist/` — jangan taruh `dist` sebagai subfolder.
   Salah: `meetroom/dist/index.html`
   Benar: `meetroom/index.html`

5. Buka: `https://dev.nbil.my.id/meetroom/` atau `https://dev.nbil.my.id/meetroom/index.html`
   Route app: `https://dev.nbil.my.id/meetroom/#/settings` dll.

## Cek di browser (F12 → Network)

- `index.html` → 200
- `assets/index-....js` → 200
- `assets/index-....css` → 200

Kalau masih 404, lihat path request vs path file di File Manager hosting.

## Jangan pakai artifact GitHub Pages mentah

Build GitHub Actions set `BASE_PATH=/nama-repo/` untuk GitHub Pages.
Untuk shared hosting, build lokal dengan `npm run build` (base `./`).
