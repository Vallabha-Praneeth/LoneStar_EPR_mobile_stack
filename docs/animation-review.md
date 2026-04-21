# Mobile Animation Review

Audit date: 2026-04-09

Scope: read-only audit of mobile animation usage in the requested React Native screens, shared motion primitives, and parity against the Framer Motion patterns in `../adtruck-proof-main`.

## Manual Smoke Results (2026-04-20)

Checklist run captured from interactive simulator validation. Status values: Pass, Fail, Blocked, Not run.

| Check | Status | Notes |
| --- | --- | --- |
| Admin analytics hero animation loops at top | Fail | Hero appears, but icon/asset size is too small and not satisfactory. |
| Admin analytics revenue coin visibility/sizing | Fail | Revenue coin result was negative in manual validation. |
| Admin analytics filter drill burst behavior | Fail | Expected drill-only behavior did not pass. |
| Driver and client analytics hero animations | Fail | Hero animations appear, but an unexpected secondary burst also appears. |
| Admin reports CSV export + success burst | Blocked | Reporting section/tab not available in current app navigation. |
| Client export + success burst | Blocked | Same as admin: report/export surface not available. |
| Admin brand logo + Rive back arrows | Pass | Branding and back-navigation behavior accepted in manual check. |
| Settings logout confirm flow | Pass | Confirm dialog now works correctly across admin, client, and driver logout entry points (cancel stays logged in, confirm signs out). |
| Driver ShiftStartBurst then navigate to upload | Pass | Burst and subsequent navigation behavior accepted. |
| OfflineOverlay offline/online transition | Not run | Scenario not executed during this pass. |

## Summary Table

| Screen | Animations present | Library used | Uses tokens? | Rating |
| --- | --- | --- | --- | --- |
| `src/features/admin/campaign-list-screen.tsx` | Empty-state entrance via `EmptyStateWithAnimation`; no page, list, or card reveal; loading is plain `ActivityIndicator`. | Moti through shared empty state; Lottie. | Partial. Empty-state preset uses `motionTokens`, but list/card timings are absent. | 2/5 |
| `src/features/admin/reports-screen.tsx` | Empty-state entrance; no stat-card reveal, table/list stagger, or loading skeleton pulse. | Moti through shared empty state; Lottie. | Partial. Empty-state preset uses `motionTokens`; stat/list motion is absent. | 2/5 |
| `src/features/admin/analytics-screen.tsx` | Empty-state entrance; KPI grid and chart sections are static; loading is plain `ActivityIndicator`; range picker has no transition. | Moti through shared empty state; Lottie. | Partial. Empty-state preset uses `motionTokens`; analytics content motion is absent. | 2/5 |
| `src/features/admin/routes-screen.tsx` | Empty-state entrance; route rows are static; switch thumb animates through shared `Switch`; loading is plain `ActivityIndicator`. | Moti through shared empty state and shared switch; Lottie. | Partial. Empty-state preset uses `motionTokens`; switch timings are hardcoded/default Moti config. | 2/5 |
| `src/features/admin/cost-types-screen.tsx` | Empty-state entrance; add-row button spinner; shared switch thumb animation; cost type rows are static. | Moti through shared empty state and switch; Lottie. | Partial. Empty-state preset uses `motionTokens`; switch and spinner timing do not use app motion tokens. | 2/5 |
| `src/features/admin/driver-detail-screen.tsx` | Empty-state entrance for shift history; form sections, totals, and shift cards are static; loading is plain `ActivityIndicator`. | Moti through shared empty state; Lottie. | Partial. Empty-state preset uses `motionTokens`; section/card motion is absent. | 2/5 |
| `src/features/client/client-landing-screen.tsx` | Center card is static; embedded empty-state Lottie has entrance animation. | Moti through shared empty state; Lottie. | Partial. Empty-state preset uses `motionTokens`; card/page entrance is absent. | 3/5 |
| `src/features/client/timing-sheet-screen.tsx` | Empty-state entrance; timing cards and timeline rows are static; loading is plain `ActivityIndicator`. | Moti through shared empty state; Lottie. | Partial. Empty-state preset uses `motionTokens`; list/timeline motion is absent. | 2/5 |
| `src/features/driver/upload-screen.tsx` | Infinite scale pulse on camera tile; Lottie upload progress in submit button; no page/card entrance; preview swap is static. | Moti; Lottie. | Mostly. Pulse duration uses `motionTokens.duration.reveal`; Lottie speed is hardcoded. | 3/5 |
| `src/features/driver/upload-success-screen.tsx` | Lottie success animation; text fade-up after success badge. Parent success card and action buttons are static. | Moti; Lottie. | Mostly. Text reveal uses `motionTokens.duration.reveal`; Lottie size/speed are hardcoded in shared wrapper. | 4/5 |

