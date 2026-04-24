# Session Summary — Sunday 19 April 2026

Branch: `feat/e2e-android-maestro-cloud` (merged → `main`)
Repo: `/Users/praneeth/LoneStar_ERP/adtruck-driver-native` (GitHub: `Vallabha-Praneeth/LoneStar_EPR_mobile_stack`)
Supabase project: `hfewsknqnlwphaeamvuv` (adtruck-e2e — reused from PR B)

---

## Overview

Goal: close out the Mobile E2E rollout by shipping PR D (Android E2E via Maestro Cloud), mirroring PR C's iOS pipeline. Outcome: PR #53 (iOS, PR C) merged, PR #54 (Android, PR D) built from scratch, iterated through five CI failures (EAS quota → 4-ABI build time → wrong ABI → env precedence → keyboard overlap), first green run on dispatch 24625972055, merged as squash commit `4f7ebc3`. The 4-PR mobile E2E sequence (A infra → B seed users → C iOS → D Android) is now complete.

---

## Files Changed

### `.github/workflows/e2e-android-maestro-cloud.yml` — Created

**What:** New GitHub Actions workflow. Final version: `workflow_dispatch` + PR-event triggers (paths-filtered), `ubuntu-latest` runner, `timeout-minutes: 50`, `permissions: contents: read`, `concurrency` group. Env block exposes `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY/API_URL` from `*_E2E` secrets and sets `ORG_GRADLE_PROJECT_reactNativeArchitectures: arm64-v8a`. Steps: checkout → `setup-node-pnpm-install` composite → `setup-jdk-generate-apk` composite (APP_ENV: preview) → sanity-check APK → `mobile-dev-inc/action-maestro-cloud@v2.0.2` with `workspace: .maestro`, `include-tags: smoke`, env vars `APP_ID=com.adtruck_driver_native.preview` / `USERNAME=driver-e2e` / `PASSWORD=${{ secrets.E2E_DRIVER_PASSWORD }}`. Soft-gated (not a required check).

**Why:** PR C landed the iOS E2E pipeline via EAS Cloud; PR D extends the same pattern to Android. Switched from EAS Cloud to local Gradle after hitting the monthly free-tier Android-build quota on the first EAS attempt. Single-ABI build is critical because Maestro Cloud emulators are arm64-v8a only and building all four ABIs was adding ~20min of CMake compile time per run.

### `.maestro/driver/login-smoke.yaml` — Modified

**What:** (1) Removed the flow-header `env:` block that was hardcoding `APP_ID: com.adtruck-driver-native.preview` (iOS bundle ID with hyphens), `USERNAME: driver-e2e`, and `PASSWORD: E2eDriver!20260418`. Maestro's flow-header `env:` takes precedence over CLI `-e KEY=VALUE`, so these defaults were shadowing Android's hyphenated-vs-underscore package name. (2) Replaced the `driver-login.yaml` sub-flow reference with inlined login steps (commit `e628c59` pre-compaction). (3) Added a `hide-keyboard` invocation between username-input and password-input tapping, because the Android soft keyboard was covering the password field and Maestro reported "Element not found".

**Why:** Fixed two Android-specific Maestro failures. First failure: `Unable to launch app com.adtruck-driver-native.preview` — Maestro tried to launch the iOS bundle ID because the flow-header default shadowed the workflow's Android package input. Second failure: `Element not found: Id matching regex: password-input` — keyboard overlap, iOS doesn't exhibit this but Android does.

### `eas.json` — Modified

**What:** Reverted Android block added during the EAS-Cloud attempt — the `simulator-e2e` profile no longer references Android, since Android builds now go through local Gradle not EAS.

**Why:** Keep the `simulator-e2e` profile iOS-only (single source of truth for iOS CI build); Android is built by the Gradle composite action instead.

### `docs/mobile-e2e-plan.md` — Modified

**What:** Updated PR D status to in-progress, added branch/started date, revised gotchas section to reflect the local-Gradle path (not EAS).

**Why:** The plan doc is the single-sheet tracker for the 4-PR mobile E2E rollout; keeping it current lets the next session see PR D's real state without re-deriving it.

### Deleted: stale Obytes-template Android workflows

- `.github/workflows/e2e-android.yml`
- `.github/workflows/e2e-android-maestro.yml`
- `.github/workflows/e2e-android-eas-build.yml`

**Why:** These were scaffolding inherited from the Obytes React Native template and didn't match the Maestro Cloud + local Gradle approach. Leaving them in would have been dead weight and confused future devs.

