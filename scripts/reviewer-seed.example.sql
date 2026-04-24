-- ============================================================
-- LoneStar Fleet — reviewer seed (TEMPLATE)
-- ============================================================
-- This is the VERSION-CONTROLLED template.
-- The filled-in copy (with real passwords) lives at
-- `/secrets/reviewer-seed.sql`, which is gitignored.
--
-- Workflow:
--   1. Copy this file to /secrets/reviewer-seed.sql.
--   2. Replace the two CHANGE_ME_* placeholders with real passwords.
--   3. Paste the filled copy into Supabase Dashboard -> SQL editor.
--   4. Record the passwords somewhere safe — they're what you paste into:
--        • App Store Connect -> App Review Information -> Sign-in information
--        • Play Console -> App Content -> App access
--
-- Safe to re-run: every INSERT has an ON CONFLICT clause.
-- Runs as `postgres` in the SQL editor, so direct inserts into
-- auth.* succeed without needing the service_role key.
-- ============================================================

-- ── 1. Passwords for the two reviewer accounts ──────────────
-- Replace each placeholder with a real password (≥ 8 chars).
-- They appear exactly once each below:
--   CHANGE_ME_APPLE_PASSWORD_HERE   (Apple App Review login)
--   CHANGE_ME_PLAY_PASSWORD_HERE    (Google Play Review login)

BEGIN;

-- ── 2. Stable UUIDs for reviewer records ────────────────────
-- All hand-picked so re-runs are idempotent and the rows are
-- easy to spot in admin tooling.
-- apple user    : aaaa1111-0000-0000-0000-000000000001
-- play  user    : aaaa2222-0000-0000-0000-000000000002
-- reviewer client: 11111111-1111-1111-1111-111111111111
-- demo route    : 22222222-2222-2222-2222-222222222222
-- apple campaign: 33333333-3333-3333-3333-333333330001
-- play  campaign: 33333333-3333-3333-3333-333333330002

-- ── 3. auth.users ───────────────────────────────────────────
-- `role` in JWT app_metadata MUST be 'driver' or the RLS policy
-- `campaigns: driver read assigned` will block the query.
--
-- Token columns (confirmation_token, recovery_token, email_change_*,
-- phone_change*, reauthentication_token) MUST be set to '' explicitly.
-- They default to '' at the schema level, but a partial INSERT bypasses
-- column defaults and lands NULL. GoTrue's Go scanner then crashes
-- during sign-in with "converting NULL to string is unsupported" and
-- returns a 500 — manifesting in-app as "Invalid username or password".
-- The ON CONFLICT branch also repairs NULLs left by prior seeds.
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token,
  email_change_token_current, email_change_token_new, email_change,
  phone_change, phone_change_token, reauthentication_token,
  created_at, updated_at
) VALUES
  (
    'aaaa1111-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'apple-reviewer@quantum-ops.com',
    crypt('CHANGE_ME_APPLE_PASSWORD_HERE', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"driver"}',
    '{"username":"apple-reviewer","display_name":"Apple App Review"}',
    '', '', '', '', '', '', '', '',
    now(), now()
  ),
  (
    'aaaa2222-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'play-reviewer@quantum-ops.com',
    crypt('CHANGE_ME_PLAY_PASSWORD_HERE', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"role":"driver"}',
    '{"username":"play-reviewer","display_name":"Google Play Review"}',
    '', '', '', '', '', '', '', '',
    now(), now()
  )
ON CONFLICT (id) DO UPDATE SET
  encrypted_password         = EXCLUDED.encrypted_password,
  email_confirmed_at         = EXCLUDED.email_confirmed_at,
  raw_app_meta_data          = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data         = EXCLUDED.raw_user_meta_data,
  -- Repair any NULL token columns left by an earlier partial-insert seed.
  -- COALESCE preserves real in-flight tokens (e.g., an active email change)
  -- and only fills when the current value is NULL.
  confirmation_token         = COALESCE(auth.users.confirmation_token, ''),
  recovery_token             = COALESCE(auth.users.recovery_token, ''),
  email_change_token_current = COALESCE(auth.users.email_change_token_current, ''),
  email_change_token_new     = COALESCE(auth.users.email_change_token_new, ''),
  email_change               = COALESCE(auth.users.email_change, ''),
  phone_change               = COALESCE(auth.users.phone_change, ''),
  phone_change_token         = COALESCE(auth.users.phone_change_token, ''),
  reauthentication_token     = COALESCE(auth.users.reauthentication_token, ''),
  updated_at                 = now();

