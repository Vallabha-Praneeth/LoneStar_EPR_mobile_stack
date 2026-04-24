import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let hasReceivedEvent = false;

    const handleReduceMotionChanged = (isEnabled: boolean) => {
      hasReceivedEvent = true;
      setEnabled(isEnabled);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((isReduceMotionEnabled) => {
        if (isMounted && !hasReceivedEvent) {
          setEnabled(isReduceMotionEnabled);
        }
      })
      .catch(() => {
        // Keep default state when accessibility query fails.
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      handleReduceMotionChanged,
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}
