import NetInfo from '@react-native-community/netinfo';
import { act, renderHook } from '@testing-library/react-native';

import { useIsOnline } from './use-is-online';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    fetch: jest.fn(),
  },
}));

describe('useIsOnline', () => {
  let listener: ((state: { isConnected: boolean | null }) => void) | null = null;
  let unsubscribe: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    listener = null;
    unsubscribe = jest.fn();

    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      listener = callback;
      return unsubscribe;
    });
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('starts online by default', () => {
    const { result } = renderHook(() => useIsOnline());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOnline).toBe(true);
  });

  it('reflects disconnect after debounce and sets wasOnline true', () => {
    const { result } = renderHook(() => useIsOnline());

    act(() => {
      listener?.({ isConnected: false });
    });

    expect(result.current.isOnline).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOnline).toBe(true);
  });

  it('ignores flicker shorter than debounce', () => {
    const { result } = renderHook(() => useIsOnline());

    act(() => {
      listener?.({ isConnected: false });
    });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    act(() => {
      listener?.({ isConnected: true });
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOnline).toBe(true);
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useIsOnline());

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