### `/Users/praneeth/.claude/projects/-Users-praneeth-LoneStar-ERP/memory/project_maestro_cloud_abi.md` — Created

**What:** Project memory recording that Maestro Cloud Android emulators are arm64-v8a only, NOT x86_64. Documents the 400-at-upload error (`APK does not support arm64-v8a architecture. Found: [x86_64]`) and how to configure `ORG_GRADLE_PROJECT_reactNativeArchitectures`.

**Why:** I had the ABI backwards on first attempt (assumed x86_64 like most CI-hosted Android emulators). Saving this means future sessions won't repeat the ~25min wasted Gradle build.

### `/Users/praneeth/.claude/projects/-Users-praneeth-LoneStar-ERP/memory/feedback_mobile_vs_web_repo.md` — Created

**What:** Feedback memory: mobile repo is `Vallabha-Praneeth/LoneStar_EPR_mobile_stack`, web repo is `Vallabha-Praneeth/LoneStar_ERP`. Before any `gh` command, run `git remote -v` to verify.

**Why:** User explicitly corrected me ("remeber this are we doing for mobile app not web app, you keep forgetting and merging to LoneStar_ERP repo").

### `/Users/praneeth/.claude/projects/-Users-praneeth-LoneStar-ERP/memory/feedback_android_ci_caching.md` — Created

**What:** Feedback memory: next Android workflow iteration must add caching for `~/.gradle/caches/`, `~/.gradle/wrapper`, `android/app/.cxx`, and `android/app/build/intermediates/cxx`. Cache key must include the `reactNativeArchitectures` value (ABI change invalidates CMake outputs). pnpm store caching should be verified in the `setup-node-pnpm-install` composite action.

**Why:** User flagged after watching three consecutive ~19–25min cold-Gradle builds. The expensive step is CMake native compilation of RN deps (reanimated, gesture-handler, worklets, nitro, rive), which the default `gradle/gradle-build-action` cache does NOT cover.

---

## Git Operations

| Operation | Repo | Branch | Details |
|-----------|------|--------|---------|
| merge | `LoneStar_EPR_mobile_stack` | `feature/e2e-ios-maestro-cloud` → `main` | PR #53 merged as commit `96d9756` (squash) |
| branch create | `LoneStar_EPR_mobile_stack` | `feat/e2e-android-maestro-cloud` | cut from `main` |
| commit | `LoneStar_EPR_mobile_stack` | `feat/e2e-android-maestro-cloud` | `8edd4ee` — `feat(e2e): android e2e via maestro cloud, mirror PR C` |
| commit | `LoneStar_EPR_mobile_stack` | `feat/e2e-android-maestro-cloud` | `aa3e950` — `chore(e2e): least-privilege permissions on both e2e workflows` |
| commit | `LoneStar_EPR_mobile_stack` | `feat/e2e-android-maestro-cloud` | `51bce03` — `refactor(e2e): build android apk via local gradle, not eas` |
| commit | `LoneStar_EPR_mobile_stack` | `feat/e2e-android-maestro-cloud` | `883a7c0` — `perf(e2e): build only x86_64 ABI for android e2e, raise timeout` |
| commit | `LoneStar_EPR_mobile_stack` | `feat/e2e-android-maestro-cloud` | `7e7d786` — `fix(e2e): build arm64-v8a not x86_64 for maestro cloud android` |
| commit | `LoneStar_EPR_mobile_stack` | `feat/e2e-android-maestro-cloud` | `c7f6bd2` — `fix(e2e): remove hardcoded env defaults from login-smoke flow header` |
| commit | `LoneStar_EPR_mobile_stack` | `feat/e2e-android-maestro-cloud` | `1088b64` — `fix(e2e): hide keyboard between username and password inputs` |
| push | `LoneStar_EPR_mobile_stack` | `feat/e2e-android-maestro-cloud` | pushed all 7 commits to origin across iterations |
| PR created | `LoneStar_EPR_mobile_stack` | `feat/e2e-android-maestro-cloud` → `main` | PR #54 — `feat(e2e): android e2e via Maestro Cloud` (draft) |
| PR ready | `LoneStar_EPR_mobile_stack` | PR #54 | marked ready for review after run 24625972055 green |
| PR merged | `LoneStar_EPR_mobile_stack` | `feat/e2e-android-maestro-cloud` → `main` | PR #54 merged as commit `4f7ebc3` (squash, branch deleted) |

---

## Fixes and Debugging

