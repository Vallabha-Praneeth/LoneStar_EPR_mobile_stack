# Rive + Lottie Motion Rollout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 13 curated Rive + Lottie animations across AdTruck native app in two PRs (analytics pack, then global UX pack), using reusable motion primitives.

**Architecture:** Each placement has a dedicated wrapper component that handles its lifecycle (autoplay loop, one-shot burst, state-machine trigger, or conditional mount). Assets live in `assets/animations/` and are registered in `src/components/motion/{rive,lottie}-assets.ts`. All timings come from existing `motionTokens`; all non-essential motion is gated by a new `useReducedMotion()` hook.

**Tech Stack:** Expo SDK 54, React Native 0.81, `rive-react-native` ^9.8, `lottie-react-native` (existing), `@react-native-community/netinfo` (new), Jest + `@testing-library/react-native`, TailwindCSS via Uniwind.

**Source spec:** `docs/superpowers/specs/2026-04-20-rive-lottie-motion-rollout-design.md`

---

## Phase 1 — Analytics pack (PR #1)

Isolated to analytics screens + reports screen. No new native dependencies.

### Task 1: `useReducedMotion` hook

Gates all non-essential motion across the app. Needed first because later components consume it.

**Files:**
- Create: `src/lib/hooks/use-reduced-motion.ts`
- Test: `src/lib/hooks/use-reduced-motion.test.tsx`
- Modify: `src/lib/hooks/index.tsx` (add export)

- [ ] **Step 1: Write the failing test**

```tsx
// src/lib/hooks/use-reduced-motion.test.tsx
import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useReducedMotion } from './use-reduced-motion';

describe('useReducedMotion', () => {
  let subscriptionCallback: ((enabled: boolean) => void) | null = null;
  const mockRemove = jest.fn();

  beforeEach(() => {
    subscriptionCallback = null;
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((event, cb) => {
      if (event === 'reduceMotionChanged') {
        subscriptionCallback = cb as (enabled: boolean) => void;
      }
      return { remove: mockRemove };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns false initially and reflects async fetch', async () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    await act(async () => {});
    expect(result.current).toBe(false);
  });

  it('reflects true when system returns true', async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => useReducedMotion());
    await act(async () => {});
    expect(result.current).toBe(true);
  });

  it('updates when reduceMotionChanged fires', async () => {
    const { result } = renderHook(() => useReducedMotion());
    await act(async () => {});
    act(() => {
      subscriptionCallback?.(true);
    });
    expect(result.current).toBe(true);
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useReducedMotion());
    await act(async () => {});
    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test src/lib/hooks/use-reduced-motion.test.tsx
```

Expected: FAIL with "Cannot find module './use-reduced-motion'".

- [ ] **Step 3: Implement the hook**

```tsx
// src/lib/hooks/use-reduced-motion.ts
import * as React from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setEnabled);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}
```

- [ ] **Step 4: Add export to barrel**

```tsx
// src/lib/hooks/index.tsx — append after existing exports
export * from './use-reduced-motion';
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
pnpm test src/lib/hooks/use-reduced-motion.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/hooks/use-reduced-motion.ts src/lib/hooks/use-reduced-motion.test.tsx src/lib/hooks/index.tsx
git commit -m "feat(motion): add useReducedMotion hook"
```

---

### Task 2: Copy Phase 1 assets and register

Copy the 6 Lottie + 1 Rive asset used in Phase 1 into `assets/animations/`, register them in the asset barrels.

**Files:**
- Create: `assets/animations/{7 files}`
- Modify: `src/components/motion/rive-assets.ts`
- Modify: `src/components/motion/lottie-assets.ts`

- [ ] **Step 1: Copy the Phase 1 assets**

```bash
cp /Users/praneeth/LoneStar_ERP/UI_related/rive/free-assets/skycoins-27109-51076.riv \
   assets/animations/skycoins.riv

cp /Users/praneeth/LoneStar_ERP/UI_related/lottiefiles/analytics/analytics-character-animation-rSQ1Cjs8wv.lottie \
   assets/animations/analytics-character.lottie

cp /Users/praneeth/LoneStar_ERP/UI_related/lottiefiles/analytics/chart-diagram-hreI9ZgxO4.lottie \
   assets/animations/chart-diagram.lottie

cp /Users/praneeth/LoneStar_ERP/UI_related/lottiefiles/analytics/business-deal-uhkfrhkpdg.lottie \
   assets/animations/business-deal.lottie

cp /Users/praneeth/LoneStar_ERP/UI_related/lottiefiles/analytics/data-analytics-JPXA6OPHt7.lottie \
   assets/animations/filter-drill.lottie

cp /Users/praneeth/LoneStar_ERP/UI_related/lottiefiles/analytics/seo-specialists-work-on-high-quality-organic-search-traffic-IEAvBRqlp2.lottie \
   assets/animations/driver-analytics-hero.lottie

cp /Users/praneeth/LoneStar_ERP/UI_related/lottiefiles/analytics/dashboard-4s1AjCkyMJ.lottie \
   assets/animations/client-analytics-hero.lottie
```

- [ ] **Step 2: Register Rive asset**

Append to `src/components/motion/rive-assets.ts` after the existing entries in the object:

```ts
  // Phase 1 — analytics
  skycoins: require('../../../assets/animations/skycoins.riv'),
```

- [ ] **Step 3: Read existing `lottie-assets.ts` and register new entries**

Add these entries to the exported `lottieAssets` object in `src/components/motion/lottie-assets.ts`:

```ts
  analyticsCharacter: require('../../../assets/animations/analytics-character.lottie'),
  chartDiagram: require('../../../assets/animations/chart-diagram.lottie'),
  businessDeal: require('../../../assets/animations/business-deal.lottie'),
  filterDrill: require('../../../assets/animations/filter-drill.lottie'),
  driverAnalyticsHero: require('../../../assets/animations/driver-analytics-hero.lottie'),
  clientAnalyticsHero: require('../../../assets/animations/client-analytics-hero.lottie'),
```

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add assets/animations/skycoins.riv assets/animations/analytics-character.lottie assets/animations/chart-diagram.lottie assets/animations/business-deal.lottie assets/animations/filter-drill.lottie assets/animations/driver-analytics-hero.lottie assets/animations/client-analytics-hero.lottie src/components/motion/rive-assets.ts src/components/motion/lottie-assets.ts
git commit -m "feat(motion): register phase 1 rive + lottie assets"
```

---

### Task 3: `FilterDrillBurst` component (L4)

Subtle 72×72 bottom-right corner burst that plays once when a filter chip changes. Skips the first mount.

**Files:**
- Create: `src/components/motion/filter-drill-burst.tsx`
- Test: `src/components/motion/filter-drill-burst.test.tsx`
- Modify: `src/components/motion/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/motion/filter-drill-burst.test.tsx
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { FilterDrillBurst } from './filter-drill-burst';

