// Kept in sync with adtruck-proof-main/src/lib/types.ts
// If types change, update both files in the same PR.

export type UserRole = 'admin' | 'driver' | 'client';

export type Profile = {
  id: string;
  role: UserRole;
  username: string;
  display_name: string;
  email: string | null;
  client_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Campaign = {
  id: string;
  title: string;
  campaign_date: string;
  route_id: string | null;
  status: 'draft' | 'pending' | 'active' | 'completed';
  client_id: string;
  driver_profile_id: string | null;
  internal_notes: string | null;
  client_billed_amount: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DriverShift = {
  id: string;
  campaign_id: string;
  driver_profile_id: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignPhoto = {
  id: string;
  campaign_id: string;
  uploaded_by: string;
  storage_path: string;
  note: string | null;
  submitted_at: string;
  captured_at: string | null;
};
