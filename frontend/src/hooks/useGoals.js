import { useState, useEffect, useCallback } from 'react';
import * as goalService from '@/services/goalService';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/auditService';

// Global cache for goals to prevent unmounting/loading flickers on page-switches
const goalsCache = {};

export const useGoals = (employeeId) => {
  const cacheKey = employeeId || 'anonymous';
  const cached = goalsCache[cacheKey] || { goalSheet: null, goals: [], loaded: false };

  const [goalSheet, setGoalSheet] = useState(cached.goalSheet);
  const [goals, setGoals] = useState(cached.goals);
  const [loading, setLoading] = useState(!cached.loaded);
  const [error, setError] = useState(null);

  // Auto-fetch goals on component mount or when employeeId changes
  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    const fetchGoalsData = async () => {
      if (!goalsCache[employeeId]?.loaded) {
        setLoading(true);
      }
      setError(null);
      try {
        // Fetch the active goal sheet
        let sheet = await goalService.getGoalSheet(employeeId);
        
        if (!sheet) {
          // Auto-create on load if doesn't exist
          sheet = await goalService.createGoalSheet(employeeId);
        }

        if (sheet) {
          // If a sheet exists, fetch its goals
          const fetchedGoals = await goalService.getGoals(sheet.id);
          
          // Save to global cache
          goalsCache[employeeId] = {
            goalSheet: sheet,
            goals: fetchedGoals,
            loaded: true
          };

          if (isMounted) {
            setGoalSheet(sheet);
            setGoals(fetchedGoals);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load goals data.');
          console.error(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGoalsData();

    return () => {
      isMounted = false;
    };
  }, [employeeId]);

  // Helper to update global cache
  const updateCache = useCallback((newSheet, newGoals) => {
    if (employeeId) {
      goalsCache[employeeId] = {
        goalSheet: newSheet !== undefined ? newSheet : (goalsCache[employeeId]?.goalSheet || null),
        goals: newGoals !== undefined ? newGoals : (goalsCache[employeeId]?.goals || []),
        loaded: true
      };
    }
  }, [employeeId]);

  // Helper to silently reset a Rejected sheet back to Draft when the user starts making changes
  const resetToDraftIfRejected = async (currentGoals) => {
    if (goalSheet?.status === 'Rejected') {
      // 1. Update all goals to 'Draft'
      const { error: goalsError } = await supabase
        .from('goals')
        .update({ status: 'Draft' })
        .eq('goal_sheet_id', goalSheet.id);

      if (goalsError) {
        console.error('Error resetting goals status to Draft:', goalsError);
      }

      // 2. Update goal sheet to 'Draft'
      const { data, error } = await supabase
        .from('goal_sheets')
        .update({ status: 'Draft' })
        .eq('id', goalSheet.id)
        .select()
        .single();
      
      if (!error && data) {
        setGoalSheet(data);
        const updatedGoals = (currentGoals || goals).map(g => ({ ...g, status: 'Draft' }));
        setGoals(updatedGoals);
        updateCache(data, updatedGoals);
      }
    }
  };

  // Add a new goal
  const addGoal = useCallback(async (goalData) => {
    setError(null);
    setLoading(true);
    try {
      let currentSheetId = goalSheet?.id;
      let activeSheet = goalSheet;

      // If the employee doesn't have a goal sheet yet, automatically create one first
      if (!currentSheetId) {
        const newSheet = await goalService.createGoalSheet(employeeId);
        setGoalSheet(newSheet);
        activeSheet = newSheet;
        currentSheetId = newSheet.id;
        updateCache(newSheet, undefined);
      }

      const newGoal = await goalService.createGoal({
        ...goalData,
        goal_sheet_id: currentSheetId,
        employee_id: employeeId,
        status: 'Draft'
      });

      setGoals((prev) => {
        const updated = [...prev, newGoal];
        updateCache(activeSheet, updated);
        return updated;
      });
      
      await logAudit({
        userId: employeeId,
        userRole: 'employee',
        action: 'GOAL_CREATED',
        tableName: 'goals',
        recordId: newGoal.id,
        newValue: newGoal,
        description: `Employee created goal: ${newGoal.title}`
      });
      
      await resetToDraftIfRejected([...goals, newGoal]);
      
      return newGoal;
    } catch (err) {
      setError(err.message || 'Failed to add goal.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [employeeId, goalSheet, goals, updateCache]);

  // Edit an existing goal
  const editGoal = useCallback(async (goalId, updatedData) => {
    setError(null);
    setLoading(true);
    try {
      const oldGoal = goals.find(g => g.id === goalId);
      
      const updatedGoal = await goalService.updateGoal(goalId, {
        title: updatedData.title,
        description: updatedData.description,
        target: updatedData.target,
        uom_type: updatedData.uom_type,
        weightage: updatedData.weightage,
      });
      
      setGoals((prev) => {
        const updated = prev.map((g) => (g.id === goalId ? updatedGoal : g));
        updateCache(goalSheet, updated);
        return updated;
      });
      
      await logAudit({
        userId: employeeId,
        userRole: 'employee',
        action: 'GOAL_UPDATED',
        tableName: 'goals',
        recordId: goalId,
        oldValue: oldGoal,
        newValue: updatedGoal,
        description: `Employee updated goal: ${updatedGoal.title}`
      });
      
      await resetToDraftIfRejected();
      
      return updatedGoal;
    } catch (err) {
      setError(err.message || 'Failed to update goal.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [employeeId, goalSheet, goals, updateCache]);

  // Remove a goal
  const removeGoal = useCallback(async (goalId) => {
    setError(null);
    setLoading(true);
    try {
      const goalToLog = goals.find(g => g.id === goalId);
      await logAudit({
        userId: employeeId,
        userRole: 'employee',
        action: 'GOAL_DELETED',
        tableName: 'goals',
        recordId: goalId,
        oldValue: goalToLog,
        description: `Employee deleted goal: ${goalToLog?.title}`
      });
      
      await goalService.deleteGoal(goalId);
      setGoals((prev) => {
        const updated = prev.filter((g) => g.id !== goalId);
        updateCache(goalSheet, updated);
        return updated;
      });
      
      await resetToDraftIfRejected();
    } catch (err) {
      setError(err.message || 'Failed to delete goal.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [employeeId, goalSheet, goals, updateCache]);

  // Submit all goals (Updates the goal sheet status)
  const submitGoals = useCallback(async () => {
    if (!goalSheet?.id) return;
    
    setError(null);
    setLoading(true);
    try {
      const updatedSheet = await goalService.submitGoalSheet(goalSheet.id, employeeId);
      setGoalSheet(updatedSheet);
      updateCache(updatedSheet, undefined);
      
      await logAudit({
        userId: employeeId,
        userRole: 'employee',
        action: 'SHEET_SUBMITTED',
        tableName: 'goal_sheets',
        recordId: goalSheet.id,
        description: `Employee submitted goal sheet for approval`
      });

      return updatedSheet;
    } catch (err) {
      setError(err.message || 'Failed to submit goals.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [goalSheet, employeeId, updateCache]);

  return {
    goalSheet,
    goals,
    loading,
    error,
    addGoal,
    editGoal,
    removeGoal,
    submitGoals,
  };
};
