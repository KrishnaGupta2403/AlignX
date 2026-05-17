import { useState, useEffect } from 'react';
import { getActiveCycle } from '@/services/cycleService';

export const useCycle = () => {
  const [activeCycle, setActiveCycle] = useState(null);
  const [activePhase, setActivePhase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCycle = async () => {
      try {
        const cycle = await getActiveCycle();
        setActiveCycle(cycle);
        setActivePhase(cycle?.phase || null);
      } catch (err) {
        console.error('Error fetching active cycle:', err);
        setActivePhase(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCycle();
  }, []);

  const isGoalPhase = activePhase === 'Goal';
  const isCheckinPhase = ['Q1', 'Q2', 'Q3', 'Q4'].includes(activePhase);
  const activeQuarter = isCheckinPhase ? activePhase : null;

  return {
    activeCycle,
    activePhase,
    activeQuarter,
    isGoalPhase,
    isCheckinPhase,
    loading
  };
};
