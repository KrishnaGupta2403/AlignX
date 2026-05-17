export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
export const GOAL_PHASES = ['Goal', 'Q1', 'Q2', 'Q3', 'Q4'];

// Dynamic active quarter based on current calendar month
// Q1 = Jan-Mar, Q2 = Apr-Jun, Q3 = Jul-Sep, Q4 = Oct-Dec
const getCurrentQuarter = () => {
  const month = new Date().getMonth();
  if (month >= 0 && month <= 2) return 'Q1';
  if (month >= 3 && month <= 5) return 'Q2';
  if (month >= 6 && month <= 8) return 'Q3';
  return 'Q4';
};

// Kept for backward compatibility — all existing imports still work
export const ACTIVE_QUARTER = 'Q1'; // temporary fallback only — overridden by useCycle