**Problem:** commitlint rejected initial PR D commit: `subject must not be sentence-case`.
**Root cause:** Capitalized "Android" in `feat(e2e): Android E2E via Maestro Cloud, mirror PR C`.
**Fix:** Lowercased to `feat(e2e): android e2e via maestro cloud, mirror PR C`. Commit `8edd4ee`.

**Problem:** First workflow dispatch (run 24624064859) failed in 24s at the EAS build step with "This account has used its Android builds from the Free plan this month, which will reset in 11 days (on Fri May 01 2026)."
**Root cause:** EAS free-tier Android build quota exhausted.
**Fix:** Pivoted from EAS Cloud to local Gradle build via the existing `setup-jdk-generate-apk` composite action. User approved ("ok let's take option 3"). Commit `51bce03`.

**Problem:** Gradle run 24624338369 was cancelled at 24min. Not stuck — actively compiling CMake native modules for all four Android ABIs.
**Root cause:** Default Gradle build compiles arm64-v8a, armeabi-v7a, x86, x86_64 — three of which are dead weight for Maestro Cloud.
**Fix:** Restricted to single ABI via `ORG_GRADLE_PROJECT_reactNativeArchitectures` env var (maps to `-PreactNativeArchitectures=...` Gradle property). Commit `883a7c0`.

**Problem:** Run 24624794696 failed at Maestro upload with `APK does not support arm64-v8a architecture. Found: [x86_64]`.
**Root cause:** I assumed Maestro Cloud ran x86_64 emulators (common for CI-hosted Android), but it's arm64-only infrastructure.
**Fix:** Switched the restricted ABI from `x86_64` to `arm64-v8a`. Saved as project memory (`project_maestro_cloud_abi.md`) so this doesn't happen again. Commit `7e7d786`.

**Problem:** Run 24625152468 failed with `[Failed] login-smoke (Unable to launch app com.adtruck-driver-native.preview)`.
**Root cause:** `.maestro/driver/login-smoke.yaml` had a flow-header `env:` block hardcoding `APP_ID: com.adtruck-driver-native.preview` (iOS bundle ID with hyphens). Maestro's flow-header `env:` takes precedence over CLI `-e KEY=VALUE`, so Maestro tried to launch the iOS bundle ID on the Android emulator. Android uses underscores: `com.adtruck_driver_native.preview`.
**Fix:** Removed the entire `env:` block from the flow header. Workflow's `-e APP_ID=...` is now the sole source. Added a comment block at the top of the file documenting the precedence gotcha. Commit `c7f6bd2`.

**Problem:** Run 24625521468 failed with `[Failed] login-smoke (Element not found: Id matching regex: password-input)`. App launched successfully (previous fix worked), username-input tap succeeded, username was typed, but tapping password-input couldn't find the element.
**Root cause:** Android software keyboard appeared after typing the username and covered the password-input field below. iOS doesn't exhibit this because its keyboard doesn't occlude elements the same way.
**Fix:** Inserted `- runFlow: ../utils/hide-keyboard.yaml` between `inputText: ${USERNAME}` and `tapOn: password-input`. The util is a no-op on iOS and calls `hideKeyboard` on Android. Commit `1088b64`.

---

## Plans and Docs Updated

**File:** `docs/mobile-e2e-plan.md`
**What changed:** PR D row flipped from "planned" to "in-progress" with branch name and started date. Gotchas section updated to remove EAS-specific notes and add the Gradle-path gotchas (single-ABI build, CMake compile time, arm64-v8a requirement, Maestro flow-header env precedence).
**Why:** The plan doc is the one-sheet tracker for the 4-PR rollout. When PR D merged, it became the canonical record of what shipped.

**File:** `sat18_sun19.md` (read only this session)
**What changed:** Nothing. Referenced for the Maestro-sub-flow-env-override learning from Saturday's session.
**Why:** Source-of-truth for PR C patterns that PR D was mirroring.

---

## Decisions Made

