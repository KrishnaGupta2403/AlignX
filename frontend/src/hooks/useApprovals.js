import { useState, useCallback } from 'react';
import * as approvalService from '@/services/approvalService';

export const useApprovals = () => {
  const [teamSheets, setTeamSheets] = useState([]);
  const [selectedSheetGoals, setSelectedSheetGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all submitted goal sheets for a specific manager
   */
  const fetchTeamSheets = useCallback(async (managerId) => {
    if (!managerId) return;
    setLoading(true);
    setError(null);
    try {
      const sheets = await approvalService.getTeamGoalSheets(managerId);
      setTeamSheets(sheets);
      return sheets;
    } catch (err) {
      setError(err.message || 'Failed to fetch team goal sheets.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all goals attached to a specific sheet (when a manager clicks "View")
   */
  const fetchSheetGoals = useCallback(async (goalSheetId) => {
    if (!goalSheetId) return;
    setLoading(true);
    setError(null);
    try {
      const goals = await approvalService.getGoalsBySheet(goalSheetId);
      setSelectedSheetGoals(goals);
      return goals;
    } catch (err) {
      setError(err.message || 'Failed to fetch goals for this sheet.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Approve a goal sheet and remove it from the pending view
   */
  const approveSheet = useCallback(async (goalSheetId, managerId, comments = '') => {
    setLoading(true);
    setError(null);
    try {
      const result = await approvalService.approveGoalSheet(goalSheetId, managerId, comments);
      
      // Remove the approved sheet from the active list
      setTeamSheets((prev) => prev.filter((sheet) => sheet.id !== goalSheetId));
      
      // Clear the detailed view
      setSelectedSheetGoals([]);
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to approve the goal sheet.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reject a goal sheet and remove it from the pending view
   */
  const rejectSheet = useCallback(async (goalSheetId, managerId, comments = '') => {
    setLoading(true);
    setError(null);
    try {
      const result = await approvalService.rejectGoalSheet(goalSheetId, managerId, comments);
      
      // Remove the rejected sheet from the active list
      setTeamSheets((prev) => prev.filter((sheet) => sheet.id !== goalSheetId));
      
      // Clear the detailed view
      setSelectedSheetGoals([]);
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to reject the goal sheet.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Manager edits a goal's target or weightage inline before making a decision
   */
  const updateGoal = useCallback(async (goalId, updatedData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedGoal = await approvalService.updateGoalInline(goalId, updatedData);
      
      // Live-update the goal in the current detailed view
      setSelectedSheetGoals((prev) => 
        prev.map((g) => (g.id === goalId ? updatedGoal : g))
      );
      
      return updatedGoal;
    } catch (err) {
      setError(err.message || 'Failed to update goal.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate dynamic stats
  const stats = {
    total: teamSheets.length,
    pending: teamSheets.filter(s => s.status === 'Submitted').length,
    approved: teamSheets.filter(s => s.status === 'Approved').length,
    rejected: teamSheets.filter(s => s.status === 'Rejected').length,
  };

  return {
    teamSheets,
    selectedSheetGoals,
    loading,
    error,
    stats,
    fetchTeamSheets,
    fetchSheetGoals,
    approveSheet,
    rejectSheet,
    updateGoal
  };
};
