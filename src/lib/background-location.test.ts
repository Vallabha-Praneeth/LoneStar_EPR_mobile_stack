import * as Location from 'expo-location';

import {
  getLastKnownTrackingCoordForShift,
  MMKV_LAST_COORD_KEY,
  MMKV_SHIFT_ID_KEY,
  startShiftTracking,
  stopShiftTracking,
} from '@/lib/background-location';

jest.mock('@/lib/storage', () => ({
  storage: {
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));
jest.mock('@/lib/realtime/driver-location', () => ({
  driverPositionChannelName: (shiftId: string) => `driver-position:${shiftId}`,
}));
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
}));
jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 3,
  },
  hasStartedLocationUpdatesAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
}));

describe('background-location MMKV helpers', () => {
  const { storage } = jest.requireMock('@/lib/storage') as {
    storage: {
      getString: jest.Mock;
      set: jest.Mock;
      remove: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(Location.hasStartedLocationUpdatesAsync).mockResolvedValue(false);
    jest.mocked(Location.startLocationUpdatesAsync).mockResolvedValue(undefined);
    jest.mocked(Location.stopLocationUpdatesAsync).mockResolvedValue(undefined);
  });

  it('returns cached coord only for matching shift', () => {
    storage.getString.mockReturnValue(JSON.stringify({
      shiftId: 'shift-a',
      lat: 12.91,
      lng: 77.62,
      ts: 123,
    }));

    expect(getLastKnownTrackingCoordForShift('shift-a')).toEqual({
      coord: [77.62, 12.91],
      ts: 123,
    });
    expect(getLastKnownTrackingCoordForShift('shift-b')).toBeNull();
  });

  it('handles malformed cached payload safely', () => {
    storage.getString.mockReturnValue('not-json');
    expect(getLastKnownTrackingCoordForShift('shift-a')).toBeNull();
  });

  it('stores shift id and starts background updates when not running', async () => {
    jest.mocked(Location.hasStartedLocationUpdatesAsync).mockResolvedValue(false);
    await startShiftTracking('shift-a');

    expect(storage.set).toHaveBeenCalledWith(MMKV_SHIFT_ID_KEY, 'shift-a');
    expect(Location.hasStartedLocationUpdatesAsync).toHaveBeenCalled();
    expect(Location.startLocationUpdatesAsync).toHaveBeenCalled();
  });

  it('clears tracking MMKV keys and stops updates', async () => {
    jest.mocked(Location.hasStartedLocationUpdatesAsync).mockResolvedValue(true);
    await stopShiftTracking();

    expect(storage.remove).toHaveBeenCalledWith(MMKV_SHIFT_ID_KEY);
    expect(storage.remove).toHaveBeenCalledWith(MMKV_LAST_COORD_KEY);
    expect(Location.stopLocationUpdatesAsync).toHaveBeenCalled();
  });
});
