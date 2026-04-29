import { useCallback, useState } from 'react';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { requestAccountDeletion } from '@/lib/api/account';
import { translate } from '@/lib/i18n';

export type AccountDeletionState = {
  open: boolean;
  loading: boolean;
  errorMessage: string | null;
  startDeletion: () => void;
  cancel: () => void;
  confirm: () => Promise<void>;
};

export function useAccountDeletion(): AccountDeletionState {
  const signOut = useAuthStore.use.signOut();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startDeletion = useCallback(() => {
    setErrorMessage(null);
    setOpen(true);
  }, []);

  const cancel = useCallback(() => {
    if (loading)
      return;
    setOpen(false);
    setErrorMessage(null);
  }, [loading]);

  const confirm = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await requestAccountDeletion();
      setOpen(false);
      await signOut();
    }
    catch (err) {
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : translate('settings.delete_account.error_generic'),
      );
    }
    finally {
      setLoading(false);
    }
  }, [signOut]);

  return { open, loading, errorMessage, startDeletion, cancel, confirm };
}
