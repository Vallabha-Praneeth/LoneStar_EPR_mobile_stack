import type { StyleProp, ViewStyle } from 'react-native';
import * as React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView, Pressable } from 'react-native-gesture-handler';
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
      <GestureHandlerRootView style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none" />
        <Animated.View style={expandedViewStyle}>
          <View style={styles.mapLayer}>
            {children}
          </View>
          <View style={styles.overlay} pointerEvents="box-none">
            <Pressable
              onPress={closeMap}
              style={[styles.closeButton, { top: insets.top + 8, right: 20 }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Minimize map"
            >
              <Text style={styles.closeLabel}>✕</Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLayer: { flex: 1, zIndex: 0 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
  },
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
