import { supabase } from '@/lib/supabase';

export type ClientOption = {
  id: string;
  name: string;
};

export type DriverOption = {
  id: string;
  display_name: string;
};

export async function fetchClients(): Promise<ClientOption[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  if (error)
    throw error;
  return (data ?? []) as ClientOption[];
}

export async function fetchDrivers(): Promise<DriverOption[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('role', 'driver')
    .eq('is_active', true)
    .order('display_name');

  if (error)
    throw error;
  return (data ?? []) as DriverOption[];
}
