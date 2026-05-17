import { supabase } from '@/lib/supabase';
import { calculateProgress } from './progressService';

/**
 * Fetch planned vs actual for all team members for a quarter
 * @param {string} managerId 
 * @param {string} quarter 
 */
export const getAchievementReport = async (managerId, quarter) => {
  const { data, error } = await supabase
    .from('goal_sheets')
    .select(`
      id,
      status,
      employee:profiles!employee_id(name, email),
      goals (
        id, title, target, weightage, uom_type, status,
        achievements (actual, planned, quarter)
      )
    `)
    .eq('manager_id', managerId);

  if (error) {
    console.error('Error fetching achievement report:', error);
    throw error;
  }

  // Filter achievements by quarter
  const report = data.map(sheet => {
    const goals = sheet.goals
      .filter(goal => goal.achievements && goal.achievements.some(a => a.quarter === quarter))
      .map(goal => {
        const achievement = goal.achievements.find(a => a.quarter === quarter) || { actual: 0, planned: 0 };
        return {
          id: goal.id,
          title: goal.title,
          target: goal.target,
          weightage: goal.weightage,
          uom_type: goal.uom_type,
          status: goal.status || 'Draft',
          actual: achievement.actual || 0,
          planned: achievement.planned || 0
        };
      });
    
    return {
      sheetStatus: sheet.status || 'Draft',
      employeeName: sheet.employee?.name || 'Unknown',
      employeeEmail: sheet.employee?.email || '',
      goals
    };
  });

  return report;
};

/**
 * Fetch how many employees have submitted/approved/pending goal sheets
 * @param {string} managerId 
 */
export const getCompletionReport = async (managerId) => {
  const { data, error } = await supabase
    .from('goal_sheets')
    .select(`
      status,
      employee:profiles!employee_id(name, email)
    `)
    .eq('manager_id', managerId);

  if (error) {
    console.error('Error fetching completion report:', error);
    throw error;
  }

  return data.map(sheet => ({
    employeeName: sheet.employee?.name || 'Unknown',
    employeeEmail: sheet.employee?.email || '',
    status: sheet.status || 'Draft'
  }));
};

/**
 * Fetch average progress score per employee
 * @param {string} managerId 
 * @param {string} quarter 
 */
export const getTeamProgressReport = async (managerId, quarter) => {
  const { data, error } = await supabase
    .from('goal_sheets')
    .select(`
      id,
      employee:profiles!employee_id(name, email),
      goals (
        id, target, weightage, uom_type,
        achievements (actual, quarter)
      ),
      checkins (
        rating,
        quarter
      )
    `)
    .eq('manager_id', managerId);

  if (error) {
    console.error('Error fetching team progress report:', error);
    throw error;
  }

  const report = data.map(sheet => {
    let totalScore = 0;
    let totalWeightage = 0;
    let completedGoals = 0;
    let inProgressGoals = 0;
    let missedGoals = 0;

    const activeGoals = sheet.goals?.filter(goal => goal.achievements && goal.achievements.some(a => a.quarter === quarter)) || [];

    activeGoals.forEach(goal => {
      const achievement = goal.achievements.find(a => a.quarter === quarter);
      const actual = achievement ? achievement.actual : 0;
      
      const progressPercent = calculateProgress(goal.uom_type, goal.target, actual);
      
      const weightage = Number(goal.weightage) || 0;
      totalScore += (progressPercent * weightage) / 100;
      totalWeightage += weightage;

      if (progressPercent >= 100) {
        completedGoals++;
      } else if (progressPercent > 0) {
        inProgressGoals++;
      } else {
        missedGoals++;
      }
    });

    const averageScore = totalWeightage > 0 ? (totalScore / totalWeightage) * 100 : 0;

    // Find check-in rating for this quarter
    const checkin = sheet.checkins?.find(c => c.quarter === quarter);
    const rating = checkin ? checkin.rating : null;

    return {
      employeeName: sheet.employee?.name || 'Unknown',
      employeeEmail: sheet.employee?.email || '',
      score: averageScore,
      completedGoals,
      inProgressGoals,
      missedGoals,
      rating
    };
  });

  return report;
};

/**
 * Fetch progress scores across all quarters for trend analysis
 * @param {string} managerId 
 */
