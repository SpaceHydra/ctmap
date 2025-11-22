/**
 * Export utilities for downloading data as CSV/Excel
 */

export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  formatter?: (value: any) => string;
}

/**
 * Export array of objects to CSV
 */
export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string = 'export'
) {
  // Create CSV header
  const header = columns.map(col => `"${col.label}"`).join(',');

  // Create CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = typeof col.key === 'string'
        ? (item as any)[col.key]
        : item[col.key as keyof T];

      const formatted = col.formatter ? col.formatter(value) : String(value ?? '');
      // Escape quotes and wrap in quotes
      return `"${formatted.replace(/"/g, '""')}"`;
    }).join(',');
  });

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export to JSON
 */
export function exportToJSON<T>(
  data: T[],
  filename: string = 'export'
) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy data to clipboard as formatted text
 */
export async function copyToClipboard<T>(
  data: T[],
  columns: ExportColumn<T>[]
): Promise<boolean> {
  try {
    const rows = data.map(item => {
      return columns.map(col => {
        const value = typeof col.key === 'string'
          ? (item as any)[col.key]
          : item[col.key as keyof T];
        return col.formatter ? col.formatter(value) : String(value ?? '');
      }).join('\t');
    });

    const text = rows.join('\n');
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format common data types for export
 */
export const exportFormatters = {
  date: (value: string | Date | undefined) => {
    if (!value) return '-';
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  datetime: (value: string | Date | undefined) => {
    if (!value) return '-';
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleString('en-IN');
  },

  currency: (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
  },

  number: (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-IN').format(value);
  },

  boolean: (value: boolean | undefined) => {
    if (value === undefined || value === null) return '-';
    return value ? 'Yes' : 'No';
  },

  array: (value: any[] | undefined, separator: string = ', ') => {
    if (!value || !Array.isArray(value)) return '-';
    return value.join(separator);
  }
};
