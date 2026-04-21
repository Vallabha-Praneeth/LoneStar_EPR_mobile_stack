# PR #55 — CI Failure Audit (2026-04-21)

PR: https://github.com/Vallabha-Praneeth/LoneStar_EPR_mobile_stack/pull/55
Branch: `feat/e2e-android-ci-caching`
Head commit: `c07ab18` (pushed 2026-04-21)
Merge state: `UNSTABLE` (mergeable = true, but failing required checks)

Per user directive: errors are **listed only** — no feature code has been modified. All 7 locally edited test files were reverted to HEAD before push.

---

## Summary

| Check | Workflow | Status | Root cause |
|---|---|---|---|
| Lint (ESLint) | CI | FAIL | 77 errors, mostly markdown-related |
| Tests (jest) | Tests (jest) | FAIL | `getByTestId is not defined` in filter-drill-burst.test.tsx |
| Tests (Jest) | CI | FAIL | same as above (duplicate workflow) |
| Type Check (tsc) | Type Check (tsc) | FAIL | same filter-drill-burst.test.tsx — 4 TS2304 errors |
| Type Check (tsc) | CI | FAIL | same as above (duplicate workflow) |
| Expo Doctor | Expo Doctor | PASS | — |
| Lint TS (eslint, prettier) | Lint TS | PASS | — |
| E2E iOS (Maestro Cloud) | E2E iOS | IN_PROGRESS | monitoring |
| E2E Android (Maestro Cloud) | E2E Android | IN_PROGRESS | monitoring |
| CodeRabbit | — | PENDING | review not yet posted |

**Single root-cause clusters:**
1. `filter-drill-burst.test.tsx` — causes both tsc and jest failures on both CI workflows (4 failing jobs, 1 underlying bug).
2. Session notes `.md` files — cause all 77 lint errors (filename case + trailing whitespace).

---

## 1. Tests (jest) — 2 failing tests, 1 file

**File:** `src/components/motion/filter-drill-burst.test.tsx`

```
● filterDrillBurst › auto-hides after burst visibility timeout
  ReferenceError: getByTestId is not defined
    at line 99–100

● filterDrillBurst › retrigger resets the visibility window
  ReferenceError: getByTestId is not defined
    at line 122–123
```

**Why:** The file destructures `{ queryByTestId, rerender }` from `render(...)` but then references bare `getByTestId(...)` at lines 100, 106, 123, 137. The symbol was never imported or destructured. This is a latent bug already present in commit c07ab18.

**Result:** 2 failed / 102 passed tests. `Test Suites: 1 failed, 20 passed`.

**Note:** The pre-push working-tree edits in this file (reverted on user instruction) were exactly the fix for this — they switched to `screen.queryByTestId(...)` throughout. Reapplying them would resolve both jest failures and all 4 tsc errors below.

---

## 2. Type Check (tsc) — 4 errors, all same file

**File:** `src/components/motion/filter-drill-burst.test.tsx`

```
(100,14): error TS2304: Cannot find name 'getByTestId'.
(106,12): error TS2304: Cannot find name 'getByTestId'.
(123,14): error TS2304: Cannot find name 'getByTestId'.
(137,12): error TS2304: Cannot find name 'getByTestId'.
```

Same root cause as §1.

---

## 3. Lint (ESLint) — 77 errors, 27 warnings

### 3a. Filename case errors (`unicorn/filename-case`) — 5 files

These are the committed session-note markdowns; ESLint enforces kebab-case.

| File | Required rename |
|---|---|
| `fri17_s.md` | `fri17-s.md` |
| `mon20_tue21.md` | `mon20-tue21.md` |
| `sat18_sun19.md` | `sat18-sun19.md` |
| `sun19_mon20.md` | `sun19-mon20.md` |
| `tue21_wed22.md` | `tue21-wed22.md` |

### 3b. Trailing-whitespace errors (`style/no-trailing-spaces`)

- `mon20_tue21.md` — 41 lines flagged (lines 3, 4, 11, 20, 24, 28, 34, 35, 39, 45, 49, 53, 57, 61, 65, 69, 73, 77, 81, 85, 104, 105, 108, 109, 112, 113, 116, 117, 120, 121, 124, 125, 128, 129, 136, 137, 140, 141, 144, 145, 148, 149)
- `tue21_wed22.md` — 27 lines flagged (lines 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70, 74, 78, 82, 98, 99, 102, 103, 106, 107, 110, 111, 118, 119)

### 3c. Other errors

- `mon20_tue21.md:294:1` — `style/no-multiple-empty-lines` (too many blank lines at end of file; max 0 allowed)
- `cursor-driver-p2-fixes.md:62:20` — `style/max-statements-per-line` (5 statements on one line; max 1)

### 3d. Warnings (not failing, for reference)

| File | Rule | Count |
|---|---|---|
| `src/components/motion/filter-drill-burst.tsx` | `react-hooks-extra/no-direct-set-state-in-use-effect` | 6 |
| `src/features/client/analytics-screen.tsx` | `react-hooks-extra/no-direct-set-state-in-use-effect` | 3 |
| `src/features/driver/analytics-screen.tsx` | `react-hooks-extra/no-direct-set-state-in-use-effect` | 4 |
| `src/features/driver/campaign-screen.tsx` | `react-hooks-extra/no-direct-set-state-in-use-effect` | 4 |
| `src/lib/realtime/driver-location.ts` | `react-hooks-extra/no-direct-set-state-in-use-effect` | 1 |
| `src/lib/realtime/live-map-motion.ts` | `react-hooks-extra/no-direct-set-state-in-use-effect` | 3 |
| `cursor-driver-p2-fixes.md` | `react-refresh/only-export-components` | 2 |
| `src/components/ui/offline-overlay.test.tsx` | `react/no-unnecessary-use-prefix` | 2 |
| `src/components/ui/rive-back-button.test.tsx` | `react/no-unnecessary-use-prefix` | 1 |
| `src/features/admin/route-form-screen.tsx` | `react/no-array-index-key` | 1 |

Totals: **77 errors, 27 warnings.** ESLint reports `70 of 77 errors are auto-fixable with --fix`.

---

## Proposed fix order (low → high blast radius)

> None applied yet. User owns the call on each.

1. **ESLint** — run `pnpm lint --fix` to resolve the ~70 auto-fixable errors (trailing spaces, blank-line count). Then rename the 5 `*_*.md` session files to `*-*.md`. The `max-statements-per-line` in `cursor-driver-p2-fixes.md` and the set-state-in-effect warnings need manual review.
2. **tsc + jest** — fix `filter-drill-burst.test.tsx` by switching from implicit `getByTestId` to `screen.queryByTestId(...)`. This was exactly the reverted working-tree edit; reapplying it closes both tsc (4) and jest (2) failures.
3. Re-run CI after either fix.

## Items still pending at time of writing

- E2E iOS via Maestro Cloud — IN_PROGRESS
- E2E Android via Maestro Cloud — IN_PROGRESS
- CodeRabbit review — PENDING

Monitoring continues per user standing-by directive.
