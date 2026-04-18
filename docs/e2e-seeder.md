# E2E user seeder

One-shot maintenance script for the `adtruck-e2e` Supabase project. Populates the fixture data the Maestro Cloud pipeline depends on. Not executed by CI — run locally when the e2e DB is provisioned or needs re-seeding.

See `docs/mobile-e2e-plan.md` for the full 4-PR rollout context.

## What it creates

| Entity | Details |
|---|---|
| `auth.users` | `admin-e2e@adtruck.test`, `driver-e2e@adtruck.test`, `client-e2e@adtruck.test` — each with `app_metadata.role` set for JWT claims |
| `public.profiles` | One row per user, `role` matching |
| `public.drivers` | Driver row for `driver-e2e`, city `Chicago` |
| `public.clients` | `Acme E2E Client` linked to `client-e2e`'s profile |
| `public.campaigns` | `id = 00000000-0000-0000-0000-0000000e2e01`, attached to the first active route |

Idempotent — re-running patches existing rows, never duplicates.

## Run

```bash
cp .env.e2e.local.example .env.e2e.local
# fill in SUPABASE_SERVICE_ROLE_KEY_E2E (get from the e2e Supabase project console)
pnpm seed:e2e
```

The script prints fixture credentials at the end. The same passwords should be set as GitHub repo secrets (`E2E_ADMIN_PASSWORD`, `E2E_DRIVER_PASSWORD`, `E2E_CLIENT_PASSWORD`) when wiring up the Maestro workflow in PR C.

## Why a script, not a SQL migration

The `auth.users` table is internal to Supabase — raw SQL inserts are fragile against upstream schema changes. The `auth.admin.createUser()` API is the stable contract. This script runs locally against the e2e project only, never against dev or prod.

## Fixture credentials (default)

| Role | Email | Password |
|---|---|---|
| admin | `admin-e2e@adtruck.test` | `E2eAdmin!20260418` |
| driver | `driver-e2e@adtruck.test` | `E2eDriver!20260418` |
| client | `client-e2e@adtruck.test` | `E2eClient!20260418` |

Override via `E2E_*_PASSWORD` env vars if rotation is needed.
