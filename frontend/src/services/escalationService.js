import { supabase } from '@/lib/supabase';
import { sendNotification } from './notificationService';

// Create a new escalation
export const createEscalation = async ({ employeeId, managerId, issue, level = 1 }) => {
  const { data, error } = await supabase
    .from('escalations')
    .insert([{
      employee_id: employeeId,
      manager_id: managerId,
      issue,
      escalation_level: level,
      resolved: false
    }])
    .select('id, employee_id, manager_id, issue, escalation_level, resolved, created_at')
    .single();

  if (error) throw error;
  return data;
};

// Fetch all escalations (admin view)
export const getAllEscalations = async () => {
  const { data, error } = await supabase
    .from('escalations')
    .select(`
      id,
      employee_id,
      manager_id,
      issue,
      escalation_level,
      resolved,
      created_at,
      employee:profiles!employee_id(name, email),
      manager:profiles!manager_id(name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
};

// Mark escalation as resolved
export const resolveEscalation = async (escalationId) => {
  const { error } = await supabase
    .from('escalations')
    .update({ resolved: true })
    .eq('id', escalationId);

  if (error) throw error;
};

// Check for Draft sheets older than 7 days and escalate/notify
export const checkAndEscalatePendingSheets = async () => {
  // Fetch all Draft sheets older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: draftSheets, error } = await supabase
    .from('goal_sheets')
    .select('id, employee_id, status, created_at, employee:profiles!employee_id(name, manager_id)')
    .eq('status', 'Draft')
    .lt('created_at', sevenDaysAgo.toISOString())
    .limit(50);

  if (error) throw error;

  for (const sheet of draftSheets) {
    const managerId = sheet.employee?.manager_id;
    if (!managerId) continue;

    // Create escalation
    await createEscalation({
      employeeId: sheet.employee_id,
      managerId,
      issue: 'Employee has not submitted goal sheet for over 7 days',
      level: 1
    });

    // Notify manager
    await sendNotification({
      userId: managerId,
      title: 'Goal Submission Overdue',
      message: `${sheet.employee?.name} has not submitted their goal sheet. Please follow up.`,
      type: 'warning',
      link: '/manager/approvals'
    });
  }
};