export const getQoQReport = async (managerId) => {
  const { data, error } = await supabase
    .from('goal_sheets')
    .select(`
      id,
      employee:profiles!employee_id(name, email),
      goals (
        id, target, weightage, uom_type,
        achievements (actual, quarter)
      )
    `)
    .eq('manager_id', managerId);

  if (error) {
    console.error('Error fetching QoQ report:', error);
    throw error;
  }

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const report = data.map(sheet => {
    const scoresByQuarter = {};
    quarters.forEach(q => {
      let employeeScore = 0;
      let totalWeightage = 0;

      const activeGoals = sheet.goals?.filter(goal => goal.achievements && goal.achievements.some(a => a.quarter === q)) || [];

      activeGoals.forEach(goal => {
        const achievement = goal.achievements.find(a => a.quarter === q);
        const actual = achievement ? achievement.actual : 0;
        
        const progressPercent = calculateProgress(goal.uom_type, goal.target, actual);
        
        const weightage = Number(goal.weightage) || 0;
        employeeScore += (progressPercent * weightage) / 100;
        totalWeightage += weightage;
      });

      scoresByQuarter[q] = totalWeightage > 0 ? Math.round((employeeScore / totalWeightage) * 100) : 0;
    });

    return {
      employeeName: sheet.employee?.name || 'Unknown',
      employeeEmail: sheet.employee?.email || '',
      ...scoresByQuarter
    };
  });

  return report;
};

/**
 * Admin Overview Stats
 */
export const getAdminOverviewStats = async () => {
  // 1. Fetch total users (profiles)
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, role, name, email');
  
  if (pError) {
    console.error('Error fetching admin profiles stats:', pError);
    throw pError;
  }

  // 2. Fetch all goal sheets
  const { data: sheets, error: sError } = await supabase
    .from('goal_sheets')
    .select('id, status, employee_id');
  
  if (sError) {
    console.error('Error fetching admin sheets stats:', sError);
    throw sError;
  }

  const totalUsers = profiles.length;
  const employees = profiles.filter(p => p.role?.toLowerCase() === 'employee');
  const totalEmployees = employees.length || 1; // Avoid divide by zero
  
  const submittedCount = sheets.filter(s => s.status === 'Submitted').length;
  const approvedCount = sheets.filter(s => s.status === 'Approved').length;
  const pendingCount = submittedCount; // pending approvals are submitted sheets

  const systemCompletionRate = Math.round((approvedCount / totalEmployees) * 100);

  return {
    totalUsers,
    totalEmployees,
    totalSubmitted: submittedCount,
    totalApproved: approvedCount,
    totalPending: pendingCount,
    completionRate: Math.min(systemCompletionRate, 100),
  };
};

/**
 * Admin Department-wise Completion Rates
 */
export const getAdminDepartmentCompletion = async () => {
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, name, email, role');
  
  if (pError) throw pError;

  const { data: sheets, error: sError } = await supabase
    .from('goal_sheets')
    .select('employee_id, status');
  
  if (sError) throw sError;

  const DEPARTMENTS = ['Engineering', 'Sales', 'HR', 'Marketing', 'Finance'];
  const getDepartment = (profile) => {
    const str = profile.name || profile.email || profile.id || '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return DEPARTMENTS[Math.abs(hash) % DEPARTMENTS.length];
  };

  // Group employees by department
  const deptMap = {};
  DEPARTMENTS.forEach(dept => {
    deptMap[dept] = { total: 0, approved: 0 };
  });

  const employees = profiles.filter(p => p.role?.toLowerCase() === 'employee');
  employees.forEach(emp => {
    const dept = getDepartment(emp);
    deptMap[dept].total++;
    
    // Check if this employee has an approved sheet
    const hasApproved = sheets.some(s => s.employee_id === emp.id && s.status === 'Approved');
    if (hasApproved) {
      deptMap[dept].approved++;
    }
  });

  return DEPARTMENTS.map(dept => {
    const { total, approved } = deptMap[dept];
    const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
    return {
      department: dept,
      rate,
      total,
      approved
    };
  });
};

/**
 * Admin Manager-wise team performance comparison
 */
