# Session Doc — Thursday, March 18, 2026
# AdTruck Driver Native — Maestro E2E Fully Passing + Workaround Research

---

## Quick Start Tomorrow (Friday March 19)

```bash
# 1. Verify simulator is booted (iPhone 16e)
UDID="A4152A57-003A-47D9-8713-D7E0FFB3D04D"
xcrun simctl list devices | grep "$UDID"
# Expected: "iPhone 16e (...) (Booted)"
# If not booted: xcrun simctl boot $UDID && open -a Simulator

# 2. Start Metro in dev mode (dev mode required — console.log forwarded)
cd /Users/praneeth/LoneStar_ERP/adtruck-driver-native
pnpm start > /tmp/metro.log 2>&1 &
# Wait ~10s, check: tail -5 /tmp/metro.log

# 3. Pre-warm the bundle before running Maestro
xcrun simctl openurl $UDID "exp+obytesapp://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081%3FdisableOnboarding%3D1"
sleep 10

# 4. Update campaign date to today
ANON_KEY="<from .env file>"
ADMIN_JWT=$(curl -s -X POST \
  "https://cleooniqbagrpewlkans.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"admin@adtruck.com","password":"mawqex-rYsneq-kynja5"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['access_token'])")
curl -s -X PATCH \
  "https://cleooniqbagrpewlkans.supabase.co/rest/v1/campaigns?id=eq.00000000-0000-0000-0000-000000000010" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"campaign_date\":\"$(date +%Y-%m-%d)\"}"

# 5. Verify E2E still green before touching anything
~/.maestro/bin/maestro test .maestro/driver/shift-flow.yaml
# All steps should COMPLETE — zero FAILED lines.
```

**First task Friday:** Work through the three workaround replacements in order — expo-asset (5 min), photo picker (20 min), secureTextEntry (30 min). See "Workaround Replacement Plan" section below.

---

## Session Overview

| Field | Value |
|-------|-------|
| Date | Thursday, March 18, 2026 |
| Project | adtruck-driver-native (React Native / Expo) |
| Primary Goal | Get `shift-flow.yaml` Maestro E2E test passing end-to-end |
| Outcome | Full shift-flow passes ✅ · console.log PII stripped ✅ · proper fix research complete ✅ |
| GitHub status | Still not pushed (ESLint errors from wed18 not yet fixed — carried forward) |
| Next action | Replace 3 workarounds with proper fixes → fix ESLint errors → first commit + push |

---

## What Was Accomplished This Session

### 1. Root Cause Investigation — Login Step Failing

The Maestro test had been failing at `Assert "My Campaign" is visible` all day. Prior to this session, the password field was empty in every test run because `secureTextEntry` on a React Native New Architecture app blocks XCTest's `typeText` from firing `onChangeText`.

**Three separate bugs were found and fixed:**

#### Bug 1 — `login-screen.tsx`: no navigation after signIn

`signIn(session, profile)` updated the auth store correctly, but `router.replace()` was never called. Expo Router's auth guard redirects unauthenticated users *to* login — it does not automatically reverse when auth state changes. The app was permanently stuck on `/login` even after a successful Supabase login.

**Fix:** Added `router.replace('/(app)')` at `login-screen.tsx:59` immediately after `signIn()`.

Metro logs confirmed multiple successive login calls (the button was being re-tapped during the `extendedWaitUntil` because the form never navigated away).

#### Bug 2 — `login-form.tsx`: `onSubmitEditing` racing with button tap

The password field had `onSubmitEditing={handleSubmit}`. The Maestro `hide-keyboard.yaml` flow presses the Return key to dismiss the keyboard. With the navigation fix in place, that Return key press triggered `handleSubmit` → `signIn()` → `router.replace('/(app)')` — navigating away *before* the subsequent `tapOn: login-button` step could run. Maestro then errored with "Element not found: login-button".

**Fix:** Removed `onSubmitEditing={handleSubmit}` from the password field. The button is now the only submission trigger.

#### Bug 3 — `secureTextEntry` blocking `onChangeText` in XCTest

XCTest's `typeText` on an `AXSecureTextField` bypasses the UITextFieldDelegate path that React Native uses to fire `onChangeText`. With `secureTextEntry={true}`, the password state stayed `""` while the native field showed the typed characters.

**Fix:** Added `IS_DEV = Env.EXPO_PUBLIC_APP_ENV === 'development'` and set `secureTextEntry={!IS_DEV}` on the password field. This is a workaround (see Workaround Replacement Plan).

---

### 2. Photo Picker — Coordinate Taps Unreliable

