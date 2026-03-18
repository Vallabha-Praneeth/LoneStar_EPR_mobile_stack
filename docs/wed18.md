# Session Doc — Wednesday, March 17, 2026
# AdTruck Driver Native — iOS Simulator E2E + Skills System

---

## Quick Start Tomorrow

Run these commands in order to restore the full dev environment:

```bash
# 1. Verify simulator is booted (iPhone 16e)
UDID="A4152A57-003A-47D9-8713-D7E0FFB3D04D"
xcrun simctl list devices | grep "$UDID"
# Expected output: "iPhone 16e (A4152A57-003A-47D9-8713-D7E0FFB3D04D) (Booted)"
# If not booted: xcrun simctl boot $UDID

# 2. Open Simulator window
open -a Simulator

# 3. Start Metro bundler (in project directory)
cd /Users/praneeth/LoneStar_ERP/adtruck-driver-native
pnpm start
# Metro starts on port 8081. Wait for "Metro waiting on..."

# 4. If app is not already installed, rebuild:
pnpm ios
# This takes ~3-5 min. Once installed, use simctl for faster relaunches.

# 5. Relaunch the app without full rebuild:
xcrun simctl terminate $UDID com.adtruck-driver-native.development
xcrun simctl launch $UDID com.adtruck-driver-native.development

# 6. Verify idb is available for touch injection
~/Library/Python/3.9/bin/idb --help
# If idb_companion is not running:
idb_companion --udid $UDID &

# 7. Check today's campaign date is correct
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZW9vbmlxYmFncnBld2xrYW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjEyMzUsImV4cCI6MjA4OTAzNzIzNX0.yEG8DbkKijawQ9IfztHEAWjk-Jw5r_-V-slgNLEwwr8"
curl -s "https://cleooniqbagrpewlkans.supabase.co/rest/v1/campaigns?id=eq.00000000-0000-0000-0000-000000000010&select=campaign_date" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
# If date is not today, update it — see "Campaign Date Maintenance" section below.
```

**First task tomorrow:** Refactor `campaign-screen.tsx` and `upload-screen.tsx` to extract sub-components and fix `photos.ts` params — ESLint blocks the first commit (Option B chosen — proper refactor, not disable comments).

---

## Session Overview

| Field | Value |
|-------|-------|
| Date | Wednesday, March 17, 2026 |
| Project | adtruck-driver-native (React Native / Expo) |
| Primary Goal | Complete full driver flow end-to-end on iOS Simulator |
| Outcome | Full flow verified; Skills system built; login tests fixed; ESLint errors blocking first commit |
| GitHub status | Repo created: `LoneStar_EPR_mobile_stack` — NOT YET pushed (ESLint errors must be fixed first) |
| Next action | Option B refactor (extract sub-components from large screens, fix photos.ts params) → first commit → push |

---

## Context Carried from Previous Session

These items were already resolved before today started:

- **Black screen fix** — resolved in a prior session
- **Metro on port 8081** — established and stable
- **idb (Facebook iOS Device Bridge)** — installed via pip3 (`fb-idb`), idb_companion running via Homebrew; confirmed as the only reliable touch injection method on Metal GPU simulators (cliclick and osascript do not work)
- **Expo Dev Client deep link connection** — working
- **Dev menu onboarding popup bypass** — done via UserDefaults plist injection
- **App scaffolded** from Obytes React Native Template
- **Login screen visible** — but button taps were not registering via idb (unresolved at end of last session)
- **"No active campaign"** showing on campaign screen — seed campaign had an old `campaign_date`

---

## What Was Accomplished This Session

### 1. Campaign Date Fix

**Problem:** Campaign screen showed "No active campaign assigned to you today" because the seed campaign row in Supabase had an outdated `campaign_date`.

**Why anon key did not work:** An unauthenticated PATCH request returned `[]` — RLS policies correctly deny writes to anonymous callers.

