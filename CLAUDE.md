# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Аренда Неба** — Russian-language site for boom lift (автовышка) rental in Saint Petersburg. Full-stack **Node.js + Express**, **SQLite** (`database.db`), vanilla **HTML/CSS/JS** in `public/` (no bundler).

**Remote**: GitHub `MassimoUniverse/Arenda-neba-1`, branch `main`.

---

## Key behavior notes

### «Популярная техника» on the homepage (`index.html` → `public/script.js`)

- Data comes from **`GET /api/popular-cards`**: services with `active = 1`, `is_popular = 1`, ordered by **`popular_order`**.
- Admin toggles **`is_popular`**, **`popular_order`**, main photo **`image_url`**, gallery **`images`**, **`short_description`**, **`card_bullets`** via **`/admin.html`** → API **`PUT /api/admin/services/:id`**.
- **Image priority (2026-04 fix)**: Slider always uses `image_url` from DB as the primary slide image. Falls back to `/uploads/` gallery images, then `getImageForService()`. `collectAdminImagePaths()` / `collectAdminImagePathsOrdered()` are helper functions used elsewhere.
- **Cyrillic filenames in uploads**: When setting `img.src` via `innerHTML`, Cyrillic characters in the path must be percent-encoded (use `encodeURIComponent` on non-ASCII chars). Direct `img.src = path` assignment handles it automatically. Script uses `imageSrcEncoded` variable for the innerHTML template.
- Cache busting: `addCacheBuster(url, updated_at)` appends `?v=<unix_ms>` derived from the `updated_at` SQLite datetime string.
- Related helpers in **`script.js`**: `collectAdminImagePaths()`, `collectAdminImagePathsOrdered()`, `getImageForService()`, `addCacheBuster()`.

### Admin panel: saving, archiving and deleting equipment (2026-11)

- **Save** (`PUT /api/admin/services/:id` → `updateService`): reads the current row first. `active` is kept when the form does not send it (an archived machine stays archived). The form sends `expected_updated_at`; if the row changed since the form was opened the server answers **409** instead of overwriting.
- **Page address** (`normalizeServiceUrl`): always `/avtopark/<latin-slug>.html`; an empty field keeps the old address; another machine's address is refused (400). On change the old page file moves to `backups/deleted/…` and a 301 is stored in the **`page_redirects`** table (applied in the `/avtopark/*` middleware).
- **Visibility**: `/avtopark/<page>.html` is served only while an **active** service with that URL exists — archived or deleted machines answer 404 even if the file is still on disk.
- **Delete**: nothing is erased. The row (`service.json`), the page and the photos move to `backups/deleted/<date>-service-<id>/`; photos used by another machine stay in `uploads/`.
- **Derived columns** (`height_lift`, `max_reach`, `max_capacity`, `width`, …) are computed on the server from `custom_specs` by **`lib/spec-fields.js`** — do not rely on the values the browser sends. The homepage calculator reads them.
- Any successful non-GET `/api/admin/*` request resets the 60 s SSR cache (`seoDataCache`).
- **Homepage calculator** (`loadCalculatorEquipmentFromAPI` in `script.js`): keys are the height (`21`), `self`, `30offroad`, `loader`; a clash gets `-<id>` appended, a machine with no height gets `id<id>`. Only machines from the API are listed.

### Lead form: phone check and anti-spam (2026-11)

- **`public/lead-form.js`** is shared by the browser (`window.LeadForm`) and the server (`require` in `server.js`), so both validate the phone the same way. `normalizePhone()` accepts Russian/Kazakh numbers in any spelling, an extension («доб. 12»), two numbers separated by a comma, and foreign numbers written with `+`; it stores them as `+7 (999) 123-45-67`.
- Both forms (homepage `#calculator-form`, equipment page `#equipmentCalculatorForm`) call `LeadForm.checkPhoneField(form)` before sending and show the hint under the field. `LeadForm.protect(form)` adds a hidden trap field `hp_check` and a timestamp; `appendMeta()` sends `hp_check` and `form_ms`.
- **`POST /api/requests`** = `leadRateLimit` → `leadUpload` → handler. No captcha on purpose. Rejections always answer with a Russian text and the phone number (never a silent «success»), so a real person caught by a filter can still call.
  - Limits (in memory, reset on restart): 8 attempts / 10 min and 25 / day per visitor, 40 / 10 min per connection address, 80 / hour for the whole site, 4 accepted leads / hour per phone number.
  - The visitor address comes from the Yandex API Gateway header `x-real-remote-address` (present when `x-serverless-gateway-id` is set); `X-Real-IP` from nginx is the gateway itself for such requests.
  - The same lead repeated within 2 minutes answers «already received» without a second row or e-mail.
  - Up to two files are accepted in `attachment` and the first is kept: old cached equipment pages sent the file twice.
