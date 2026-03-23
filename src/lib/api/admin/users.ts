import { supabase } from '@/lib/supabase';

export type UserRow = {
  id: string;
  display_name: string;
  username: string;
  email: string | null;
  role: 'admin' | 'driver' | 'client';
  is_active: boolean;
  created_at: string;
  clients: { name: string } | null;
};

export async function fetchUsers(): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, email, role, is_active, created_at, clients:client_id ( name )')
    .order('created_at', { ascending: false });

  if (error)
    throw error;
  return (data ?? []) as unknown as UserRow[];
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: !isActive })
    .eq('id', userId);

  if (error)
    throw error;
}
