# Turkish course web app

Stack: **Node.js (Express)** API + **React (Vite) + TypeScript** SPA, **SQLite** file database for progress. No user accounts (single learner per deployment).

## Requirements

- **Node.js 18+** (20 LTS recommended). The repo root `package.json` declares `"engines": { "node": ">=18.0.0" }`. Use `.nvmrc` with `nvm use` if you use nvm.
- Course Markdown stays in this repository; the API reads it from disk via `CONTENT_ROOT`.

## Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | API HTTP port | `3001` |
| `CONTENT_ROOT` | Absolute path to the repo root (must contain **`course/`** with chapters, `exercises/`, `resources/`, and root-level files such as `content.md`, `plan.md`, `progress.md`, `development-plan.md`) | Parent of `apps/` (repo root when running from a built `apps/api`) |
| `DATABASE_PATH` | SQLite database file | `<CONTENT_ROOT>/data/app.db` |
| `SERVE_STATIC` | Set to `0` to disable serving the built SPA from the API (API-only mode) | enabled when `apps/web/dist` exists |

## Development

From the repository root:

```bash
npm install
npm run dev
```

This builds `@turkish/shared`, then runs the API on port **3001** (TypeScript compiled with `tsc --watch` and `node --watch dist/index.js`) and the Vite dev server on **5173** with `/api` proxied to the API.

- Web UI: `http://localhost:5173`
- API health: `http://localhost:3001/api/health`

## Production build

```bash
npm run build
npm start
```

`npm start` runs `@turkish/api`, which serves `GET /api/*` and, if `apps/web/dist` exists, static assets plus SPA fallback for client-side routes.

Run with `CONTENT_ROOT` pointing at the directory that contains your Markdown (usually the repo root):

```bash
CONTENT_ROOT=/path/to/turkish npm start
```

## Data and backups

- **Progress** lives in the SQLite file at `DATABASE_PATH` (default `data/app.db` under `CONTENT_ROOT`).
- **Course content** is plain Markdown under `course/` in Git; back up the repo and the SQLite file.
- **Content IDs** in the API and progress DB are paths without `.md`, e.g. `course/month-01/chapter-01-01` and `course/exercises/grammar-tests`. If you had an older database from before content lived under `course/`, those rows no longer match — delete `data/app.db` or clear the `progress` table and start fresh.
- To reset progress, stop the server and delete `data/app.db` (or only the `progress` table).

## Troubleshooting

- **`better-sqlite3` install fails** — It ships prebuilt binaries for common Node/OS pairs. Use **Node 20 LTS** (see `.nvmrc`) and run `npm install` again. If you must compile from source, install Xcode Command Line Tools (`xcode-select --install`) on macOS.
- **Vite build fails on old Node** — The frontend requires **Node 18+** (Vite 5). Upgrade Node before `npm run build`.
- **`You installed esbuild for another platform` / wrong `@esbuild/*` (e.g. `aix-ppc64` on macOS)** — `node_modules` was installed on another OS or copied between machines. Remove and reinstall on this computer: `rm -rf node_modules package-lock.json && npm install` (or delete only `node_modules` and run `npm install`). Do not commit or copy `node_modules` between different OS/architectures.

## Security (self-hosted)

The app has **no authentication**. Run it on a trusted network, bind to `127.0.0.1` behind a reverse proxy (Caddy, nginx), and use TLS plus optional HTTP basic auth at the proxy if you expose it beyond localhost.

## API overview

- `GET /api/health` — liveness / paths in use
- `GET /api/manifest` — indexed chapters, exercises, resources
- `POST /api/manifest/refresh` — rebuild manifest cache after content edits
- `GET /api/content/:id` — raw Markdown (`id` is URL-encoded path without `.md`, e.g. `course%2Fmonth-01%2Fchapter-01-01`)
- `GET /api/progress` — all progress rows
- `PATCH /api/progress/:contentId` — JSON body: `{ "status"?, "notes"?, "touch"? }`. The bundled UI only sends `status` when you use the toolbar buttons and `notes` when you blur the notes field; it does **not** auto-update status on page load. Optional `touch` updates `last_opened_at` and can move `not_started` → `in_progress` if you call the API yourself.
