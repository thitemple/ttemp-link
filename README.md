# ttemp-link

Personal URL shortener with a dedicated admin dashboard and a redirect app.

## Monorepo layout

- `apps/admin` — SvelteKit admin dashboard with Better Auth
- `apps/redirect` — SvelteKit redirect service for short links
- `packages/db` — shared Drizzle schema + queries

## Local development (Docker Compose)

1. Copy env files:

```sh
cp .env.example .env.local
```

2. Symlink root env into each app (for SvelteKit dev):

```sh
# Run from the repo root. The ../../ path is relative to each app directory.
ln -sf ../../.env.local apps/admin/.env.local
ln -sf ../../.env.local apps/redirect/.env.local
```

3. Start Postgres:

```sh
bun run db:start
```

4. Install deps and run dev servers:

```sh
bun install
bun run dev
```

Admin app runs at `http://localhost:5173` and redirect app at `http://localhost:5174`.

Both apps read environment variables from the repo root. For dev, we symlink the root `.env.local` into each app
so SvelteKit can resolve it from the project root.

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

Set these in the root `.env.local`:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_BASE_URL`
- `ADMIN_ALLOWLIST`

Use your email in `ADMIN_ALLOWLIST` for first signup.

Generate `BETTER_AUTH_SECRET` with:

```sh
openssl rand -base64 32
```

## Optional configuration

- `PUBLIC_SHORTLINK_DISPLAY` — display label for the short domain in the admin header (defaults to `PUBLIC_SHORTLINK_BASE_URL` host).
- `LINK_METADATA_USER_AGENT` — user agent used when fetching page titles for link metadata (defaults to no explicit header).
- `MAXMIND_LICENSE_KEY` — optional key for GeoLite2 Country fallback downloads from the settings page.

Country analytics behavior:
- Country tracking is controlled in `/settings`.
- Resolution order is provider headers first, GeoLite fallback second.
- GeoLite database is stored in Postgres and refreshed from the admin settings page.

## Scripts

- `bun run dev` — run both apps
- `bun run build` — build both apps
- `bun run db:start` — start Postgres
- `bun run db:studio` — Drizzle Studio
