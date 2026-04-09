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

  const normalize = (val: unknown) =>
    Array.isArray(val) ? (val[0] ?? null) : (val ?? null);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    display_name: row.display_name,
    username: row.username,
    email: row.email,
    role: row.role,
    is_active: row.is_active,
    created_at: row.created_at,
    clients: normalize(row.clients),
  })) as UserRow[];
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: !isActive })
    .eq('id', userId);

  if (error)
    throw error;
}

export type CreateDriverInput = {
  username: string;
  display_name: string;
  password: string;
};

export async function createDriver(input: CreateDriverInput): Promise<{ id: string; display_name: string }> {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      role: 'driver',
      username: input.username,
      display_name: input.display_name,
      password: input.password,
    },
  });

  if (error)
    throw new Error(error.message || 'Failed to create driver');
  if (data?.error)
    throw new Error(data.error);

  return data.user;
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('reset-user-password', {
    body: { user_id: userId, new_password: newPassword },
  });

  if (error)
    throw new Error(error.message || 'Failed to reset password');
  if (data?.error)
    throw new Error(data.error);
}

export type CreateClientUserInput = {
  email: string;
  display_name: string;
  password: string;
  client_id: string;
};

export async function createClientUser(input: CreateClientUserInput): Promise<{ id: string; display_name: string }> {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      role: 'client',
      username: input.email,
      display_name: input.display_name,
      password: input.password,
      email: input.email,
      client_id: input.client_id,
    },
  });

  if (error)
    throw new Error(error.message || 'Failed to create client user');
  if (data?.error)
    throw new Error(data.error);

  return data.user;
}