- **EAS Cloud → local Gradle for Android builds.** User approved ("ok let's take option 3") after EAS free-tier quota exhausted. Gradle is free, reproducible, and faster once cached. iOS stays on EAS Cloud because iOS simulator builds require macOS/Xcode runners.
- **Single-ABI build (arm64-v8a) for CI.** Maestro Cloud is arm64-v8a only; building the other three ABIs is pure waste. Saved roughly 20min of CMake compile per run.
- **`workflow_dispatch` for first runs.** User requested — first validation runs dispatched manually so PR status checks don't flicker red while iterating. Only after green do we rely on PR-event triggers.
- **Inline login steps in `login-smoke.yaml`** (not `runFlow` → `driver-login.yaml`). Sub-flow env headers override parent env in Maestro, and `driver-login.yaml` has a `USERNAME: driver1` dev default that shadows e2e creds. Inlining keeps env precedence single-scoped. (Decision made pre-compaction, commit `e628c59`.)
- **PR D merged as squash.** Standard for this repo; preserves one commit per PR on `main`.
- **Caching deferred to next iteration.** User explicitly chose to accept the ~25min cold build on the final verification run and implement caching in a follow-up PR, not in PR D. Memory saved to track this.

---

## Resume Point

**Current state:**
- PR #53 (iOS E2E, PR C) merged on `main` as commit `96d9756`.
- PR #54 (Android E2E, PR D) merged on `main` as commit `4f7ebc3`.
- Branch `feat/e2e-android-maestro-cloud` deleted on origin.
- Workflow `.github/workflows/e2e-android-maestro-cloud.yml` is live and soft-gated (not a required check).
- Last green dispatch: run `24625972055`, 18m25s.
- Mobile E2E rollout (PR A infra → PR B seed users → PR C iOS → PR D Android) is COMPLETE.

**Immediate next step:**
Add Gradle + CMake + pnpm caching to `e2e-android-maestro-cloud.yml` per the plan in `/Users/praneeth/.claude/projects/-Users-praneeth-LoneStar-ERP/memory/feedback_android_ci_caching.md`. Cache paths: `~/.gradle/caches/**/*`, `~/.gradle/wrapper`, `android/app/.cxx`, `android/app/build/intermediates/cxx`. Cache key must include the `reactNativeArchitectures` value. Target: drop warm builds from ~19min to ~5–7min.

**Pending work (in order):**
1. Android CI caching (above).
2. Promote the soft-gated Android + iOS E2E workflows to required checks once caching is in place and a few more runs confirm stability (week of 2026-04-22 at earliest).
3. Long-term fix for `.maestro/utils/driver-login.yaml` — it still has `USERNAME: driver1` as a dev default. Either remove the defaults or split into two variants (local-dev vs e2e). Currently avoided by inlining login steps in `login-smoke.yaml`, but any new smoke flow that reuses the shared login sub-flow will hit the same shadowing bug.
4. Investigate why the `isE2E: 'true'` launchArg isn't flipping `secureTextEntry` on the password input (discovered during iOS E2E work; tracked as a follow-up).
5. Opt into Node.js 24 on the e2e workflows before the June 2, 2026 deadline (GitHub Actions deprecation warning surfaced on every run). Set `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` or upgrade the individual actions (`setup-java@v3` → v4, `pnpm/action-setup@v4` → v5, etc.).

**Gotchas to remember:**
- **Mobile repo is `Vallabha-Praneeth/LoneStar_EPR_mobile_stack`.** Not `LoneStar_ERP` (that's the web repo). Always `git remote -v` before any `gh` command. See `feedback_mobile_vs_web_repo.md`.
- **Maestro Cloud Android emulators are arm64-v8a only.** Never x86_64. `ORG_GRADLE_PROJECT_reactNativeArchitectures=arm64-v8a` is required. See `project_maestro_cloud_abi.md`.
- **Maestro flow-header `env:` overrides CLI `-e KEY=VALUE`.** Don't hardcode defaults in flow headers for vars that CI supplies — they will silently shadow.
- **iOS uses hyphens, Android uses underscores** in bundle ID / package name: `com.adtruck-driver-native.preview` vs `com.adtruck_driver_native.preview`. Both defined in `env.ts` (`BUNDLE_IDS` and `PACKAGES`).
- **Soft keyboard on Android covers fields.** Always invoke `../utils/hide-keyboard.yaml` between consecutive text inputs in Maestro flows. It's a no-op on iOS.
- **commitlint enforces lowercase subject.** `feat(e2e): android ...`, not `feat(e2e): Android ...`.
- **EAS free-tier Android quota is ~10 builds/month.** Resets monthly. Next reset was `Fri May 01 2026` when this was observed. Local Gradle avoids this entirely.
- **Don't skip hooks (`--no-verify`).** This repo runs `tsc --noemit` on commit. If it fails, fix the types, don't bypass.
- **Draft PRs skip the real workflow.** The workflow has `if: github.event.pull_request.draft != true`. Use `workflow_dispatch` for first runs, or mark ready-for-review after green. PR-event runs will register as "skipped" until the PR is ready.