After login was fixed, the test failed at `Assert "submit-photo-button" is visible`. The system photo picker (`PHPickerViewController`) runs outside the app's accessibility tree. Coordinate taps at `25%, 20%` and `17%, 24%` were firing but not selecting photos reliably — the picker loads photo thumbnails asynchronously, and after `clearState` resets permissions, the first-time grant causes a slower thumbnail load than subsequent runs.

**Evidence:** A manual screenshot taken between two test runs showed the photo *was* selected and the upload screen was showing the preview — but the timing window was too narrow for the tap to catch the photo on every run.

**Fix:** Added a dev-only `testID="use-test-photo-button"` component to `upload-screen.tsx` that uses `expo-asset` to load the bundled `assets/splash-icon.png` directly into state, bypassing the system picker entirely. Updated `shift-flow.yaml` to tap this button instead of opening the gallery. This is a workaround (see Workaround Replacement Plan).

---

### 3. Additional Test Fixes

| Fix | Location | Detail |
|-----|----------|--------|
| Added `scroll` before assertVisible | `shift-flow.yaml:65` | `submit-photo-button` is below the fold when photo preview takes up most of the screen |
| Fixed assertion text | `shift-flow.yaml:74` | `"Photo Submitted"` → `"Photo Submitted!"` — the success screen uses an exclamation mark |
| `waitForAnimationToEnd` removed | `shift-flow.yaml` | No longer needed — test photo button is instant, no picker animation to wait for |

---

### 4. Full shift-flow.yaml — Confirmed Passing

```
Clear state of ${APP_ID}...              COMPLETED
Open exp+obytesapp://...                 COMPLETED
Assert that id: login-button is visible  COMPLETED
Run ../utils/driver-login.yaml...
  Tap on id: username-input              COMPLETED
  Input text ${USERNAME}                 COMPLETED
  Tap on id: password-input              COMPLETED
  Input text ${PASSWORD}                 COMPLETED
  Run ./hide-keyboard.yaml               COMPLETED
  Tap on id: login-button                COMPLETED
  Assert that "My Campaign" is visible   COMPLETED
Run ../utils/driver-login.yaml           COMPLETED
Run flow when id: start-shift-button...  SKIPPED (shift already active in DB)
Assert that id: end-shift-button...      COMPLETED
Tap on id: upload-photo-button           COMPLETED
Assert that "Upload Photo" is visible    COMPLETED
Tap on id: use-test-photo-button         COMPLETED
Scroll vertically                        COMPLETED
Assert that id: submit-photo-button...   COMPLETED
Tap on id: submit-photo-button           COMPLETED
Assert that "Photo Submitted!" is vis.   COMPLETED
Tap on id: back-to-campaign-button       COMPLETED
Assert that id: end-shift-button...      COMPLETED
Tap on id: end-shift-button              COMPLETED
Assert that id: login-button is visible  COMPLETED
```

Exit code: **0** ✅

---

### 5. /review Run — Findings Summary

A `/review` was run covering the login + upload stage. Key findings:

| # | Label | Finding |
|---|-------|---------|
| A | ✅ STANDARD | `router.replace('/(app)')` after signIn — correct Expo Router auth pattern |
| B | ✅ STANDARD | Single submission path (button only) — correct for E2E test environments |
| C | ⚠️ WORKAROUND | `use-test-photo-button` bypasses real picker — test never exercises permissions flow |
| D | ⚠️ WORKAROUND | `secureTextEntry={!IS_DEV}` exposes password in all dev builds, not just E2E |
| E | 🔴 TECH DEBT | 7 `[LOGIN]` console.log lines including one logging driver email (PII) |
| F | ⚠️ WORKAROUND | `expo-asset` not declared in `package.json` — implicit transitive dep |
| G | ✅ FIXED | Known Issue #3 (`login-form.test.tsx` testID mismatch) — already correct |

---

### 6. Console.log PII Stripped

All seven `[LOGIN]` debug lines were removed from `login-screen.tsx`. The file now has clean comments and error handling with no console output. The driver email log (line 25 in the old version) that would have appeared in preview builds is gone.

**Current state of `login-screen.tsx`:** 65 lines, no console.log, comments preserved, navigation correct.

---

## Workaround Replacement Plan

Research was completed this session. All three proper fixes are ready to implement Friday.

---

### Fix 1 — `expo-asset` undeclared *(5 min)*

**Current state:** `upload-screen.tsx` imports `expo-asset` but it's not in `package.json`. Works now as a transitive dep of `expo` SDK 54 (`expo-asset@12.0.x`), but fragile.

**Proper fix:**
```bash
npx expo install expo-asset
```

Use `npx expo install` (not `pnpm add`) — it consults Expo SDK 54's manifest and pins the exact compatible version automatically.

