import { supabase } from '@/lib/supabase';

/**
 * Fetch all achievement records for a specific goal sheet and quarter.
 * Useful to display current actuals/progress on employee and manager screens.
 */
export const getAchievements = async (goalSheetId, quarter) => {
  if (!goalSheetId || !quarter) return [];

  const { data, error } = await supabase
    .from('achievements')
    .select('id, goal_id, goal_sheet_id, quarter, actual, employee_comments, created_at, updated_at')
    .eq('goal_sheet_id', goalSheetId)
    .eq('quarter', quarter)
    .limit(50);

  if (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
  return data || [];
};

/**
 * Insert or update an achievement record for a specific goal in a quarter.
 * Uses upsert to dynamically handle inserts and modifications.
 */
export const upsertAchievement = async (achievementData) => {
  const { data, error } = await supabase
    .from('achievements')
    .upsert([achievementData], {
      onConflict: 'goal_id,quarter'
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting achievement:', error);
    throw error;
  }
  return data;
};

/**
 * Fetch manager check-in records for a specific goal sheet and quarter.
 * Sorted by newest first.
 */
export const getCheckins = async (goalSheetId, quarter) => {
  if (!goalSheetId || !quarter) return [];

  const { data, error } = await supabase
    .from('checkins')
    .select('id, goal_sheet_id, quarter, manager_id, comments, status, created_at')
    .eq('goal_sheet_id', goalSheetId)
    .eq('quarter', quarter)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching manager checkins:', error);
    throw error;
  }
  return data || [];
};

/**
 * Manager submits a new check-in with comments and assessment for a quarter.
 */
export const addManagerCheckin = async (checkinData) => {
  const { data, error } = await supabase
    .from('checkins')
    .insert([checkinData])
    .select()
    .single();

  if (error) {
    console.error('Error adding manager checkin:', error);
    throw error;
  }
  return data;
};
