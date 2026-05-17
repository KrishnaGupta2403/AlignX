import { useState, useCallback } from 'react';
import * as analyticsService from '@/services/analyticsService';
import * as reportService from '@/services/reportService';

/**
 * Custom hook to manage report state, fetch analytics data, and export/log reports.
 * @param {string} initialQuarter 
 */
export const useReports = (initialQuarter = 'Q1') => {
  const [reportData, setReportData] = useState([]);
  const [activeReport, setActiveReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quarter, setQuarter] = useState(initialQuarter);

  /**
   * Fetch planned vs actual report for all team members for a quarter.
   */
  const fetchAchievementReport = useCallback(async (managerId, q = quarter) => {
    if (!managerId) return;
    setLoading(true);
    setError(null);
    setActiveReport('achievement');
    try {
      const data = await analyticsService.getAchievementReport(managerId, q);
      setReportData(data);
      return data;
    } catch (err) {
      const errMsg = err.message || 'Failed to fetch achievement report.';
      setError(errMsg);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [quarter]);

  /**
   * Fetch how many employees have submitted/approved/pending goal sheets.
   */
  const fetchCompletionReport = useCallback(async (managerId) => {
    if (!managerId) return;
    setLoading(true);
    setError(null);
    setActiveReport('completion');
    try {
      const data = await analyticsService.getCompletionReport(managerId);
      setReportData(data);
      return data;
    } catch (err) {
      const errMsg = err.message || 'Failed to fetch completion report.';
      setError(errMsg);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch average progress score per employee.
   */
  const fetchTeamProgress = useCallback(async (managerId, q = quarter) => {
    if (!managerId) return;
    setLoading(true);
    setError(null);
    setActiveReport('teamProgress');
    try {
      const data = await analyticsService.getTeamProgressReport(managerId, q);
      setReportData(data);
      return data;
    } catch (err) {
      const errMsg = err.message || 'Failed to fetch team progress report.';
      setError(errMsg);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [quarter]);

  /**
   * Fetch progress scores across all quarters for trend analysis.
   */
  const fetchQoQReport = useCallback(async (managerId) => {
    if (!managerId) return;
    setLoading(true);
    setError(null);
    setActiveReport('qoq');
    try {
      const data = await analyticsService.getQoQReport(managerId);
      setReportData(data);
      return data;
    } catch (err) {
      const errMsg = err.message || 'Failed to fetch QoQ report.';
      setError(errMsg);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Export the current report data to a CSV file and log the action.
   */
  const exportCSV = useCallback(async (managerId, filename) => {
    if (!reportData || !reportData.length) {
      console.warn('No report data available to export');
      return;
    }

    const defaultFilename = `${activeReport}_report_${quarter}`;
    const finalFilename = filename || defaultFilename;

    // Trigger local CSV generation
    reportService.generateCSV(reportData, finalFilename);

    // Audit trail logging
    if (managerId) {
      try {
        await reportService.logReport(activeReport, managerId, {
          quarter,
          format: 'CSV',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to log CSV export event:', err);
      }
    }
  }, [reportData, activeReport, quarter]);

  /**
   * Export the current report data to an Excel file and log the action.
   */
  const exportExcel = useCallback(async (managerId, filename) => {
    if (!reportData || !reportData.length) {
      console.warn('No report data available to export');
      return;
    }

    const defaultFilename = `${activeReport}_report_${quarter}`;
    const finalFilename = filename || defaultFilename;

    // Trigger local Excel generation
    reportService.generateExcel(reportData, finalFilename);

    // Audit trail logging
    if (managerId) {
      try {
        await reportService.logReport(activeReport, managerId, {
          quarter,
          format: 'Excel',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to log Excel export event:', err);
      }
    }
  }, [reportData, activeReport, quarter]);

  return {
    reportData,
    activeReport,
    setActiveReport,
    loading,
    error,
    quarter,
    setQuarter,
    fetchAchievementReport,
    fetchCompletionReport,
    fetchTeamProgress,
    fetchQoQReport,
    exportCSV,
    exportExcel
  };
};
