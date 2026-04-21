# Mobile Emulator Test Plan

Two-pass test on Android emulator (after EAS build passes / dev APK).

**Pass 1 — Functional correctness:** Every feature works end-to-end and data
round-trips to Supabase correctly.
**Pass 2 — UI / motion / icons:** Visual polish, animation quality, empty states,
dark/light mode, icon rendering.

---

## Setup

- Install APK from EAS preview build or `pnpm android` dev client
- Supabase dashboard open in another window for live DB verification
- Credentials:
  - Admin: `admin@adtruck.com` / `AdminPass123!`
  - Driver: username `driver1` / `DriverPass123!`
  - Client: `client@acme.com` / `ClientPass123!`

---

## Pass 1 — Functional Verification

### A. Auth & Role Routing

| # | Step | Expected | DB Check |
|---|------|----------|----------|
| A1 | Open app cold — see login screen | Login form appears, no crash | — |
| A2 | Enter wrong password → submit | Error toast/message shown, stays on login | — |
| A3 | Login as admin | Navigates to campaign list | — |
| A4 | Hard-back from campaign list | Cannot leave app (no back to login) | — |
| A5 | Settings → Sign Out | Returns to login screen | — |
| A6 | Login as driver | Navigates to driver campaign screen | — |
| A7 | Sign out as driver | Returns to login | — |
| A8 | Login as client | Navigates to client landing | — |
| A9 | Sign out as client | Returns to login | — |

---

### B. Admin — Campaign List

| # | Step | Expected | DB Check |
|---|------|----------|----------|
| B1 | Login as admin, see campaign list | Shows all campaigns with photo count + cost total per card | — |
| B2 | Pull-to-refresh | List refreshes without error | — |
| B3 | Filter by status (Active / Completed) | List filters correctly | — |
| B4 | Tap a campaign card | Navigates to campaign detail | — |

---

### C. Admin — Create Campaign

| # | Step | Expected | DB Check |
|---|------|----------|----------|
| C1 | Tap "+" or "Create" button | Create Campaign form opens | — |
| C2 | Submit empty form | Validation errors shown on required fields (Title, Date, Client) | — |
| C3 | Fill: Title = "Test Campaign Apr9", Date = today, pick a client, pick a driver | All fields accepted | — |
| C4 | Submit | Success message / navigates back to list | `campaigns` table has new row |
| C5 | Find new campaign in list | Card appears with 0 photos, $0.00 | — |
| C6 | Open new campaign detail | All fields correct (title, client, driver, date) | — |

---

### D. Admin — Campaign Detail

| # | Step | Expected | DB Check |
|---|------|----------|----------|
| D1 | Open any campaign with photos | Photo grid shows thumbnails | — |
| D2 | Tap a photo | Full-screen preview opens | — |
| D3 | Tap Approve on a photo | Photo status changes, UI updates | `campaign_photos.status = 'approved'` |
| D4 | Check KPIs at top | Photo count, cost total, shift hours correct | Matches `campaign_costs` + `driver_shifts` |
| D5 | Scroll to Financial Summary | Line items show with amounts | — |
| D6 | Scroll to Driver Shifts | Shift rows show login/logout times and status | — |

---

### E. Admin — Create User (Driver / Client)

| # | Step | Expected | DB Check |
|---|------|----------|----------|
| E1 | Navigate to Users screen | List of existing users with roles | — |
| E2 | Tap "Create User" / "+" | Create user form opens | — |
| E3 | Fill: email = `newdriver2@test.com`, role = driver, display name = "New Driver 2" | All fields accepted | — |
| E4 | Submit | Success, user appears in list | `auth.users` + `profiles` rows created |
| E5 | Verify new user appears in driver selector on Create Campaign | "New Driver 2" shows in dropdown | — |
| E6 | Repeat for a client user | Client user created | `profiles.role = 'client'` |

---

### F. Admin — Analytics

| # | Step | Expected | DB Check |
|---|------|----------|----------|
| F1 | Open Analytics tab | KPI cards load (Revenue, Driver Cost, Internal Cost, Gross Profit, Margin %, Billable Hours, Active Campaigns) | — |
| F2 | Default range is 3M | Cards show 3-month data | — |
| F3 | Tap 6M | KPIs update for 6-month window | — |
| F4 | Tap 1Y | KPIs update for 1-year window | — |
| F5 | Check Driver Breakdown chart | Each driver's hours and payout shown as bar | Matches `driver_shifts` durations |
| F6 | Verify hours for "Test Driver" | Hours match shift records in Supabase | Cross-check `driver_shifts` table |
| F7 | Verify salary (driver cost) | Matches campaign costs for that driver | Cross-check `campaign_costs` table |
| F8 | Check Client Breakdown | Client names + revenue bars shown | — |
| F9 | Verify gross profit = Revenue − Driver Cost − Internal Cost | Math correct on screen | — |

---

### G. Admin — Reports

