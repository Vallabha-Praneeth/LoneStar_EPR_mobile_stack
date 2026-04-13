import { supabase } from '@/lib/supabase';

export type AdminRouteRow = {
  id: string;
  name: string;
  city: string | null;
  is_active: boolean;
  route_stops: { id: string }[];
};

export type RouteStopRow = {
  id: string;
  stop_order: number;
  venue_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type RouteDetail = {
  id: string;
  name: string;
  city: string | null;
  is_active: boolean;
  route_stops: RouteStopRow[];
};

export type RouteStopInput = {
  venue_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type UpsertRouteParams = {
  routeId?: string;
  name: string;
  city: string | null;
  isActive: boolean;
  stops: RouteStopInput[];
};

export async function fetchAdminRoutes(): Promise<AdminRouteRow[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('id, name, city, is_active, route_stops ( id )')
    .order('name');
  if (error)
    throw error;
  return (data ?? []) as AdminRouteRow[];
}

export async function fetchRouteById(id: string): Promise<RouteDetail> {
  const { data, error } = await supabase
    .from('routes')
    .select('id, name, city, is_active, route_stops ( id, stop_order, venue_name, address, latitude, longitude )')
    .eq('id', id)
    .single();
  if (error)
    throw error;
  const route = data as RouteDetail;
  route.route_stops = (route.route_stops ?? []).sort((a, b) => a.stop_order - b.stop_order);
  return route;
}

export async function toggleRouteActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('routes')
    .update({ is_active: !isActive })
    .eq('id', id);
  if (error)
    throw error;
}

export async function deleteRoute(id: string): Promise<void> {
  const { error } = await supabase.from('routes').delete().eq('id', id);
  if (error)
    throw error;
}

async function insertStopsForRoute(routeId: string, stops: RouteStopInput[]): Promise<void> {
  const valid = stops.filter(s => s.venue_name.trim());
  if (valid.length === 0)
    return;
  const { error } = await supabase.from('route_stops').insert(
    valid.map((s, i) => ({
      route_id: routeId,
      stop_order: i + 1,
      venue_name: s.venue_name.trim(),
      address: s.address?.trim() || null,
      latitude: s.latitude,
      longitude: s.longitude,
    })),
  );
  if (error)
    throw error;
}

export async function upsertRoute(p: UpsertRouteParams): Promise<void> {
  const name = p.name.trim();
  const city = p.city;
  const { isActive, stops } = p;

  if (p.routeId) {
    const { error: routeErr } = await supabase
      .from('routes')
      .update({ name, city, is_active: isActive })
      .eq('id', p.routeId);
    if (routeErr)
      throw routeErr;
    const { error: delErr } = await supabase.from('route_stops').delete().eq('route_id', p.routeId);
    if (delErr)
      throw delErr;
    await insertStopsForRoute(p.routeId, stops);
    return;
  }

  const { data: newRoute, error: routeErr } = await supabase
    .from('routes')
    .insert({ name, city, is_active: isActive })
    .select('id')
    .single();
  if (routeErr)
    throw routeErr;
  await insertStopsForRoute(newRoute.id, stops);
}
