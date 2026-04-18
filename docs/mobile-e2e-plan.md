# Mobile E2E Rollout Plan

**Created:** 2026-04-18
**Owner:** Praneeth (solo)
**Target repo:** `adtruck-driver-native` (React Native / Expo)
**Remote:** https://github.com/Vallabha-Praneeth/LoneStar_EPR_mobile_stack

---

## Why this plan exists

The mobile repo has 3 E2E workflows inherited from the obytes template:

- `.github/workflows/e2e-android.yml` — GH self-hosted runner + Android emulator
- `.github/workflows/e2e-android-maestro.yml` — Maestro Cloud
- `.github/workflows/e2e-android-eas-build.yml` — EAS build + self-hosted emulator

All three are `pull_request`-triggered but gated by labels that nobody adds, so **every PR shows "skipping" and no E2E ever runs**. A prior attempt (PR #50) to flip the label gate exposed multiple template-default bugs (`APP_ENV: staging` doesn't exist, `APP_ID=com.obytes.staging` is the template app ID, missing CI env vars, hardcoded test creds) — PR #50 was closed.

The root issue isn't a trigger flip. It's three unanswered design questions. This plan resolves them and ships E2E properly, one PR at a time.

---

## Design decisions (2026-04-18)

### 1. Target Supabase for E2E: **dedicated `adtruck-e2e` project**

- Not shared with dev. Free tier covers a second Supabase project.
- Same migration pipeline applies schema to both dev and e2e projects.
- Isolates test pollution; can be wiped + re-seeded in ~2 min.

### 2. Test user lifecycle: **seeded via migration, not per-run**

- Dedicated migration `e2e_001_seed_users.sql` (or similar) applied once to the e2e project.
- Known creds: `driver-e2e`, `admin-e2e`, `client-e2e` with documented passwords.
- No service role key in CI. No ephemeral user creation.
- State mutations inside flows get cleaned up within the flow; weekly cron for drift.

### 3. Platform + provider: **Maestro Cloud, iOS first**

- API key `MAESTRO_CLOUD_API_KEY` already set in mobile repo secrets (rotated 2026-04-18).
- iOS-first: app is iOS-primary; no credible GH-runner iOS E2E path exists at solo-dev scale.
- Ship iOS first, prove it works, then Android.
- Soft-gate (not required for merge) for the first 2 weeks; flip to required after 10 consecutive green runs on main.

---

## PR sequence overview

| PR | Title | Scope | Status |
|----|-------|-------|--------|
| A  | Create e2e Supabase project + doc decisions | Infra + docs only, no CI | pending |
| B  | Seed e2e users migration | DB schema | pending |
| C  | iOS E2E via Maestro Cloud (soft-gate) | New workflow, one flow | pending |
| D  | Android E2E via Maestro Cloud | Duplicate C pattern for Android | pending |

---

## PR A — Create e2e Supabase project + doc decisions

**Status:** in-progress
**Started:** 2026-04-18
**Completed:**
**Branch:**
**PR URL:**

### Scope

Infra and documentation. No workflow changes. No CI activation.

### Prerequisites

- Supabase account (existing — current dev project already there)
- Admin access to `adtruck-driver-native` GitHub repo (for secrets)

### To-do

- [x] Create new Supabase project via console: name `adtruck-e2e`, same region as dev (project ref `hfewsknqnlwphaeamvuv`, owned under a separate admin account because free-tier quota on primary was exhausted)
- [x] Note Project Ref, Project URL, `anon` key, `service_role` key (never commit these) — user captured locally; plaintext snapshot file was deleted; **rotation still pending**
- [x] Apply existing migrations `001` through `011` to the new e2e project — all 11 show Local+Remote via `supabase migration list --linked`
- [x] Verify RLS policies intact — `pg_policies` returns coverage on `profiles` (5), `campaigns` (6), `driver_shifts` (6), `routes` (3), `route_stops` (3), `drivers` (2), `clients` (2), `cost_types` (1), `shift_stop_completions` (2), plus `campaign_photos` and `campaign_costs` (expected from `001`/`002`)
- [x] Verify storage bucket `campaign-photos` exists on e2e project — confirmed `public=false`
- [ ] Add GitHub repo secrets (via UI, not chat):
  - [ ] `EXPO_PUBLIC_SUPABASE_URL_E2E` = `https://hfewsknqnlwphaeamvuv.supabase.co`
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY_E2E` = e2e anon key (from user's locally-stored credentials; rotate first)
  - [ ] `EXPO_PUBLIC_API_URL_E2E` = `https://hfewsknqnlwphaeamvuv.supabase.co` (resolved 2026-04-18: `EXPO_PUBLIC_API_URL` is read only by template dead-code `src/features/feed/api.ts`, and dev already points it at the Supabase host — safe to mirror for e2e)
- [ ] Rotate the 5 e2e credentials that were briefly written to `database_Qlinks.txt` (DB password, service_role key, `sb_secret_*`, anon key, publishable key) before PR A merges
- [ ] Update `MEMORY.md` with e2e project ref + URL (public info only — no keys) + note that e2e lives under a different Supabase admin account
- [ ] Open doc-only PR A with this plan file + MEMORY updates

### Acceptance criteria

- [ ] e2e Supabase project exists and is reachable
- [ ] All schema migrations applied successfully
- [ ] Three GitHub secrets set and visible in `gh secret list`
- [ ] PR A merged

### Gotchas

- Supabase free tier: check quota — 2 free projects allowed per org. Should be fine for solo.
- `anon` key goes in client-side builds, so it's technically public. Still treat it as a secret to avoid key rotation churn.
- API URL decision: if `EXPO_PUBLIC_API_URL` is the Supabase REST URL, it's the e2e URL. If it's a custom backend, may need its own e2e environment. Check `env.ts` and `src/api/` to confirm what it points to.

---

## PR B — Seed e2e users migration

**Status:** pending
**Started:**
**Completed:**
**Branch:**
**PR URL:**

### Scope

One migration file that creates the three e2e user accounts via Supabase auth admin API calls + profiles rows + JWT role claims. Applied once to the e2e project only.

### Prerequisites

- PR A merged
- e2e project URL + service_role key available locally (never commit)

### To-do

- [ ] Draft migration `supabase/migrations/e2e_001_seed_users.sql` (or similar prefix to keep it separate from the shared-schema sequence)
  - Approach option 1: raw SQL into `auth.users` — works but fragile against Supabase internal changes
  - Approach option 2: use `auth.admin.createUser()` via a one-shot Node script, committed as a fixture runner (cleaner, future-proof)
- [ ] Seed 3 users with documented creds:
  - `driver-e2e@adtruck.test` / strong password → role=driver
  - `admin-e2e@adtruck.test` / strong password → role=admin
  - `client-e2e@adtruck.test` / strong password → role=client
- [ ] Set `raw_app_meta_data.role` via SQL after creation (JWT claim pattern from memory)
- [ ] Insert `profiles` rows matching user IDs
- [ ] Add entry in `drivers` table for driver-e2e, with `username = driver-e2e`
- [ ] Create seed `client` row for client-e2e
- [ ] Create seed `campaign` tied to driver-e2e + client-e2e (for smoke tests)
- [ ] Apply manually to e2e project; verify via API hit
- [ ] Update `CLAUDE.md` with the e2e creds (password only stored there, never in code)

### Acceptance criteria

- [ ] Three users exist in e2e project's `auth.users`
- [ ] JWT role claims set correctly (verify via `/rest/v1/` call with each user's token)
- [ ] RLS policies work against these users (driver sees only their campaign, etc.)
- [ ] PR B merged

### Gotchas

- Migration prefix: don't use `012_` or similar — that implies it applies to dev too. Use an `e2e_` prefix or a separate `supabase/migrations-e2e/` directory, and document that it's e2e-only.
- Passwords must be strong enough for Supabase's default policy (check current min requirements).
- Storage bucket policies use JWT claims — confirm the three seeded users can access `campaign-photos` paths as their role dictates.

---

## PR C — iOS E2E via Maestro Cloud (soft-gate)

**Status:** pending
**Started:**
**Completed:**
**Branch:**
**PR URL:**

### Scope

New workflow `e2e-ios-maestro-cloud.yml`. Runs on PRs that touch app source / maestro flows. Builds iOS via EAS, uploads `.app` or `.ipa` to Maestro Cloud, runs the existing `.maestro/driver/shift-flow.yaml`. **Soft-gated** — posts result but doesn't block merge initially.

### Prerequisites

- PR A + B merged
- `MAESTRO_CLOUD_API_KEY` secret set (already done 2026-04-18)
- `EAS_TOKEN` secret set (already exists)
- EAS build profile for e2e exists (may need to add to `eas.json`: profile `preview-e2e` pointing env to the e2e Supabase)

### To-do

- [ ] Add `eas.json` profile `preview-e2e`:
  - `distribution: internal`
  - `env.EXPO_PUBLIC_APP_ENV = preview`
  - `env.EXPO_PUBLIC_SUPABASE_URL = $EXPO_PUBLIC_SUPABASE_URL_E2E`
  - `env.EXPO_PUBLIC_SUPABASE_ANON_KEY = $EXPO_PUBLIC_SUPABASE_ANON_KEY_E2E`
  - `env.EXPO_PUBLIC_API_URL = $EXPO_PUBLIC_API_URL_E2E`
  - iOS-specific: resource class that supports simulator build
- [ ] Update `.maestro/utils/driver-login.yaml` to use e2e creds (or introduce `${USERNAME}` / `${PASSWORD}` env overrides driven by the workflow)
- [ ] Draft `.github/workflows/e2e-ios-maestro-cloud.yml`:
  - Triggers: `pull_request` on main/master, paths-filter for src/maestro/ios/config, concurrency group
  - Skip drafts (`if: github.event.pull_request.draft != true`)
  - Job 1: `eas build --profile preview-e2e --platform ios --non-interactive --wait` → capture build URL
  - Job 2: `action-maestro-cloud@v2.0.2` with `app-file` from the build URL, `env: APP_ID=com.adtruck-driver-native.preview`, `USERNAME=driver-e2e`, `PASSWORD=<from secret>`
  - Upload Maestro report as artifact
- [ ] Add `E2E_DRIVER_PASSWORD` secret (the seeded e2e user's password from PR B)
- [ ] Initial run on PR C itself — must pass against e2e project
- [ ] Merge with soft-gate: do NOT mark as required check in branch protection yet

### Acceptance criteria

- [ ] Workflow triggers on PR C
- [ ] EAS build succeeds
- [ ] Maestro Cloud run completes with the shift-flow passing
- [ ] Report uploaded as artifact
- [ ] Merged

### Gotchas

- iOS simulator builds via EAS: verify the `preview-e2e` profile produces a `.app` (simulator) not `.ipa` (device). Maestro Cloud for iOS sim accepts `.app` zipped.
- Build time: EAS iOS builds take 8-15 min. Combined workflow time: ~20 min end-to-end. Concurrency cancellation important.
- Cost: EAS has a free tier (30 builds/mo). iOS PR volume will burn through quickly. Consider using `--local` EAS builds on a macOS runner instead, but that defeats the "use Maestro Cloud" pattern. Decide based on volume.
- `action-maestro-cloud@v2.0.2` is pinned in `e2e-android-maestro.yml` — check if newer major exists; pin explicitly either way.

---

## PR D — Android E2E via Maestro Cloud

**Status:** pending
**Started:**
**Completed:**
**Branch:**
**PR URL:**

### Scope

Mirror PR C for Android. New workflow `e2e-android-maestro-cloud.yml` OR revise the existing `e2e-android-maestro.yml` (which already exists label-gated). Builds Android APK via EAS or Gradle, pushes to Maestro Cloud with `APP_ID=com.adtruck_driver_native.preview`.

### Prerequisites

- PR C merged and stable for at least 3-5 PRs

### To-do

- [ ] Decide: new workflow vs. revising existing `e2e-android-maestro.yml`
  - Revise existing: less YAML sprawl but mixes history
  - New file: clean separation, easier to delete the template default later
- [ ] Apply same trigger pattern as PR C (paths, concurrency, skip drafts)
- [ ] EAS profile `preview-e2e` already set from PR C — reuse with `--platform android`
- [ ] Or: use existing Gradle build path from `e2e-android.yml` composite action with `APP_ENV: preview` fix applied
- [ ] Wire to Maestro Cloud with `APP_ID=com.adtruck_driver_native.preview`
- [ ] Confirm same `.maestro/driver/shift-flow.yaml` passes on Android

### Acceptance criteria

- [ ] Workflow triggers on mobile PRs
- [ ] Android build succeeds
- [ ] Maestro Cloud run completes with shift-flow passing on Android
- [ ] Merged
- [ ] Both platforms green for 5 consecutive main-branch runs → flip both to required checks in branch protection

### Gotchas

- APK vs AAB: Maestro Cloud accepts APK. EAS defaults to AAB for production but APK for preview — verify profile output format.
- `.maestro/utils/driver-login.yaml` currently has platform-specific APP_ID defaults; clean up to rely solely on `${APP_ID}` from workflow env.
- Delete `e2e-android.yml` and `e2e-android-eas-build.yml` as part of this PR once the Cloud-based Android path is proven — don't leave three competing workflows.

---

## Session log

Append one entry per working session. Capture what was worked on and what's next.

### Session 2026-04-18 — Plan created

- Had the strategy conversation that produced the 3 decisions above
- Closed PR #50 (premature trigger-flip without the underlying infra)
- Wrote this plan
- **Next session resume point:** Start PR A — create the `adtruck-e2e` Supabase project via console, apply migrations, add 3 GitHub secrets, update `MEMORY.md`

### Session 2026-04-18 (cont.) — PR A infra almost complete

- User provisioned new Supabase project `adtruck-e2e` (ref `hfewsknqnlwphaeamvuv`) under a **separate admin account** because the primary account's free-tier quota was full
- User briefly saved all project secrets to `database_Qlinks.txt` in plaintext; file was deleted after use. **Rotation of all 5 keys is still pending.**
- Switched Supabase CLI auth (`supabase logout` → `supabase login`) to the e2e-owning account to clear the "necessary privileges" error
- `supabase link --project-ref hfewsknqnlwphaeamvuv` succeeded from `/Users/praneeth/LoneStar_ERP/adtruck-proof-main`
- `supabase db push --linked` applied all 11 migrations; `supabase migration list --linked` confirms 001–011 present Local+Remote
- `supabase db query --linked` verified:
  - storage bucket `campaign-photos` exists, `public=false`
  - 11 public tables present
  - RLS policies intact across all expected tables (`profiles` 5, `campaigns` 6, `driver_shifts` 6, `routes`/`route_stops` 3 each, `drivers`/`clients`/`shift_stop_completions` 2 each, `cost_types` 1, plus `campaign_photos`/`campaign_costs`)
- Resolved open question: `EXPO_PUBLIC_API_URL` is read only by template dead-code `src/features/feed/api.ts`; dev already points it at the dev Supabase host. For e2e, mirror with the e2e Supabase REST URL.
- Created memory file `project_adtruck_e2e_supabase.md` + added pointers to `MEMORY.md`
- **Next session resume point:** user adds 3 GitHub secrets via UI to `Vallabha-Praneeth/LoneStar_EPR_mobile_stack`, then we rotate the 5 exposed credentials, then open doc-only PR A on the web repo (plan file) and close out PR A.

---

## Resume point (always kept current)

**Most recent state:** PR A infra work complete on Supabase side. Secrets not yet added to GitHub. Compromised credentials not yet rotated. Doc-only PR not yet opened.

**To resume:**

1. **User action (GitHub UI):** add 3 repo secrets to `Vallabha-Praneeth/LoneStar_EPR_mobile_stack`:
   - `EXPO_PUBLIC_SUPABASE_URL_E2E` = `https://hfewsknqnlwphaeamvuv.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY_E2E` = e2e anon key (from local capture)
   - `EXPO_PUBLIC_API_URL_E2E` = `https://hfewsknqnlwphaeamvuv.supabase.co`
2. **User action (Supabase console):** rotate the 5 e2e credentials that were briefly written to `database_Qlinks.txt` (DB password, service_role key, `sb_secret_*`, anon key, publishable key). Update the GitHub secret in step 1 with the rotated anon key.
3. Verify with `gh secret list --repo Vallabha-Praneeth/LoneStar_EPR_mobile_stack` that all three `*_E2E` secrets appear.
4. Open doc-only PR A on the web repo (`Vallabha-Praneeth/LoneStar_ERP`): commits the new `mobile_e2e_plan.md` at repo root (or agreed location) + any matching doc updates. No code or workflow changes in this PR.
5. Mark PR A done in this file; move on to PR B (seed e2e users migration).