**Source:** [expo-asset SDK 54 docs](https://docs.expo.dev/versions/v54.0.0/sdk/asset/)

---

### Fix 2 — `use-test-photo-button` (replace with `addMedia` + optional tapOn) *(20 min)*

**Current state:** Dev-only button loads bundled PNG, never exercises real permissions flow or image picker code path.

**Proper fix:** Maestro has a first-class documented recipe for this exact scenario.

**Step 1 — Add a test photo asset** to the project:
```
.maestro/test-assets/sample-photo.jpg
```
Any small JPEG works. This file will be seeded into the simulator library before the picker opens.

**Step 2 — Update `shift-flow.yaml`** — replace the gallery section:
```yaml
# Seed photo into simulator library before opening picker
- addMedia: ".maestro/test-assets/sample-photo.jpg"

- tapOn:
    id: gallery-button

# Grant permission if dialog appears
- runFlow:
    when:
      visible: "Allow Full Access"
    commands:
      - tapOn: "Allow Full Access"

# Select first photo — optional: true handles iOS 17/18 element ID differences
- tapOn:
    id: "PXGGridLayout-Info"
    index: 0
    optional: true
- tapOn:
    text: "Photo, .*"
    index: 0
    optional: true
```

**Step 3 — Remove app code:** Delete the `use-test-photo-button` component, the `handleTestPhoto` function, and the `expo-asset` import from `upload-screen.tsx`. (Keep `expo-asset` in `package.json` since `npx expo install` was run in Fix 1.)

**Source:** [Maestro — Choosing images from the gallery](https://docs.maestro.dev/examples/recipes/choose-images-from-the-gallery)

---

### Fix 3 — `secureTextEntry={!IS_DEV}` (replace with launch argument) *(30 min)*

**Current state:** Password shows as plain text in ALL dev builds. Problematic for demos and real credentials.

**Root cause clarified:** The XCTest `onChangeText` blocking is a known open Maestro issue [#1061](https://github.com/mobile-dev-inc/maestro/issues/1061) (open since May 2023). The iOS AutoFill popup appears on secure fields and blocks `inputText`. Not a React Native New Architecture bug — it's a Maestro + iOS AutoFill interaction.

**Proper fix:** `react-native-launch-arguments` — pass a flag at launch time from the Maestro YAML, so only the E2E runner disables secure entry.

**Step 1 — Install:**
```bash
pnpm add react-native-launch-arguments
```
Note: This requires a native rebuild (`pnpm ios`) since it's a native module.

**Step 2 — Update `shift-flow.yaml`** — replace `clearState` + `openLink` with `launchApp`:
```yaml
- launchApp:
    appId: ${APP_ID}
    clearState: true
    arguments:
      isE2E: "true"
```
`launchApp` with `clearState: true` replicates the `clearState` + `openLink` behaviour. The `expo-dev-client` bug that previously dropped launch arguments ([expo #31830](https://github.com/expo/expo/issues/31830)) is confirmed closed.

**Step 3 — Update `login-form.tsx`:**
```ts
import { LaunchArguments } from 'react-native-launch-arguments';
const isE2E = LaunchArguments.value<{ isE2E?: string }>().isE2E === 'true';
// Remove IS_DEV constant
// Change: secureTextEntry={!isE2E}
```

**Step 4 — Pre-test CI setup (optional but complete fix):** Add `plutil` command to disable iOS AutoFill on the simulator before tests run. Described in [Maestro issue #1061 comments](https://github.com/mobile-dev-inc/maestro/issues/1061).

**Sources:**
- [react-native-launch-arguments](https://github.com/iamolegga/react-native-launch-arguments)
- [Best tips for E2E Maestro with React Native](https://dev.to/retyui/best-tips-tricks-for-e2e-maestro-with-react-native-2kaa)
- [Maestro issue #1061](https://github.com/mobile-dev-inc/maestro/issues/1061)

---

## Prioritised Next Steps for Friday

### Step 1 — Replace workarounds (in order, ~55 min total)
- [ ] `npx expo install expo-asset` → commit `chore(driver): declare expo-asset as direct dependency`
- [ ] Add `.maestro/test-assets/sample-photo.jpg`, update `shift-flow.yaml`, remove `use-test-photo-button` from app → run test to verify green
- [ ] `pnpm add react-native-launch-arguments` → `pnpm ios` (rebuild needed) → update `login-form.tsx` + `shift-flow.yaml` → run test to verify green

### Step 2 — Fix ESLint errors (carried from Wed session)
- [ ] `npx eslint --fix src/lib/api/driver/photos.ts` — or manually wrap params into options object (max-params error)
- [ ] Run `pnpm lint` — must return 0 errors before commit
- [ ] Run `pnpm test` — 3/3 must still pass
- [ ] Run `pnpm type-check` — 0 errors

### Step 3 — First commit and push
```bash
git add src/ .maestro/ package.json pnpm-lock.yaml docs/
git commit -m "feat(driver): maestro e2e shift-flow passing with proper workaround replacements"
git push -u origin main
```

### Step 4 — Post-push
- [ ] Add `.github/workflows/ci-native.yml` (type-check + lint + test)
- [ ] Add `.github/dependabot.yml`
- [ ] Create `.coderabbit.yaml`

---

## File State at End of Session

| File | Change | Status |
|------|--------|--------|
| `src/features/auth/login-screen.tsx` | Added `router.replace('/(app)')`, removed 7 console.logs | ✅ Clean |
| `src/features/auth/components/login-form.tsx` | `secureTextEntry={!IS_DEV}`, removed `onSubmitEditing` | ⚠️ Workaround (Fix 3 replaces) |
| `src/features/driver/upload-screen.tsx` | Added `use-test-photo-button` + `expo-asset` import | ⚠️ Workaround (Fix 2 removes) |
| `.maestro/driver/shift-flow.yaml` | Uses `use-test-photo-button`, scroll, `Photo Submitted!` | ⚠️ Workaround (Fix 2+3 update) |
| `.maestro/utils/driver-login.yaml` | Unchanged | ✅ |
| `package.json` | `expo-asset` still undeclared | ⚠️ Workaround (Fix 1 adds) |

---

## Known Workarounds (Carried Forward)

Same as `wed18.md` plus new additions from this session:

| # | Location | Issue | Proper Fix | When |
|---|----------|-------|------------|------|
| 1 | `campaign-screen.tsx:126` | date-fns v1 tokens | Upgrade to date-fns v3 | Future sprint |
| 2 | `upload-screen.tsx:22` | iOS Simulator camera detection | `expo-device` `Device.isDevice` | Future sprint |
| 3 | `login-form.tsx:32` | `validators: schema as any` | Wait for TanStack zod-form-adapter Zod v4 support | Future sprint |
| 4 | `supabase.ts` | MMKV session storage | Deliberate — expo-secure-store 2048b limit | Do not fix |
| 5 | `(app)/_layout.tsx` | 5s splash fallback timer | Intentional safety net | Do not fix |
| **6** | **`login-form.tsx:21,70`** | **`secureTextEntry={!IS_DEV}`** | **`react-native-launch-arguments`** | **Friday** |
| **7** | **`upload-screen.tsx:51-59`** | **`use-test-photo-button`** | **Maestro `addMedia` + `optional` tapOn** | **Friday** |
| **8** | **`package.json`** | **`expo-asset` undeclared** | **`npx expo install expo-asset`** | **Friday** |

---

## Environment State at End of Session

| Component | State |
|-----------|-------|
| iOS Simulator | iPhone 16e, UDID `A4152A57-003A-47D9-8713-D7E0FFB3D04D`, Booted |
| Metro bundler | Running in dev mode on port 8081, logging to `/tmp/metro.log` |
| App install | `com.adtruck-driver-native.development` installed |
| Maestro E2E | `shift-flow.yaml` fully passing (exit code 0) |
| Login state | After `clearState`, always lands on login screen correctly |
| Auth navigation | `router.replace('/(app)')` working — no stuck-on-login regression |
| Supabase | Connected, real data, RLS working |
| Campaign date | Updated to 2026-03-18 — update again tomorrow morning |
| GitHub | Still not pushed — ESLint errors + workaround replacements pending |
| console.log | All PII-risk debug logs removed from `login-screen.tsx` |

---

## Test Credentials

| Role | Identifier | Password | UUID |
|------|-----------|----------|------|
| Admin | admin@adtruck.com | mawqex-rYsneq-kynja5 | 07b1a667-2738-49a8-b219-589b204d6391 |
| Driver | username: driver1 | DriverPass123! | 5631663f-2ca2-42d8-9408-720f6b2fb3c7 |
| Client | client@acme.com | ClientPass123! | 005d0d6c-10a0-4ebc-9f14-8e1db308ce67 |

Supabase: `https://cleooniqbagrpewlkans.supabase.co`
Seed campaign: `00000000-0000-0000-0000-000000000010`

---

## Skills Available

| Command | Purpose |
|---------|---------|
| `/adtruck` | Master orchestrator |
| `/review` | Stage quality review — classifies STANDARD/WORKAROUND/TECH DEBT/BUG |
| `/security-audit` | Auth, DB, upload security review |
| `/test-plan` | Test strategy for completed features |
| `/ship` | Commit message + PR description |
