import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

/**
 * Helper function to flatten nested JSON objects (e.g. joined tables from Supabase queries)
 * so that they can be easily represented as flat rows in CSV/Excel.
 */
const flattenRow = (obj, prefix = '', result = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const propertyName = prefix ? `${prefix}_${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenRow(value, propertyName, result);
    } else if (Array.isArray(value)) {
      result[propertyName] = value.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join('; ');
    } else {
      result[propertyName] = value;
    }
  }
  return result;
};

/**
 * Converts JSON data array into downloadable CSV file.
 */
export const generateCSV = (data, filename = 'report') => {
  if (!data || data.length === 0) return;
  
  const flattenedData = data.map(row => flattenRow(row));
  const headers = Object.keys(flattenedData[0]).join(',');
  const rows = flattenedData.map(row => 
    Object.values(row).map(v => {
      const val = v ?? '';
      // Escape commas and double quotes for proper CSV compliance
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',')
  ).join('\n');
  const csvContent = `${headers}\n${rows}`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Converts JSON data into downloadable Excel file using xlsx.
 */
export const generateExcel = (data, filename = 'report') => {
  if (!data || data.length === 0) return;

  const flattenedData = data.map(row => flattenRow(row));
  const worksheet = XLSX.utils.json_to_sheet(flattenedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Inserts a record into the reports table for generation logs/audit trail.
 */
export const logReport = async (reportType, generatedBy, filters = {}) => {
  const { data, error } = await supabase
    .from('reports')
    .insert([
      {
        report_type: reportType,
        generated_by: generatedBy,
        filters: filters,
        created_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error logging report:', error);
    throw error;
  }
  return data;
};