**Solution:** Authenticate as admin via the Supabase Auth REST API to obtain a JWT with `app_metadata.role = admin`, then use that JWT for the PATCH.

```bash
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # full anon key

ADMIN_JWT=$(curl -s -X POST \
  "https://cleooniqbagrpewlkans.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@adtruck.com","password":"mawqex-rYsneq-kynja5"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['access_token'])")

curl -s -X PATCH \
  "https://cleooniqbagrpewlkans.supabase.co/rest/v1/campaigns?id=eq.00000000-0000-0000-0000-000000000010" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"campaign_date":"2026-03-17"}'
```

**Result:** Campaign date updated. App relaunch showed the campaign card correctly.

**Ongoing maintenance:** Each morning the campaign_date must match today's date for the driver flow to work in development. The query in `src/lib/api/driver/campaign.ts` uses `.gte('campaign_date', today)`, so yesterday's date causes the "No active campaign" state.

---

### 2. idb Path Discovery

idb was installed via `pip3 install fb-idb` but the binary is not in the system PATH by default.

| Item | Value |
|------|-------|
| idb binary | `~/Library/Python/3.9/bin/idb` |
| idb_companion | Installed via Homebrew, runs as a background daemon |
| idb_companion PID (session start) | 22097 (may differ after restart) |
| All idb commands | Must use full path: `~/Library/Python/3.9/bin/idb` |

To check if idb_companion is running:
```bash
pgrep -l idb_companion
```

To start it manually if not running:
```bash
idb_companion --udid A4152A57-003A-47D9-8713-D7E0FFB3D04D &
```

---

### 3. App Bundle ID Discovery

| Item | Value |
|------|-------|
| Bundle ID | `com.adtruck-driver-native.development` |
| Discovery method | `find ~/Library/Developer/CoreSimulator/Devices/$UDID/data/Containers/Bundle/Application -name "Info.plist" -maxdepth 3` |

App lifecycle commands (faster than full rebuild):
```bash
UDID="A4152A57-003A-47D9-8713-D7E0FFB3D04D"

# Terminate
xcrun simctl terminate $UDID com.adtruck-driver-native.development

# Relaunch
xcrun simctl launch $UDID com.adtruck-driver-native.development
```

---

### 4. date-fns Format Bug — Found and Fixed

**Symptom:** Campaign date showed "March 2, yyyy" — wrong day number and literal "yyyy" text in the rendered output.

**Root cause:** `date-fns` version `1.30.1` is installed. The format string was using v2/v3 tokens:
- `d` in v1 = day of **week** (not month)
- `yyyy` in v1 = invalid token → renders as literal text

**Fix applied** in `src/features/driver/campaign-screen.tsx` line 126:

| | Before (broken) | After (fixed) |
|-|----------------|---------------|
| Format string | `format(new Date(campaign.campaign_date), 'MMMM d, yyyy')` | `format(new Date(campaign.campaign_date + 'T12:00:00'), 'MMMM D, YYYY')` |

Two changes in one line:
1. **Token case:** `D` (day of month in v1), `YYYY` (calendar year in v1)
2. **Noon anchor `T12:00:00`:** Prevents UTC midnight string parsing from shifting the date backward by one day in non-UTC timezones

**Result:** Showed "March 17, 2026" correctly.

**Remaining workaround status:** Using v1 tokens is correct for the installed version but is a known workaround. The permanent fix is to upgrade to date-fns v3 and change all format strings to lowercase tokens. See Known Workarounds section.

**date-fns v1 token reference (critical — do not use v2/v3 rules in this codebase):**

| Token | Meaning in v1 | v2/v3 equivalent |
|-------|--------------|-------------------|
| `D` | Day of month (1–31) | `d` in v2/v3 |
| `YYYY` | Calendar year | `yyyy` in v2/v3 |
| `d` | Day of WEEK (0–6) | `e` in v2/v3 |
| `h` | 12-hour clock | same |
| `a` | AM/PM | same |

