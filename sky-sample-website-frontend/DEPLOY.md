# Deploy POS frontend to `public_html/pos`

**Live URL:** https://finance.skytechsl.com/pos/

**Backend API:** https://finance.skytechsl.com/pos/backend/public/api

## 1. Build on your PC

```bash
cd sky-sample-website-frontend
npm install
npm run build
```

This creates the `dist/` folder with `index.html`, `assets/`, `.htaccess`, etc.

## 2. Upload to server

Upload **everything inside** `dist/` to:

```
public_html/pos/
```

Example structure on the server:

```
public_html/
  pos/
    index.html
    .htaccess
    company-logo1.jpg
    assets/
      index-xxxxx.js
      index-xxxxx.css
```

Do **not** upload the `dist` folder itself — upload its **contents**.

**Critical:** Upload the whole `dist` folder every time (including `assets/`). If you only upload `index.html`, every page will 404 JS files like `Items-xxxxx.js`.

Verify before upload:

```powershell
npm run build
.\scripts\verify-dist.ps1
```

Put your logo at `public/company-logo1.jpg` before build (optional).

## 3. Environment (already in `.env.production`)

| Variable | Value |
|----------|--------|
| `VITE_API_BASE_URL` | `https://finance.skytechsl.com/pos/backend/public` |
| `VITE_BASE_PATH` | `/pos/` |

## 4. Open the app

- Login: https://finance.skytechsl.com/pos/
- Dashboard: https://finance.skytechsl.com/pos/dashboard

## 5. Fix 404 on page reload

After login, refreshing `/pos/dashboard` must serve `index.html`, not Apache 404.

1. Confirm **`public_html/pos/.htaccess`** exists (from `dist/.htaccess` after build).
2. Confirm **`public_html/pos/index.html`** exists.
3. On cPanel → **Apache Modules** → enable `rewrite`.
4. If still 404, add rules from `deploy/public_html.htaccess.example` into **`public_html/.htaccess`** (parent folder).
5. Re-upload `.htaccess` and run `npm run build` again so `dist/.htaccess` is current.

**Correct URLs** (one `/pos` in path):

| Page | URL |
|------|-----|
| Login | https://finance.skytechsl.com/pos/ |
| Dashboard | https://finance.skytechsl.com/pos/pos/dashboard → should be **/pos/dashboard** |

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page | Check browser console; ensure `assets/` uploaded |
| 404 on refresh | `.htaccess` in `pos/` + `mod_rewrite`; see section 5 |
| 404 on assets | Paths must be `/pos/assets/...` — rebuild with `VITE_BASE_PATH=/pos/` |
| API network error | Confirm backend at `.../pos/backend/public` works |
| Wrong login URL | Rebuild after changing `VITE_BASE_PATH` |

## Local dev (optional)

In `.env.local` for root dev without subfolder:

```
VITE_BASE_PATH=/
VITE_APP_BASE_PATH=
```