## Consistency Findings

- The strongest mobile pattern is the shared `EmptyStateWithAnimation`, which wraps `LottieAnimation` in a Moti fade-up (`opacity` plus `translateY`) and defaults to `motionTokens.duration.base` with an 8 px offset.
- Empty-state durations are intentionally varied by preset: campaign-style admin empty states use `motionTokens.duration.fast`, reports use `base`, analytics and client info use `reveal`. This is tokenized, but the same UX role now has three speeds.
- Page-level animation is not standardized. The web app wraps each page in a `motion.div` with `fadeIn` and route-level `AnimatePresence`; the native screens generally render static root `View` trees.
- List and card reveal animation is missing in most mobile equivalents. Admin campaign cards, report rows, route rows, cost type rows, timing rows, and driver shift cards render directly inside `FlatList`, `ScrollView`, or maps.
- Loading states are inconsistent with the web. The web uses skeleton pulse loops on campaign, reports, timing, and driver-detail loading states; mobile mostly uses `ActivityIndicator`.

## Missing Animations

- `campaign-list-screen.tsx`: add a page `fadeIn` equivalent and a `FlatList` row reveal that mirrors web `listStaggerParent` plus `cardReveal` from `AdminCampaignList`.
- `reports-screen.tsx`: add a `gridStagger`/`cardReveal` equivalent for `StatCard` and a list/table reveal for campaign rows, matching web `AdminReports`.
- `analytics-screen.tsx`: add KPI card reveal, chart section fade-up, and a fast crossfade between empty/data states. Web `AdminAnalytics` uses `AnimatePresence` and animated `AnalyticsKpiGrid`/`ChartCard`.
- `routes-screen.tsx`: add list row reveal. The web version uses `listStaggerParent` and `slideIn` per route row.
- `cost-types-screen.tsx`: add fade-up for the add form and list-row stagger. The web version animates both.
- `driver-detail-screen.tsx`: add section-level stagger for license, emergency contact, compensation, action, and shift-history blocks. The web version uses `sectionStaggerParent` and `fadeUp` per section.
- `client-landing-screen.tsx`: the Lottie info state animates, but the surrounding card/page should enter as a whole so the screen does not feel like a static shell with a moving child.
- `timing-sheet-screen.tsx`: add card and row/timeline stagger. The web timing sheet uses a `fadeUp` card plus staggered timeline rows.
- `upload-screen.tsx`: add page/card entrance and preview-state crossfade/scale transition. The web upload flow uses a quick `fadeUp` wrapper and an animated upload progress bar.

## Hardcoded Values

- `src/components/ui/checkbox.tsx`: checkbox/radio transitions use hardcoded `100` ms and `50` ms durations instead of `motionTokens.duration.instant`; the switch thumb relies on Moti's default transition with `overshootClamping` and no explicit app token.
- `src/components/ui/progress-bar.tsx`: `withTiming` uses hardcoded `duration: 250` and `Easing.inOut(Easing.quad)` instead of mobile motion tokens. This component is not used by the requested screens, but it is part of the app's animation surface.
- `src/components/ui/modal.tsx`: modal backdrop uses hardcoded `FadeIn.duration(50)` and `FadeOut.duration(20)` instead of tokenized instant/fast exit values.
- `src/components/empty-state-with-animation.tsx`: default `entranceOffsetY = 8` is not tokenized. Presets also use hardcoded offsets of `6`, `8`, and `10`.
- `src/components/motion/lottie-animation.tsx`: default Lottie size `64`, success size `80`, upload progress size `24`, upload progress speed `1.35`, and fallback colors `#FF6C00`/`#ffffff` are hardcoded.
- `src/features/driver/upload-screen.tsx`: camera pulse scale target `1.06` is hardcoded, though the duration is tokenized.
- `src/features/driver/upload-success-screen.tsx`: text `translateY: 6` is hardcoded, though duration is tokenized.

## Lottie Asset Usage

