import * as React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Rive, { Alignment, Fit } from 'rive-react-native';

import { riveAssets } from '@/components/motion/rive-assets';
import { Text } from '@/components/ui';

type LogoutConfirmDialogProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LogoutConfirmDialog({ visible, onCancel, onConfirm }: LogoutConfirmDialogProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      accessibilityViewIsModal
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop} accessibilityRole="alert" testID="logout-dialog">
        <View style={styles.card}>
          <Text className="text-center text-sm font-medium text-neutral-600">
            Are you sure you want to logout?
          </Text>

          <View style={styles.iconWrap}>
            <Rive
              source={riveAssets.logoutIcon}
              fit={Fit.Contain}
              alignment={Alignment.Center}
              autoplay
              style={styles.rive}
            />
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              onPress={onCancel}
              testID="logout-dialog-cancel"
              style={[styles.button, styles.cancelButton]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              testID="logout-dialog-confirm"
              style={[styles.button, styles.confirmButton]}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Text style={styles.confirmText}>Sign out</Text>
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
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '80%',
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
  },
  rive: {
    width: '100%',
    height: '100%',
  },
  row: {
    width: '100%',
    marginTop: 8,
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#d4d4d4',
  },
  confirmButton: {
    backgroundColor: '#FF6C00',
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