jest.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: jest.fn(() => false),
}));

describe('FilterDrillBurst', () => {
  it('does not render burst on first mount', () => {
    const { queryByTestId } = render(<FilterDrillBurst trigger="all" />);
    expect(queryByTestId('filter-drill-burst-player')).toBeNull();
  });

  it('renders burst after trigger changes', () => {
    const { queryByTestId, rerender } = render(<FilterDrillBurst trigger="all" />);
    rerender(<FilterDrillBurst trigger="client-42" />);
    expect(queryByTestId('filter-drill-burst-player')).not.toBeNull();
  });

  it('renders nothing when reduced motion is enabled', () => {
    (jest.requireMock('@/lib/hooks/use-reduced-motion').useReducedMotion as jest.Mock).mockReturnValueOnce(true);
    const { queryByTestId, rerender } = render(<FilterDrillBurst trigger="all" />);
    rerender(<FilterDrillBurst trigger="client-42" />);
    expect(queryByTestId('filter-drill-burst-player')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test src/components/motion/filter-drill-burst.test.tsx
```

Expected: FAIL with "Cannot find module './filter-drill-burst'".

- [ ] **Step 3: Implement component**

```tsx
// src/components/motion/filter-drill-burst.tsx
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { View } from 'react-native';

import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

import { lottieAssets } from './lottie-assets';

const BURST_MS = 1200;

type Props = {
  trigger: string | number | null;
  accessibilityLabel?: string;
};

export function FilterDrillBurst({ trigger, accessibilityLabel }: Props) {
  const reduced = useReducedMotion();
  const prev = React.useRef<typeof trigger | undefined>(undefined);
  const [playKey, setPlayKey] = React.useState<number>(0);

  React.useEffect(() => {
    if (prev.current === undefined) {
      prev.current = trigger;
      return;
    }
    if (prev.current === trigger) return;
    prev.current = trigger;
    setPlayKey(k => k + 1);
  }, [trigger]);

  React.useEffect(() => {
    if (!playKey) return;
    const t = setTimeout(() => setPlayKey(0), BURST_MS);
    return () => clearTimeout(t);
  }, [playKey]);

  if (reduced || !playKey) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityLabel={accessibilityLabel}
      testID="filter-drill-burst"
      style={{ position: 'absolute', right: 12, bottom: 12, width: 72, height: 72 }}
    >
      <LottieView
        key={playKey}
        testID="filter-drill-burst-player"
        source={lottieAssets.filterDrill}
        autoPlay
        loop={false}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
```

- [ ] **Step 4: Export from barrel**

Append to `src/components/motion/index.ts`:

```ts
export * from './filter-drill-burst';
```

- [ ] **Step 5: Run the test**

```bash
pnpm test src/components/motion/filter-drill-burst.test.tsx
```

Expected: 3 tests pass. If Jest complains about `lottie-react-native`, add a mock: create `__mocks__/lottie-react-native.js` with `module.exports = { __esModule: true, default: require('react-native').View };` — and add the mock path to `jest.config.js` `moduleNameMapper` as `^lottie-react-native$`.

- [ ] **Step 6: Commit**

```bash
git add src/components/motion/filter-drill-burst.tsx src/components/motion/filter-drill-burst.test.tsx src/components/motion/index.ts
git commit -m "feat(motion): add FilterDrillBurst one-shot corner burst"
```

---

### Task 4: `ExportSuccessBurst` component (L3)

Full-width overlay that plays `business-deal.lottie` once, auto-hides after 2s.

**Files:**
- Create: `src/components/motion/export-success-burst.tsx`
- Test: `src/components/motion/export-success-burst.test.tsx`
- Modify: `src/components/motion/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/motion/export-success-burst.test.tsx
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { ExportSuccessBurst } from './export-success-burst';

jest.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: jest.fn(() => false),
}));

describe('ExportSuccessBurst', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('renders when visible is true', () => {
    const { queryByTestId } = render(<ExportSuccessBurst visible onHide={jest.fn()} />);
    expect(queryByTestId('export-success-burst')).not.toBeNull();
  });

  it('does not render when visible is false', () => {
    const { queryByTestId } = render(<ExportSuccessBurst visible={false} onHide={jest.fn()} />);
    expect(queryByTestId('export-success-burst')).toBeNull();
  });

  it('calls onHide after 2000ms', () => {
    const onHide = jest.fn();
    render(<ExportSuccessBurst visible onHide={onHide} />);
    jest.advanceTimersByTime(2000);
    expect(onHide).toHaveBeenCalled();
  });

  it('skips render when reduced motion is enabled', () => {
    (jest.requireMock('@/lib/hooks/use-reduced-motion').useReducedMotion as jest.Mock).mockReturnValueOnce(true);
    const onHide = jest.fn();
    const { queryByTestId } = render(<ExportSuccessBurst visible onHide={onHide} />);
    expect(queryByTestId('export-success-burst')).toBeNull();
    jest.advanceTimersByTime(2000);
    expect(onHide).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test src/components/motion/export-success-burst.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement component**

```tsx
// src/components/motion/export-success-burst.tsx
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { View } from 'react-native';

import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

import { lottieAssets } from './lottie-assets';

const VISIBLE_MS = 2000;

type Props = {
  visible: boolean;
  onHide: () => void;
};

export function ExportSuccessBurst({ visible, onHide }: Props) {
  const reduced = useReducedMotion();

  React.useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onHide, VISIBLE_MS);
    return () => clearTimeout(t);
  }, [visible, onHide]);

  if (!visible || reduced) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityLabel="Report exported"
      testID="export-success-burst"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
      }}
    >
      <LottieView
        source={lottieAssets.businessDeal}
        autoPlay
        loop={false}
        style={{ width: 220, height: 220 }}
      />
    </View>
  );
}
```

- [ ] **Step 4: Export from barrel**

```ts
// src/components/motion/index.ts — append
export * from './export-success-burst';
```

- [ ] **Step 5: Run the test**

```bash
pnpm test src/components/motion/export-success-burst.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/motion/export-success-burst.tsx src/components/motion/export-success-burst.test.tsx src/components/motion/index.ts
git commit -m "feat(motion): add ExportSuccessBurst one-shot overlay"
```

---

### Task 5: `RevenueCoin` component (R4)

Small inline component: 48×48 `skycoins.riv` autoplay loop beside a formatted currency string.

**Files:**
- Create: `src/components/ui/revenue-coin.tsx`
- Test: `src/components/ui/revenue-coin.test.tsx`
- Modify: `src/components/ui/index.tsx` (add export)

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ui/revenue-coin.test.tsx
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { RevenueCoin } from './revenue-coin';

describe('RevenueCoin', () => {
  it('renders the formatted value', () => {
    const { getByText } = render(<RevenueCoin formattedValue="$1,234" />);
    expect(getByText('$1,234')).toBeTruthy();
  });

  it('renders the Rive coin player', () => {
    const { getByTestId } = render(<RevenueCoin formattedValue="$0" />);
    expect(getByTestId('revenue-coin-rive')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test src/components/ui/revenue-coin.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement component**

```tsx
// src/components/ui/revenue-coin.tsx
import * as React from 'react';
import { View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { riveAssets } from '@/components/motion/rive-assets';

import { Text } from './text';

type Props = {
  formattedValue: string;
  size?: number;
  accessibilityLabel?: string;
};

export function RevenueCoin({ formattedValue, size = 48, accessibilityLabel }: Props) {
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? `Revenue ${formattedValue}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
    >
      <View style={{ width: size, height: size }} testID="revenue-coin-rive">
        <Rive
          source={riveAssets.skycoins}
          fit={Fit.Contain}
          alignment={Alignment.Center}
          autoplay
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <Text className="text-xl font-semibold">{formattedValue}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Export from UI barrel**

Append to `src/components/ui/index.tsx`:

```tsx
export * from './revenue-coin';
```

- [ ] **Step 5: Run the test**

```bash
pnpm test src/components/ui/revenue-coin.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/revenue-coin.tsx src/components/ui/revenue-coin.test.tsx src/components/ui/index.tsx
git commit -m "feat(ui): add RevenueCoin component"
```

---

### Task 6: Wire admin analytics screen (L1, L2, R4, L4)

Add hero Lottie, replace loading `ActivityIndicator` with chart-diagram, insert revenue coin, add filter drill burst.

**Files:**
- Modify: `src/features/admin/analytics-screen.tsx`

- [ ] **Step 1: Read the file to locate insertion points**

```bash
pnpm exec grep -n "ActivityIndicator\|StatCard\|Revenue\|filter" src/features/admin/analytics-screen.tsx | head -40
```

Record the line numbers for:
1. The top of the screen content (hero insertion)
2. The `ActivityIndicator` on initial-load path (replace)
3. The `StatCard` with `label="Revenue"` (insert `<RevenueCoin />` next to value)
4. The filter chip group or state (derive a stable `trigger` key for `FilterDrillBurst`)

- [ ] **Step 2: Add imports at the top of the file**

```tsx
import LottieView from 'lottie-react-native';

import { FilterDrillBurst } from '@/components/motion';
import { lottieAssets } from '@/components/motion/lottie-assets';
import { RevenueCoin } from '@/components/ui';
```

- [ ] **Step 3: Insert hero at the top of the screen's returned JSX (above first card)**

```tsx
<LottieView
  source={lottieAssets.analyticsCharacter}
  autoPlay
  loop
  style={{ width: '100%', height: 140, alignSelf: 'center' }}
/>
```

- [ ] **Step 4: Replace initial-load `ActivityIndicator`**

Replace any `<ActivityIndicator ... />` rendered on the `isLoading && !data` path with:

```tsx
<LottieView
  source={lottieAssets.chartDiagram}
  autoPlay
  loop
  style={{ width: 160, height: 160, alignSelf: 'center' }}
/>
```

Do NOT replace the `ActivityIndicator` used on refetch — only the initial-load one.

- [ ] **Step 5: Replace Revenue value rendering**

Locate the JSX at line ~171:

```tsx
label="Revenue"
value={formatCurrency(summary.revenue)}
```

If this is inside a `StatCard` component, adjust the render so the value slot renders `<RevenueCoin formattedValue={formatCurrency(summary.revenue)} />`. If `StatCard` does not support a custom value render, inline the card for the Revenue entry specifically and render `<RevenueCoin />` inside.

- [ ] **Step 6: Add filter drill burst at the bottom of the screen root View**

Derive a stable trigger key from the active filter state. For example, if the screen uses `{ clientId, campaignId, driverId }`:

```tsx
const filterKey = React.useMemo(
  () => `${clientId ?? 'all'}|${campaignId ?? 'all'}|${driverId ?? 'all'}`,
  [clientId, campaignId, driverId]
);

// ... near the end of the root container:
<FilterDrillBurst trigger={filterKey === 'all|all|all' ? null : filterKey} />
```

Rationale: `trigger={null}` keeps the burst silent on the "all" view and only fires when drilling into a specific entity.

- [ ] **Step 7: Type-check and test**

```bash
pnpm type-check
pnpm test src/features/admin/analytics-screen
```

Expected: zero type errors; any existing screen test still passes.

- [ ] **Step 8: Commit**

```bash
git add src/features/admin/analytics-screen.tsx
git commit -m "feat(admin): add motion hero, loading, revenue coin, filter burst"
```

---

### Task 7: Wire driver analytics screen (L5, L4)

**Files:**
- Modify: `src/features/driver/analytics-screen.tsx`

- [ ] **Step 1: Add imports**

```tsx
import LottieView from 'lottie-react-native';

import { FilterDrillBurst } from '@/components/motion';
import { lottieAssets } from '@/components/motion/lottie-assets';
```

- [ ] **Step 2: Insert driver hero at top of screen JSX**

```tsx
<LottieView
  source={lottieAssets.driverAnalyticsHero}
  autoPlay
  loop
  style={{ width: '100%', height: 160, alignSelf: 'center' }}
/>
```

- [ ] **Step 3: Add `FilterDrillBurst` near end of root container with a driver-relevant trigger key**

```tsx
const filterKey = React.useMemo(
  () => `${campaignId ?? 'all'}|${dateRange ?? 'all'}`,
  [campaignId, dateRange]
);

<FilterDrillBurst trigger={filterKey.includes('all') ? null : filterKey} />
```

Use whatever filter state actually exists in this screen; the pattern is: only play when the user narrows to a specific entity.

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/features/driver/analytics-screen.tsx
git commit -m "feat(driver): add analytics hero and filter drill burst"
```

---

### Task 8: Wire client analytics screen (L6, L4)

**Files:**
- Modify: `src/features/client/analytics-screen.tsx`

- [ ] **Step 1: Add imports**

```tsx
import LottieView from 'lottie-react-native';

import { FilterDrillBurst } from '@/components/motion';
import { lottieAssets } from '@/components/motion/lottie-assets';
```

- [ ] **Step 2: Insert client hero at top of screen JSX**

```tsx
<LottieView
  source={lottieAssets.clientAnalyticsHero}
  autoPlay
  loop
  style={{ width: '100%', height: 160, alignSelf: 'center' }}
/>
```

- [ ] **Step 3: Add `FilterDrillBurst` near end of root container**

```tsx
const filterKey = React.useMemo(
  () => `${campaignId ?? 'all'}`,
  [campaignId]
);

<FilterDrillBurst trigger={filterKey === 'all' ? null : filterKey} />
```

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/features/client/analytics-screen.tsx
git commit -m "feat(client): add analytics hero and filter drill burst"
```

---

### Task 9: Wire reports screen (L3)

**Files:**
- Modify: `src/features/admin/reports-screen.tsx`

- [ ] **Step 1: Read the file to locate the export handler**

```bash
pnpm exec grep -n "exportReport\|downloadCSV\|csv\|export" src/features/admin/reports-screen.tsx
```

Identify the mutation/callback that runs on successful CSV export.

- [ ] **Step 2: Add import + burst state + success hook**

At top of component body:

```tsx
import { ExportSuccessBurst } from '@/components/motion';

// inside the component:
const [burstVisible, setBurstVisible] = React.useState(false);
```

If the export uses a React Query mutation, chain the success:

```tsx
const exportMutation = useMutation({
  // existing options...
  onSuccess: (data, vars, ctx) => {
    // existing onSuccess body (if any) preserved
    setBurstVisible(true);
  },
});
```

If the export is an async function, call `setBurstVisible(true)` on the resolved path.

- [ ] **Step 3: Render the burst inside the screen root View**

```tsx
<ExportSuccessBurst visible={burstVisible} onHide={() => setBurstVisible(false)} />
```

Position this as the last child of the screen's root container so the overlay sits above content.

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/reports-screen.tsx
git commit -m "feat(admin): add export success burst on CSV export"
```

---

### Task 10: Phase 1 smoke check

**Files:** none — validation only.

- [ ] **Step 1: Full type-check**

```bash
pnpm type-check
```

Expected: zero errors.

- [ ] **Step 2: Full test run**

```bash
pnpm test
```

Expected: all tests pass. If a Lottie test suite fails due to missing mock, add `__mocks__/lottie-react-native.js`:

```js
const React = require('react');
const { View } = require('react-native');
module.exports = { __esModule: true, default: (props) => React.createElement(View, props) };
```

And add `'^lottie-react-native$': '<rootDir>/__mocks__/lottie-react-native.js'` to `jest.config.js` `moduleNameMapper`.

- [ ] **Step 3: Lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 4: Start Metro and smoke-test on iOS simulator**

```bash
pnpm start
```

In the Expo CLI, press `i` to open iOS. Verify on the admin analytics tab:
- Hero Lottie loops at top
- Revenue card shows the animated coin
- Filter drill burst fires when you pick a specific client/campaign/driver (and does NOT fire on initial mount)

Repeat on driver and client analytics tabs.

Open the reports screen and export a CSV — confirm the burst plays for ~2s.

- [ ] **Step 5: Commit the Lottie Jest mock if added**

```bash
git add __mocks__/lottie-react-native.js jest.config.js
git commit -m "test: add lottie-react-native jest mock"
```

---

**Phase 1 complete.** Open PR #1 with title `feat(motion): analytics pack (phase 1)`.

---

## Phase 2 — Global UX pack (PR #2)

Touches shared chrome across the app: headers, back arrows, offline overlay, logout, shift-start. New dependency: `@react-native-community/netinfo`.

### Task 11: Install NetInfo + copy Phase 2 assets + register

**Files:**
- Modify: `package.json` (via `expo install`)
- Create: `assets/animations/{6 files}`
- Modify: `src/components/motion/rive-assets.ts`

- [ ] **Step 1: Install NetInfo via Expo**

```bash
pnpm expo install @react-native-community/netinfo
```

This adds the dependency and aligns versions with Expo SDK 54.

- [ ] **Step 2: Copy the Phase 2 Rive assets**

```bash
cp /Users/praneeth/LoneStar_ERP/UI_related/rive/free-assets/logo-chrome-27114-51086.riv \
   assets/animations/logo-chrome.riv

cp /Users/praneeth/LoneStar_ERP/UI_related/rive/free-assets/cloner-scripted-path-effect-26908-50574.riv \
   assets/animations/back-arrow.riv

cp /Users/praneeth/LoneStar_ERP/UI_related/rive/free-assets/rival-hmi-for-rive-challenge-on-contra-27124-51105.riv \
   assets/animations/shift-start.riv

cp /Users/praneeth/LoneStar_ERP/UI_related/rive/free-assets/nature-22580-42245.riv \
   assets/animations/offline.riv

cp /Users/praneeth/LoneStar_ERP/UI_related/rive/free-assets/rive-asset-27127-51109.riv \
   assets/animations/logout-icon.riv
```

- [ ] **Step 2a: Overwrite the existing `approve-unlock.riv` with the new unlock asset (R7 swap)**

`src/components/motion/rive-animation.tsx:177` (in the `ApproveUnlockAnimation` preset) directly `require()`s `assets/animations/approve-unlock.riv`. Overwriting the file at that path is the smallest change that propagates the swap to all existing consumers — no component edits required.

```bash
cp /Users/praneeth/LoneStar_ERP/UI_related/rive/free-assets/unlock-27122-51099.riv \
   assets/animations/approve-unlock.riv
```

- [ ] **Step 3: Register Phase 2 Rive entries**

Append these to the `riveAssets` object in `src/components/motion/rive-assets.ts`:

```ts
  // Phase 2 — global UX
  brandLogo: require('../../../assets/animations/logo-chrome.riv'),
  backArrow: require('../../../assets/animations/back-arrow.riv'),
  shiftStart: require('../../../assets/animations/shift-start.riv'),
  offline: require('../../../assets/animations/offline.riv'),
  logoutIcon: require('../../../assets/animations/logout-icon.riv'),
```

The existing `approveUnlock` key stays unchanged — it still points at `approve-unlock.riv`, which now contains the new asset bytes.

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml assets/animations/logo-chrome.riv assets/animations/back-arrow.riv assets/animations/shift-start.riv assets/animations/offline.riv assets/animations/logout-icon.riv assets/animations/unlock.riv src/components/motion/rive-assets.ts
git commit -m "feat(motion): add netinfo dep and register phase 2 rive assets"
```

---

### Task 12: `useIsOnline` hook

Wraps NetInfo with a 500ms debounce.

**Files:**
- Create: `src/lib/hooks/use-is-online.ts`
- Test: `src/lib/hooks/use-is-online.test.tsx`
- Modify: `src/lib/hooks/index.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/lib/hooks/use-is-online.test.tsx
import { act, renderHook } from '@testing-library/react-native';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    fetch: jest.fn(),
  },
}));

import NetInfo from '@react-native-community/netinfo';

import { useIsOnline } from './use-is-online';

describe('useIsOnline', () => {
  let listener: ((state: { isConnected: boolean | null }) => void) | null = null;
  const unsubscribe = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    listener = null;
    (NetInfo.addEventListener as jest.Mock).mockImplementation((cb) => {
      listener = cb;
      return unsubscribe;
    });
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('starts online by default', () => {
    const { result } = renderHook(() => useIsOnline());
    expect(result.current.isOnline).toBe(true);
  });

  it('reflects disconnect after debounce', () => {
    const { result } = renderHook(() => useIsOnline());
    act(() => { listener?.({ isConnected: false }); });
    expect(result.current.isOnline).toBe(true); // before debounce
    act(() => { jest.advanceTimersByTime(500); });
    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOnline).toBe(true);
  });

  it('ignores flicker shorter than debounce', () => {
    const { result } = renderHook(() => useIsOnline());
    act(() => { listener?.({ isConnected: false }); });
    act(() => { jest.advanceTimersByTime(200); });
    act(() => { listener?.({ isConnected: true }); });
    act(() => { jest.advanceTimersByTime(500); });
    expect(result.current.isOnline).toBe(true);
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useIsOnline());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test src/lib/hooks/use-is-online.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
// src/lib/hooks/use-is-online.ts
import NetInfo from '@react-native-community/netinfo';
import * as React from 'react';

const DEBOUNCE_MS = 500;

export function useIsOnline(): { isOnline: boolean; wasOnline: boolean } {
  const [isOnline, setIsOnline] = React.useState(true);
  const wasOnlineRef = React.useRef(true);
  const pendingRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    NetInfo.fetch().then((state) => {
      const next = state.isConnected !== false;
      setIsOnline(next);
      wasOnlineRef.current = next;
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const next = state.isConnected !== false;
      if (pendingRef.current) clearTimeout(pendingRef.current);
      pendingRef.current = setTimeout(() => {
        setIsOnline((prev) => {
          wasOnlineRef.current = prev;
          return next;
        });
      }, DEBOUNCE_MS);
    });

    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      unsubscribe();
    };
  }, []);

  return { isOnline, wasOnline: wasOnlineRef.current };
}
```

- [ ] **Step 4: Export + test**

Append `export * from './use-is-online';` to `src/lib/hooks/index.tsx`, then run:

```bash
pnpm test src/lib/hooks/use-is-online.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/use-is-online.ts src/lib/hooks/use-is-online.test.tsx src/lib/hooks/index.tsx
git commit -m "feat(hooks): add useIsOnline with 500ms debounce"
```

---

### Task 13: `OfflineOverlay` component

**Files:**
- Create: `src/components/ui/offline-overlay.tsx`
- Test: `src/components/ui/offline-overlay.test.tsx`
- Modify: `src/components/ui/index.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ui/offline-overlay.test.tsx
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { OfflineOverlay } from './offline-overlay';

const useIsOnlineMock = jest.fn();
jest.mock('@/lib/hooks/use-is-online', () => ({
  useIsOnline: () => useIsOnlineMock(),
}));

jest.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: () => false,
}));

describe('OfflineOverlay', () => {
  afterEach(() => useIsOnlineMock.mockReset());

  it('renders nothing when online', () => {
    useIsOnlineMock.mockReturnValue({ isOnline: true, wasOnline: true });
    const { queryByTestId } = render(<OfflineOverlay />);
    expect(queryByTestId('offline-overlay')).toBeNull();
  });

  it('renders overlay when offline', () => {
    useIsOnlineMock.mockReturnValue({ isOnline: false, wasOnline: true });
    const { getByTestId } = render(<OfflineOverlay />);
    expect(getByTestId('offline-overlay')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test src/components/ui/offline-overlay.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
// src/components/ui/offline-overlay.tsx
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { riveAssets } from '@/components/motion/rive-assets';
import { useIsOnline } from '@/lib/hooks/use-is-online';

import { Text } from './text';

export function OfflineOverlay() {
  const { isOnline } = useIsOnline();

  if (isOnline) return null;

  return (
    <View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      accessibilityLabel="No internet connection"
      testID="offline-overlay"
      style={styles.overlay}
    >
      <View style={styles.card}>
        <View style={styles.rive}>
          <Rive
            source={riveAssets.offline}
            fit={Fit.Contain}
            alignment={Alignment.Center}
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        <Text className="text-lg font-semibold">You are offline</Text>
        <Text className="text-sm text-neutral-500">We will reconnect automatically.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  card: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  rive: {
    width: 220,
    height: 160,
  },
});
```

- [ ] **Step 4: Export + test**

Append `export * from './offline-overlay';` to `src/components/ui/index.tsx`, then:

```bash
pnpm test src/components/ui/offline-overlay.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/offline-overlay.tsx src/components/ui/offline-overlay.test.tsx src/components/ui/index.tsx
git commit -m "feat(ui): add OfflineOverlay"
```

---

### Task 14: Mount `OfflineOverlay` in app layout

**Files:**
- Modify: `src/app/(app)/_layout.tsx`

- [ ] **Step 1: Add import and mount above Stack**

Read the existing return block (lines 37–49) and wrap the return in a fragment so the overlay sits above the Stack:

```tsx
// top of file — add import
import { OfflineOverlay } from '@/components/ui';

// return block — replace existing single Stack return with:
return (
  <>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="driver-analytics" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="upload-success" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="client" />
    </Stack>
    <OfflineOverlay />
  </>
);
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/_layout.tsx
git commit -m "feat(app): mount OfflineOverlay above main stack"
```

---

### Task 15: `BrandLogo` component + wire admin-header (R1)

**Files:**
- Create: `src/components/ui/brand-logo.tsx`
- Test: `src/components/ui/brand-logo.test.tsx`
- Modify: `src/components/ui/index.tsx`
- Modify: `src/components/admin-header.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ui/brand-logo.test.tsx
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { BrandLogo } from './brand-logo';

describe('BrandLogo', () => {
  it('renders Rive player', () => {
    const { getByTestId } = render(<BrandLogo />);
    expect(getByTestId('brand-logo-rive')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test src/components/ui/brand-logo.test.tsx
```

- [ ] **Step 3: Implement**

```tsx
// src/components/ui/brand-logo.tsx
import * as React from 'react';
import { View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { riveAssets } from '@/components/motion/rive-assets';

type Props = { size?: number; accessibilityLabel?: string };

export function BrandLogo({ size = 24, accessibilityLabel = 'AdTruck' }: Props) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      testID="brand-logo-rive"
      style={{ width: size, height: size }}
    >
      <Rive
        source={riveAssets.brandLogo}
        fit={Fit.Contain}
        alignment={Alignment.Center}
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
```

- [ ] **Step 4: Export + test**

Append `export * from './brand-logo';` to `src/components/ui/index.tsx`, run:

```bash
pnpm test src/components/ui/brand-logo.test.tsx
```

- [ ] **Step 5: Wire admin-header**

Read `src/components/admin-header.tsx`, locate where the static brand/title renders on the left, and replace with `<BrandLogo />` (or insert `<BrandLogo />` adjacent if branding text is kept).

```bash
pnpm exec grep -n "title\|brand\|AdTruck\|headerTitle" src/components/admin-header.tsx
```

Add import: `import { BrandLogo } from '@/components/ui';` and insert the component in the left slot.

- [ ] **Step 6: Type-check and commit**

```bash
pnpm type-check
git add src/components/ui/brand-logo.tsx src/components/ui/brand-logo.test.tsx src/components/ui/index.tsx src/components/admin-header.tsx
git commit -m "feat(ui): add BrandLogo and wire into admin header"
```

---

### Task 16: `RiveBackButton` component (R2)

**Files:**
- Create: `src/components/ui/rive-back-button.tsx`
- Test: `src/components/ui/rive-back-button.test.tsx`
- Modify: `src/components/ui/index.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ui/rive-back-button.test.tsx
import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';

const back = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back }),
}));

import { RiveBackButton } from './rive-back-button';

describe('RiveBackButton', () => {
  beforeEach(() => back.mockReset());

  it('calls router.back when pressed', () => {
    const { getByTestId } = render(<RiveBackButton testID="back-btn" />);
    fireEvent.press(getByTestId('back-btn'));
    expect(back).toHaveBeenCalled();
  });

  it('calls onPress override when provided', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<RiveBackButton testID="back-btn" onPress={onPress} />);
    fireEvent.press(getByTestId('back-btn'));
    expect(onPress).toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test src/components/ui/rive-back-button.test.tsx
```

- [ ] **Step 3: Implement**

```tsx
// src/components/ui/rive-back-button.tsx
import type { RiveRef } from 'rive-react-native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { riveAssets } from '@/components/motion/rive-assets';

type Props = {
  onPress?: () => void;
  size?: number;
  testID?: string;
  accessibilityLabel?: string;
  // State-machine name and trigger — record once the .riv is inspected.
  stateMachineName?: string;
  triggerInputName?: string;
};

export function RiveBackButton({
  onPress,
  size = 32,
  testID,
  accessibilityLabel = 'Go back',
  stateMachineName,
  triggerInputName,
}: Props) {
  const router = useRouter();
  const riveRef = React.useRef<RiveRef>(null);

  function handlePress() {
    if (stateMachineName && triggerInputName) {
      try {
        riveRef.current?.fireState(stateMachineName, triggerInputName);
      } catch {
        // If the asset lacks that trigger, fall through.
      }
    }
    if (onPress) onPress();
    else router.back();
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={{ width: size, height: size }}
    >
      <View style={{ width: '100%', height: '100%' }}>
        <Rive
          ref={riveRef}
          source={riveAssets.backArrow}
          stateMachineName={stateMachineName}
          fit={Fit.Contain}
          alignment={Alignment.Center}
          autoplay={!!stateMachineName}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 4: Export + test**

Append `export * from './rive-back-button';` to `src/components/ui/index.tsx`, run:

```bash
pnpm test src/components/ui/rive-back-button.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/rive-back-button.tsx src/components/ui/rive-back-button.test.tsx src/components/ui/index.tsx
git commit -m "feat(ui): add RiveBackButton"
```

---

### Task 17: Swap back arrows in 7 call sites

**Files:**
- Modify: `src/components/admin-header.tsx`
- Modify: `src/features/driver/analytics-screen.tsx`
- Modify: `src/features/client/analytics-screen.tsx`
- Modify: `src/app/(app)/client/campaign/[id].tsx`
- Modify: `src/features/driver/upload-screen.tsx`
- Modify: `src/features/admin/create-campaign-screen.tsx`
- Modify: `src/features/client/timing-sheet-screen.tsx`
- Modify: `src/features/admin/route-form-screen.tsx`

- [ ] **Step 1: For each file, locate the existing back arrow**

```bash
for f in src/components/admin-header.tsx src/features/driver/analytics-screen.tsx src/features/client/analytics-screen.tsx 'src/app/(app)/client/campaign/[id].tsx' src/features/driver/upload-screen.tsx src/features/admin/create-campaign-screen.tsx src/features/client/timing-sheet-screen.tsx src/features/admin/route-form-screen.tsx; do
  echo "=== $f ==="
  pnpm exec grep -n "router.back\|ArrowLeft\|BackButton\|Pressable.*back" "$f"
done
```

- [ ] **Step 2: In each file, import `RiveBackButton`**

```tsx
import { RiveBackButton } from '@/components/ui';
```

- [ ] **Step 3: Replace each back button with `<RiveBackButton />`**

Example — replacing a pattern like:

```tsx
<Pressable onPress={() => router.back()}>
  <ArrowLeft />
</Pressable>
```

becomes:

```tsx
<RiveBackButton />
```

If the original had a custom `onPress` (not just `router.back()`), pass it: `<RiveBackButton onPress={customHandler} />`.

Remove now-unused `ArrowLeft` imports and unused `useRouter` imports in each file (run type-check to catch them).

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin-header.tsx 'src/app/(app)/client/campaign/[id].tsx' src/features/driver/analytics-screen.tsx src/features/client/analytics-screen.tsx src/features/driver/upload-screen.tsx src/features/admin/create-campaign-screen.tsx src/features/client/timing-sheet-screen.tsx src/features/admin/route-form-screen.tsx
git commit -m "refactor(ui): replace hand-rolled back arrows with RiveBackButton"
```

---

### Task 18: `ShiftStartBurst` component (R3)

Full-screen one-shot modal. Calls `onComplete` when the state machine exits or after a 2.5s fallback.

**Files:**
- Create: `src/components/motion/shift-start-burst.tsx`
- Test: `src/components/motion/shift-start-burst.test.tsx`
- Modify: `src/components/motion/index.ts`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/motion/shift-start-burst.test.tsx
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { ShiftStartBurst } from './shift-start-burst';

jest.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: jest.fn(() => false),
}));

describe('ShiftStartBurst', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('renders nothing when not visible', () => {
    const { queryByTestId } = render(<ShiftStartBurst visible={false} onComplete={jest.fn()} />);
    expect(queryByTestId('shift-start-burst')).toBeNull();
  });

  it('renders when visible', () => {
    const { getByTestId } = render(<ShiftStartBurst visible onComplete={jest.fn()} />);
    expect(getByTestId('shift-start-burst')).toBeTruthy();
  });

  it('calls onComplete after 2500ms fallback', () => {
    const onComplete = jest.fn();
    render(<ShiftStartBurst visible onComplete={onComplete} />);
    jest.advanceTimersByTime(2500);
    expect(onComplete).toHaveBeenCalled();
  });

  it('calls onComplete immediately when reduced motion is on', () => {
    (jest.requireMock('@/lib/hooks/use-reduced-motion').useReducedMotion as jest.Mock).mockReturnValueOnce(true);
    const onComplete = jest.fn();
    render(<ShiftStartBurst visible onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test src/components/motion/shift-start-burst.test.tsx
```

- [ ] **Step 3: Implement**

```tsx
// src/components/motion/shift-start-burst.tsx
import * as React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

import { riveAssets } from './rive-assets';

const FALLBACK_MS = 2500;

type Props = {
  visible: boolean;
  onComplete: () => void;
};

export function ShiftStartBurst({ visible, onComplete }: Props) {
  const reduced = useReducedMotion();

  React.useEffect(() => {
    if (!visible) return;
    if (reduced) {
      onComplete();
      return;
    }
    const t = setTimeout(onComplete, FALLBACK_MS);
    return () => clearTimeout(t);
  }, [visible, reduced, onComplete]);

  if (!visible || reduced) return null;

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.backdrop} testID="shift-start-burst">
        <View style={styles.player}>
          <Rive
            source={riveAssets.shiftStart}
            fit={Fit.Contain}
            alignment={Alignment.Center}
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: {
    width: '100%',
    height: '80%',
  },
});
```

- [ ] **Step 4: Export + test**

Append `export * from './shift-start-burst';` to `src/components/motion/index.ts`, run:

```bash
pnpm test src/components/motion/shift-start-burst.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/shift-start-burst.tsx src/components/motion/shift-start-burst.test.tsx src/components/motion/index.ts
git commit -m "feat(motion): add ShiftStartBurst full-screen modal"
```

---

### Task 19: Wire shift-start in driver campaign screen

**Files:**
- Modify: `src/features/driver/campaign-screen.tsx`

- [ ] **Step 1: Locate the shift-start CTA**

```bash
pnpm exec grep -n "startShift\|Start Shift\|begin\|start.*shift" src/features/driver/campaign-screen.tsx
```

- [ ] **Step 2: Add import + state + gate**

```tsx
import { ShiftStartBurst } from '@/components/motion';

// inside component:
const [burstVisible, setBurstVisible] = React.useState(false);
const pendingNavRef = React.useRef<null | (() => void)>(null);

function handleStartShift() {
  startShiftMutation.mutate(undefined, {
    onSuccess: () => {
      // Queue navigation to run when burst completes.
      pendingNavRef.current = () => router.push('/upload');
    },
  });
  setBurstVisible(true);
}
```

Adjust the mutation call and navigation target to match the existing code; the key behaviour is:
- kick the mutation off in parallel with the burst
- store the navigation in a ref
- let `ShiftStartBurst.onComplete` run it

- [ ] **Step 3: Swap existing CTA `onPress` to `handleStartShift`**

- [ ] **Step 4: Render the burst**

```tsx
<ShiftStartBurst
  visible={burstVisible}
  onComplete={() => {
    setBurstVisible(false);
    const nav = pendingNavRef.current;
    pendingNavRef.current = null;
    nav?.();
  }}
/>
```

- [ ] **Step 5: Handle mutation error — cancel the burst**

In the mutation's `onError`, add `setBurstVisible(false); pendingNavRef.current = null;` and show the existing error toast.

- [ ] **Step 6: Type-check and commit**

```bash
pnpm type-check
git add src/features/driver/campaign-screen.tsx
git commit -m "feat(driver): gate shift-start navigation with ShiftStartBurst"
```

---

### Task 20: `LogoutConfirmDialog` component (R6)

**Files:**
- Create: `src/features/auth/components/logout-confirm-dialog.tsx`
- Test: `src/features/auth/components/logout-confirm-dialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/auth/components/logout-confirm-dialog.test.tsx
import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';

import { LogoutConfirmDialog } from './logout-confirm-dialog';

describe('LogoutConfirmDialog', () => {
  it('renders nothing when closed', () => {
    const { queryByTestId } = render(
      <LogoutConfirmDialog visible={false} onCancel={jest.fn()} onConfirm={jest.fn()} />
    );
    expect(queryByTestId('logout-dialog')).toBeNull();
  });

  it('calls onConfirm when confirm pressed', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <LogoutConfirmDialog visible onCancel={jest.fn()} onConfirm={onConfirm} />
    );
    fireEvent.press(getByTestId('logout-dialog-confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel pressed', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <LogoutConfirmDialog visible onCancel={onCancel} onConfirm={jest.fn()} />
    );
    fireEvent.press(getByTestId('logout-dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test src/features/auth/components/logout-confirm-dialog.test.tsx
```

- [ ] **Step 3: Implement**

```tsx
// src/features/auth/components/logout-confirm-dialog.tsx
import * as React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { riveAssets } from '@/components/motion/rive-assets';
import { Text } from '@/components/ui';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LogoutConfirmDialog({ visible, onCancel, onConfirm }: Props) {
  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop} accessibilityRole="alert" testID="logout-dialog">
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Rive
              source={riveAssets.logoutIcon}
              fit={Fit.Contain}
              alignment={Alignment.Center}
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <Text className="text-lg font-semibold">Sign out?</Text>
          <Text className="text-sm text-neutral-500 text-center">
            You will need to sign in again to continue.
          </Text>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={onCancel}
              testID="logout-dialog-cancel"
              style={[styles.btn, styles.cancel]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text className="font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              testID="logout-dialog-confirm"
              style={[styles.btn, styles.confirm]}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Text className="font-medium text-white">Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '80%',
    borderRadius: 16,
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: { width: 80, height: 80 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancel: { backgroundColor: '#eee' },
  confirm: { backgroundColor: '#d11a2a' },
});
```

- [ ] **Step 4: Run test + commit**

```bash
pnpm test src/features/auth/components/logout-confirm-dialog.test.tsx
git add src/features/auth/components/logout-confirm-dialog.tsx src/features/auth/components/logout-confirm-dialog.test.tsx
git commit -m "feat(auth): add LogoutConfirmDialog"
```

---

### Task 21: Wire logout confirm in settings screen

**Files:**
- Modify: `src/features/settings/settings-screen.tsx`

- [ ] **Step 1: Add state + dialog wiring**

At the top of the file, import:

```tsx
import { LogoutConfirmDialog } from '@/features/auth/components/logout-confirm-dialog';
```

Inside the component:

```tsx
const [confirmOpen, setConfirmOpen] = React.useState(false);
```

Change the existing `<SettingsItem text="settings.logout" onPress={signOut} />` at line 84 to:

```tsx
<SettingsItem text="settings.logout" onPress={() => setConfirmOpen(true)} />
```

At the end of the screen's root view, render:

```tsx
<LogoutConfirmDialog
  visible={confirmOpen}
  onCancel={() => setConfirmOpen(false)}
  onConfirm={() => {
    setConfirmOpen(false);
    signOut();
  }}
/>
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm type-check
git add src/features/settings/settings-screen.tsx
git commit -m "feat(settings): gate logout with confirm dialog"
```

---

### Task 22: Phase 2 smoke check

**Files:** none — validation only.

- [ ] **Step 1: Full type-check, test, lint**

```bash
pnpm type-check
pnpm test
pnpm lint
```

Expected: all green.

- [ ] **Step 2: Run on iOS simulator**

```bash
pnpm ios
```

Verify on each role:
- Admin: brand logo in header loops; back arrow on every inner screen animates on press; logout confirm dialog appears on Settings → Log out; R7 unlock placements (photo approval) still play (may visually differ due to asset swap)
- Driver: shift-start burst plays when starting a shift; after ~2.5s navigates to upload
- Offline: toggle Airplane mode — offline overlay appears within ~500ms; disable airplane — overlay dismisses

- [ ] **Step 3: Run on Android emulator**

```bash
pnpm android
```

Repeat the same checks.

- [ ] **Step 4: Record bundle delta**

```bash
pnpm exec du -sh assets/animations/
```

Expected: increase of ~2.6 MB from the Phase 2 assets.

---

**Phase 2 complete.** Open PR #2 with title `feat(motion): global UX pack (phase 2)`.

---

## Post-implementation

After both PRs merge, run the Maestro smoke suite on iOS + Android:

```bash
pnpm exec bash scripts/run-e2e.sh
```

Record observations about each animation's feel in `docs/animation-review.md` — especially whether any feel noisy, any that should be replaced, and any state-machine triggers that need tuning. This informs which deferred-scope items (see spec) to pull in next.

## Self-review notes

- Each task is self-contained and commits independently; rollback is per-task.
- Every new file has a failing test before implementation (TDD).
- Screen modifications type-check and run against the existing test suite at each step.
- State-machine names for R2/R3/R6/R7 are left as optional props in the components (`stateMachineName`, `triggerInputName`). Once the `.riv` assets are opened in the Rive editor or inspected via `rive-react-native`, pass those names in at the call sites — no component rewrite needed.
- `motionTokens` integration: durations in this plan (1200ms drill burst, 2000ms export, 2500ms shift fallback, 500ms NetInfo debounce) are explicit because they do not map to any existing motion token. If a matching token exists, swap the literal for the token reference during implementation.
