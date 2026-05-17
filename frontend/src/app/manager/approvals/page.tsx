"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApprovals } from '@/hooks/useApprovals';
import ApprovalDashboard from '@/modules/approvals/ApprovalDashboard';
import GoalReviewPanel from '@/modules/approvals/GoalReviewPanel';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Loader2, CheckCircle2 } from 'lucide-react';
import ManagerLayout from '@/layouts/ManagerLayout';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const {
    teamSheets,
    selectedSheetGoals,
    loading,
    error,
    fetchTeamSheets,
    fetchSheetGoals,
    approveSheet,
    rejectSheet,
    updateGoal
  } = useApprovals() as any;

  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<any>(null); // { type: 'Approve' | 'Reject', sheetId, comments }
  const [successMessage, setSuccessMessage] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    if (user?.id) {
      fetchTeamSheets(user.id);
    }
  }, [user?.id, fetchTeamSheets]);

  // Handlers
  const handleReviewClick = async (sheet: any) => {
    setSelectedSheet(sheet);
    await fetchSheetGoals(sheet.id);
  };

  const handleClosePanel = () => {
    setSelectedSheet(null);
  };

  const initiateApprove = (sheetId: any, comments: any) => {
    setConfirmAction({ type: 'Approve', sheetId, comments });
  };

  const initiateReject = (sheetId: any, comments: any) => {
    if (!comments || comments.trim() === '') {
      alert("Please provide comments before rejecting a goal sheet.");
      return;
    }
    setConfirmAction({ type: 'Reject', sheetId, comments });
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    
    try {
      if (confirmAction.type === 'Approve') {
        await approveSheet(confirmAction.sheetId, user.id, confirmAction.comments);
        setSuccessMessage('Goal sheet approved successfully!');
      } else if (confirmAction.type === 'Reject') {
        await rejectSheet(confirmAction.sheetId, user.id, confirmAction.comments);
        setSuccessMessage('Goal sheet rejected and returned to employee.');
      }
      
      // Cleanup UI
      setConfirmAction(null);
      setSelectedSheet(null);
      
      // Auto-hide success message after 3s
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ManagerLayout>
      <div className="space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Team Approvals</h1>
            <p className="text-white/50 mt-2">
              Review and approve your team's submitted goal sheets.
            </p>
          </div>
        </div>

        {/* Global Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl shadow-lg">
            {error}
          </div>
        )}

        {/* Success Toast */}
        {successMessage && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 size={20} />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Dashboard */}
        {loading && !selectedSheet && !confirmAction ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="w-10 h-10 text-[#A855F7] animate-spin mb-4" />
            <p className="text-white/50 font-medium">Fetching team submissions...</p>
          </div>
        ) : (
          <ApprovalDashboard 
            sheets={teamSheets.filter((s: any) => s.status === 'Submitted')} 
            onReview={handleReviewClick} 
          />
        )}

      </div>

      {/* Slide-over or Modal Review Panel */}
      {selectedSheet && (
        <GoalReviewPanel
          sheet={selectedSheet}
          goals={selectedSheetGoals}
          onClose={handleClosePanel}
          onApprove={initiateApprove}
          onReject={initiateReject}
          onUpdateGoal={updateGoal}
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={!!confirmAction}
          title={confirmAction.type === 'Approve' ? 'Approve Goal Sheet' : 'Reject Goal Sheet'}
          message={`Are you sure you want to ${confirmAction.type.toLowerCase()} this goal sheet? This action will be logged and the employee will be notified.`}
          confirmText={`Yes, ${confirmAction.type}`}
          cancelText="Cancel"
          onConfirm={executeAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </ManagerLayout>
  );
}
