"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Trash2, Clock, ShieldAlert } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { 
    notifications, 
    unreadCount, 
    markRead, 
    markAllRead 
  } = useNotifications();

  // Pagination State (10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when dropdown panel opens/closes or notification count changes
  useEffect(() => {
    setCurrentPage(1);
  }, [isOpen, notifications.length]);
  
  // Click outside listener to collapse dropdown panel
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    setIsOpen(false);
    try {
      if (!notification.is_read) {
        await markRead(notification.id);
      }
      if (notification.link) {
        router.push(notification.link);
      }
    } catch (err) {
      console.error('Failed to handle notification click:', err);
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          dot: 'bg-emerald-400'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          dot: 'bg-amber-400'
        };
      case 'error':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          dot: 'bg-rose-400'
        };
      default: // info
        return {
          bg: 'bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20',
          dot: 'bg-[#A855F7]'
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xl transition-all flex items-center justify-center group"
        title="View Notifications"
      >
        <Bell size={20} className="group-hover:rotate-12 transition-transform duration-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-rose-500 to-[#A855F7] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0A0510] animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0A0510]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[999] animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-2xl">Alerts & System Notifications</span>
              {unreadCount > 0 && (
                <span className="text-sm bg-white/10 text-white/80 font-semibold px-2.5 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            {notifications.some(n => !n.is_read) && (
              <button 
                onClick={markAllRead}
                className="text-sm text-[#A855F7] hover:text-white flex items-center gap-1.5 bg-transparent border-0 font-medium cursor-pointer transition-all hover:underline"
              >
                <Check size={14} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications Scroll */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {(() => {
              const totalPages = Math.ceil(notifications.length / itemsPerPage) || 1;
              const paginatedNotifications = notifications.slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              );

              if (notifications.length === 0) {
                return (
                  <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/10 text-white/30">
                      <Check size={22} />
                    </div>
                    <h4 className="text-white font-semibold text-xs">All Caught Up!</h4>
                    <p className="text-white/40 text-[10px] mt-1">There are no unread governance alerts currently logged.</p>
                  </div>
                );
              }

              return paginatedNotifications.map((notification) => {
                const styles = getTypeStyles(notification.type);
                return (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 flex items-start gap-3.5 hover:bg-white/5 transition-all cursor-pointer relative group ${!notification.is_read ? 'bg-white/[0.02]' : ''}`}
                  >
                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <span className={`absolute top-4 left-2 w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                    )}

                    {/* Icon indicator based on type */}
                    <div className={`p-2 rounded-xl flex-shrink-0 ${styles.bg}`}>
                      <ShieldAlert size={16} />
                    </div>

                    {/* Meta/Text info */}
                    <div className="space-y-1 w-full overflow-hidden">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-xl font-bold leading-tight ${!notification.is_read ? 'text-white' : 'text-white/60'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-sm text-white/40 whitespace-nowrap flex items-center gap-1">
                          <Clock size={12} />
                          {timeAgo(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-lg text-white/60 leading-relaxed font-medium break-words">
                        {notification.message}
                      </p>
                    </div>

                  </div>
                );
              });
            })()}
          </div>

          {/* Pagination Controls */}
          {(() => {
            const totalPages = Math.ceil(notifications.length / itemsPerPage) || 1;
            if (totalPages <= 1) return null;
            return (
              <div className="flex justify-between items-center px-4 py-2 border-t border-white/10 bg-white/5 text-xs text-white/60">
                <button
                  disabled={currentPage === 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage(prev => Math.max(1, prev - 1));
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  Prev
                </button>
                <span className="font-mono text-[10px]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  Next
                </button>
              </div>
            );
          })()}

          {/* Footer view-all */}
          <div className="p-3 text-center border-t border-white/5 bg-white/[0.02] text-[10px] text-white/30">
            Real-time compliance monitoring synced.
          </div>

        </div>
      )}

    </div>
  );
}
