# AGENTS.md

## Cursor Cloud specific instructions

`play4096` is a single-service SvelteKit app (Svelte 5 + Tailwind 4) with a
`better-sqlite3` database via Drizzle ORM. It's a 2048-style tile game with user
auth, a leaderboard, and optional Stripe payments / SMTP email. Standard scripts
live in `package.json` (`dev`, `build`, `lint`, `check`, `db:migrate`, `db:seed`).

Node and pnpm are the runtime (see `packageManager` in `package.json`). Deps are
refreshed by the startup update script (`pnpm install`).

Non-obvious setup/run notes:

- **`DATABASE_URL` is required.** Both `drizzle.config.js` and the DB client throw
  if it is unset. Local dev reads it from a gitignored `.env` file (Vite loads
  `.env` automatically). If `.env` is missing, recreate it from `.env.example`
  with `DATABASE_URL=data/local.db` and `ENVIRONMENT=development`.
- **The SQLite DB is gitignored** (`data/local.db`). On a fresh checkout, create it
  with `mkdir -p data && pnpm db:migrate` before running the app. Optionally seed an
  admin user (`admin` / `admin123`) with `pnpm db:seed`.
- **Dev server:** `pnpm dev` serves on `http://localhost:5173` (bound to `0.0.0.0`).
  Use `pnpm build` + `pnpm preview`/`pnpm start` for a production-style run.
- **Stripe and SMTP are optional in development** — leave their env vars blank.
  Email sends are skipped and Stripe is only exercised when the payment flow is
  used; they only hard-fail when `ENVIRONMENT=production`.
- **`pnpm check` (svelte-check) currently reports 4 pre-existing type errors** in
  `src/lib/server/email.js` and `src/routes/animated/+page.svelte`. These are
  unrelated to environment setup and do not block dev/build.
- `pnpm lint` runs `eslint . --fix` (it will auto-fix in place).
