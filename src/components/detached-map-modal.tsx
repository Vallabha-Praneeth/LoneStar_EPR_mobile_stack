import type { StyleProp, ViewStyle } from 'react-native';
import * as React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';

type DetachedMapModalProps = {
  visible: boolean;
  closeMap: () => void;
  expandedViewStyle: StyleProp<ViewStyle>;
  backdropStyle: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function DetachedMapModal({
  visible,
  closeMap,
  expandedViewStyle,
  backdropStyle,
  children,
}: DetachedMapModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
      animationType="none"
      onRequestClose={closeMap}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none" />
        <Animated.View style={expandedViewStyle}>
          <View style={styles.mapLayer}>
            {children}
          </View>
        </Animated.View>
        <Pressable
          onPress={closeMap}
          style={[styles.closeButton, { top: insets.top + 8, right: 20 }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Minimize map"
          accessibilityRole="button"
        >
          <Text style={styles.closeLabel}>✕</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLayer: { flex: 1 },
  closeButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },
  closeLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
});
