## Repo snapshot

This is a standard Laravel 12 application (PHP 8.2) with a Vite + Tailwind frontend.

- Backend: PHP (Laravel) — code lives in `app/`, routes in `routes/`, migrations in `database/migrations`.
- Frontend: Vite entry points: `resources/js/app.js` and `resources/css/app.css` (see `vite.config.js`).
- DB: default `.env` uses `DB_CONNECTION=sqlite` and repository contains `database/database.sqlite`.

## Big picture & key components

- HTTP/API: routes in `routes/web.php` and `routes/api.php`. API routes use `auth:sanctum` in the example (`/user`).
- Models & data: `app/Models` with PSR-4 autoloading. Factories in `database/factories`.
- Jobs/queues: queue connection is `database` (see `.env`), so background jobs and `queue:listen` are part of the dev workflow.
- Logging/diagnostics: project includes `laravel/pail` (vendor) used for live logging/diagnostics — `php artisan pail` writes `.pail` files under storage.

## Developer workflows (concrete commands)

- Full dev stack (project provides a composer script that runs everything concurrently):

```bash
composer dev
```

This runs: `php artisan serve`, `php artisan queue:listen --tries=1`, `php artisan pail --timeout=0`, and `npm run dev`.

- Vite dev server (assets hot reload):

```bash
npm run dev
```

- Build frontend production assets:

```bash
npm run build
```

- Run tests:

```bash
composer test
# or
php artisan test
```



## Agent workflow: plan-first + execution logs
- Before editing, create a per-task plan file: `.github/agent-plans/YYYYMMDD-HHMM-<short-slug>.md`.
- Plan file template:
	- Goal (1–2 lines)
	- Requirements checklist (copy exact bullets from the user ask)
	- Assumptions (if any) and scope boundaries
	- Plan (ordered steps) and Files to touch
	- Validation plan (Build, Lint, quick smoke; what “green” means)
	- Progress log (timestamped), Todos, Done, Decisions
- During work, update the plan:
	- After every 3–5 tool calls or when >3 files are edited, append to Progress log and mark checklist items Done/Deferred (+reason).
	- Summarize edits (file paths + brief purpose) and any commands run; record build/lint status.
	- Favor minimal diffs; avoid unrelated reformatting.
- On completion:
	- Add a Final summary (what changed, how verified), list of files/sections touched, and follow-ups.
	- Keep the plan file in the repo with the changes.

## Project-specific conventions & patterns

- DB/State: `SESSION_DRIVER`, `QUEUE_CONNECTION`, and `CACHE_STORE` are set to `database` in `.env` — migrations exist for these stores (check `database/migrations`).
- Passwords: `User` model uses the `password => 'hashed'` cast — prefer assigning raw passwords and let casting handle hashing when possible.
- Frontend: Vite config uses `laravel-vite-plugin` and `@tailwindcss/vite`. Edit `resources/js/app.js` and `resources/css/app.css` for UI changes.
- Exception/logging: `pail` is used as a live CLI logger (see `vendor/laravel/pail` files in vendor). Expect `.pail` files in `storage/pail`.

## Integration points & external dependencies

- Sanctum: `laravel/sanctum` is required — API/auth flows typically use token-based auth.
- Pail: live logging/diagnostics via `php artisan pail` as part of dev.
- Vite/Tailwind: front-end build pipeline via `vite` and `tailwindcss` in `package.json`.

## Examples agents should reference when making edits

- Add a new API route: see `routes/api.php` — the `/user` route is protected with `auth:sanctum`.
- Edit model attributes: see `app/Models/User.php` for shape, fillable, hidden and casts.
- Add assets: update `vite.config.js` input array (currently `['resources/css/app.css','resources/js/app.js']`).

## Practical guardrails for AI edits

- Don't change vendor code. If a behaviour looks like a framework command (e.g. `install:api`) it's from `vendor/laravel/framework` — prefer using or wrapping it, not editing vendor.
- When updating environment-sensitive code, reference `.env` keys (e.g. `DB_CONNECTION`, `SESSION_DRIVER`, `QUEUE_CONNECTION`) and update migrations if a new DB table is required.
- Keep PSR-4 structure intact. New classes should follow namespace `App\...` and go under `app/`.

## Quick pointers for debugging & verification

- Logs: `storage/logs/laravel.log` and `storage/pail/*.pail` (when `php artisan pail` runs).
- DB: `database/database.sqlite` if running locally with sqlite. Migrations exist and `composer post-create-project-cmd` seeds and migrates.
- Run unit/feature tests: `composer test` or `php artisan test` after edits.

If anything in these notes looks incomplete or you want me to expand a section (examples, commands, or important file references), tell me which area to iterate on next.
