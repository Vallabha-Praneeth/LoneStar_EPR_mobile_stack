# Session Doc — Friday, March 19, 2026
# AdTruck Driver Native — 3 Workaround Replacements + CI Green + Sprint 8

---

## Quick Start Next Session

```bash
# 1. Check which branch to work on
cd /Users/praneeth/LoneStar_ERP/adtruck-driver-native
git branch -a

# 2. If PR #12 and #13 are merged, pull main
git checkout main && git pull

# 3. Tag v0.1.0 if not already tagged
git tag v0.1.0 && git push origin v0.1.0

# 4. Update campaign date to today
ANON_KEY="$(grep EXPO_PUBLIC_SUPABASE_ANON_KEY .env | cut -d= -f2)"
ADMIN_JWT=$(curl -s -X POST \
  "https://cleooniqbagrpewlkans.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"admin@adtruck.com","password":"mawqex-rYsneq-kynja5"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['access_token'])")
curl -s -X PATCH \
  "https://cleooniqbagrpewlkans.supabase.co/rest/v1/campaigns?id=eq.00000000-0000-0000-0000-000000000010" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"campaign_date\":\"$(date +%Y-%m-%d)\"}"

# 5. Boot simulator + start Metro if running E2E
UDID="A4152A57-003A-47D9-8713-D7E0FFB3D04D"
pnpm start > /tmp/metro.log 2>&1 &
sleep 10
xcrun simctl openurl $UDID "exp+obytesapp://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081%3FdisableOnboarding%3D1"
sleep 10
~/.maestro/bin/maestro test .maestro/driver/shift-flow.yaml
```

**First task next session:** Check if PRs #12 and #13 have CodeRabbit reviews. Address any findings, then merge in order (#12 first, then rebase #13 on main, then merge #13). Tag v0.1.0.

---

## Session Overview

| Field | Value |
|-------|-------|
| Date | Friday, March 19, 2026 |
| Project | adtruck-driver-native (React Native / Expo) |
| Primary Goal | Replace all 3 E2E workarounds, push first commit, green CI |
| Outcome | All 3 workarounds replaced ✅ · Sprint 8 done ✅ · PRs #12 + #13 open · CI re-running |
| GitHub status | 2 PRs open — waiting for CodeRabbit + final CI green |
| Next action | Merge PRs → tag v0.1.0 |

---

## What Was Accomplished This Session

### Sprint 1 — Declare expo-asset as direct dependency ✅

- Ran `npx expo install expo-asset` — pinned to `~12.0.12`
- Added `'expo-asset'` plugin to `app.config.ts`
- Resolved Known Issue #F from `/review`: implicit transitive dependency

---

### Sprint 2 — Replace `use-test-photo-button` with Maestro `addMedia` ✅

**App changes (`upload-screen.tsx`):**
- Removed `use-test-photo-button` component, `handleTestPhoto` function
- Removed `import { Asset } from 'expo-asset'`
- Removed `onTestPhoto` prop from `PhotoPickerArea`

**Maestro changes (`shift-flow.yaml`):**
```yaml
- addMedia:
    - '../test-assets/sample-photo.jpg'
- tapOn:
    id: gallery-button
- runFlow:
    when:
      visible: Allow Full Access
    commands:
      - tapOn: Allow Full Access
- tapOn:
    id: PXGGridLayout-Info
    index: 0
    optional: true
- tapOn:
    text: 'Photo, .*'
    index: 0
    optional: true
```

**New file:** `.maestro/test-assets/sample-photo.jpg` (26K JPEG, converted from `assets/splash-icon.png` via `sips`)

**Why two optional tapOns:** iOS 17 and iOS 18 use different accessibility element IDs for the first photo in PHPickerViewController. Both are marked `optional: true` — whichever matches wins, the other warns but doesn't fail.

---

### Sprint 3 — Replace `secureTextEntry={!IS_DEV}` with launch argument ✅

**Installed:** `pnpm add react-native-launch-arguments@^4.1.1`

**`login-form.tsx` changes:**
- Removed `import Env from 'env'` and `IS_DEV` constant
- Added:
  ```ts
  import { LaunchArguments } from 'react-native-launch-arguments';
  const isE2E = LaunchArguments.value<{ isE2E?: string }>().isE2E === 'true';
  ```
- Changed `secureTextEntry={!IS_DEV}` → `secureTextEntry={!isE2E}`

