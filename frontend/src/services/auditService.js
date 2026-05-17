import { supabase } from '@/lib/supabase';

// Log any action to audit_logs table
export const logAudit = async ({
  userId,
  userRole,
  action,
  tableName,
  recordId,
  oldValue = null,
  newValue = null,
  description = ''
}) => {
  const { error } = await supabase
    .from('audit_logs')
    .insert([{
      user_id: userId,
      user_role: userRole,
      action,
      table_name: tableName,
      record_id: recordId,
      old_value: oldValue,
      new_value: newValue,
      description
    }]);

  if (error) {
    console.error('Audit log failed:', error);
    // Don't throw — audit failure should never break main flow
  }
};

// Fetch audit logs for admin view
export const getAuditLogs = async (filters = {}) => {
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles!user_id(name, email, role)
    `)
    .order('created_at', { ascending: false });

  if (filters.action) query = query.eq('action', filters.action);
  if (filters.tableName) query = query.eq('table_name', filters.tableName);
  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.from) query = query.gte('created_at', filters.from);
  if (filters.to) query = query.lte('created_at', filters.to);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};