---

### 5. Login Form Restoration

During a previous debugging session, `form.handleSubmit` had been bypassed on the login button's `onPress`:

```tsx
// BROKEN (was bypassing Zod validation)
onPress={() => onSubmit(values)}

// RESTORED (correct — handleSubmit runs validation first)
onPress={form.handleSubmit}
```

Additionally, the `form.Subscribe` selector was simplified:

```tsx
// Before (unnecessarily subscribing to values)
selector={state => [state.isSubmitting, state.values]}

// After (correct — only need isSubmitting for the button)
selector={state => state.isSubmitting}
```

**Why this matters:** Bypassing `form.handleSubmit` means Zod validation never runs — a user could submit with an empty username and the form would call `onSubmit` regardless.

Current state of `login-form.tsx` (lines 94–103) is correct:
```tsx
<form.Subscribe
  selector={state => state.isSubmitting}
  children={isSubmitting => (
    <Button
      testID="login-button"
      label="Sign In"
      onPress={form.handleSubmit}
      loading={isSubmitting}
    />
  )}
/>
```

---

### 6. idb Coordinate Discovery Methodology

**Key discovery:** `idb ui describe-all --udid $UDID` returns the full accessibility tree with exact logical coordinates for every visible UI element. This eliminates all coordinate guessing.

```bash
~/Library/Python/3.9/bin/idb ui describe-all \
  --udid A4152A57-003A-47D9-8713-D7E0FFB3D04D
```

Output format for each element:
```
'<label>' frame={{<x>, <y>}, {<width>, <height>}}
```

Tap center formula: `x_center = x + (width / 2)`, `y_center = y + (height / 2)`

Tap command:
```bash
~/Library/Python/3.9/bin/idb ui tap \
  --udid A4152A57-003A-47D9-8713-D7E0FFB3D04D \
  <x_center> <y_center>
```

**Device resolution:**
- iPhone 16e logical resolution: 390 × 844 points
- Physical pixel density: @3x (1170 × 2532 physical pixels)
- Always use logical point coordinates with idb, not physical pixels

---

### 7. Full Driver Flow — End-to-End Test Results

All steps performed via `idb ui describe-all` coordinate lookup then `idb ui tap`. No coordinates were guessed.

#### Step 1 — Login

Login screen already showing (MMKV session persistence restores session on relaunch). Driver was already logged in as `driver1`.

#### Step 2 — Start Shift

```
Accessibility element: '▶ Start Shift'
Frame: {{37, 202}, {316, 56}}
Tap coordinates: (195, 230)
```

Result: Green badge appeared — "Shift started at 1:34 pm". Button changed to "End Shift".

#### Step 3 — Navigate to Upload Photo

```
Accessibility element: '📷 Upload Photo'
Frame: {{37, 254}, {316, 56}}
Tap coordinates: (195, 282)
```

Result: Upload Photo screen opened.

#### Step 4 — Select from Gallery (Simulator has no camera)

```
Accessibility element: '🖼 Gallery'
Frame: {{200, 284}, {119, 48}}
Tap coordinates: (259, 308)
```

Photo library permission dialog appeared:

```
Accessibility element: 'Allow Full Access'
Frame: {{51, 616.33}, {288, 48}}
Tap coordinates: (195, 640)
```

Photo picker opened with 6 sample simulator photos. First photo tapped at coordinates (97, 170).

Result: Photo previewed in upload screen.

#### Step 5 — Submit Photo

```
Accessibility element: '↑ Submit Photo'
Frame: {{37, 484.33}, {316, 56}}
Tap coordinates: (195, 512)
```

Result: "Photo Submitted!" screen appeared with "Your photo is pending admin approval" message.

#### Step 6 — Back to Campaign

```
Accessibility element: 'Back to Campaign'
Frame: {{57, 540}, {276, 48}}
Tap coordinates: (195, 564)
```