- Do not test the form against production from a local copy: `window.LEAD_API_BASE` in `script.js` / `equipment-page.js` points at the production gateway. Point it at the copy first.

### Database fields worth knowing

- **`services`**: includes `short_description`, `is_popular`, `popular_order`, `card_bullets`, `image_url`, `images` (JSON), `custom_specs`, `updated_at`, etc.
- **`content`**, **`advantages`**, **`reviews`**, **`requests`**, **`admins`**, **`homepage`**, **`page_redirects`** (old page address → new).

---

## Common Commands

```bash
npm start              # Production: node server.js
npm run dev            # nodemon server.js
npm run init-db        # init-db.js — schema + default admin
npm run generate-pages # DISABLED (needs --force): stale generator, corrupts /public/avtopark/*.html — pages are written by server.js on admin save
node regen-pages-direct.js # Correct bulk regeneration (evals the real generator from server.js); used by scripts/server-setup-git.sh
npm run fix-encoding   # fix-encoding.js — repair mixed UTF-8 / Win-1251 in DB
npm run update         # update.sh (git pull + restart — environment-dependent)

node init-database-safe.js                    # Safe init; does not wipe existing DB
node optimize-uploads.js                      # Compress uploads to WebP (if present)
node reset-admin.js                           # Reset admin user
node scripts/update-prices-2026.js
node scripts/apply-equipment-specs-preset.js
node scripts/rename-uploads-to-ascii.js       # Rename Cyrillic upload filenames to ASCII (+ updates DB)
node scripts/repair-legacy-spec-fields.js     # Recompute derived spec columns from custom_specs (dry run; --apply to write)
```

Local URL: **http://localhost:3000** · Admin: **`/admin.html`**

---

## Environment Variables

Copy **`.env.example`** → **`.env`**:

```
PORT=3000
JWT_SECRET=<random>
TELEGRAM_BOT_TOKEN=<optional>
TELEGRAM_CHAT_ID=<optional>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123   # change in production
```

---

## Architecture

```
server.js                    # Monolithic Express (~2850 lines): routes, DB, uploads, HTML generation
ecosystem.config.js          # PM2 config (app name: arenda-neba, cwd: /opt/arenda-neba, port: 3000)
lib/slugify-filename.js      # ASCII-safe upload filenames
lib/seo-blocks.js            # Server-rendered homepage/equipment blocks
lib/spec-fields.js           # Derived spec columns from custom_specs

public/
  index.html, script.js, styles.css           # Landing + «Популярная техника» slider
  admin.html, admin-script.js, admin-styles.css
  equipment-page.js, equipment-page.css        # Equipment detail pages
  animations.js, cookie-consent.js            # Standalone helpers loaded in index.html
  equipment/*.html                            # Often generated; do not hand-edit if generated

uploads/                     # User/admin uploads (not in git; large on server)
database.db                  # SQLite (gitignored locally; server has its own copy)
scripts/server-setup-git.sh  # Runs on VPS during deploy: git pull → npm install → pm2 restart
```

> **Root directory clutter**: The repo root contains many one-off `*.js` diagnostic/fix scripts and `FIX_*.md` / `SETUP_*.md` docs generated during previous incidents. Treat them as historical artifacts — they are not part of the normal workflow and can be ignored unless troubleshooting a specific past issue.

### Key functions in `server.js` (navigate by name)

