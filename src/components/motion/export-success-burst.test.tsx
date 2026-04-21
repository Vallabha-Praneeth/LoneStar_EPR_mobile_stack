import type * as React from 'react';
import { act, render, screen } from '@testing-library/react-native';

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

const { ExportSuccessBurst } = require('./export-success-burst');

const useReducedMotionMock = jest.requireMock(
  '@/lib/hooks/use-reduced-motion',
).useReducedMotion as jest.Mock;

describe('exportSuccessBurst', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useReducedMotionMock.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    useReducedMotionMock.mockReset();
  });

  it('renders when visible is true', () => {
    render(<ExportSuccessBurst visible onHide={jest.fn()} />);
    expect(screen.getByTestId('export-success-burst', { includeHiddenElements: true })).not.toBeNull();
  });

  it('renders nothing when visible is false', () => {
    render(<ExportSuccessBurst visible={false} onHide={jest.fn()} />);
    expect(screen.queryByTestId('export-success-burst', { includeHiddenElements: true })).toBeNull();
  });

  it('calls onHide after 2000ms', () => {
    const onHide = jest.fn();

    render(<ExportSuccessBurst visible onHide={onHide} />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('reduced motion enabled renders nothing and still calls onHide after 2000ms', () => {
    useReducedMotionMock.mockReturnValue(true);
    const onHide = jest.fn();

    render(<ExportSuccessBurst visible onHide={onHide} />);
    expect(screen.queryByTestId('export-success-burst', { includeHiddenElements: true })).toBeNull();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onHide).toHaveBeenCalledTimes(1);
  });
});