export const getAdminManagerPerformance = async () => {
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, name, email, role, manager_id');
  
  if (pError) throw pError;

  const { data: sheets, error: sError } = await supabase
    .from('goal_sheets')
    .select(`
      id,
      employee_id,
      manager_id,
      goals (
        id, target, weightage, uom_type,
        achievements (actual, quarter, progress_score)
      )
    `)
    .eq('status', 'Approved')
    .not('manager_id', 'is', null);
  
  if (sError) throw sError;

  console.log('Approved sheets:', sheets);

  const managers = profiles.filter(p => p.role?.toLowerCase() === 'manager');
  
  const result = managers.map(manager => {
    // Get employees directly from profiles
    const employees = profiles.filter(
      p => p.manager_id === manager.id && p.role?.toLowerCase() === 'employee'
    );

    // Get only sheets belonging to these employees
    const managerSheets = sheets.filter(
      s => s.manager_id === manager.id && 
      employees.some(e => e.id === s.employee_id)  // ← must be an actual employee
    );

    console.log('Manager:', manager.name);
    console.log('Employees:', employees);
    console.log('Manager sheets:', managerSheets);

    let totalScoreSum = 0;
    let sheetsWithScore = 0;

    managerSheets.forEach(sheet => {
      let sheetScore = 0;
      let sheetWeightage = 0;

      sheet.goals?.forEach(goal => {
        const achievement = goal.achievements?.[0];
        if (achievement) {
          const progressPercent = Number(achievement.progress_score) || 0;
          const weightage = Number(goal.weightage) || 0;
          sheetScore += (progressPercent * weightage) / 100;
          sheetWeightage += weightage;
        }
      });

      if (sheetWeightage > 0) {
        const sheetAvg = (sheetScore / sheetWeightage) * 100;
        totalScoreSum += sheetAvg;
        sheetsWithScore++;
      }
    });

    const avgProgress = sheetsWithScore > 0 
      ? Math.round(totalScoreSum / sheetsWithScore) 
      : 0;

    return {
      managerName: manager.name || manager.email || 'Unknown',
      avgProgress,
      teamSize: employees.length  // ← from profiles, not sheets
    };
  });

  return result.sort((a, b) => b.avgProgress - a.avgProgress);
};
/**
 * System-wide QoQ Trends Chart
 */
export const getAdminSystemQoQTrends = async () => {
 const { data: sheets, error: sError } = await supabase
  .from('goal_sheets')
  .select(`
    id,
    employee_id,
    manager_id,
    goals (
      id, target, weightage, uom_type,
      achievements (actual, quarter, progress_score)
    )
  `)
  .eq('status', 'Approved')      // ← only approved sheets
  .not('manager_id', 'is', null); // ← exclude sheets with no manager
  
  if (sError) throw sError;

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const trends = quarters.map(q => {
    let totalScoreSum = 0;
    let totalWeightageSum = 0;

    sheets.forEach(sheet => {
      sheet.goals?.forEach(goal => {
        const achievement = goal.achievements?.find(a => a.quarter === q);
        if (achievement) {
          const progressPercent = calculateProgress(goal.uom_type, goal.target, achievement.actual);
          const weightage = Number(goal.weightage) || 0;
          totalScoreSum += (progressPercent * weightage) / 100;
          totalWeightageSum += weightage;
        }
      });
    });

    const averageProgress = totalWeightageSum > 0 ? Math.round((totalScoreSum / totalWeightageSum) * 100) : 0;
    return {
      quarter: q,
      averageProgress
    };
  });

  return trends;
};

/**
 * Admin System Reports Data
 */
export const getAdminSystemReportsData = async () => {
  const { data, error } = await supabase
    .from('goal_sheets')
    .select(`
  id,
  status,
  is_locked,
  created_at,
  employee:profiles!employee_id(name, email, role),
  goals (
    id, title, target, weightage, uom_type, status,
    achievements (actual, planned, quarter)
  )
`);
  if (error) {
    console.error('Error fetching admin system reports:', error);
    throw error;
  }

  // Map to flat report records
 return data.map(sheet => {
  console.log('sheet.is_locked:', sheet.id, sheet.is_locked);
  return {
    id: sheet.id,
    employeeName: sheet.employee?.name || 'Unknown',
    employeeEmail: sheet.employee?.email || '',
    status: sheet.status || 'Draft',
    is_locked: sheet.is_locked || false,  // ← add this
    createdAt: new Date(sheet.created_at).toLocaleDateString(),
    goalsCount: sheet.goals?.length || 0,
    goals: sheet.goals || []
  };
});
};
