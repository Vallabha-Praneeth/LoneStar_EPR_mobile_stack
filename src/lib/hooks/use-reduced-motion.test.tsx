/* eslint-disable max-lines-per-function */
import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useReducedMotion } from './use-reduced-motion';

describe('useReducedMotion', () => {
  let removeMock: jest.Mock;
  let reduceMotionChangedHandler: ((enabled: boolean) => void) | undefined;
  let isReduceMotionEnabledMock: jest.SpiedFunction<typeof AccessibilityInfo.isReduceMotionEnabled>;

  beforeEach(() => {
    removeMock = jest.fn();
    reduceMotionChangedHandler = undefined;

    isReduceMotionEnabledMock = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled');
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((eventName, handler) => {
      if ((eventName as string) === 'reduceMotionChanged') {
        reduceMotionChangedHandler = handler as unknown as (enabled: boolean) => void;
      }

      return { remove: removeMock } as never;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts as false while async system value resolves to false', async () => {
    let resolveReduceMotion: ((value: boolean) => void) | undefined;
    isReduceMotionEnabledMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveReduceMotion = resolve;
        }),
    );

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    await act(async () => {
      resolveReduceMotion?.(false);
      await Promise.resolve();
    });

    expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(false);
  });

  it('updates to true when system reduced motion is enabled', async () => {
    let resolveReduceMotion: ((value: boolean) => void) | undefined;
    isReduceMotionEnabledMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveReduceMotion = resolve;
        }),
    );

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    await act(async () => {
      resolveReduceMotion?.(true);
      await Promise.resolve();
    });

    expect(result.current).toBe(true);
  });

  it('updates state on reduceMotionChanged events', () => {
    isReduceMotionEnabledMock.mockImplementation(() => new Promise<boolean>(() => {}));
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      reduceMotionChangedHandler?.(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      reduceMotionChangedHandler?.(false);
    });
    expect(result.current).toBe(false);
  });

  it('handles isReduceMotionEnabled rejection without unhandled errors', async () => {
    let rejectReduceMotion: ((error: Error) => void) | undefined;
    isReduceMotionEnabledMock.mockImplementation(
      () =>
        new Promise<boolean>((_, reject) => {
          rejectReduceMotion = reject;
        }),
    );

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    await act(async () => {
      rejectReduceMotion?.(new Error('query failed'));
      await Promise.resolve();
    });

    expect(result.current).toBe(false);
  });

  it('does not let async init overwrite newer reduceMotionChanged state', async () => {
    let resolveReduceMotion: ((value: boolean) => void) | undefined;
    isReduceMotionEnabledMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveReduceMotion = resolve;
        }),
    );

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      reduceMotionChangedHandler?.(true);
    });
    expect(result.current).toBe(true);

    await act(async () => {
      resolveReduceMotion?.(false);
      await Promise.resolve();
    });

    expect(result.current).toBe(true);
  });

  it('unsubscribes from reduceMotionChanged listener on unmount', () => {
    isReduceMotionEnabledMock.mockImplementation(() => new Promise<boolean>(() => {}));
    const { unmount } = renderHook(() => useReducedMotion());

    unmount();

    expect(removeMock).toHaveBeenCalledTimes(1);
  });
});
