// Kept in sync with adtruck-proof-main/src/lib/types.ts
// If types change, update both files in the same PR.

export type UserRole = 'admin' | 'driver' | 'client';

export type ShiftStatus
  = | 'scheduled'
    | 'active'
    | 'completed'
    | 'no_show'
    | 'cancelled';

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

export type Client = {
  id: string;
  name: string;
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
  shift_status: ShiftStatus;
  created_at: string;
  updated_at: string;
};

export type Driver = {
  id: string;
  profile_id: string;
  license_number: string | null;
  license_type: string | null;
  license_expiry: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  base_daily_wage: number | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Route = {
  id: string;
  name: string;
  city: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RouteStop = {
  id: string;
  route_id: string;
  stop_order: number;
  venue_name: string;
  address: string | null;
  created_at: string;
};

export type CostType = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type CampaignCost = {
  id: string;
  campaign_id: string;
  cost_type_id: string;
  amount: number;
  notes: string | null;
  created_at: string;
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