**`shift-flow.yaml` changes:**
- Replaced `clearState` + `openLink` combo with:
  ```yaml
  - launchApp:
      appId: ${APP_ID}
      clearState: true
      arguments:
        isE2E: 'true'
  - openLink: "exp+obytesapp://..."
  ```
  Note: `openLink` still needed after `launchApp` — `clearState: true` wipes the saved Metro URL in expo-dev-client, so reconnection is required.

**`driver-login.yaml` fix:** Added conditional dismiss for iOS "Save Password?" keychain sheet that appears after login on first E2E run:
```yaml
- runFlow:
    when:
      visible: Not Now
    commands:
      - tapOn: Not Now
```

**New Jest mock:** `__mocks__/react-native-launch-arguments.ts` — returns `{}` so tests don't try to link native module.

**Added to doctor exclude:** `react-native-launch-arguments` listed in `expo.doctor.reactNativeDirectoryCheck.exclude` in `package.json`.

---

### Sprint 4 — ESLint + test fixes ✅

- Fixed `login-screen.tsx`: `catch (e)` unused var → `catch`
- Fixed `login-form.test.tsx`:
  - Added `beforeEach(() => onSubmitMock.mockClear())` before `afterEach(cleanup)` (order required by `test/prefer-hooks-in-order` ESLint rule)
- All 39 tests passing

---

### Sprint 5 — First commit + PR #12 ✅