Result: Campaign screen showed:
- "Shift started at 1:34 pm" (green badge)
- New photo: "1:37 pm pending" in Recent Uploads
- Previous photo: "1:13 pm approved" in Recent Uploads

#### Step 7 — End Shift

```
Accessibility element: '⏹ End Shift'
Frame: {{37, 322}, {316, 56}}
Tap coordinates: (195, 350)
```

Result: App signed out and redirected to Login screen. Full flow complete.

**Summary:** All 7 steps passed. Supabase mutations (startShift, uploadPhoto, endShift) all wrote to the database correctly. React Query cache invalidation worked — photo list updated without manual refresh.

---

### 8. Skills System Built

Two major additions to the Claude Code workflow for this project:

#### 8a. `/review` Skill

**File:** `~/.claude/commands/review.md`

Acts as a Senior React Native Critic. Reads source files for the named stage, uses context7 MCP for live version-accurate library docs, and classifies every finding into one of four categories:

| Label | Meaning |
|-------|---------|
| STANDARD ✅ | Industry-correct approach |
| WORKAROUND ⚠️ | Works today, may break on upgrade or growth |
| TECH DEBT 🔴 | Real problem: security hole, crash risk, broken upgrade path |
| BUG 🐛 | Wrong right now — named file, named symptom |

Pre-loaded with 7 confirmed issues from this codebase (see Known Issues table below). Writes `.cursor/debug-context.md` for Cursor AI handoff on confirmed bugs. Produces a plain-English verdict readable by a non-technical founder.

**Trigger:** Call `/review` followed by the stage name (e.g., "login flow", "campaign screen", "full review").

#### 8b. Cursor AI Integration

**File:** `/Users/praneeth/LoneStar_ERP/adtruck-driver-native/.cursor/rules/adtruck-native.mdc`

Project-level rules file for Cursor AI. Contains:
- date-fns v1 token reference (critical — v2/v3 tokens are wrong here)
- TanStack Form 1.27 correct patterns with code examples
- Broken test file warning — do not copy from `login-form.test.tsx`
- MMKV storage rules (no AsyncStorage, no expo-secure-store)
- What Not To Do list

**`alwaysApply: true`** — loads automatically whenever the project is opened in Cursor.

**How to open in Cursor correctly (Option A — workspace root):**
```bash
cursor /Users/praneeth/LoneStar_ERP/adtruck-driver-native
```
Opening at the workspace root ensures `.cursor/rules/` is discovered by Cursor.

#### 8c. `/adtruck` Orchestrator Updated

Added to routing table:
```
Stage review / quality check → /review → Security Audit (if TECH DEBT or BUG found) → Ship
```

Added `/review` to Direct Skill Invocation reference section.

---

## Confirmed Bugs

### ✅ FIXED: `login-form.test.tsx` — Fixed by Cursor AI This Session

**File:** `/Users/praneeth/LoneStar_ERP/adtruck-driver-native/src/features/auth/components/login-form.test.tsx`

**Status:** Fixed — 3/3 tests passing. Cursor AI applied the fix using `.cursor/debug-context.md` as context.

**What was wrong:** Template tests referenced `email-input` testID and "Email is required" text. The form uses `username-input` and "Username is required".

**What was fixed:**
1. All `email-input` testID references → `username-input`
2. "Email is required" → "Username is required"
3. "Invalid Email Format" test removed (no email field)
4. Valid-submit test updated: `{ email: 'youssef@gmail.com' }` → `{ username: 'driver1' }`

**Verification:** `pnpm test src/features/auth/components/login-form.test.tsx` — all 3 tests pass.

---

## ESLint Errors Blocking First Commit

Discovered during `/ship` run at end of session. `pnpm lint` returns 9 errors. The pre-commit hook runs `pnpm lint-staged` (which runs ESLint) and will block the commit until these are resolved.

