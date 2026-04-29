import { supabase } from '@/lib/supabase';

export async function requestAccountDeletion(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('request-account-deletion', {
    body: {},
  });

  if (error)
    throw new Error(error.message || 'Failed to delete account');
  if (data?.error)
    throw new Error(data.error);
}
