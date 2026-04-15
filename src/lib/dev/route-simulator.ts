export type SimCoord = [number, number];

type StopLike = {
  longitude: number | null;
  latitude: number | null;
};

type SimulationOptions = {
  stepMs?: number;
  loop?: boolean;
};

const DEFAULT_STEP_MS = 2500;

export function buildRouteSimulationPoints(stops: StopLike[]): SimCoord[] {
  const points = stops
    .filter(stop => stop.longitude != null && stop.latitude != null)
    .map(stop => [stop.longitude!, stop.latitude!] as SimCoord);

  return points.filter((point, index) => {
    if (index === 0)
      return true;
    const previous = points[index - 1];
    return previous[0] !== point[0] || previous[1] !== point[1];
  });
}

export function startRouteSimulation(
  points: SimCoord[],
  onCoord: (coord: SimCoord) => void,
  options: SimulationOptions = {},
): () => void {
  if (points.length === 0)
    return () => {};

  const { stepMs = DEFAULT_STEP_MS, loop = true } = options;
  let index = 0;
  let stopped = false;

  onCoord(points[index]);

  const timer = setInterval(() => {
    if (stopped)
      return;

    if (loop) {
      index = (index + 1) % points.length;
      onCoord(points[index]);
      return;
    }

    if (index < points.length - 1) {
      index += 1;
      onCoord(points[index]);
      if (index === points.length - 1)
        clearInterval(timer);
      return;
    }

    clearInterval(timer);
  }, stepMs);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