- Branch: `feature/replace-e2e-workarounds`
- PR #12: [github.com/.../pull/12](https://github.com/Vallabha-Praneeth/LoneStar_EPR_mobile_stack/pull/12)
- CI fixed: `expo-doctor.yml` changed to `pnpm expo prebuild --platform ios --no-install` (Android package names can't have hyphens)
- Patch version bumps: `expo ~54.0.33`, `expo-router ~6.0.23`, `jest-expo ~54.0.17`

---

### Sprint 7 — date-fns v3 upgrade ✅ (separate branch)

- Branch: `fix/date-fns-v3`
- PR #13: [github.com/.../pull/13](https://github.com/Vallabha-Praneeth/LoneStar_EPR_mobile_stack/pull/13)
- Fixed `campaign-screen.tsx:244`: `'MMMM D, YYYY'` → `'MMMM d, yyyy'` (v1→v3 breaking tokens)
- Removed date-fns ignore block from `dependabot.yml`
- `eslint.config.mjs` updated with ignores for generated files (same fix applied to both branches)
- Same Expo Doctor + patch version fixes applied

---

### Sprint 8 — Camera detection fix ✅

- Installed `expo-device@~8.0.10`
- `upload-screen.tsx:22`:
  ```ts
  // Before (workaround):
  const IS_IOS_SIMULATOR = Platform.OS === 'ios' && __DEV__ && !Platform.isPad;

  // After (proper fix):
  const IS_IOS_SIMULATOR = Platform.OS === 'ios' && !Device.isDevice;
  ```
- `Device.isDevice` is `false` on all simulators, `true` on all real devices (including iPads)
- Removed the `__DEV__` guard — works correctly in production builds too
- Resolves Known Issue #2 from `thus19.md`

---

## CI Issues Encountered & Fixed

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Expo Doctor fails — Android package name | `pnpm run prebuild` runs both platforms; `com.adtruck-driver-native` has hyphens | `pnpm expo prebuild --platform ios --no-install` |
| Expo Doctor fails — version mismatch | `expo`, `expo-router`, `jest-expo` on old patch versions | Bumped to `~54.0.33`, `~6.0.23`, `~54.0.17` on both branches |
| All CI fails — lockfile mismatch | `npx expo install expo-device` updated `package.json` but `pnpm-lock.yaml` wasn't committed | Committed lockfile separately |
| eslint.config.mjs — 6 errors on `uniwind-types.d.ts` | Generated file wasn't in ignore list | Added to ignores on both branches |

---

## Open Items at End of Session

| # | Status | Item |
|---|--------|------|
| 1 | ⏳ waiting | PR #12 CI re-running (lockfile fix + Sprint 8 pushed) |
| 2 | ⏳ waiting | PR #13 CI re-running (patch version bump pushed) |
| 3 | ⏳ waiting | CodeRabbit review on both PRs (manually triggered — no response yet) |
| 4 | 🔜 next | Merge PR #12 → rebase #13 on main → merge #13 |
| 5 | 🔜 next | Tag v0.1.0 |
| 6 | 🔜 next | Update MEMORY.md with new state |

---

## Remaining Workarounds (as of end of session)

| # | Location | Issue | Proper Fix | Priority |
|---|----------|-------|------------|----------|
| 1 | `login-form.tsx:32` | `validators: schema as any` | Wait for `@tanstack/zod-form-adapter` Zod v4 support | Low — library fix needed |
| 2 | `supabase.ts` | MMKV session storage | Deliberate — expo-secure-store 2048b limit | Do not fix |
| 3 | `(app)/_layout.tsx` | 5s splash fallback timer | Intentional safety net | Do not fix |

All previous workarounds from `thus19.md` have been replaced or resolved.

---

## Known Issues Table (Updated)

| # | Status | Location | Issue |
|---|--------|----------|-------|
| 1 | ✅ FIXED (PR #13) | `campaign-screen.tsx:244` | date-fns v1 tokens → v3 |
| 2 | ✅ FIXED (Sprint 8) | `upload-screen.tsx:22` | Camera detection uses `Device.isDevice` |
| 3 | ✅ FIXED (Sprint 4) | `login-form.test.tsx` | testID mismatch was already correct; test mock + hook order fixed |
| 4 | ⚠️ WORKAROUND | `login-form.tsx:32` | `validators: schema as any` — waiting on library |
| 5 | ⚠️ DELIBERATE | `supabase.ts` | MMKV session storage — intentional |
| 6 | ✅ FIXED | `(app)/_layout.tsx` | 5s splash fallback — intentional, kept |
| 7 | ✅ FIXED | `login-form.tsx` button | `form.handleSubmit` — correct |

---

## File State at End of Session

| File | Branch | Change | Status |
|------|--------|--------|--------|
| `src/features/driver/upload-screen.tsx` | `feature/replace-e2e-workarounds` | Removed `use-test-photo-button`, added `expo-device` | ✅ Clean |
| `src/features/auth/components/login-form.tsx` | `feature/replace-e2e-workarounds` | `LaunchArguments` replaces `IS_DEV`, `secureTextEntry={!isE2E}` | ✅ Proper fix |
| `src/features/auth/login-screen.tsx` | `feature/replace-e2e-workarounds` | `catch` not `catch (e)` | ✅ Clean |
| `src/features/auth/components/login-form.test.tsx` | `feature/replace-e2e-workarounds` | `beforeEach` mock clear + `afterEach` cleanup order | ✅ Clean |
| `src/features/driver/campaign-screen.tsx` | `fix/date-fns-v3` | `'MMMM d, yyyy'` tokens | ✅ Fixed |
| `.maestro/driver/shift-flow.yaml` | `feature/replace-e2e-workarounds` | `addMedia` + `launchApp` + optional tapOn | ✅ Proper fix |
| `.maestro/utils/driver-login.yaml` | `feature/replace-e2e-workarounds` | "Save Password?" sheet dismissal | ✅ Clean |
| `.maestro/test-assets/sample-photo.jpg` | `feature/replace-e2e-workarounds` | New file, 26K JPEG | ✅ |
| `__mocks__/react-native-launch-arguments.ts` | `feature/replace-e2e-workarounds` | New Jest mock | ✅ |
| `package.json` | both branches | `expo-asset`, `react-native-launch-arguments`, `expo-device`, patch bumps | ✅ |
| `pnpm-lock.yaml` | both branches | Updated for all new packages | ✅ |
| `app.config.ts` | `feature/replace-e2e-workarounds` | Added `'expo-asset'` plugin | ✅ |
| `eslint.config.mjs` | both branches | Added generated file ignores | ✅ |
| `.github/workflows/expo-doctor.yml` | both branches | `--platform ios --no-install` | ✅ |
| `.github/dependabot.yml` | `fix/date-fns-v3` | Removed date-fns ignore block | ✅ |

---

## Environment State at End of Session

| Component | State |
|-----------|-------|
| iOS Simulator | iPhone 16e, UDID `A4152A57-003A-47D9-8713-D7E0FFB3D04D` |
| Metro bundler | Not running (session ended) |
| App install | `com.adtruck-driver-native.development` — rebuilt after Sprint 3 (native module) |
| Maestro E2E | Verified green with all 3 workarounds replaced |
| GitHub | PR #12 and PR #13 open, CI re-running |
| CodeRabbit | Triggered manually on both PRs — awaiting response |
| Current branch | `feature/replace-e2e-workarounds` |

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
