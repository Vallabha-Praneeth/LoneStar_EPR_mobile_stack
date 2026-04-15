import { act, renderHook } from '@testing-library/react-native';

import {
  driverPositionChannelName,
  useDriverPositionSubscriber,
  useDriverPositionSubscriberSnapshot,
} from '@/lib/realtime/driver-location';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

describe('driver-location realtime helpers', () => {
  const { supabase } = jest.requireMock('@/lib/supabase') as {
    supabase: {
      channel: jest.Mock;
      removeChannel: jest.Mock;
    };
  };
  const mockChannel = {
    on: jest.fn(),
    subscribe: jest.fn(),
    send: jest.fn(),
  };
  let broadcastHandler: ((event: { payload: { lat: number; lng: number; ts: number } }) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    broadcastHandler = null;
    mockChannel.on.mockImplementation((_, __, cb) => {
      broadcastHandler = cb;
      return mockChannel;
    });
    mockChannel.subscribe.mockReturnValue(mockChannel);
    supabase.channel.mockReturnValue(mockChannel);
  });

  it('builds consistent channel names', () => {
    expect(driverPositionChannelName('shift-123')).toBe('driver-position:shift-123');
  });

  it('returns timestamp-aware snapshot and dedups bursty duplicates', () => {
    const { result } = renderHook(() => useDriverPositionSubscriberSnapshot('shift-1'));
    expect(result.current).toBeNull();

    act(() => {
      broadcastHandler?.({ payload: { lat: 17.1, lng: 78.4, ts: 1000 } });
    });
    expect(result.current).toEqual({ coord: [78.4, 17.1], ts: 1000 });

    act(() => {
      broadcastHandler?.({ payload: { lat: 17.1, lng: 78.4, ts: 4000 } });
    });
    expect(result.current).toEqual({ coord: [78.4, 17.1], ts: 1000 });

    act(() => {
      broadcastHandler?.({ payload: { lat: 17.1, lng: 78.4, ts: 7000 } });
    });
    expect(result.current).toEqual({ coord: [78.4, 17.1], ts: 7000 });
  });

  it('keeps backward-compatible coord-only subscriber', () => {
    const { result } = renderHook(() => useDriverPositionSubscriber('shift-2'));
    act(() => {
      broadcastHandler?.({ payload: { lat: 12.34, lng: 56.78, ts: 123_456 } });
    });
    expect(result.current).toEqual([56.78, 12.34]);
  });
});
