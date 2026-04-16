# AdTruck Debug Context — 2026-04-16

## Bug Being Fixed
`useStopState` is called in `CampaignScreen` while the campaign query is still loading.
The `useState` lazy initialiser runs once with an empty `stops` array and permanently
stays empty — so route stops list shows "0 / 0 done" with no rows, and GPS proximity
nudges never fire, on every first app launch.

## File
/Users/praneeth/LoneStar_ERP/adtruck-driver-native/src/features/driver/campaign-screen.tsx

## Lines
Lines 799–835 (`useStopState` hook body)

## Root Cause
State was lifted from `RouteStopsCard` (which was only rendered after data arrived) to
`CampaignScreen` (which mounts during the loading state). React's `useState` lazy
initialiser is guaranteed to run exactly once — on mount — so the empty array passed
at load time is frozen as the permanent initial state. When `campaign` data arrives and
`stops` changes from `[]` to the real array, no re-initialisation happens.

## What the Fix Should Do
- Add `const seededRef = React.useRef(stops.length > 0)` immediately after the
  `useState` declaration — starts as `true` if data was already available at mount,
  `false` if loading
- Add a `React.useEffect` with deps `[stops, activeShift]` that:
  1. Returns immediately if `seededRef.current` is already `true`
  2. Returns immediately if `stops.length === 0` (still loading)
  3. Sets `seededRef.current = true` (so subsequent query refetches are ignored)
  4. Rebuilds `completedStopIds` from `activeShift` and calls `setItems(stops.map(...))`
     using the same mapping as the lazy initialiser

## Do Not Change
- The `useState` lazy initialiser itself — it still handles the fast-path where data is
  in the React Query cache at mount time (e.g. returning to screen after navigation)
- The `markDone`, `markSkip`, and `moveStop` functions — no changes needed there
- The `max-lines-per-function` budget — `useStopState` is ~37 lines; adding 7 more is
  well within the 110-line ESLint limit
- The `useProximityNudge` hook — no changes needed; it already handles empty `items`

## How to Verify the Fix
Cold-launch the app in the Simulator (Cmd+Shift+H to home then re-open — clears
React Query cache) and confirm the RouteStopsCard shows the correct number of stops
and the first pending stop shows amber on the map.
