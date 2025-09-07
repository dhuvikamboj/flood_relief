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



## Agent workflow: robust plan-first + execution logs

This repo expects agents to operate like a careful developer. The goal of this section is to make plans, actions, and verification repeatable and auditable.

- Before editing, create a per-task plan file: `.github/agent-plans/YYYYMMDD-HHMM-<short-slug>.md`.

- Plan file template (required):
	- Goal (1–2 lines)
	- Requirements checklist (copy exact bullets from the user ask)
	- Assumptions and scope boundaries (explicitly state any inferred assumptions)
	- Short contract (inputs, outputs, success criteria, error modes)
	- Plan (ordered steps) and Files to touch
	- Validation plan (Build, Lint/Static analysis, Tests, Quick smoke; define what “green” means)
	- Rollback & safety plan (how to revert or abort if things go wrong)
	- Progress log (timestamped entries)

- Required pre-flight checks (do these before making edits):
	- Read the user's request fully, extract requirements into a checklist and include it in the plan.
	- Run repository discovery (files to touch, tests impacted).
	- Confirm runtime/build commands (e.g., `composer test`, `npm run build`) and note any environment prerequisites (PHP version, node). If uncertain, record the uncertainty in the plan and choose conservative defaults.
	- Back up state-changing artifacts where appropriate (e.g., copy `database/database.sqlite` to `database/database.sqlite.bak` before running migrations locally).

- During work (runtime rules):
	- Tool-batch rule: before each group of read-only tool calls (search/read operations) preface with a one-line why/what/outcome sentence. After the batch, state a concise progress update and next step.
	- Checkpointing: after every 3–5 tool calls or when >3 files are edited, append an entry to the plan's Progress log and mark checklist items Done/Deferred with reasons.
	- Edits: favor minimal, atomic diffs. If changing a public API or behavior, add/update at least one unit/feature test that covers the change.
	- Avoid changing files under `vendor/`. If a vendor bug is suspected, open an issue and document it in the plan.

- Validation & quality gates (run after edits before finalizing):
	- Local static checks / lint (if present): run any repo linters (ESLint, PHPStan, Psalm, StyleCI) or note if not configured.
	- Build: `npm run build` (frontend) and a quick `composer install --no-interaction --prefer-dist` to ensure dependencies resolve.
	- Tests: run `composer test` or `php artisan test` and include the result in the plan. Add at least one happy-path test for code changes and one edge-case when practical.
	- Smoke: start dev server or run a fast CLI command that exercises the change (e.g., `php artisan route:list` after adding routes).
	- If any step fails, capture the failing output in the plan and attempt up to two targeted fixes. If still failing, mark the checklist item Deferred and explain why.

- Safety, secrets, and environment hygiene:
	- Never write secrets into the repo. If new environment variables are required, add them to `.env.example` and document the steps to set them in the plan.
	- Don't modify `.env` in commits. Use `.env.example` and document local setup steps instead.
	- Avoid destructive commands in automation (no `php artisan migrate --force` without explicit human confirmation in the plan).

- Version control & PR practices:
	- Branching: use `task/<short-slug>-<ticket-or-brief>` (e.g., `task/add-relief-api-123`). Keep branches small and focused.
	- Commits: write clear, imperative commit messages and keep changes atomic.
	- Tests must be included for behavioral changes. If adding files, include a one-line purpose in the plan and in the PR description.
	- Pull request body should include a link to the `.github/agent-plans/...` plan file, the checklist, and a short testing/verification summary.

- On completion (deliverables recorded in plan):
	- Final summary (what changed, how verified), list of files/sections touched, and follow-ups.
	- Requirements coverage: map each original requirement to Done/Deferred and include reasons for any deferrals.
	- Keep the plan file in the repo alongside the changes and reference it in the PR.

Notes on scope & conservatism

- If a requirement cannot be completed due to missing information, state the blocker in the plan and propose 1–2 reasonable next steps or assumptions the agent took. Only ask the user for clarifying input when strictly necessary to proceed.

Minimal plan example (for quick copy/paste)

```
Goal: <one line>
Requirements:
- <bullet from user>
Assumptions:
- <explicit assumption>
Plan:
1. Read code areas X, Y
2. Implement change in Z
3. Run tests & lint
Validation:
- Build: npm run build -> PASS/FAIL
- Tests: php artisan test -> PASS/FAIL
Progress log:
- 2025-09-06T12:00Z — Created plan
Rollback: cp database/database.sqlite database/database.sqlite.bak
```

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
