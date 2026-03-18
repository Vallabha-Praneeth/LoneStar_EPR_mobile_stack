import type { LoginFormProps } from './components/login-form';

import type { Profile } from '@/lib/types';
import * as React from 'react';
import { FocusAwareStatusBar } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { LoginForm } from './components/login-form';
import { useAuthStore } from './use-auth-store';

export function LoginScreen() {
  const signIn = useAuthStore.use.signIn();
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit: LoginFormProps['onSubmit'] = async ({ username, password }) => {
    setError(null);
    try {
      // Step 1: resolve username → email via RPC
      const { data: email, error: rpcError } = await supabase.rpc(
        'get_auth_email_by_username',
        { p_username: username, p_role: 'driver' },
      );
      if (rpcError || !email) {
        setError('Invalid username or password.');
        return;
      }

      // Step 2: sign in with resolved email + password
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError || !data.session) {
        setError('Invalid username or password.');
        return;
      }

      // Step 3: fetch driver profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (profileError || !profile) {
        setError('Could not load profile. Please try again.');
        return;
      }

      signIn(data.session, profile as Profile);
    }
    catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <FocusAwareStatusBar />
      <LoginForm onSubmit={onSubmit} error={error} />
    </>
  );
}
