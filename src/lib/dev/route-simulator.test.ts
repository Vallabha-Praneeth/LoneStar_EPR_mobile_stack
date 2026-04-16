import { buildRouteSimulationPoints, startRouteSimulation } from '@/lib/dev/route-simulator';

describe('route simulator helpers', () => {
  it('builds simulation points from valid route coordinates', () => {
    const points = buildRouteSimulationPoints([
      { latitude: 12.91, longitude: 77.62 },
      { latitude: 12.91, longitude: 77.62 }, // duplicate consecutive
      { latitude: 12.93, longitude: 77.64 },
      { latitude: null, longitude: 77.65 },
    ]);

    expect(points).toEqual([
      [77.62, 12.91],
      [77.64, 12.93],
    ]);
  });

  it('steps through points and supports cleanup', () => {
    jest.useFakeTimers();
    const onCoord = jest.fn();

    const stop = startRouteSimulation(
      [
        [77.62, 12.91],
        [77.63, 12.92],
      ],
      onCoord,
      { stepMs: 1000, loop: true },
    );

    expect(onCoord).toHaveBeenNthCalledWith(1, [77.62, 12.91]);
    jest.advanceTimersByTime(1000);
    expect(onCoord).toHaveBeenNthCalledWith(2, [77.63, 12.92]);
    jest.advanceTimersByTime(1000);
    expect(onCoord).toHaveBeenNthCalledWith(3, [77.62, 12.91]);

    stop();
    jest.advanceTimersByTime(3000);
    expect(onCoord).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
  });
});
