import { supabase } from '@/lib/supabase';

// Get the currently active cycle phase
export const getActiveCycle = async () => {
  const { data, error } = await supabase
    .from('cycles')
    .select('id, name, start_date, end_date, active, phase, created_at')
    .eq('active', true)
    .single();

  if (error) throw error;
  return data;
};

// Get all cycles
export const getAllCycles = async () => {
  const { data, error } = await supabase
    .from('cycles')
    .select('id, name, start_date, end_date, active, phase, created_at')
    .order('start_date', { ascending: true })
    .limit(50);

  if (error) throw error;
  return data || [];
};

// Activate a specific cycle phase
export const activateCycle = async (cycleId) => {
  // First deactivate all cycles
  await supabase
    .from('cycles')
    .update({ active: false })
    .neq('id', cycleId);

  // Then activate the selected one
  const { data, error } = await supabase
    .from('cycles')
    .update({ active: true })
    .eq('id', cycleId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Create a new cycle
export const createCycle = async (cycleData) => {
  const { data, error } = await supabase
    .from('cycles')
    .insert([cycleData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Deactivate all cycles
export const deactivateAllCycles = async () => {
  const { error } = await supabase
    .from('cycles')
    .update({ active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) throw error;
};

// Fetch all profiles with role = 'employee'
export const getAllEmployees = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'employee');

  if (error) throw error;
  return data || [];
};
