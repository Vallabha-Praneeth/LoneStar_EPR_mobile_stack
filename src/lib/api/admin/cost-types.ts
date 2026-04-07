import { supabase } from '@/lib/supabase';

export type CostTypeRow = {
  id: string;
  name: string;
  is_active: boolean;
};

export async function fetchCostTypes(): Promise<CostTypeRow[]> {
  const { data, error } = await supabase
    .from('cost_types')
    .select('id, name, is_active')
    .order('name');
  if (error)
    throw error;
  return (data ?? []) as CostTypeRow[];
}

export async function createCostType(name: string): Promise<void> {
  const { error } = await supabase.from('cost_types').insert({ name: name.trim() });
  if (error)
    throw error;
}

export async function updateCostTypeActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('cost_types')
    .update({ is_active: !isActive })
    .eq('id', id);
  if (error)
    throw error;
}

export async function updateCostTypeName(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('cost_types')
    .update({ name: name.trim() })
    .eq('id', id);
  if (error)
    throw error;
}

export async function deleteCostType(id: string): Promise<void> {
  const { error } = await supabase.from('cost_types').delete().eq('id', id);
  if (error)
    throw error;
}