**Decision: Option B (proper refactor) — chosen for next session.**

### Error 1 — `max-lines-per-function` in two screen files

| File | Lines | Limit |
|------|-------|-------|
| `src/features/driver/campaign-screen.tsx` | 215 | 110 |
| `src/features/driver/upload-screen.tsx` | 165 | 110 |

**Fix:** Extract sub-components from each screen. For example, `CampaignHeader`, `ShiftStatusBadge`, `RecentUploadsList` from campaign-screen; `PhotoPreview`, `UploadActions` from upload-screen. Each extracted component goes in the same feature folder.

### Error 2 — `max-params` in `photos.ts`

```
src/lib/api/driver/photos.ts:7  error  Async function 'uploadPhoto' has too many parameters (4). Maximum allowed is 3
```

**Fix:** Wrap the 4 parameters into a single options object (standard pattern for functions with 3+ args).

### Error 3 — Formatting in `uniwind-types.d.ts` (6 errors, auto-fixable)

Indentation and semicolon style errors. Run `npx eslint --fix uniwind-types.d.ts` to resolve automatically — no manual work needed.

### Warnings (not blocking — do not need to fix before commit)

`bg-primary` class flagged as unknown by `better-tailwindcss/no-unknown-classes` in 5 files. These are warnings only and do not block the commit.

---

## Known Workarounds (Acceptable, Documented)

These are intentional choices. Do not "fix" them without reading the rationale first.

| # | Location | Issue | Rationale | Proper Fix When Ready |
|---|----------|-------|-----------|----------------------|
| 1 | `campaign-screen.tsx` line 126 | date-fns v1 tokens `'MMMM D, YYYY'` + `T12:00:00` noon anchor | Correct for installed version 1.30.1 | Upgrade to date-fns v3, audit all format strings, switch to lowercase tokens |
| 2 | `upload-screen.tsx` line 21 | iOS Simulator camera detection: `Platform.OS === 'ios' && __DEV__ && !Platform.isPad` | Prevents simulator crash; acceptable for now | Replace with `expo-device` `Device.isDevice === false` |
| 3 | `login-form.tsx` line 32 | `validators: { onChange: schema as any }` | Zod v4 + TanStack Form v1.27 TypeScript gap; correct at runtime | Wait for `@tanstack/zod-form-adapter` to publish Zod v4 type support |
| 4 | `supabase.ts` MMKV adapter | Session tokens stored in MMKV instead of expo-secure-store | expo-secure-store has a 2048-byte limit that breaks Supabase JWTs | Note for future compliance review; no immediate action needed |
| 5 | `(app)/_layout.tsx` | 5-second splash screen fallback timer | Prevents stuck splash if `supabase.auth.getSession()` hangs on first launch (no network) | Intentional safety net; keep as-is |

---

## Architecture Decisions Made This Session

### idb as the Canonical Touch Injection Method

Metal GPU rendering on the iOS Simulator blocks `cliclick` and `osascript` from injecting touch events. idb (Facebook iOS Device Bridge) works because it uses the XCTest private framework layer, which bypasses the GPU render pipeline.

**Confirmed architecture:**
- `idb_companion` (Homebrew) runs as a background daemon connected to the simulator
- `idb` Python client (`~/Library/Python/3.9/bin/idb`) sends touch events to the companion
- `idb ui describe-all` is the canonical way to get element coordinates — never guess

### Admin JWT for Seed Data Mutations

When Supabase RLS blocks anon writes (as it should in production), use:
1. POST to `/auth/v1/token?grant_type=password` with admin credentials
2. Extract `access_token` from the response
3. Use that JWT as `Authorization: Bearer <token>` for the PATCH

No service role key is stored locally. The admin JWT approach uses the same auth path the web app uses — it is safe for development.

### `xcrun simctl terminate` + `xcrun simctl launch` for App Restarts

