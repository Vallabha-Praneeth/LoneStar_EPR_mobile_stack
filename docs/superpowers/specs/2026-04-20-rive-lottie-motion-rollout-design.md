# Rive + Lottie Motion Rollout — Design

Date: 2026-04-20
Status: Draft — awaiting implementation plan
Source spec: `/Users/praneeth/LoneStar_ERP/UI_rive_lottile.rtf`
Source assets: `/Users/praneeth/LoneStar_ERP/UI_related/{rive,lottiefiles}`

## Goals

- Add interactive motion across the AdTruck native app using curated Rive and Lottie assets.
- Keep the UI clean and subtle — motion should reinforce meaning, not decorate.
- Ship in two reviewable PRs (analytics pack, then global UX pack).
- Establish reusable motion primitives (brand logo, back button, bursts, overlays) for future work.

## Non-goals

- Replacing the existing Rive/Lottie components or motion tokens.
- Adding animations to surfaces not listed in the placement map.
- Remote asset delivery. All assets ship bundled unless a size threshold forces the `expo-asset` fallback.
- New analytics/reporting features. Only motion overlays on existing flows.

## Summary

Source RTF nominates 19 asset placements across the app. After a UX/bundle review, 13 are included in this rollout (7 Rive, 6 Lottie). The remaining 6 are recorded in the "Deferred scope" appendix.

## Placement map (13 items)

| ID | Asset | Target file | Insertion point | Lifecycle |
| --- | --- | --- | --- | --- |
| R1 | `logo-chrome.riv` (9 KB) | `src/components/admin-header.tsx` (and all role headers) | Brand slot, 24×24 | Autoplay loop |
| R2 | `cloner-scripted-path.riv` (5 KB) | New `src/components/ui/rive-back-button.tsx`, replacing hand-rolled back arrows in 6 screens | Back icon | One-shot state trigger on press |
| R3 | `rival-hmi.riv` (1.5 MB) | `src/features/driver/campaign-screen.tsx` | Full-screen burst gating shift-start navigation | One-shot; `onComplete` from state-machine exit or 2.5s timeout |
| R4 | `skycoins.riv` (40 KB) | `src/features/admin/analytics-screen.tsx` revenue card (~line 171) | 48×48 beside formatted currency | Autoplay loop |
| R5 | `nature.riv` (694 KB) | New `src/components/ui/offline-overlay.tsx` mounted in `src/app/(app)/_layout.tsx` | Full-screen overlay when offline | Conditional mount; fade 150ms in / 200ms out; NetInfo 500ms debounce |
| R6 | `rive-asset-27127.riv` (6 KB) | New `src/features/auth/components/logout-confirm-dialog.tsx`; replaces direct `onPress={signOut}` in `src/features/settings/settings-screen.tsx` | Header icon of the confirm dialog | One-shot on dialog open |
| R7 | `unlock-27122.riv` (338 KB) | Existing `approveUnlock` preset in `src/components/motion/rive-assets.ts` (asset-swap only) | Photo-approval, campaign-unlock CTAs | Existing state-machine consumers |
| L1 | `analytics-character-animation.lottie` (20 KB) | `src/features/admin/analytics-screen.tsx` | Hero slot at top of screen | Autoplay loop |
| L2 | `chart-diagram.lottie` (5 KB) | `src/features/admin/analytics-screen.tsx` | Replaces `ActivityIndicator` on initial analytics query load | Loop while loading, unmount when data arrives |
| L3 | `business-deal.lottie` (39 KB) | `src/features/admin/reports-screen.tsx` | One-shot overlay on CSV export success | 2s auto-hide |
| L4 | `data-analytics-JPXA6OPHt7.lottie` (3 KB) | All three analytics screens (admin/driver/client) | 72×72 bottom-right corner burst on filter drill-into single entity | One-shot 1.2s; `key={filterValue}`; skip first mount; `pointerEvents: none` |
| L5 | `seo-specialists-...lottie` (47 KB) | `src/features/driver/analytics-screen.tsx` | Hero slot at top | Autoplay loop |
| L6 | `dashboard-4s1AjCkyMJ.lottie` (13 KB) | `src/features/client/analytics-screen.tsx` | Hero slot at top | Autoplay loop |

