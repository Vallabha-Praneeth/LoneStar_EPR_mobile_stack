import * as React from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

type DeleteAccountConfirmDialogProps = {
  visible: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

const REQUIRED_PHRASE = 'DELETE';

export function DeleteAccountConfirmDialog({
  visible,
  loading,
  errorMessage,
  onCancel,
  onConfirm,
}: DeleteAccountConfirmDialogProps) {
  const [typed, setTyped] = React.useState('');

  if (!visible) {
    return null;
  }

  const phraseMatches = typed.trim().toUpperCase() === REQUIRED_PHRASE;
  const canConfirm = phraseMatches && !loading;

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      accessibilityViewIsModal
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={styles.backdrop} accessibilityRole="alert" testID="delete-account-dialog">
        <View style={styles.card}>
          <Text className="text-center text-lg font-bold text-neutral-900">
            {translate('settings.delete_account.dialog_title')}
          </Text>
          <Text className="text-center text-sm text-neutral-600">
            {translate('settings.delete_account.dialog_body')}
          </Text>
          <Text className="text-center text-xs text-neutral-500">
            {translate('settings.delete_account.dialog_confirm_prompt')}
          </Text>

          <TextInput
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!loading}
            testID="delete-account-confirm-input"
            placeholder={REQUIRED_PHRASE}
            placeholderTextColor="#a3a3a3"
            style={styles.input}
            accessibilityLabel={translate('settings.delete_account.dialog_confirm_prompt')}
          />

          {errorMessage
            ? (
                <Text className="text-center text-xs text-red-600" testID="delete-account-error">
                  {errorMessage}
                </Text>
              )
            : null}

          <View style={styles.row}>
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              testID="delete-account-cancel"
              style={[styles.button, styles.cancelButton, loading && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityLabel={translate('settings.delete_account.cancel')}
            >
              <Text style={styles.cancelText}>
                {translate('settings.delete_account.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={!canConfirm}
              testID="delete-account-confirm"
              style={[styles.button, styles.confirmButton, !canConfirm && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canConfirm, busy: loading }}
              accessibilityLabel={translate('settings.delete_account.confirm')}
            >
              <Text style={styles.confirmText}>
                {loading
                  ? translate('settings.delete_account.deleting')
                  : translate('settings.delete_account.confirm')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#171717',
    letterSpacing: 2,
  },
  row: {
    width: '100%',
    marginTop: 4,
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#d4d4d4',
  },
  confirmButton: {
    backgroundColor: '#dc2626',
  },
  cancelText: {
    color: '#404040',
    fontWeight: '600',
  },
  confirmText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
