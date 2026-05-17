import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/auditService';

/**
 * Fetch all Submitted goal sheets where manager_id matches the authenticated manager.
 * Joins with the profiles table to pull the employee's name and email.
 */
export const getTeamGoalSheets = async (managerId) => {
  const { data, error } = await supabase
    .from('goal_sheets')
    // We fetch the employee profile data so the manager knows whose sheet it is
    // We also fetch the attached goals to calculate the total count and weightage quickly
    .select('*, employee:profiles!employee_id(name), goals(weightage)')
    .eq('manager_id', managerId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching team goal sheets:', error);
    throw error;
  }
  return data || [];
};

/**
 * Fetch all goals under a specific goal sheet.
 */
export const getGoalsBySheet = async (goalSheetId) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('goal_sheet_id', goalSheetId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching goals by sheet:', error);
    throw error;
  }
  return data || [];
};

/**
 * Update goal sheet status to Approved, and insert an approval record for the audit log.
 */
export const approveGoalSheet = async (goalSheetId, managerId, comments = '') => {
  // 1. Update the goal sheet status and lock it
  const { data: sheetData, error: sheetError } = await supabase
    .from('goal_sheets')
    .update({ 
      status: 'Approved',
      is_locked: true 
    })
    .eq('id', goalSheetId)
    .select()
    .single();

  if (sheetError) {
    console.error('Error approving goal sheet:', sheetError);
    throw sheetError;
  }

  // 2. Update all goals to 'Approved'
  const { error: goalsError } = await supabase
    .from('goals')
    .update({ status: 'Approved' })
    .eq('goal_sheet_id', goalSheetId);

  if (goalsError) {
    console.error('Error updating goals status to Approved:', goalsError);
    throw goalsError;
  }

  // 3. Insert into the approvals audit table
  const { error: approvalError } = await supabase
    .from('approvals')
    .insert([{
      goal_sheet_id: goalSheetId,
      manager_id: managerId,
      action: 'Approved',
      comments: comments
    }]);

  if (approvalError) {
    console.error('Error inserting approval record:', approvalError);
    throw approvalError;
  }

  await logAudit({
    userId: managerId,
    userRole: 'manager',
    action: 'GOAL_APPROVED',
    tableName: 'goal_sheets',
    recordId: goalSheetId,
    newValue: { status: 'Approved', comments },
    description: `Manager approved goal sheet`
  });

  return sheetData;
};

/**
 * Update goal sheet status to Rejected, and insert an approval record (with mandatory feedback/comments).
 */
export const rejectGoalSheet = async (goalSheetId, managerId, comments = '') => {
  // 1. Update the goal sheet status back to Rejected
  const { data: sheetData, error: sheetError } = await supabase
    .from('goal_sheets')
    .update({ status: 'Rejected' })
    .eq('id', goalSheetId)
    .select()
    .single();

  if (sheetError) {
    console.error('Error rejecting goal sheet:', sheetError);
    throw sheetError;
  }

  // 2. Update all goals to 'Rejected'
  const { error: goalsError } = await supabase
    .from('goals')
    .update({ status: 'Rejected' })
    .eq('goal_sheet_id', goalSheetId);

  if (goalsError) {
    console.error('Error updating goals status to Rejected:', goalsError);
    throw goalsError;
  }

  // 3. Insert into the approvals audit table
  const { error: approvalError } = await supabase
    .from('approvals')
    .insert([{
      goal_sheet_id: goalSheetId,
      manager_id: managerId,
      action: 'Rejected',
      comments: comments
    }]);

  if (approvalError) {
    console.error('Error inserting rejection record:', approvalError);
    throw approvalError;
  }

  await logAudit({
    userId: managerId,
    userRole: 'manager',
    action: 'GOAL_REJECTED',
    tableName: 'goal_sheets',
    recordId: goalSheetId,
    newValue: { status: 'Rejected', comments },
    description: `Manager rejected goal sheet with comments: ${comments}`
  });

  return sheetData;
};

/**
 * Manager edits target or weightage inline before approving.
 */
export const updateGoalInline = async (goalId, updatedData) => {
  const { data, error } = await supabase
    .from('goals')
    .update(updatedData)
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    console.error('Error updating goal inline:', error);
    throw error;
  }
  return data;
};

/**
 * Unlock a goal sheet: sets is_locked to false and status to Draft.
 */
/**
 * Admin unlocks a goal sheet — resets to Draft and removes lock
 */
export const unlockGoalSheet = async (goalSheetId, adminId) => {
  const { data, error } = await supabase
  .from('goal_sheets')
  .update({ 
    status: 'Draft',
    is_locked: false
  })
  .eq('id', goalSheetId)
  .select();

  if (error) {
    console.error('Error unlocking goal sheet:', error);
    throw error;
  }

  // Log audit
  await logAudit({
    userId: adminId,
    userRole: 'admin',
    action: 'SHEET_UNLOCKED',
    tableName: 'goal_sheets',
    recordId: goalSheetId,
    description: 'Admin unlocked goal sheet for employee to re-edit'
  });

  return data;
};