Total bundle delta: ~2.59 MB Rive + ~127 KB Lottie + ~40 KB NetInfo ≈ **2.75 MB**.

## New components (10)

| # | Path | Purpose | Phase |
| --- | --- | --- | --- |
| 1 | `src/components/ui/brand-logo.tsx` | Wraps `logo-chrome.riv` at 24×24 for all role headers | 2 |
| 2 | `src/components/ui/rive-back-button.tsx` | `cloner-scripted-path.riv` + `router.back()`. Props: `onPress?`, `size?`, `accessibilityLabel?` | 2 |
| 3 | `src/components/motion/shift-start-burst.tsx` | Full-screen modal playing `rival-hmi.riv` one-shot; `onComplete` callback | 2 |
| 4 | `src/components/ui/revenue-coin.tsx` | `skycoins.riv` + formatted currency pair | 1 |
| 5 | `src/components/ui/offline-overlay.tsx` | Absolute-positioned, plays `nature.riv` while `!isOnline` | 2 |
| 6 | `src/lib/hooks/use-is-online.ts` | Wraps `@react-native-community/netinfo`; returns `{ isOnline, wasOnline }`; 500ms debounce | 2 |
| 7 | `src/features/auth/components/logout-confirm-dialog.tsx` | Modal with `rive-asset-27127.riv` icon, Cancel + Sign-out actions | 2 |
| 8 | `src/components/motion/export-success-burst.tsx` | 2s overlay with `business-deal.lottie` one-shot | 1 |
| 9 | `src/components/motion/filter-drill-burst.tsx` | 72×72 corner burst; `trigger` key re-mount; skip first mount | 1 |
| 10 | `src/lib/hooks/use-reduced-motion.ts` | Wraps `AccessibilityInfo.isReduceMotionEnabled` + subscription; returns boolean | 1 |

## Modified files

| Path | Change | Phase |
| --- | --- | --- |
| `src/components/motion/rive-assets.ts` | Add 6 new keys; repoint `approveUnlock` → `unlock-27122.riv` | 1 (coin) + 2 (rest) |
| `src/components/motion/lottie-assets.ts` | Add 6 new keys | 1 |
| `src/components/motion/rive-animation.tsx` | Add presets: `BrandLogo`, `ShiftStartBurst`, `RevenueCoin`, `RiveBackButton` | 1 + 2 |
| `src/components/motion/lottie-animation.tsx` | Add presets: `ExportSuccessBurst`, `FilterDrillBurst`, driver/client hero variants | 1 |
| `src/components/admin-header.tsx` | `<BrandLogo />` + `<RiveBackButton />` | 2 |
| `src/features/admin/analytics-screen.tsx` | L1 hero, L2 loading swap, R4 `<RevenueCoin>`, L4 drill burst | 1 |
| `src/features/driver/analytics-screen.tsx` | L5 hero, L4 drill burst, `<RiveBackButton />` | 1 + 2 |
| `src/features/client/analytics-screen.tsx` | L6 hero, L4 drill burst | 1 |
| `src/features/admin/reports-screen.tsx` | L3 `<ExportSuccessBurst>` on CSV-export success | 1 |
| `src/features/driver/campaign-screen.tsx` | `<ShiftStartBurst>` gates shift-start → navigation | 2 |
| `src/features/settings/settings-screen.tsx` | Wrap logout tap in `<LogoutConfirmDialog>` | 2 |
| `src/app/(app)/_layout.tsx` | Mount `<OfflineOverlay />` above Stack | 2 |
| 5 back-arrow consumers: `src/app/(app)/client/campaign/[id].tsx`, `src/features/driver/upload-screen.tsx`, `src/features/admin/create-campaign-screen.tsx`, `src/features/client/timing-sheet-screen.tsx`, `src/features/admin/route-form-screen.tsx` | Swap for `<RiveBackButton />` (admin-header and both analytics screens are covered in their own rows) | 2 |
| `package.json` | Add `@react-native-community/netinfo` | 2 |
| `assets/animations/` | Copy the 13 curated `.riv` / `.lottie` files | 1 + 2 |

