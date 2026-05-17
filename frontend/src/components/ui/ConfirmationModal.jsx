"use client";

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel" 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#1A1423] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Decorator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600" />
        
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="bg-red-500/10 p-3 rounded-full flex-shrink-0 mt-1">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-white/70 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-8">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-white/70 font-medium hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors shadow-lg shadow-red-500/20"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