-- ── 4. auth.identities (email provider) ─────────────────────
-- Supabase requires a matching identity row before sign-in works.
INSERT INTO auth.identities (
  id, user_id, provider, provider_id, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES
  (
    gen_random_uuid(),
    'aaaa1111-0000-0000-0000-000000000001',
    'email',
    'aaaa1111-0000-0000-0000-000000000001',
    jsonb_build_object(
      'sub',            'aaaa1111-0000-0000-0000-000000000001',
      'email',          'apple-reviewer@quantum-ops.com',
      'email_verified', true,
      'phone_verified', false
    ),
    now(), now(), now()
  ),
  (
    gen_random_uuid(),
    'aaaa2222-0000-0000-0000-000000000002',
    'email',
    'aaaa2222-0000-0000-0000-000000000002',
    jsonb_build_object(
      'sub',            'aaaa2222-0000-0000-0000-000000000002',
      'email',          'play-reviewer@quantum-ops.com',
      'email_verified', true,
      'phone_verified', false
    ),
    now(), now(), now()
  )
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ── 5. Reviewer demo client ─────────────────────────────────
INSERT INTO public.clients (id, name, is_active)
VALUES ('11111111-1111-1111-1111-111111111111', 'LoneStar Reviewer Demo', true)
ON CONFLICT (id) DO UPDATE SET
  name      = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- ── 6. Reviewer demo route + 3 Prosper, TX stops ────────────
INSERT INTO public.routes (id, name, city, is_active)
VALUES ('22222222-2222-2222-2222-222222222222', 'Reviewer Demo Route', 'Prosper', true)
ON CONFLICT (id) DO UPDATE SET
  name      = EXCLUDED.name,
  city      = EXCLUDED.city,
  is_active = EXCLUDED.is_active;

-- Stops ordered; coordinates are approximate Prosper TX locations
-- so the map renders something plausible without hitting geocoding.
INSERT INTO public.route_stops (id, route_id, stop_order, venue_name, address, latitude, longitude)
VALUES
  (
    '22222222-2222-2222-2222-000000000101',
    '22222222-2222-2222-2222-222222222222',
    1, 'QuantumOps HQ',
    '1630 W Prosper Trl Ste 410, Prosper, TX 75078',
    33.2526, -96.8011
  ),
  (
    '22222222-2222-2222-2222-000000000102',
    '22222222-2222-2222-2222-222222222222',
    2, 'Prosper City Hall',
    '250 W First St, Prosper, TX 75078',
    33.2363, -96.7883
  ),
  (
    '22222222-2222-2222-2222-000000000103',
    '22222222-2222-2222-2222-222222222222',
    3, 'HEB Prosper',
    '601 S Preston Rd, Prosper, TX 75078',
    33.2400, -96.7928
  )
ON CONFLICT (id) DO UPDATE SET
  stop_order = EXCLUDED.stop_order,
  venue_name = EXCLUDED.venue_name,
  address    = EXCLUDED.address,
  latitude   = EXCLUDED.latitude,
  longitude  = EXCLUDED.longitude;

-- ── 7. Reviewer profiles ────────────────────────────────────
INSERT INTO public.profiles (id, role, username, display_name, email, client_id, is_active)
VALUES
  (
    'aaaa1111-0000-0000-0000-000000000001',
    'driver', 'apple-reviewer', 'Apple App Review',
    'apple-reviewer@quantum-ops.com',
    '11111111-1111-1111-1111-111111111111',
    true
  ),
  (
    'aaaa2222-0000-0000-0000-000000000002',
    'driver', 'play-reviewer', 'Google Play Review',
    'play-reviewer@quantum-ops.com',
    '11111111-1111-1111-1111-111111111111',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  role         = EXCLUDED.role,
  username     = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  email        = EXCLUDED.email,
  client_id    = EXCLUDED.client_id,
  is_active    = EXCLUDED.is_active;

-- ── 8. Today-campaigns, one per reviewer ────────────────────
-- `created_by` points to the first admin profile found — required
-- by the NOT NULL FK. If you get a NOT NULL violation here, make
-- sure at least one admin profile exists in public.profiles first.
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id
  FROM public.profiles
  WHERE role = 'admin' AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION
      'No active admin profile found. Create an admin user first so campaigns.created_by has a valid owner.';
  END IF;

  INSERT INTO public.campaigns (
    id, title, campaign_date, status,
    client_id, driver_profile_id, route_id,
    driver_can_modify_route, created_by
  ) VALUES
    (
      '33333333-3333-3333-3333-333333330001',
      'Reviewer Demo — Apple',
      CURRENT_DATE,
      'active',
      '11111111-1111-1111-1111-111111111111',
      'aaaa1111-0000-0000-0000-000000000001',
      '22222222-2222-2222-2222-222222222222',
      false,
      v_admin_id
    ),
    (
      '33333333-3333-3333-3333-333333330002',
      'Reviewer Demo — Google Play',
      CURRENT_DATE,
      'active',
      '11111111-1111-1111-1111-111111111111',
      'aaaa2222-0000-0000-0000-000000000002',
      '22222222-2222-2222-2222-222222222222',
      false,
      v_admin_id
    )
  ON CONFLICT (id) DO UPDATE SET
    title             = EXCLUDED.title,
    campaign_date     = EXCLUDED.campaign_date,
    status            = EXCLUDED.status,
    client_id         = EXCLUDED.client_id,
    driver_profile_id = EXCLUDED.driver_profile_id,
    route_id          = EXCLUDED.route_id,
    updated_at        = now();
END $$;

COMMIT;

-- ── 9. pg_cron: roll campaign_date to CURRENT_DATE nightly ──
-- Needs the `pg_cron` extension. Enable once in Dashboard ->
-- Database -> Extensions -> pg_cron, then run this block.
-- Runs at 00:05 UTC every day; safe to re-run (schedule is
-- replaced via unschedule + schedule).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Drop any prior schedule under this job name
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'lonestar-reviewer-campaign-roll';

    PERFORM cron.schedule(
      'lonestar-reviewer-campaign-roll',
      '5 0 * * *',
      $SQL$
        UPDATE public.campaigns
        SET campaign_date = CURRENT_DATE,
            status        = 'active',
            updated_at    = now()
        WHERE id IN (
          '33333333-3333-3333-3333-333333330001',
          '33333333-3333-3333-3333-333333330002'
        );
      $SQL$
    );
  ELSE
    RAISE NOTICE
      'pg_cron extension is not enabled. Enable it via Dashboard -> Database -> Extensions -> pg_cron, then re-run the block in section 9 only.';
  END IF;
END $$;

-- ============================================================
-- Done. Reviewer credentials to paste into ASC / Play Console:
--   apple-reviewer@quantum-ops.com  / <your apple password>
--   play-reviewer@quantum-ops.com   / <your play password>
-- Or login by username (driver login accepts both):
--   apple-reviewer / <password>
--   play-reviewer  / <password>
-- ============================================================