## Lifecycle & triggers

Shared patterns:

- **Motion tokens**: every transition timing references `motionTokens.duration.{instant,fast,base,reveal}`. No hardcoded durations.
- **Reduce motion**: new `useReducedMotion()` hook gates non-essential motion. Loops render the static first frame. Bursts are skipped entirely; the underlying action (navigation, export, filter apply) still succeeds.
- **Skip-first-mount ref pattern**: reuse the pattern from `src/components/ui/theme-toggle.tsx:27` for any animation that must fire on *change*, not initial render (R5, L4).
- **State-machine names**: each Rive asset's state-machine and input/trigger names must be discovered at implementation time (open each `.riv` in the Rive editor or read via `rive-react-native`). These are recorded alongside each entry in `rive-assets.ts` and referenced by the consuming component. Assets that need this: R2 (`cloner-scripted-path`), R3 (`rival-hmi`), R6 (`rive-asset-27127`), R7 (`unlock-27122`). R1, R4, R5 are autoplay loops and do not need explicit state names.

Per-placement notes:

- **R2 RiveBackButton** navigates immediately on press; the animation plays as the screen transitions out. Matches existing `RiveButton` pattern in `src/components/motion/rive-animation.tsx:346`.
- **R3 ShiftStartBurst** mounts when the user taps "Start shift", runs the mutation in parallel, and unmounts on `onComplete` (state-machine exit or 2.5s fallback). If the mutation errors during the burst, the burst is cancelled and a toast is shown.
- **R5 OfflineOverlay**: NetInfo subscription + 500ms debounce to tolerate flapping connections. Overlay uses `accessibilityLiveRegion="polite"`.
- **R6 LogoutConfirmDialog**: Android hardware-back = Cancel. Dialog role is `alert`. Sign-out only fires after explicit Confirm.
- **L2 ChartDiagram loading**: show only on initial load (`isLoading && !data`). Do not re-show on refetch.
- **L3 ExportSuccessBurst**: 2s auto-hide; unmounts cleanly if user navigates away mid-burst.
- **L4 FilterDrillBurst**: plays on filter transition from "all" → specific or specific → different specific; does NOT play on first render.

## Performance & bundle

- Total app binary delta: ~2.75 MB.
- `require()` co-located with consumers. Metro resolves on-demand; `rival-hmi.riv` (1.5 MB) loads only when `ShiftStartBurst` renders.
- Never mount two heavy Rive full-screens simultaneously (`rival-hmi` and `nature` are mutually exclusive).
- Bursts unmount after play; no lingering state-machine instances.
- Fallback lever: if the binary increase blocks a release, ship `rival-hmi` and `nature` via `expo-asset` `downloadAsync()` on first launch (saves ~2.2 MB, adds a one-time download). Not default; documented only.

## Accessibility

- `useReducedMotion()` gates non-essential animations as described above.
- All wrappers accept an `accessibilityLabel` prop and set it on the container `View`.
- Specific announcements:
  - `OfflineOverlay`: "No internet connection" with `accessibilityLiveRegion="polite"`.
  - `ExportSuccessBurst`: "Report exported".
  - `FilterDrillBurst`: "Filter applied to {value}".
  - `RiveBackButton`: `accessibilityRole="button"`, label "Go back", `hitSlop={8}`.
  - `LogoutConfirmDialog`: `accessibilityRole="alert"`, focus traps to Cancel/Confirm buttons.

## Testing

Unit (Jest; existing `__mocks__/rive-react-native.js` covers Rive):

