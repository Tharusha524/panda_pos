# POS System — Complete Setup Guide

Step-by-step instructions to install and run the **backend API** and **frontend POS app** on your machine (Windows) and on a production server.

> **සිංහල සාරාංශය:** පළමුව MySQL database එක හදන්න → `backend` folder එකේ Composer + migrate → `sky-sample-website-frontend` folder එකේ npm install → browser එකෙන් login. පහළ steps follow කරන්න.

---

## Table of Contents

1. [What you need (prerequisites)](#1-what-you-need-prerequisites)
2. [Get the code](#2-get-the-code)
3. [Database setup (MySQL)](#3-database-setup-mysql)
4. [Backend setup (Laravel API)](#4-backend-setup-laravel-api)
5. [Frontend setup (React POS)](#5-frontend-setup-react-pos)
6. [First login & test](#6-first-login--test)
7. [Run both apps together (daily development)](#7-run-both-apps-together-daily-development)
8. [Production deployment](#8-production-deployment)
9. [Initial POS configuration (after login)](#9-initial-pos-configuration-after-login)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What you need (prerequisites)

| Software | Version | Download |
|----------|---------|----------|
| **PHP** | 8.2 or newer | https://windows.php.net/download/ |
| **Composer** | Latest | https://getcomposer.org/download/ |
| **Node.js** | 18+ (20 LTS recommended) | https://nodejs.org/ |
| **MySQL** | 8.0+ (or MariaDB 10.6+) | XAMPP / WAMP / standalone MySQL |
| **Git** | Latest | https://git-scm.com/ |

### PHP extensions (enable in `php.ini`)

```
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_mysql
extension=zip
```

Verify:

```powershell
php -v
composer -V
node -v
npm -v
mysql --version
```

---

## 2. Get the code

```powershell
cd "F:\my work"
git clone <your-repo-url> POS
cd POS
```

If you already have the folder, just open it in your editor/terminal.

---

## 3. Database setup (MySQL)

### 3.1 Create database

Open **MySQL** (phpMyAdmin, MySQL Workbench, or command line):

```sql
CREATE DATABASE pos_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Create a user (optional but recommended for production):

```sql
CREATE USER 'pos_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON pos_system.* TO 'pos_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3.2 Note your connection details

You will need:

- Host: `127.0.0.1`
- Port: `3306`
- Database: `pos_system`
- Username / Password

---

## 4. Backend setup (Laravel API)

### 4.1 Open backend folder

```powershell
cd "F:\my work\POS\backend"
```

### 4.2 Install PHP dependencies

```powershell
composer install
```

If `composer install` is slow or fails, try:

```powershell
composer install --no-dev
```

### 4.3 Environment file

```powershell
copy .env.example .env
```

Edit `backend\.env` in Notepad or your IDE.

**Important:** `.env.example` has two `DB_CONNECTION` lines. Keep **only one** database block.

**For MySQL (recommended):**

```env
APP_NAME=POS_System
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pos_system
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

POS_DATABASE_PER_TENANT=false
```

**For quick local test with SQLite** (no MySQL):

```env
DB_CONNECTION=sqlite
# Comment out or remove DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD for mysql
```

Then create the SQLite file:

```powershell
New-Item -ItemType File -Path database\database.sqlite -Force
```

### 4.4 Application key

```powershell
php artisan key:generate
```

### 4.5 Run database migrations

```powershell
php artisan migrate
```

This creates all tables (users, items, sales, batches, subscriptions, etc.).

### 4.6 (Optional) Seed demo users & sample data

```powershell
php artisan db:seed
```

Default seed accounts:

| Email | Password | Role |
|-------|----------|------|
| `admin@pos.com` | `admin123` | Admin |
| `manager@pos.com` | `manager123` | Manager |
| `user@pos.com` | `user123` | User |

Change these passwords after first login in production.

### 4.7 Storage link (required for item images / uploads)

```powershell
php artisan storage:link
```

### 4.8 Start the API server

```powershell
php artisan serve
```

API base URL: **http://localhost:8000/api**

Test health:

```powershell
curl http://localhost:8000/up
```

Keep this terminal open while developing.

---

## 5. Frontend setup (React POS)

Open a **new** terminal:

```powershell
cd "F:\my work\POS\sky-sample-website-frontend"
```

### 5.1 Install dependencies

```powershell
npm install
```

### 5.2 Environment file

```powershell
copy .env.example .env
```

Edit `sky-sample-website-frontend\.env`:

**Local development:**

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_BASE_PATH=/
VITE_APP_BASE_PATH=
VITE_APP_NAME=POS System
```

> `VITE_API_BASE_URL` must **not** end with `/api` — the app adds `/api/auth/login`, etc. automatically.

> If you have `.env.local`, it overrides `.env` in Vite. Delete or update `.env.local` if login hits the wrong URL.

### 5.3 Start the frontend dev server

```powershell
npm run dev
```

Vite prints a URL, usually: **http://localhost:5173**

Open that URL in Chrome/Edge.

### 5.4 First-time backend URL in the app

If `VITE_API_BASE_URL` is empty, the app shows a **Backend setup** screen on first launch. Enter:

```
http://localhost:8000
```

It is saved in the browser (localStorage).

---

## 6. First login & test

### Option A — Use seeded admin

1. Open frontend URL (e.g. http://localhost:5173)
2. Login: `admin@pos.com` / `admin123`

### Option B — Register new company user

```powershell
curl -X POST http://localhost:8000/api/auth/register `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"My Shop\",\"email\":\"shop@example.com\",\"password\":\"password123\",\"password_confirmation\":\"password123\"}"
```

Then login in the web app with that email and password.

### Quick API login test

```powershell
curl -X POST http://localhost:8000/api/auth/login `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"admin@pos.com\",\"password\":\"admin123\"}"
```

You should receive `"success": true` and a `token`.

### Subscription note

New companies get an **active subscription** with `next_payment_date` one month ahead. If POS screens return **402 Payment Required**, go to subscription settings in the app or call:

```powershell
curl http://localhost:8000/api/subscription/status `
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 7. Run both apps together (daily development)

**Terminal 1 — Backend:**

```powershell
cd "F:\my work\POS\backend"
php artisan serve
```

**Terminal 2 — Frontend:**

```powershell
cd "F:\my work\POS\sky-sample-website-frontend"
npm run dev
```

Optional — clear Laravel cache after `.env` changes:

```powershell
cd backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

---

## 8. Production deployment

### 8.1 Backend (Laravel on server)

1. Upload `backend/` to the server (e.g. `public_html/pos/backend/`)
2. Point the web server **document root** to `backend/public`
   - Example URL: `https://yourdomain.com/pos/backend/public`
3. Set `backend/.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com/pos/backend/public
FRONTEND_URL=https://yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
SANCTUM_STATEFUL_DOMAINS=yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=pos_system
DB_USERNAME=...
DB_PASSWORD=...
```

4. On the server:

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate   # only once on first deploy
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
```

5. Folder permissions (Linux):

```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 8.2 Frontend (build static files)

On your PC or CI:

```powershell
cd sky-sample-website-frontend
```

Edit `.env` for production:

```env
VITE_API_BASE_URL=https://yourdomain.com/pos/backend/public
VITE_BASE_PATH=/pos/
VITE_APP_BASE_PATH=/pos
VITE_APP_NAME=POS System
```

Build:

```powershell
npm run build
```

Upload the contents of `sky-sample-website-frontend/dist/` to your web host (e.g. `public_html/pos/`).

### 8.3 Apache subfolder example

Frontend at: `https://yourdomain.com/pos/`  
API at: `https://yourdomain.com/pos/backend/public/api`

Ensure `dist/index.html` is served for SPA routes (fallback to `index.html`).

---

## 9. Initial POS configuration (after login)

Recommended order in **Settings**:

| Step | Setting | Purpose |
|------|---------|---------|
| 1 | **Company** | Shop name, logo, address |
| 2 | **Branch management** | Add branches/locations |
| 3 | **Inventory** | Enable multi-location if needed |
| 4 | **Item settings** | Item numbering, categories |
| 5 | **Order settings** | Hold PIN, negative stock, pricing rules |
| 6 | **Tax / VAT** | VAT rates |
| 7 | **Users & roles** | Staff accounts and permissions |
| 8 | **Backup** | Create first database backup (admin) |

### Create first product (with expiry)

1. Go to **Items** → **Add item**
2. Set **qty**, **purchase price**, **expiry date** on the item — this is **main (unbatched) stock**
3. Save

### Purchase stock

- **Same price + same expiry** as item → adds to **main stock** (no batch)
- **Different price or expiry** → creates a **batch**

See [README.md](README.md#core-business-logic) for full inventory/expiry rules.

---

## 10. Troubleshooting

### `SQLSTATE[HY000] [1045] Access denied`

- Check `DB_USERNAME` and `DB_PASSWORD` in `backend/.env`
- Confirm MySQL service is running

### `Base table or view not found`

```powershell
cd backend
php artisan migrate
```

### Login works in Postman but not in browser (CORS)

- Set `CORS_ALLOWED_ORIGINS` in `backend/.env` to your frontend URL
- No trailing slash on origin: `http://localhost:5173`

### Frontend calls wrong API URL

- Check `VITE_API_BASE_URL` in `.env`
- Delete `.env.local` if it points to old URL
- Restart `npm run dev` after env changes

### `402 SUBSCRIPTION_PAYMENT_REQUIRED`

- Subscription overdue — pay via app or extend `next_payment_date` in `subscriptions` table for dev

### Item images not showing

```powershell
php artisan storage:link
```

### Backup fails on Windows (mysqldump)

The system falls back to a PHP-based dump automatically. Ensure `storage/app/backups` is writable.

### Port 8000 already in use

```powershell
php artisan serve --port=8001
```

Update `VITE_API_BASE_URL=http://localhost:8001`

### `composer` or `php` not recognized

Add PHP and Composer to Windows **PATH**, then reopen PowerShell.

---

## Quick reference commands

```powershell
# Backend
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve

# Frontend
cd sky-sample-website-frontend
npm install
copy .env.example .env
npm run dev

# Production frontend build
npm run build
```

---

## Related docs

- [README.md](README.md) — System overview, security, inventory logic
- [backend/README.md](backend/README.md) — Backend overview
- [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md) — API reference (if present)

---

**Setup complete?** Login → Settings → Company → add items → open **POS Sales** and test a sale.
