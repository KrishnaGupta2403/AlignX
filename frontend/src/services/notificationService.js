import { supabase } from '@/lib/supabase';

// Send a notification to a specific user
export const sendNotification = async ({ userId, title, message, type = 'info', link = null }) => {
  const { error } = await supabase
    .from('notifications')
    .insert([{ user_id: userId, title, message, type, link }]);

  if (error) {
    console.error('Error sending notification:', error);
    // Don't throw — notification failure should never break main flow
  }
};

// Fetch all notifications for logged in user
export const getNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, created_at, user_id, title, message, type, link, is_read')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
};

// Mark a single notification as read
export const markAsRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
};

// Mark all notifications as read
export const markAllAsRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (error) throw error;
};

// Get unread notification count
export const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
};
