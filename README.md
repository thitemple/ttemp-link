# ttemp-link

Personal URL shortener with a dedicated admin dashboard and a redirect app.

## Monorepo layout

- `apps/admin` — SvelteKit admin dashboard with Better Auth
- `apps/redirect` — SvelteKit redirect service for short links
- `packages/db` — shared Drizzle schema + queries

## Local development (Docker Compose)

1. Copy env files:

```sh
cp .env.example .env
cp apps/admin/.env.example apps/admin/.env
cp apps/redirect/.env.example apps/redirect/.env
```

2. Start Postgres:

```sh
bun run db:start
```

3. Install deps and run dev servers:

```sh
bun install
bun run dev
```

Admin app runs at `http://localhost:5173` and redirect app at `http://localhost:5174`.

## Better Auth schema

Generate the Better Auth schema into the shared Drizzle package:

```sh
bunx @better-auth/cli@latest generate --config apps/admin/src/lib/auth-cli.ts --output packages/db/src/auth-schema.ts
```

Then generate and apply the Drizzle migration:

```sh
bun run db:generate
bun run db:push
```

## Database

Drizzle config lives at `drizzle.config.ts` and points to `packages/db/src/schema.ts`.

## Auth setup (Better Auth)

Set these in `apps/admin/.env`:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_BASE_URL`
- `ADMIN_ALLOWLIST`

Use your email in `ADMIN_ALLOWLIST` for first signup.

## Scripts

- `bun run dev` — run both apps
- `bun run build` — build both apps
- `bun run db:start` — start Postgres
- `bun run db:studio` — Drizzle Studio