- `uploadProgress` (`assets/animations/upload-batch.lottie`) is used only in `UploadScreen` while `uploadMutation.isPending`. It is rendered at 18 px in the submit button, but the asset is 206 KB, 516 x 516, includes nine PNG images, and runs at 60 fps. This is the highest-cost Lottie in the app and is oversized for an 18 px button indicator.
- `uploadSuccess` (`assets/animations/success-check.lottie`) is used by `UploadSuccessScreen`. It is rendered through `UploadSuccessAnimation` at the default 80 px, loops disabled, which is appropriate for the success screen.
- `adminEmptySearch` (`assets/animations/admin-empty-search.lottie`) is used by the admin empty states in campaign list, reports, analytics, routes, cost types, and driver shift history. It is 2 KB and rendered at 72 to 96 px, which is reasonable.
- `clientEmptyBox` (`assets/animations/client-empty-box.lottie`) is used by client landing and timing-sheet empty states. It is 4.2 KB and rendered at 92 px, which is reasonable.
- `src/components/motion/lottie-catalog.ts` only lists `upload-progress` and `upload-success`; it does not catalog `adminEmptySearch` or `clientEmptyBox`, so the catalog is stale relative to `lottie-assets.ts`.
- Empty states that still use static icons in the requested set: the `!clientId` state in `timing-sheet-screen.tsx` uses plain text, and analytics error/load states use plain text or `ActivityIndicator`. Outside the requested set, several other admin/driver screens still use static loaders or icons.

## Performance Flags

- No `useNativeDriver: false` usage was found in the audited mobile animation paths. Most animation code uses Moti, Reanimated, Lottie, or native `ActivityIndicator`.
- The infinite camera pulse in `PhotoPickerArea` uses Moti `loop: true` and `repeatReverse: true`. Moti should stop this with component unmount, but it still runs continuously while the picker is visible; keep it subtle and avoid adding more always-on loops to the same screen.
- `upload-batch.lottie` is relatively heavy for its current 18 px usage. Prefer a lightweight vector/spinner for the button or render the asset larger in a dedicated upload-progress state where the 206 KB cost is justified.
- `EmptyStateWithAnimation` loops all empty-state Lotties by default. This is acceptable for small 2 to 4 KB empty-state assets, but avoid using that wrapper with large image-backed `.lottie` assets without making `loop` explicit.
- Web loading skeletons pulse; mobile uses `ActivityIndicator`. This is good for low-end simplicity, but it creates parity gaps and less context-preserving loading. If skeletons are added on mobile, use Reanimated/Moti opacity loops sparingly and only for visible placeholders.

## Web Parity

- Web route transitions: `adtruck-proof-main/src/App.tsx` wraps routes in `AnimatePresence mode="wait"`. Mobile has no equivalent route transition wrapper at the audited screen level.
- Web page entrance: web pages generally use outer `fadeIn` variants with exit support. Mobile only has targeted Moti entrances in empty states and upload success copy.
- Web campaign list: `AdminCampaignList` uses `listStaggerParent` and `cardReveal` for campaign cards. Mobile campaign cards are static.
- Web reports: `AdminReports` uses `gridStaggerParent` and `cardReveal` for stat cards, `fadeUp` for the table shell, and `listStaggerParent` for rows. Mobile reports only animates the empty state.
- Web analytics: `AdminAnalytics` uses page `fadeIn`, `AnimatePresence` for empty/data crossfade, animated KPI cards, and animated chart cards. Mobile analytics only animates the empty state.
- Web routes and cost types: web list rows stagger in with `slideIn`/`fadeUp`; mobile rows are static, aside from the shared switch thumb.
- Web driver detail: web form sections use `sectionStaggerParent` with per-section `fadeUp`. Mobile driver detail sections are static.
- Web client campaign and timing: web uses `fadeUp`, `scaleIn`, and grid/list stagger for campaign info, photo grid, lightbox, and timing rows. Mobile client landing/timing has Lottie empty states but no animated data-state rows.
- Web driver upload: web uses quick page/card `fadeUp` and a tokenized upload progress bar. Mobile has a camera pulse and Lottie submit indicator, but no page/card entrance.

## Recommendations

1. Add mobile page/list motion primitives that mirror web `fadeIn`, `fadeUp`, `scaleIn`, `cardReveal`, `listStagger`, and `gridStagger`, backed by `src/lib/motion/tokens.ts`.
2. Start with high-traffic admin screens: campaign list, reports, routes, and cost types. Add `FlatList` row reveal/card reveal and keep virtualization-friendly behavior by animating rows locally rather than wrapping the whole list in a large animated container.
3. Bring analytics closer to web parity by animating the KPI grid and chart sections, then adding an explicit empty/data crossfade.
4. Replace magic timing values in shared controls (`checkbox.tsx`, `progress-bar.tsx`, `modal.tsx`, and Lottie wrappers) with token aliases, and add offset/stagger tokens to the mobile motion token file.
5. Revisit `upload-batch.lottie`: either use it at a visually meaningful size in a dedicated upload-progress state or replace the 18 px submit-button usage with a lighter animated icon/spinner.
