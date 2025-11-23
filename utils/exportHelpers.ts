import { Assignment, AssignmentStatus } from '../types';

/**
 * Convert assignments to CSV format
 */
export const exportToCSV = (
  assignments: Assignment[],
  filename: string = 'assignments-export.csv'
): void => {
  if (assignments.length === 0) {
    alert('No assignments to export');
    return;
  }

  // CSV Headers
  const headers = [
    'FI Code',
    'LAN',
    'PAN',
    'Borrower Name',
    'State',
    'District',
    'Pincode',
    'Product Type',
    'Scope',
    'Priority',
    'Status',
    'Hub',
    'Advocate',
    'Created Date',
    'Completed Date',
    'External Source'
  ];

  // CSV Rows
  const rows = assignments.map(a => [
    a.fiCode || 'N/A',
    a.lan,
    a.pan,
    a.borrowerName,
    a.state,
    a.district,
    a.pincode,
    a.productType,
    a.scope,
    a.priority || 'Standard',
    a.status,
    a.hubId || 'N/A',
    a.advocateId || 'N/A',
    formatDateForCSV(a.createdAt),
    a.completedAt ? formatDateForCSV(a.completedAt) : 'N/A',
    a.externalSource || 'Manual'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSVValue).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format date for CSV export
 */
const formatDateForCSV = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN');
  } catch {
    return dateString;
  }
};

/**
 * Escape CSV values (handle commas, quotes)
 */
const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  // If contains comma or quotes, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Export reconciliation summary to CSV
 */
export const exportReconciliationReport = (
  assignments: Assignment[],
  fromDate: string,
  toDate: string
): void => {
  const withFiCode = assignments.filter(a => a.fiCode);
  const withoutFiCode = assignments.filter(a => !a.fiCode);
  const tsrAssignments = assignments.filter(a => a.scope === 'TSR');

  const summary = [
    ['PropDD Reconciliation Report'],
    [''],
    ['Period', `${fromDate} to ${toDate}`],
    ['Generated', new Date().toLocaleString('en-IN')],
    [''],
    ['Summary Statistics'],
    ['Total Assignments', assignments.length],
    ['With FI Code', withFiCode.length, `(${Math.round(withFiCode.length / assignments.length * 100)}%)`],
    ['Without FI Code', withoutFiCode.length, `(${Math.round(withoutFiCode.length / assignments.length * 100)}%)`],
    ['TSR Assignments', tsrAssignments.length, `(${Math.round(tsrAssignments.length / assignments.length * 100)}%)`],
    [''],
    ['Status Breakdown'],
    ...getStatusBreakdown(assignments),
    [''],
    [''],
    ['Detailed Assignment List'],
    ['FI Code', 'LAN', 'Borrower', 'State', 'District', 'Status', 'Created', 'Completed'],
    ...assignments.map(a => [
      a.fiCode || 'MISSING',
      a.lan,
      a.borrowerName,
      a.state,
      a.district,
      a.status,
      formatDateForCSV(a.createdAt),
      a.completedAt ? formatDateForCSV(a.completedAt) : 'N/A'
    ])
  ];

  const csvContent = summary.map(row => row.map(escapeCSVValue).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `reconciliation-report-${fromDate}-to-${toDate}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get status breakdown for report
 */
const getStatusBreakdown = (assignments: Assignment[]): any[][] => {
  const statuses: AssignmentStatus[] = [
    AssignmentStatus.PENDING_ALLOCATION,
    AssignmentStatus.ALLOCATED,
    AssignmentStatus.IN_PROGRESS,
    AssignmentStatus.QUERY_RAISED,
    AssignmentStatus.COMPLETED,
    AssignmentStatus.FORFEITED
  ];

  return statuses.map(status => {
    const count = assignments.filter(a => a.status === status).length;
    return [status, count];
  });
};

/**
 * Copy FI Code to clipboard
 */
export const copyFiCodeToClipboard = (fiCode: string): void => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fiCode)
      .then(() => {
        // Success - could show a toast notification
        console.log('FI Code copied:', fiCode);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        fallbackCopyToClipboard(fiCode);
      });
  } else {
    fallbackCopyToClipboard(fiCode);
  }
};

/**
 * Fallback copy method for older browsers
 */
const fallbackCopyToClipboard = (text: string): void => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }
  document.body.removeChild(textArea);
};
