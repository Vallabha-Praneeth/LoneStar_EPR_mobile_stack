# Codex Review: Mobile Animation Audit (READ-ONLY)

## Instructions
**DO NOT modify any files.** This is a review-only task. Read the code and produce a written report.

## Context
This is a React Native (Expo SDK 54) app using:
- `react-native-reanimated` for animations
- `moti` (Moti) for declarative animations
- `lottie-react-native` for Lottie JSON animations
- Custom motion tokens in `src/lib/motion/tokens.ts`
- Lottie catalog in `src/components/motion/lottie-catalog.ts`
- Animated empty states in `src/components/motion/empty-state-presets.ts`

## What to review

### 1. Animation consistency audit
Read ALL files in `src/features/` that contain animation code (Animated, motion, moti, reanimated, Lottie). For each screen, document:
- What animation library is used (reanimated, moti, or Lottie)
- What animations are present (entrance, exit, loading, empty state, interactions)
- Whether the motion tokens from `src/lib/motion/tokens.ts` are used or if there are hardcoded values
- Duration and easing consistency — are all screens using the same timing?

### 2. Missing animations
Compare against the web app's animation coverage. The web uses Framer Motion with fadeUp, fadeIn, scaleIn, stagger on every page. Check which mobile screens are missing entrance animations or feel static.

Screens to check:
- `src/features/admin/campaign-list-screen.tsx`
- `src/features/admin/reports-screen.tsx`
- `src/features/admin/analytics-screen.tsx`
- `src/features/admin/routes-screen.tsx`
- `src/features/admin/cost-types-screen.tsx`
- `src/features/admin/driver-detail-screen.tsx`
- `src/features/client/client-landing-screen.tsx`
- `src/features/client/timing-sheet-screen.tsx`
- `src/features/driver/upload-screen.tsx`
- `src/features/driver/upload-success-screen.tsx`

### 3. Lottie asset usage
- Are all Lottie assets in `src/components/motion/lottie-assets.ts` actually used?
- Are there empty states that should use Lottie but use static icons instead?
- Are Lottie animations sized appropriately (not too large for mobile)?

### 4. Performance concerns
- Any animations using `useNativeDriver: false` that could use `true`?
- Any heavy animations on mount that could cause jank on low-end devices?
- Any `Animated.loop` or infinite animations that don't clean up?

### 5. Parity with web
The web app has these motion patterns:
- Page entrance: fadeUp (opacity + translateY) with stagger
- KPI cards: gridStagger with cardReveal (opacity + scale + translateY)
- List items: listStagger with fadeUp
- Photo grid: scaleIn with gridStagger
- Loading states: pulse skeletons
- Exit animations: fast fadeOut

Document which of these patterns exist in mobile and which are missing.

## Output format
Produce a markdown report with:
1. **Summary table**: Screen name | Animations present | Library used | Uses tokens? | Rating (1-5)
2. **Missing animations**: List of screens that need work
3. **Hardcoded values**: Any magic numbers that should use motion tokens
4. **Performance flags**: Any concerns
5. **Recommendations**: Top 5 priority improvements (ordered by impact)

Save the report to `docs/animation-review.md`
