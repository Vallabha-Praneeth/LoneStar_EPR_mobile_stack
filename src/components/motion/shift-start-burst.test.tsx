/* eslint-disable testing-library/prefer-screen-queries */
import { act, render } from '@testing-library/react-native';
import * as React from 'react';

let mockOnStateChanged: (() => void) | undefined;

jest.mock('rive-react-native', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');

  function MockRive(props: React.ComponentProps<typeof View> & { onStateChanged?: () => void }) {
    mockOnStateChanged = props.onStateChanged;
    return ReactLocal.createElement(View, props);
  }

  return {
    __esModule: true,
    default: MockRive,
    Alignment: { Center: 'center' },
    Fit: { Contain: 'contain' },
  };
});

jest.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: jest.fn(() => false),
}));

const { ShiftStartBurst } = require('./shift-start-burst');

const useReducedMotionMock = jest.requireMock(
  '@/lib/hooks/use-reduced-motion',
).useReducedMotion as jest.Mock;

describe('shiftStartBurst', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useReducedMotionMock.mockReturnValue(false);
    mockOnStateChanged = undefined;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    useReducedMotionMock.mockReset();
  });

  it('renders nothing when not visible', () => {
    const { queryByTestId } = render(<ShiftStartBurst visible={false} onComplete={jest.fn()} />);
    expect(queryByTestId('shift-start-burst', { includeHiddenElements: true })).toBeNull();
  });

  it('renders when visible', () => {
    const { getByTestId } = render(<ShiftStartBurst visible onComplete={jest.fn()} />);
    expect(getByTestId('shift-start-burst', { includeHiddenElements: true })).toBeTruthy();
  });

  it('calls onComplete after 2500ms fallback', () => {
    const onComplete = jest.fn();
    render(<ShiftStartBurst visible onComplete={onComplete} />);

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete immediately when reduced motion on', () => {
    useReducedMotionMock.mockReturnValue(true);
    const onComplete = jest.fn();

    render(<ShiftStartBurst visible onComplete={onComplete} />);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when state machine exits', () => {
    const onComplete = jest.fn();
    render(<ShiftStartBurst visible onComplete={onComplete} />);

    act(() => {
      mockOnStateChanged?.();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
