# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs both admin + redirect apps via Turborepo)
bun run dev

# Build all apps
bun run build

# Lint (prettier + eslint)
bun run lint

# Type-check
bun run check

# Run all tests
bun run test

# Run tests in watch mode (from apps/admin)
cd apps/admin && bun run test:unit

# Run a single test file
cd apps/admin && bunx vitest run src/lib/server/link-utils.test.ts

# Database
bun run db:start          # Start PostgreSQL via Docker Compose
bun run db:push           # Push schema changes to DB
bun run db:generate       # Generate Drizzle migrations
bun run db:migrate        # Run Drizzle migrations
bun run db:studio         # Open Drizzle Studio

# Format
cd apps/admin && bun run format
```

## Architecture

**Monorepo** managed by Turborepo with Bun as package manager:
- `apps/admin` — SvelteKit admin dashboard (port 5173)
- `apps/redirect` — SvelteKit redirect service (port 5174), handles `[slug]` → destination URL redirects with click tracking
- `packages/db` — Shared Drizzle ORM package, imported as `@ttemp/db`, `@ttemp/db/queries`, `@ttemp/db/schema`, `@ttemp/db/slug`

**Environment**: `.env.local` lives at the repo root. Both apps read from `../../.env.local` via Vite's `envDir` config.

### Remote Functions Pattern

Server-side logic uses SvelteKit's experimental remote functions (`.remote.ts` files) instead of traditional `+page.server.ts` loaders and form actions:

- `query()` — Read operations, callable from components, supports `.refresh()` for cache invalidation
- `form()` — Form submissions with Valibot validation and `issue()` for field-level errors
- `command()` — Imperative server operations (e.g., delete, add tag)

Files organized by domain under `src/lib/model/<domain>/`:
- `queries.remote.ts` — Read operations
- `mutations.remote.ts` — Write operations (forms, commands)

### Routing & Auth

- `(app)/` layout group — All protected routes; auth guard in `(app)/+layout.server.ts` redirects unauthenticated users to `/auth/login`
- `auth/` — Public login/signup routes
- Auth: Better Auth with email+password, Drizzle adapter. Signup restricted to emails in `ADMIN_ALLOWLIST` env var
- User available as `locals.user` in server code

### Data Layer

- Drizzle ORM with PostgreSQL (`postgres` driver)
- Schema at `packages/db/src/schema.ts`: links, linkDailyStats, linkClickEvents, analyticsSettings, geoipCountryDb
- All queries in `packages/db/src/queries.ts`
- Better Auth schema auto-generated at `packages/db/src/auth-schema.ts`

## Key Conventions

- **Svelte 5 runes**: Use `$state`, `$derived`, `$effect`, `$props` (not legacy stores)
- **Async templates**: `compilerOptions.experimental.async: true` — use `await` in templates with `<svelte:boundary>` for loading/error states
- **Validation**: Valibot (not Zod) for all schema validation
- **Code style**: Tabs, single quotes, no trailing commas, 100 char width (enforced by Prettier)
- **Server utilities**: `src/lib/server/` for link creation, metadata fetching, tag normalization, URL normalization, GeoIP
- **DB SSR config**: `@ttemp/db` is in `ssr.noExternal` in vite.config.ts to prevent treeshaking issues

## Remote Functions Gotchas

- `.as("hidden", value)` requires 2 args for hidden/radio/submit input types
- `.as("checkbox")` already provides `type` attr — don't duplicate `type="checkbox"`
- `bind:checked` requires literal `type="checkbox"` attribute, not from spread
- Server-side refresh: `queryFn(args).refresh()` not `queryFn.refresh(args)`
