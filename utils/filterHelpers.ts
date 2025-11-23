import { Assignment, AssignmentFilters, AssignmentStatus } from '../types';

/**
 * Default filter state
 */
export const DEFAULT_FILTERS: AssignmentFilters = {
  dateMode: 'created',
  selectedStatuses: [],
  assignmentScope: 'all',
  externalSource: 'all'
};

/**
 * Filter assignments by date range
 */
export const filterByDateRange = (
  assignments: Assignment[],
  fromDate?: string,
  toDate?: string,
  mode: 'created' | 'completed' = 'created'
): Assignment[] => {
  if (!fromDate || !toDate) return assignments;

  const from = new Date(fromDate);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999); // Include full day

  return assignments.filter(a => {
    const dateField = mode === 'created' ? a.createdAt : a.completedAt;
    if (!dateField) return false;

    const date = new Date(dateField);
    return date >= from && date <= to;
  });
};

/**
 * Filter assignments by search term (LAN, FI_code, Borrower name)
 */
export const filterBySearchTerm = (
  assignments: Assignment[],
  searchTerm?: string
): Assignment[] => {
  if (!searchTerm || searchTerm.trim() === '') return assignments;

  const term = searchTerm.toLowerCase().trim();

  return assignments.filter(a =>
    a.lan.toLowerCase().includes(term) ||
    a.fiCode?.toLowerCase().includes(term) ||
    a.borrowerName.toLowerCase().includes(term) ||
    a.pan.toLowerCase().includes(term)
  );
};

/**
 * Filter assignments by statuses (multi-select)
 */
export const filterByStatuses = (
  assignments: Assignment[],
  selectedStatuses: AssignmentStatus[]
): Assignment[] => {
  if (selectedStatuses.length === 0) return assignments;
  return assignments.filter(a => selectedStatuses.includes(a.status));
};

/**
 * Filter assignments by state
 */
export const filterByState = (
  assignments: Assignment[],
  selectedState?: string
): Assignment[] => {
  if (!selectedState || selectedState === 'all') return assignments;
  return assignments.filter(a => a.state === selectedState);
};

/**
 * Filter assignments by district
 */
export const filterByDistrict = (
  assignments: Assignment[],
  selectedDistrict?: string
): Assignment[] => {
  if (!selectedDistrict || selectedDistrict === 'all') return assignments;
  return assignments.filter(a => a.district === selectedDistrict);
};

/**
 * Filter assignments by product type
 */
export const filterByProduct = (
  assignments: Assignment[],
  selectedProduct?: string
): Assignment[] => {
  if (!selectedProduct || selectedProduct === 'all') return assignments;
  return assignments.filter(a => a.productType === selectedProduct);
};

/**
 * Filter assignments by hub
 */
export const filterByHub = (
  assignments: Assignment[],
  selectedHub?: string
): Assignment[] => {
  if (!selectedHub || selectedHub === 'all') return assignments;
  return assignments.filter(a => a.hubId === selectedHub);
};

/**
 * Filter assignments by advocate
 */
export const filterByAdvocate = (
  assignments: Assignment[],
  selectedAdvocate?: string
): Assignment[] => {
  if (!selectedAdvocate || selectedAdvocate === 'all') return assignments;
  return assignments.filter(a => a.advocateId === selectedAdvocate);
};

/**
 * Filter assignments by scope (TSR/LOR/PRR)
 */
export const filterByScope = (
  assignments: Assignment[],
  assignmentScope?: 'all' | 'TSR' | 'LOR' | 'PRR'
): Assignment[] => {
  if (!assignmentScope || assignmentScope === 'all') return assignments;
  return assignments.filter(a => a.scope === assignmentScope);
};

/**
 * Filter assignments by external source
 */
export const filterByExternalSource = (
  assignments: Assignment[],
  externalSource?: 'all' | 'PropDD' | 'Manual'
): Assignment[] => {
  if (!externalSource || externalSource === 'all') return assignments;

  if (externalSource === 'PropDD') {
    return assignments.filter(a => a.externalSource === 'PropDD' || a.fiCode);
  } else {
    return assignments.filter(a => !a.externalSource || a.externalSource === 'Manual');
  }
};

/**
 * Apply all filters to assignments
 */
export const applyAllFilters = (
  assignments: Assignment[],
  filters: AssignmentFilters
): Assignment[] => {
  let filtered = [...assignments];

  // Date range
  filtered = filterByDateRange(
    filtered,
    filters.dateFrom,
    filters.dateTo,
    filters.dateMode
  );

  // Search term
  filtered = filterBySearchTerm(filtered, filters.searchTerm);

  // Statuses
  filtered = filterByStatuses(filtered, filters.selectedStatuses);

  // Location
  filtered = filterByState(filtered, filters.selectedState);
  filtered = filterByDistrict(filtered, filters.selectedDistrict);

  // Product & Hub
  filtered = filterByProduct(filtered, filters.selectedProduct);
  filtered = filterByHub(filtered, filters.selectedHub);

  // Advocate
  filtered = filterByAdvocate(filtered, filters.selectedAdvocate);

  // Scope
  filtered = filterByScope(filtered, filters.assignmentScope);

  // External Source
  filtered = filterByExternalSource(filtered, filters.externalSource);

  return filtered;
};

/**
 * Get unique values from assignments for filter dropdowns
 */
export const getUniqueValues = (assignments: Assignment[]) => {
  return {
    states: [...new Set(assignments.map(a => a.state))].sort(),
    districts: [...new Set(assignments.map(a => a.district))].sort(),
    products: [...new Set(assignments.map(a => a.productType))].sort(),
    hubs: [...new Set(assignments.map(a => a.hubId).filter(Boolean))],
    advocates: [...new Set(assignments.map(a => a.advocateId).filter(Boolean))]
  };
};

/**
 * Count assignments matching filters
 */
export const countFilteredAssignments = (
  assignments: Assignment[],
  filters: AssignmentFilters
): number => {
  return applyAllFilters(assignments, filters).length;
};

/**
 * Check if any filters are active
 */
export const hasActiveFilters = (filters: AssignmentFilters): boolean => {
  return !!(
    filters.dateFrom ||
    filters.dateTo ||
    filters.searchTerm ||
    filters.selectedStatuses.length > 0 ||
    filters.selectedState ||
    filters.selectedDistrict ||
    filters.selectedProduct ||
    filters.selectedHub ||
    filters.selectedAdvocate ||
    (filters.assignmentScope && filters.assignmentScope !== 'all') ||
    (filters.externalSource && filters.externalSource !== 'all')
  );
};

/**
 * Clear all filters
 */
export const clearAllFilters = (): AssignmentFilters => {
  return { ...DEFAULT_FILTERS };
};
