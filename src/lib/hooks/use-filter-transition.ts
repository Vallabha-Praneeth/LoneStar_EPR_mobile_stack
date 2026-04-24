import * as React from 'react';

type UseFilterTransitionOptions = {
  durationMs?: number;
};

export function useFilterTransition({
  durationMs = 700,
}: UseFilterTransitionOptions = {}) {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTransition = React.useCallback(() => {
    setIsTransitioning(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsTransitioning(false);
      timerRef.current = null;
    }, durationMs);
  }, [durationMs]);

  React.useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return {
    isTransitioning,
    startTransition,
  } as const;
}
