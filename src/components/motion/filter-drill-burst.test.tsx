/* eslint-disable max-lines-per-function, no-restricted-globals, testing-library/no-unnecessary-act, testing-library/prefer-screen-queries */
import type * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('lottie-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');

  function MockLottieView(props: React.ComponentProps<typeof View>) {
    return <View {...props} />;
  }

  return {
    __esModule: true,
    default: MockLottieView,
  };
});

jest.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: jest.fn(() => false),
}));

const { FilterDrillBurst } = require('./filter-drill-burst');

const useReducedMotionMock = jest.requireMock(
  '@/lib/hooks/use-reduced-motion',
).useReducedMotion as jest.Mock;

describe('filterDrillBurst', () => {
  beforeEach(() => {
    useReducedMotionMock.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    useReducedMotionMock.mockReset();
  });

  it('does not render burst on first mount', () => {
    const { queryByTestId } = render(<FilterDrillBurst trigger="all" />);
    expect(queryByTestId('filter-drill-burst', { includeHiddenElements: true })).toBeNull();
  });

  it('renders burst after trigger changes', async () => {
    const { rerender } = render(<FilterDrillBurst trigger="all" />);
    await act(async () => {});
    act(() => {
      rerender(<FilterDrillBurst trigger="client-42" />);
    });
    await waitFor(() => {
      expect(screen.getByTestId('filter-drill-burst', { includeHiddenElements: true })).not.toBeNull();
    });
  });

  it('renders nothing when reduced motion is enabled', async () => {
    useReducedMotionMock.mockReturnValue(true);

    const { queryByTestId, rerender } = render(<FilterDrillBurst trigger="all" />);
    await act(async () => {});
    act(() => {
      rerender(<FilterDrillBurst trigger="client-42" />);
    });

    expect(queryByTestId('filter-drill-burst', { includeHiddenElements: true })).toBeNull();
  });

  it('does not show delayed burst after reduced motion is turned off', async () => {
    jest.useFakeTimers();
    useReducedMotionMock.mockReturnValue(true);
    const { queryByTestId, rerender } = render(<FilterDrillBurst trigger="all" />);
    await act(async () => {});

    act(() => {
      rerender(<FilterDrillBurst trigger="client-42" />);
    });
    expect(queryByTestId('filter-drill-burst', { includeHiddenElements: true })).toBeNull();

    useReducedMotionMock.mockReturnValue(false);
    act(() => {
      rerender(<FilterDrillBurst trigger="client-42" />);
    });

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(queryByTestId('filter-drill-burst', { includeHiddenElements: true })).toBeNull();
  });

  it('auto-hides after burst visibility timeout', async () => {
    jest.useFakeTimers();
    const { queryByTestId, rerender } = render(<FilterDrillBurst trigger="all" />);
    await act(async () => {});

    act(() => {
      rerender(<FilterDrillBurst trigger="client-42" />);
    });
    await waitFor(() => {
      expect(getByTestId('filter-drill-burst', { includeHiddenElements: true })).not.toBeNull();
    });

    act(() => {
      jest.advanceTimersByTime(2099);
    });
    expect(getByTestId('filter-drill-burst', { includeHiddenElements: true })).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(queryByTestId('filter-drill-burst', { includeHiddenElements: true })).toBeNull();
  });

  it('retrigger resets the visibility window', async () => {
    jest.useFakeTimers();
    const { queryByTestId, rerender } = render(<FilterDrillBurst trigger="all" />);
    await act(async () => {});

    act(() => {
      rerender(<FilterDrillBurst trigger="client-42" />);
    });
    await waitFor(() => {
      expect(getByTestId('filter-drill-burst', { includeHiddenElements: true })).not.toBeNull();
    });

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    act(() => {
      rerender(<FilterDrillBurst trigger="client-43" />);
    });

    act(() => {
      jest.advanceTimersByTime(2099);
    });
    expect(getByTestId('filter-drill-burst', { includeHiddenElements: true })).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(queryByTestId('filter-drill-burst', { includeHiddenElements: true })).toBeNull();
  });

  it('cleans up timers on unmount', async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { rerender, unmount } = render(<FilterDrillBurst trigger="all" />);
    await act(async () => {});

    act(() => {
      rerender(<FilterDrillBurst trigger="client-42" />);
    });
    act(() => {
      unmount();
    });

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
