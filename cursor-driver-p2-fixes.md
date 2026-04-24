# Cursor Prompt — Driver Screen P2 Fixes

Fix three P2 gaps found during iOS driver testing. All changes are in the
driver feature only. Do not touch admin or client screens.

---

## Fix 1 — Upload Success: show thumbnail of the just-uploaded photo

**Problem:** `upload-screen.tsx` calls `router.replace('/(app)/upload-success')`
without passing the image URI. The success screen has no `<Image>` and the
driver cannot see what they uploaded.

**Files to change:**

### `src/features/driver/upload-screen.tsx` — pass URI as param
Change the `onSuccess` navigation from:
```ts
router.replace('/(app)/upload-success');
```
to:
```ts
router.replace({ pathname: '/(app)/upload-success', params: { uri: imageUri! } });
```

### `src/app/(app)/upload-success.tsx` — read the param and pass to screen
Check what this file currently does (it likely just renders `<UploadSuccessScreen />`).
Update it to read the `uri` param from `useLocalSearchParams` and pass it as a prop.

### `src/features/driver/upload-success-screen.tsx` — display the thumbnail
Add an optional `photoUri?: string` prop to `UploadSuccessScreen`.
When `photoUri` is present, render an `<Image>` above the Lottie animation:

```tsx
{ photoUri
  ? (
      <Image
        source={{ uri: photoUri }}
        style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 12, marginBottom: 8 }}
        resizeMode="cover"
      />
    )
  : null; }
```

Place the Image inside the white card, above `<UploadSuccessAnimation>`.

---

## Fix 2 — Recent Uploads: show real thumbnails instead of grey placeholders

**Problem:** `RecentUploadsList` in `campaign-screen.tsx` renders a grey
`size-10 rounded-lg bg-neutral-100` box for each photo because the API
only fetches `id, submitted_at` — no `storage_path`.

**Files to change:**

### `src/lib/api/driver/campaign.ts`

1. Add `storage_path` to the `DriverCampaignData.campaign_photos` type:
```ts
campaign_photos: Array<{
  id: string;
  submitted_at: string;
  storage_path: string | null;
}>;
```

2. Add `storage_path` to the select query:
```ts
'id, title, campaign_date, routes ( name ), status, driver_shifts ( id, started_at, ended_at ), campaign_photos ( id, submitted_at, storage_path )';
```

3. Add a helper to generate signed URLs for thumbnails. Add a new exported function:
```ts
export async function getPhotoSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('campaign-photos')
    .createSignedUrl(storagePath, 3600);
  if (error)
    return null;
  return data.signedUrl;
}
```

### `src/features/driver/campaign-screen.tsx`

In `RecentUploadsList`, for each photo with a `storage_path`, fetch a signed URL
using `useQuery` and render a real `<Image>` thumbnail:

```tsx
function PhotoThumbnail({ storagePath }: { storagePath: string | null }) {
  const { data: uri } = useQuery({
    queryKey: ['photo-thumb', storagePath],
    queryFn: () => getPhotoSignedUrl(storagePath!),
    enabled: !!storagePath,
    staleTime: 50 * 60 * 1000, // 50 min (URL valid for 1h)
  });
  if (!uri)
    return <View className="size-10 rounded-lg bg-neutral-100 dark:bg-neutral-700" />;
  return <Image source={{ uri }} style={{ width: 40, height: 40, borderRadius: 8 }} />;
}
```

Replace the grey `<View className="size-10 rounded-lg bg-neutral-100 ..." />` in
`RecentUploadsList` with `<PhotoThumbnail storagePath={photo.storage_path} />`.

Add the required imports: `getPhotoSignedUrl` from `@/lib/api/driver/campaign`,
`useQuery` from `@tanstack/react-query`, and `Image` from `react-native`.

---

## Fix 3 — Past Campaigns: add accordion below active campaign card

**Problem:** `fetchDriverCampaign` filters `.gte('campaign_date', today).limit(1)`
so past/completed campaigns are never shown. The driver has no way to see their
history. The test plan expects a "Past Campaigns" section (J9).

**Files to change:**

### `src/lib/api/driver/campaign.ts` — add a new fetch function

Add a new type and function:
```ts
export type PastCampaignRow = {
  id: string;
  title: string;
  campaign_date: string;
  status: string;
};

export async function fetchDriverPastCampaigns(driverId: string): Promise<PastCampaignRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, title, campaign_date, status')
    .eq('driver_profile_id', driverId)
    .lt('campaign_date', today)
    .order('campaign_date', { ascending: false })
    .limit(20);
  if (error)
    throw error;
  return data ?? [];
}
```

### `src/features/driver/campaign-screen.tsx` — add PastCampaigns accordion

1. Import `fetchDriverPastCampaigns` and `PastCampaignRow` from `@/lib/api/driver/campaign`.
2. Import `format` is already imported. Import `ChevronDown, ChevronUp` from `@/components/ui/icons` (add if not present).

3. Add a `PastCampaignsAccordion` component:
```tsx
function PastCampaignsAccordion({ driverId }: { driverId: string }) {
  const [open, setOpen] = React.useState(false);
  const { data: past = [], isLoading } = useQuery({
    queryKey: ['driver-past-campaigns', driverId],
    queryFn: () => fetchDriverPastCampaigns(driverId),
    enabled: open, // only fetch when opened
  });

  return (
    <View className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
        className="flex-row items-center justify-between p-5"
      >
        <Text className="font-semibold">Past Campaigns</Text>
        {open
          ? <ChevronUp color="#737373" width={18} height={18} />
          : <ChevronDown color="#737373" width={18} height={18} />}
      </TouchableOpacity>
      {open && (
        <View className="border-t border-neutral-100 dark:border-neutral-700">
          {isLoading && (
            <View className="items-center py-6">
              <ActivityIndicator />
            </View>
          )}
          {!isLoading && past.length === 0 && (
            <Text className="p-5 text-center text-sm text-neutral-500">No past campaigns.</Text>
          )}
          {past.map((c, i) => (
            <View
              key={c.id}
              className={`flex-row items-center justify-between px-5 py-3 ${
                i < past.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-700' : ''
              }`}
            >
              <View>
                <Text className="text-sm font-medium">{c.title}</Text>
                <Text className="text-xs text-neutral-500">
                  {format(new Date(`${c.campaign_date}T12:00:00`), 'MMM d, yyyy')}
                </Text>
              </View>
              <View className="rounded-full bg-neutral-100 px-2 py-1 dark:bg-neutral-700">
                <Text className="text-xs font-medium text-neutral-600 capitalize dark:text-neutral-400">
                  {c.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
```

4. Render it at the bottom of the `ScrollView` in `CampaignScreen`, after `RecentUploadsList`:
```tsx
{ profile?.id && <PastCampaignsAccordion driverId={profile.id} />; }
```

---

## Type-check after changes

Run:
```
pnpm type-check
```

Fix any TypeScript errors before finishing. Do not change anything outside
the files listed above. Do not add comments unless logic is non-obvious.