Faster than a full Metro reload and faster than clicking "Restart" in the dev menu. Use when you need to test cold-start behavior (splash screen, session hydration).

---

## Environment State at End of Session

| Component | State |
|-----------|-------|
| iOS Simulator | iPhone 16e, UDID `A4152A57-003A-47D9-8713-D7E0FFB3D04D`, Booted |
| Metro bundler | Was running on port 8081 (will need restart next session) |
| idb_companion | Was running as background daemon (PID 22097 at session start — verify with `pgrep idb_companion`) |
| App install | `com.adtruck-driver-native.development` installed on simulator |
| Login state | Driver auto-logs in via MMKV session persistence on app launch |
| Supabase backend | Connected, real data flowing, RLS working |
| Campaign date | Updated to 2026-03-17 — must be updated each day |
| GitHub repo | `LoneStar_EPR_mobile_stack` created at https://github.com/Vallabha-Praneeth/LoneStar_EPR_mobile_stack.git — NOT YET pushed |
| .gitignore | `.env` added to `.gitignore` this session — secrets will not be committed |
| adtruck-proof-main | Unchanged — PR #6 still open (feature/playwright-setup), tag v1.1.0 |

---

## Project File Reference

Key files and their current state:

| File | Status | Notes |
|------|--------|-------|
| `src/features/driver/campaign-screen.tsx:126` | Fixed | date-fns v1 tokens + noon anchor |
| `src/features/auth/components/login-form.tsx:100` | Fixed | `onPress={form.handleSubmit}` restored |
| `src/features/auth/components/login-form.tsx:95` | Fixed | Subscribe selector simplified to `state.isSubmitting` |
| `src/features/auth/components/login-form.test.tsx` | ✅ FIXED | Updated to username-based form — 3/3 tests passing |
| `src/lib/supabase.ts` | Correct | MMKV adapter intentional, do not change |
| `src/features/driver/upload-screen.tsx:21` | Workaround | iOS Simulator camera detection |
| `.cursor/rules/adtruck-native.mdc` | New | Cursor AI rules, alwaysApply: true |
| `~/.claude/commands/review.md` | New | /review skill |
| `~/.claude/commands/adtruck.md` | Updated | /review added to routing table |

---

## Test Credentials

| Role | Identifier | Password | UUID |
|------|-----------|----------|------|
| Admin | admin@adtruck.com | mawqex-rYsneq-kynja5 | 07b1a667-2738-49a8-b219-589b204d6391 |
| Driver | username: driver1 | DriverPass123! | 5631663f-2ca2-42d8-9408-720f6b2fb3c7 |
| Client | client@acme.com | ClientPass123! | 005d0d6c-10a0-4ebc-9f14-8e1db308ce67 |

Supabase project URL: `https://cleooniqbagrpewlkans.supabase.co`
Seed campaign ID: `00000000-0000-0000-0000-000000000010`

Note: anon key and other credentials are stored in the project `.env` file. Do not paste them in chat or commit them to git.

---

## Campaign Date Maintenance

The seed campaign must have `campaign_date` = today's date for the driver flow to work in development. The `fetchDriverCampaign` query uses `.gte('campaign_date', today)`.

Run this each morning before testing (replace the date):

```bash
ANON_KEY="<from .env file>"

# Get admin JWT
ADMIN_JWT=$(curl -s -X POST \
  "https://cleooniqbagrpewlkans.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@adtruck.com","password":"mawqex-rYsneq-kynja5"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['access_token'])")

# Update campaign date to today
curl -s -X PATCH \
  "https://cleooniqbagrpewlkans.supabase.co/rest/v1/campaigns?id=eq.00000000-0000-0000-0000-000000000010" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"campaign_date\":\"$(date +%Y-%m-%d)\"}"
```

---

## Prioritised Next Steps

### 1. Fix ESLint Errors (Option B — next session)

