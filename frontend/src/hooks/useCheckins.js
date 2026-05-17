import { useState, useCallback } from 'react';
import * as achievementService from '@/services/achievementService';
import { calculateProgress } from '@/services/progressService';

// Global cache for checkin achievements to prevent flicker on tab/page changes
const achievementsCache = {};

export const useCheckins = (initialQuarter = 'Q1') => {
  const [achievements, setAchievements] = useState([]);
  const [activeQuarter, setActiveQuarter] = useState(initialQuarter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all achievements for a goal sheet and specific quarter
   */
  const fetchAchievements = useCallback(async (goalSheetId, quarter) => {
    if (!goalSheetId || !quarter) return [];
    
    const cacheKey = `${goalSheetId}_${quarter}`;
    const cached = achievementsCache[cacheKey];
    
    if (cached) {
      setAchievements(cached);
    } else {
      if (!achievements.length) setLoading(true);
    }
    
    setError(null);
    try {
      const data = await achievementService.getAchievements(goalSheetId, quarter);
      achievementsCache[cacheKey] = data;
      setAchievements(data);
      return data;
    } catch (err) {
      const errMsg = err.message || 'Failed to fetch achievements.';
      setError(errMsg);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Directly save/upsert an achievement record
   */
  const saveAchievement = useCallback(async (achievementData) => {
    if (!achievements.length) setLoading(true);
    setError(null);
    try {
      const data = await achievementService.upsertAchievement(achievementData);
      
      const cacheKey = `${data.goal_sheet_id}_${data.quarter}`;
      
      // Update local state and global cache
      setAchievements((prev) => {
        const index = prev.findIndex(
          (a) => a.id === data.id || (a.goal_id === data.goal_id && a.quarter === data.quarter)
        );
        let updated;
        if (index > -1) {
          updated = prev.map((a, i) => (i === index ? data : a));
        } else {
          updated = [...prev, data];
        }
        achievementsCache[cacheKey] = updated;
        return updated;
      });

      return data;
    } catch (err) {
      const errMsg = err.message || 'Failed to save achievement.';
      setError(errMsg);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calculate progress dynamically and upsert the achievement record
   */
  const calculateAndSaveProgress = useCallback(async ({ goalId, goalSheetId, uomType, target, actual }) => {
    setError(null);
    if (!achievements.length) setLoading(true);
    try {
      // Calculate progress percentage using progressService
      const progressPercent = calculateProgress(uomType, target, actual);

      const achievementData = {
        goal_id: goalId,
        goal_sheet_id: goalSheetId,
        quarter: activeQuarter,
        actual: Number(actual) || 0,
        progress_percentage: progressPercent
      };

      const data = await achievementService.upsertAchievement(achievementData);
      const cacheKey = `${goalSheetId}_${activeQuarter}`;

      // Update local achievements state and global cache
      setAchievements((prev) => {
        const index = prev.findIndex((a) => a.goal_id === goalId && a.quarter === activeQuarter);
        let updated;
        if (index > -1) {
          updated = prev.map((a, i) => (i === index ? data : a));
        } else {
          updated = [...prev, data];
        }
        achievementsCache[cacheKey] = updated;
        return updated;
      });

      return data;
    } catch (err) {
      const errMsg = err.message || 'Failed to calculate and save progress.';
      setError(errMsg);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeQuarter]);

  return {
    achievements,
    activeQuarter,
    setActiveQuarter,
    loading,
    error,
    fetchAchievements,
    saveAchievement,
    calculateAndSaveProgress
  };
};
