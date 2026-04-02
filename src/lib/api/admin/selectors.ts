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

export async function createClientOrg(input: { name: string; phone_number: string | null }): Promise<ClientOption> {
  const { data, error } = await supabase
    .from('clients')
    .insert({ name: input.name, is_active: true, phone_number: input.phone_number })
    .select('id, name')
    .single();

  if (error)
    throw error;
  return data as ClientOption;
}

export type RouteOption = {
  id: string;
  name: string;
};

export async function fetchRoutes(): Promise<RouteOption[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  if (error)
    throw error;
  return (data ?? []) as RouteOption[];
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