- [ ] Run `npx eslint --fix uniwind-types.d.ts` — auto-fixes 6 formatting errors
- [ ] Refactor `src/features/driver/campaign-screen.tsx` — extract sub-components to bring function under 110 lines
- [ ] Refactor `src/features/driver/upload-screen.tsx` — extract sub-components to bring function under 110 lines
- [ ] Refactor `src/lib/api/driver/photos.ts` `uploadPhoto` — wrap 4 params into options object
- [ ] Run `pnpm lint` — must return 0 errors
- [ ] Run `pnpm test` — must still pass (3/3)
- [ ] Run `pnpm type-check` — must return 0 errors

### 2. First Commit and Push

```bash
cd /Users/praneeth/LoneStar_ERP/adtruck-driver-native

# Stage specific files — never git add .
git add .gitignore src/ app.config.ts env.ts package.json pnpm-lock.yaml \
        .github/ .cursor/ .husky/ .maestro/ .npmrc .vscode/ \
        README.md __mocks__/ babel.config.js claude.md commitlint.config.js \
        docs/ eas.json eslint.config.mjs jest-setup.ts jest.config.js \
        lint-staged.config.js metro.config.js nativewind-env.d.ts \
        scripts/ tsconfig.json uniwind-types.d.ts assets/

git commit -m "feat(driver): initial react native driver app with full shift flow"

git remote add origin https://github.com/Vallabha-Praneeth/LoneStar_EPR_mobile_stack.git
git branch -M main
git push -u origin main
```

### 3. Post-Push Setup (after first push)

- [ ] Add `.github/dependabot.yml` for npm dependency updates
- [ ] Create `.coderabbit.yaml` with AdTruck-specific custom instructions
- [ ] Add `EAS_TOKEN` secret in GitHub repo settings (for future TestFlight builds)

### Add CI Workflow

Create `.github/workflows/ci-native.yml` with:
- Trigger: `paths: ['adtruck-driver-native/**']`
- Jobs: `pnpm type-check` + `pnpm lint` + `pnpm test:ci`
- No iOS build in CI (too slow/costly for PR checks — use EAS for builds)

### Future Improvements (not urgent)

- [ ] Upgrade `date-fns` from 1.30.1 to v3 — audit all format strings, switch to lowercase tokens
- [ ] Replace iOS Simulator camera detection with `expo-device` `Device.isDevice === false`
- [ ] Wait for `@tanstack/zod-form-adapter` Zod v4 support before removing `as any` cast
- [ ] Tag `v1.3.0` (or appropriate version) after first native app PR is merged
- [ ] Investigate Maestro for E2E automation (already in `package.json` as `e2e-test` script)

---

## Skills Available

| Command | File | Purpose |
|---------|------|---------|
| `/adtruck` | `~/.claude/commands/adtruck.md` | Master orchestrator — routes task to correct skills |
| `/review` | `~/.claude/commands/review.md` | Stage quality review — classifies findings, Cursor handoff |
| `/security-audit` | `~/.claude/commands/security-audit.md` | Security review for auth, DB, upload features |
| `/test-plan` | `~/.claude/commands/test-plan.md` | Test strategy for completed features |
| `/ship` | `~/.claude/commands/ship.md` | Commit message + PR description draft |

---

## Related Projects

| Project | Location | Status | Notes |
|---------|----------|--------|-------|
| adtruck-driver-native | `/Users/praneeth/LoneStar_ERP/adtruck-driver-native` | Active dev | ESLint errors blocking first push — Option B refactor next session |
| adtruck-proof-main | `/Users/praneeth/LoneStar_ERP/adtruck-proof-main` | Stable | PR #6 open, tag v1.1.0 |
| GitHub (web app) | https://github.com/Vallabha-Praneeth/LoneStar_ERP | — | Branches: main, develop |
| GitHub (mobile app) | https://github.com/Vallabha-Praneeth/LoneStar_EPR_mobile_stack | — | Created end of this session — no commits yet |
