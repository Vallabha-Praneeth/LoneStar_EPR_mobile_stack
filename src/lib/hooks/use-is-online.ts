import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 500;

export function useIsOnline(): { isOnline: boolean; wasOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOnline, setWasOnline] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasReceivedLiveEventRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const applyOnlineState = (nextIsOnline: boolean) => {
      setIsOnline((previousIsOnline) => {
        setWasOnline(previousIsOnline);
        return nextIsOnline;
      });
    };

    NetInfo.fetch()
      .then((state) => {
        if (!isMounted || hasReceivedLiveEventRef.current) {
          return;
        }

        applyOnlineState(state.isConnected !== false);
      })
      .catch(() => {
        // Keep default optimistic online state if initial check fails.
      });

    const unsubscribe = NetInfo.addEventListener((state) => {
      hasReceivedLiveEventRef.current = true;
      const nextIsOnline = state.isConnected !== false;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        applyOnlineState(nextIsOnline);
      }, DEBOUNCE_MS);
    });

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      unsubscribe();
    };
  }, []);

  return { isOnline, wasOnline };
}
