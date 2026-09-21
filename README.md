# Ugliboats.com

Freelance project to modernize ugliboats.com.

React + Vite frontend in `src/`, Express API in `server/`. In production (Render) the
server serves both the API and the built frontend from one service.

## First-time setup

The frontend and the server have **separate** `package.json` files, so both need installing:

```bash
npm install            # frontend (root)
cd server && npm install && cd ..   # backend
```

Copy `server/.env.example` to `server/.env` and fill in the values (MongoDB Atlas,
Cloudinary, Resend, admin password hash, JWT secret). See `AUTHENTICATION.md` for
generating the admin secrets.

> `server/.env` currently points at the **production** database and image storage.
> Reading is harmless, but anything you create, edit, or delete through the local admin
> panel changes the live site.

## Running locally

Two terminals:

```bash
pnpm start       # backend API on http://localhost:3001
pnpm run dev     # Vite dev server (prints its own URL, usually http://localhost:5173)
```

The frontend talks to `localhost:3001` in dev and to the same origin in production
(see `src/config/api.ts`).

If `pnpm start` fails with `Cannot find package 'express'`, the server deps aren't
installed — run `npm install` inside `server/`.

## Useful commands

```bash
npm run build          # type-check + production build into dist/
npm run lint           # eslint
cd server && node scripts/seedMongo.js   # seed MongoDB from server/data/*.json (idempotent)
cd server && node scripts/hashPassword.js # generate a new admin password hash
```

## Deployment

Hosted on Render. `render-build.sh` installs both halves, builds the frontend, and copies
`dist/` into `server/public/`.

## Notes

- If `pnpm-lock.yaml` shows as modified after running any `pnpm` command, that's just
  lockfile format drift from a newer pnpm — `git checkout -- pnpm-lock.yaml` clears it.
  Render installs with `npm`, so it doesn't use that file.
- `src_backup_20250827_181628/` is an old leftover from `fix-urls.sh` and can be deleted.
