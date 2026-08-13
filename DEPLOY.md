# Deploy ke Shared Hosting

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
