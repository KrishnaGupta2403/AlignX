import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/services/notificationService';

/**
 * Fetch employee's current goal sheet.
 */
export const getGoalSheet = async (employeeId) => {
  const { data, error } = await supabase
    .from('goal_sheets')
    .select('id, created_at, employee_id, status, manager_id, cycle_id, is_locked, cycle:cycles(name)')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching goal sheet:', error);
    throw error;
  }
  return data;
};

/**
 * Create a new goal sheet with Draft status.
 */
export const createGoalSheet = async (employeeId, cycleId) => {
  const { data, error } = await supabase
    .from('goal_sheets')
    .insert([{ 
      employee_id: employeeId, 
      status: 'Draft',
      cycle_id: cycleId
    }])
    .select('id, created_at, employee_id, status, manager_id, cycle_id, is_locked')
    .single();

  if (error) {
    console.error('Error creating goal sheet:', error);
    throw error;
  }
  return data;
};

/**
 * Fetch all goals under a specific goal sheet.
 */
export const getGoals = async (goalSheetId) => {
  if (!goalSheetId) return [];

  const { data, error } = await supabase
    .from('goals')
    .select('id, goal_sheet_id, title, description, weightage, target, uom_type, status, created_at')
    .eq('goal_sheet_id', goalSheetId)
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }
  return data || [];
};

/**
 * Insert a new goal row.
 */
export const createGoal = async (goalData) => {
  const { data, error } = await supabase
    .from('goals')
    .insert([goalData])
    .select('id, goal_sheet_id, title, description, weightage, target, uom_type, status, created_at')
    .single();

  if (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
  return data;
};

/**
 * Update an existing goal.
 */
export const updateGoal = async (goalId, updatedData) => {
  const { data, error } = await supabase
    .from('goals')
    .update(updatedData)
    .eq('id', goalId)
    .select('id, goal_sheet_id, title, description, weightage, target, uom_type, status, created_at')
    .single();

  if (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
  return data;
};

/**
 * Delete a goal.
 */
export const deleteGoal = async (goalId) => {
  const { data, error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .select('id, goal_sheet_id, title');

  if (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
  return data;
};

/**
 * Update goal sheet status to Submitted.
 */
export const submitGoalSheet = async (goalSheetId, employeeId) => {
  if (!employeeId) throw new Error("employeeId is required");

  // 1. Fetch the employee's manager_id from their profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('manager_id')
    .eq('id', employeeId)
    .single();

  if (profileError) {
    console.error('Error fetching profile for manager_id:', profileError);
    throw profileError;
  }

  // 2. Update all goals attached to this sheet to 'Submitted'
  const { error: goalsError } = await supabase
    .from('goals')
    .update({ status: 'Submitted' })
    .eq('goal_sheet_id', goalSheetId);

  if (goalsError) {
    console.error('Error updating goals status to Submitted:', goalsError);
    throw goalsError;
  }

  // 3. Update the goal sheet with both the Submitted status and the manager_id
  const { data, error } = await supabase
    .from('goal_sheets')
    .update({ 
      status: 'Submitted',
      manager_id: profile?.manager_id || null
    })
    .eq('id', goalSheetId)
    .select('id, created_at, employee_id, status, manager_id, cycle_id, is_locked')
    .single();

  if (error) {
    console.error('Error submitting goal sheet:', error);
    throw error;
  }

  // Fetch manager_id from profile then notify manager
  if (profile?.manager_id) {
    await sendNotification({
      userId: profile.manager_id,
      title: 'New Goal Sheet Submitted',
      message: 'An employee has submitted their goal sheet for your review and approval.',
      type: 'info',
      link: '/manager/approvals'
    });
  }

  return data;
};