| # | Step | Expected | DB Check |
|---|------|----------|----------|
| G1 | Open Reports screen | KPI summary cards + campaign table | — |
| G2 | Check total campaigns count | Matches number in Supabase | `count(campaigns)` |
| G3 | Check total photos count | Matches across all campaigns | `count(campaign_photos)` |
| G4 | Check shift hours total | Matches sum of completed shift durations | `driver_shifts` |
| G5 | Each row shows correct photo count | Matches `campaign_photos` per campaign | — |

---

### H. Admin — Routes

| # | Step | Expected | DB Check |
|---|------|----------|----------|
| H1 | Open Routes screen | List of routes | — |
| H2 | Tap "Add Route" | Route form opens | — |
| H3 | Fill name + description, submit | Route created, appears in list | `routes` table (or equivalent) |
| H4 | Verify new route appears in Create Campaign → Route selector | Route available | — |

---

### I. Admin — Cost Types

| # | Step | Expected | DB Check |
|---|------|----------|----------|
| I1 | Open Cost Types screen | List of cost types (Driver Wage, Transport, etc.) | — |
| I2 | Add new cost type | New type created | DB updated |
| I3 | Verify it appears in campaign cost entry | — | — |

---

### J. Driver Flow

| # | Step | Expected | DB Check |
|---|------|----------|----------|
| J1 | Login as driver1 | Campaign screen shows assigned active campaign | — |
| J2 | Verify campaign name, date, route | Matches what admin created | — |
| J3 | Tap "Start Shift" | Shift starts, button changes to "End Shift", time shown | `driver_shifts` row created with `started_at` |
| J4 | Tap "Upload Photo" | Camera/gallery picker opens | — |
| J5 | Select a photo from gallery | Photo upload in progress → success | `campaign_photos` row created, file in storage |
| J6 | Verify photo appears in upload success screen | Thumbnail shown | — |
| J7 | Return to campaign screen | Photo count updated | — |
| J8 | Tap "End Shift" | Shift ends, logged | `driver_shifts.ended_at` set, `shift_status = 'completed'` |
| J9 | Check "Past Campaigns" accordion | Completed campaigns listed | — |

---

### K. Client Flow

| # | Step | Expected | DB Check |
|---|------|----------|----------|
| K1 | Login as client | Client landing shows a campaign | — |
| K2 | Campaign switcher shows all accessible campaigns | All client's campaigns listed | — |
| K3 | Switch to campaign with approved photos | Photos visible in grid | — |
| K4 | Tap a photo | Full preview opens | — |
| K5 | Navigate to Timing Sheet | Timeline nodes show Shift Start, First Photo, Shift End with real times | — |
| K6 | Verify times match what driver logged | Matches `driver_shifts` | — |

---

## Pass 2 — UI / Motion / Icon Checklist

After Pass 1 passes, do a visual sweep of every screen. Note all issues in
`docs/mobile-ui-issues.md` for Cursor to fix.

### Checklist per screen

For each screen below, check:
- [ ] Entrance animation visible (fade/slide — not stuck at opacity 0)
- [ ] Loading skeleton shows while data fetches (not blank white flash)
- [ ] Icons render correctly (not broken, correct size, not clipped)
- [ ] Empty states: correct Lottie animation + message shown when no data
- [ ] Cards/rows have consistent padding and typography
- [ ] Dark mode: all text readable, no white-on-white or black-on-black
- [ ] Buttons: correct color, correct disabled state
- [ ] Error states: error message shown on network failure

### Screens to check

| Screen | Notes |
|--------|-------|
| Login | Form layout, button state |
| Campaign List (admin) | Card layout, photo/cost row, status badge |
| Campaign Detail (admin) | KPI strip, photo grid, shifts list, financials |
| Create Campaign | Form fields, selectors, validation errors |
| Users | Row layout, role badge, avatar initial |
| Analytics | KPI card layout, bar chart labels, range picker |
| Reports | KPI cards, table rows |
| Routes | List rows |
| Cost Types | List rows |
| Driver Detail | Form layout |
| Driver Campaign | Campaign card, Start/End Shift button, past campaigns |
| Driver Upload | Camera preview, upload progress |
| Upload Success | Success state, thumbnail |
| Client Landing | Campaign card, switcher dropdown |
| Client Timing Sheet | Timeline nodes, time labels |
| Settings | Theme toggle, language picker, sign-out |

### Specific motion checks

- [ ] Campaign list cards stagger in on first load (not all at once)
- [ ] Page transitions: outgoing page fades/slides before incoming enters
- [ ] Skeleton pulse is subtle (not jarring flash)
- [ ] No bouncing or spring overshoot on any transition
- [ ] Lottie empty states: animation plays (not frozen first frame)

---

## Issue Logging Format

When noting issues for Cursor in `docs/mobile-ui-issues.md`:

```
## Issue N — [Screen Name]
**File:** src/features/...
**Symptom:** What you see
**Expected:** What it should look like
**Severity:** P1 (broken) / P2 (wrong) / P3 (polish)
```

---

## Sign-off Criteria

- Pass 1: All functional checks ✓ (or documented with known reason)
- Pass 2: No P1/P2 UI issues outstanding, or Cursor prompt written for any found
- EAS build: green + AAB artifact available for Play Store