| Function | Lines (approx) | Purpose |
|---|---|---|
| `generateEquipmentPageHTML()` | 85–807 | Builds full product page HTML from a service row |
| `fixImageUrl()` | ~960 | Strips localhost, converts `.png`→`.webp` |
| `fixEncoding()` | ~1013 | Repairs Win-1251/UTF-8 mixed encoding in DB values |
| `authenticateToken` | ~1302 | JWT middleware for all `/api/admin/*` routes |
| `processServiceRow()` | ~1710 | Applies encoding, URL, and image fixes to a raw DB row |
| `generateUrlFromTitle()` | ~45 | Transliterates Russian title → Latin `.html` slug |

### Conventions

- **Single `server.js`**: No separate router modules; search before adding endpoints.
- **Equipment HTML template**: `public/equipment/_template.html` — `generateEquipmentPageHTML()` injects into it. Edit the template for layout changes; edit the function for data/logic changes.
- **Encoding**: `fixEncoding()` exists for legacy bad encoding in DB; do not remove blindly.
- **Slugs**: `generateUrlFromTitle()` transliterates Russian titles to Latin `*.html` URLs.
- **Images**: Uploaded files are stored via multer → optionally processed by sharp to WebP. **`fixImageUrl()`** normalizes paths — use when building URLs.
- **Admin auth**: JWT from **`POST /api/admin/login`** → **`Authorization: Bearer <token>`** on **`/api/admin/*`**.
- **Telegram**: `sendTelegramNotification()` fires on every new lead (`POST /api/requests`). Requires `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` in `.env`; silently skips if absent.
- **scripts/ utilities**: `rename-uploads-to-ascii.js` (renames Cyrillic filenames + updates DB) and `repair-upload-urls-by-timestamp.js` (repairs broken DB URLs by matching file timestamps) — run manually when upload filenames get out of sync.

---

## API (short reference)

| Area | Method | Path |
|------|--------|------|
| Content | GET | `/api/content`, `/api/content/:section` |
| Homepage | GET | `/api/homepage` |
| Popular cards | GET | `/api/popular-cards` |
| Services | GET | `/api/services`, `/api/services/url/*` |
| Reviews | GET | `/api/reviews` |
| Advantages | GET | `/api/advantages` |
| Leads | POST | `/api/requests` |
| Admin | * | `/api/admin/*` (JWT) — services CRUD, uploads, content, reviews, etc. |

---

## Deployment (Windows + production VPS)

**Production path on VPS**: `/opt/arenda-neba`  
**Stack**: Node 20, **PM2** (`arenda-neba`), **Nginx** → `proxy_pass` localhost:3000 · uploads live on server only.

**Local deploy script (this repo)**:

1. Commit and **`git push origin main`**.
2. Run **`deploy-via-plink.ps1`** (requires **PuTTY** `plink.exe` + `pscp.exe` in default install path).

**Credentials for SSH/plink** (host, user, password): store in **`.ssh-deploy.local`** (copy from **`.ssh-deploy.local.example`**). That file is **gitignored** — **never commit it**. Do not paste real passwords into `CLAUDE.md` or chat logs in production workflows.

**What the deploy script does**: uploads **`scripts/server-setup-git.sh`** via pscp, runs it via plink → `git fetch + checkout main`, `npm install`, `npm rebuild sqlite3` (must rebuild on Linux after every install), `pm2 restart arenda-neba`.

**Server PM2 logs**: `pm2 logs arenda-neba` · error log at `/opt/arenda-neba/logs/pm2-error.log`.

**`webhook-handler.js`** (PM2, port **3001**) is effectively dead: port 3001 is closed by ufw and not proxied by nginx, last received push 2026-04-09. Deploys are manual.

**Backups**: `backup-full.sh` / `backup-full.ps1` — `database.db` + `uploads/` into `./backups/`.

---

## Frontend Notes

- No build step; edit static files directly.
- **`script.js`** / **`admin-script.js`** are large — use search.
- Analytics (Yandex.Metrika, CallTouch) are embedded in **`index.html`**.

---

## When changing behavior

1. Prefer **minimal diffs**; match existing style in `server.js` and `public/*.js`.
2. After user-facing fixes: **commit → push → run `deploy-via-plink.ps1`** if the user expects production updated.
3. **`uploads/`** and production **`database.db`** are not replaced by git pull — do not assume local DB matches the live site.
