import type { View } from 'react-native';
import * as React from 'react';
import { useWindowDimensions } from 'react-native';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { motionTokens } from '@/lib/motion/tokens';

const SPRING = motionTokens.spring.lively;

export function useDetachedMapExpand(
  cardRef: React.RefObject<View | null>,
  collapsedHeight: number,
) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [showModal, setShowModal] = React.useState(false);
  const left = useSharedValue(0);
  const top = useSharedValue(0);
  const width = useSharedValue(screenWidth);
  const height = useSharedValue(collapsedHeight);
  const radius = useSharedValue(12);
  const backdrop = useSharedValue(0);

  const expandedViewStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: left.value,
    top: top.value,
    width: width.value,
    height: height.value,
    borderRadius: radius.value,
    overflow: 'hidden',
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${backdrop.value})`,
  }));

  const openMap = React.useCallback(() => {
    cardRef.current?.measureInWindow((...measurements) => {
      const [x, y, measuredWidth, measuredHeight] = measurements;
      left.value = withTiming(x, { duration: 0 });
      top.value = withTiming(y, { duration: 0 });
      width.value = withTiming(measuredWidth, { duration: 0 });
      height.value = withTiming(measuredHeight, { duration: 0 });
      radius.value = withTiming(12, { duration: 0 });
      backdrop.value = withTiming(0, { duration: 0 });
      setShowModal(true);
      left.value = withSpring(0, SPRING);
      top.value = withSpring(0, SPRING);
      width.value = withSpring(screenWidth, SPRING);
      height.value = withSpring(screenHeight, SPRING);
      radius.value = withTiming(0, { duration: 300 });
      backdrop.value = withTiming(0.45, { duration: 300 });
    });
  }, [backdrop, cardRef, height, left, radius, screenHeight, screenWidth, top, width]);

  const closeMap = React.useCallback(() => {
    cardRef.current?.measureInWindow((...measurements) => {
      const [x, y, measuredWidth, measuredHeight] = measurements;
      left.value = withSpring(x, SPRING);
      top.value = withSpring(y, SPRING);
      width.value = withSpring(measuredWidth, SPRING);
      height.value = withSpring(measuredHeight, SPRING, () => runOnJS(setShowModal)(false));
      radius.value = withTiming(12, { duration: 300 });
      backdrop.value = withTiming(0, { duration: 300 });
    });
  }, [backdrop, cardRef, height, left, radius, top, width]);

  return { showModal, openMap, closeMap, expandedViewStyle, backdropStyle };
}