- `useIsOnline`: mock NetInfo, assert `isOnline`/`wasOnline` transitions and 500ms debounce.
- `RiveBackButton`: press → `router.back()` called; first state is fired on the ref.
- `LogoutConfirmDialog`: Confirm calls `signOut()`; Cancel closes without side effects; Android back = Cancel.
- `FilterDrillBurst`: first mount does not play; key change plays once.
- `OfflineOverlay`: renders only when `!isOnline`; fade-in only on transition.
- `ShiftStartBurst`: `onComplete` fires on state-machine event or 2.5s fallback.

Verify Lottie Jest compatibility against the existing `LottieAnimation` tests; add a mock alongside the Rive one if Lottie fails under Jest.

Integration (Maestro Cloud; existing pipeline):

- `BrandLogo` testID visible in admin/driver/client headers.
- Airplane-mode toggle → `OfflineOverlay` visible; toggle off → overlay dismissed.
- Settings → Log out tap opens `LogoutConfirmDialog`; Cancel dismisses without signing out.

Manual QA matrix:

- iOS + Android across all 13 placements.
- Reduce motion ON + OFF (Settings → Accessibility).
- Slow/flapping network for R5.
- State-machine sanity per Rive asset (R2, R3, R6, R7).

## Rollout

**Phase 1 — Analytics pack (PR #1)**

Scope: L1, L2, L3, L4, L5, L6, R4 + supporting new components (`revenue-coin`, `export-success-burst`, `filter-drill-burst`).
Touches: `src/features/{admin,driver,client}/analytics-screen.tsx`, `src/features/admin/reports-screen.tsx`, motion asset registries.
No new dependencies. Blast radius: analytics + reports.

Exit criteria:
- Maestro smoke green on iOS + Android.
- Manual QA of analytics hero + filter drill burst on all three roles.
- Report-export burst observed on CSV success.
- Bundle delta recorded (expected ~130 KB for Phase 1 alone).

**Phase 2 — Global UX pack (PR #2)**

Scope: R1, R2, R3, R5, R6, R7 + supporting new components (`brand-logo`, `rive-back-button`, `shift-start-burst`, `offline-overlay`, `use-is-online`, `logout-confirm-dialog`) + NetInfo dependency + 6 back-arrow call-site swaps + root layout overlay mount.
Touches: shared chrome. Wider review surface than Phase 1.

Exit criteria:
- NetInfo offline toggle exercised on device (airplane mode + flaky Wi-Fi).
- Logout confirm dialog flows tested on iOS + Android (Cancel, Confirm, hardware-back).
- All 6 back-arrow swaps visual-QA'd.
- Bundle delta recorded (expected ~2.6 MB for Phase 2).

Phase 1 ships first and soaks before Phase 2 starts code review.

## Deferred scope (6 items)

Re-entry criteria live alongside each item:

| Asset | Original intent | Reason deferred | Re-entry signal |
| --- | --- | --- | --- |
| `rive-asset-27112` (client menu) | Client-landing nav tiles | 4 MB bundle cost disproportionate for decoration | Only revisit if we adopt remote asset delivery or find a lighter variant |
| `rival-hmi` "different animation states" | Unspecified secondary use | No concrete placement | Revisit once we define a driver status-chip motion language |
| `data-analytics-techniques` | Burst on filter return to "all" | Redundant with L4 | Revisit if UX research shows the symmetric cue is missed |
| `audit-analytics` | Common filter burst | Redundant with L4 | Same as above |
| `seo-analytics` | Fourth analytics hero | Only three roles exist | Revisit when a fourth role ships |
| `advanced-analytics` | "Some transition burst" | No concrete home | Revisit when a specific moment needs a burst that L4 does not cover |

## Implementation checklist (resolved during execution)

Items that cannot be specified ahead of time. The implementation plan owns each:

- State-machine and input/trigger names for R2, R3, R6, R7 — discover by opening each `.riv` asset, then record inline in `rive-assets.ts`.
- Which existing `motionTokens.duration` key covers the 150/200 ms fade timings for `OfflineOverlay`; if none fit, add a token rather than hardcoding.
- Whether Lottie needs its own Jest mock alongside the existing Rive one; confirm on first Jest run in Phase 1 when a Lottie-consuming test executes.
