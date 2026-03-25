# UI Improvements — adtruck-driver-native

## 1. SVG Icon System

Replaced all emoji icons across driver and admin screens with proper SVG components built on `react-native-svg`. Each icon follows the existing project pattern (`SvgProps`, stroke-based, 24x24 viewBox).

### Icons Created (`src/components/ui/icons/`)

| Icon | File | Usage |
|------|------|-------|
| Camera | `camera.tsx` | Upload photo buttons, photo picker area |
| ImageIcon | `image-icon.tsx` | Gallery button |
| User | `user.tsx` | Client info card |
| Truck | `truck.tsx` | Driver info card, transport cost |
| MapPin | `map-pin.tsx` | Route info card |
| DollarSign | `dollar-sign.tsx` | Cost info cards (wage, total) |
| Clipboard | `clipboard.tsx` | Other cost info card |
| Clock | `clock.tsx` | Shift started time badge |
| Play | `play.tsx` | Start Shift button |
| StopCircle | `stop-circle.tsx` | End Shift button |
| CheckCircle | `check-circle.tsx` | Upload success screen |
| ChevronLeft | `chevron-left.tsx` | Back navigation |
| Upload | `upload.tsx` | Submit Photo button |
| LogOut | `log-out.tsx` | Sign out actions |
| Search | `search.tsx` | Search bar |
| Plus | `plus.tsx` | Create actions |
| BarChart | `bar-chart.tsx` | Reports tab |
| FileText | `file-text.tsx` | Document/report references |
| Users | `users.tsx` | Users tab |

### Emoji Replacements

| Screen | Before | After |
|--------|--------|-------|
| campaign-detail | `📋` Other Cost | `<Clipboard>` |
| campaign-detail | `💵` Total Cost | `<DollarSign>` |
| campaign-detail | `👤` Client | `<User>` |
| campaign-detail | `🚛` Driver | `<Truck>` |
| campaign-detail | `📍` Route | `<MapPin>` |
| campaign-detail | `💰` Driver Wage | `<DollarSign>` |
| campaign-detail | `🚚` Transport | `<Truck>` |
| upload-success | `✅` checkmark | `<CheckCircle>` |
| campaign-screen | `⏱` shift time | `<Clock>` |
| campaign-screen | `📷` Upload Photo | `<Camera>` |
| campaign-screen | `▶` Start Shift | `<Play>` |
| campaign-screen | `⏹` End Shift | `<StopCircle>` |
| upload-screen | `📷` Take Photo | `<Camera>` |
| upload-screen | `🖼` Gallery | `<ImageIcon>` |
| upload-screen | `↑` Submit Photo | `<Upload>` |
| upload-screen | `‹` back chevron | `<ChevronLeft>` |

---

## 2. Color Token Migration (`gray-*` → `neutral-*`)

Migrated all Tailwind color tokens from `gray-*` to `neutral-*` for consistency with the design system (neutral palette defined in `global.css`).

- **75 replacements** across 12 files
- Covers `bg-gray-*`, `text-gray-*`, `border-gray-*`, and their `dark:` variants
- `placeholderTextColor` hex updated: `#9CA3AF` (gray-400) → `#a3a3a3` (neutral-400)

### Files Modified

| File | Occurrences |
|------|-------------|
| `src/features/driver/campaign-screen.tsx` | 14 |
| `src/features/driver/upload-screen.tsx` | 11 |
| `src/features/driver/upload-success-screen.tsx` | 5 |
| `src/features/admin/create-campaign-screen.tsx` | 7 |
| `src/features/admin/campaign-detail-screen.tsx` | 2 |
| `src/features/admin/campaign-list-screen.tsx` | 2 |
| `src/features/admin/users-screen.tsx` | 9 |
| `src/features/admin/reports-screen.tsx` | 12 |
| `src/features/client/client-landing-screen.tsx` | 6 |
| `src/components/search-bar.tsx` | 2 |
| `src/components/admin-header.tsx` | 2 |
| `src/components/ui/modal.tsx` | 1 |

---

## 3. UI Primitive Foundation (from prior session)

### Components Added

| Component | File | Purpose |
|-----------|------|---------|
| Badge | `src/components/ui/badge.tsx` | Status labels (default, success, danger, warning variants) |
| Card | `src/components/ui/card.tsx` | Consistent card container with border + shadow |
| IconButton | `src/components/ui/icon-button.tsx` | Pressable icon wrapper |
| StatusBadge | `src/components/status-badge.tsx` | Campaign/photo status display |
| SearchBar | `src/components/search-bar.tsx` | Reusable search input |
| AdminHeader | `src/components/admin-header.tsx` | Admin screen header with back nav |
| InfoCard | `src/components/info-card.tsx` | Key-value display card (accepts SVG icon nodes) |

### Test Coverage

| Suite | Tests |
|-------|-------|
| badge.test.tsx | 6 |
| card.test.tsx | 4 |
| icon-button.test.tsx | 5 |
| button.test.tsx | 14 |
| input.test.tsx | 11 |
| checkbox.test.tsx | 6 |
| login-form.test.tsx | 2 |
| select.test.tsx | 6 |
| **Total** | **54 passing** |

---

## 4. Verification

- **Type check**: 0 errors (`tsc --noEmit`)
- **Unit tests**: 54/54 passing
- **E2E driver flow** (Android): PASS — login → shift → upload → end → logout
- **E2E admin flow** (Android): PASS — login → campaigns → detail → tabs → logout
