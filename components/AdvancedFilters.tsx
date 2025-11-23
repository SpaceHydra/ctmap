import React, { useState, useEffect } from 'react';
import { Assignment, AssignmentFilters, AssignmentStatus } from '../types';
import {
  applyAllFilters,
  getUniqueValues,
  hasActiveFilters,
  clearAllFilters,
  DEFAULT_FILTERS
} from '../utils/filterHelpers';
import { exportToCSV } from '../utils/exportHelpers';
import {
  Calendar,
  Search,
  Filter,
  X,
  Download,
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react';

interface AdvancedFiltersProps {
  assignments: Assignment[];
  onFilterChange: (filtered: Assignment[]) => void;
  showExport?: boolean;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  assignments,
  onFilterChange,
  showExport = true
}) => {
  const [filters, setFilters] = useState<AssignmentFilters>({ ...DEFAULT_FILTERS });
  const [filteredCount, setFilteredCount] = useState(assignments.length);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique values for dropdowns
  const uniqueValues = getUniqueValues(assignments);

  // Apply filters whenever they change
  useEffect(() => {
    const filtered = applyAllFilters(assignments, filters);
    setFilteredCount(filtered.length);
    onFilterChange(filtered);
  }, [filters, assignments]);

  const handleFilterUpdate = (updates: Partial<AssignmentFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const handleClearAll = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const handleExport = () => {
    const filtered = applyAllFilters(assignments, filters);
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(filtered, `assignments-export-${timestamp}.csv`);
  };

  const toggleStatus = (status: AssignmentStatus) => {
    const selectedStatuses = [...filters.selectedStatuses];
    const index = selectedStatuses.indexOf(status);

    if (index > -1) {
      selectedStatuses.splice(index, 1);
    } else {
      selectedStatuses.push(status);
    }

    handleFilterUpdate({ selectedStatuses });
  };

  const allStatuses = [
    AssignmentStatus.PENDING_ALLOCATION,
    AssignmentStatus.ALLOCATED,
    AssignmentStatus.IN_PROGRESS,
    AssignmentStatus.QUERY_RAISED,
    AssignmentStatus.COMPLETED,
    AssignmentStatus.FORFEITED
  ];

  const hasFilters = hasActiveFilters(filters);

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-50 to-purple-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Advanced Filters</h3>
              <p className="text-xs text-slate-600">
                {filteredCount} of {assignments.length} assignments
                {hasFilters && ' (filtered)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors border border-red-200"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            )}
            {showExport && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border-2 border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              {isExpanded ? 'Hide' : 'Show'} Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-6 space-y-6 animate-in fade-in duration-200">
          {/* Date Range Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Calendar className="w-4 h-4 text-brand-600" />
              Date Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterUpdate({ dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterUpdate({ dateTo: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Filter By</label>
                <select
                  value={filters.dateMode}
                  onChange={(e) => handleFilterUpdate({ dateMode: e.target.value as 'created' | 'completed' })}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all bg-white"
                >
                  <option value="created">Created Date</option>
                  <option value="completed">Completed Date</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Search className="w-4 h-4 text-brand-600" />
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by LAN, FI Code, Borrower Name, or PAN..."
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterUpdate({ searchTerm: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Filter className="w-4 h-4 text-brand-600" />
              Status (Multi-Select)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {allStatuses.map(status => {
                const isSelected = filters.selectedStatuses.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                      isSelected
                        ? 'bg-brand-100 border-brand-500 text-brand-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="truncate">{status}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Filters */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Filter className="w-4 h-4 text-brand-600" />
              Location
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">State</label>
                <select
                  value={filters.selectedState || 'all'}
                  onChange={(e) => handleFilterUpdate({
                    selectedState: e.target.value === 'all' ? undefined : e.target.value,
                    selectedDistrict: undefined // Clear district when state changes
                  })}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all bg-white"
                >
                  <option value="all">All States</option>
                  {uniqueValues.states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">District</label>
                <select
                  value={filters.selectedDistrict || 'all'}
                  onChange={(e) => handleFilterUpdate({
                    selectedDistrict: e.target.value === 'all' ? undefined : e.target.value
                  })}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all bg-white"
                >
                  <option value="all">All Districts</option>
                  {uniqueValues.districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Product & Hub */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Filter className="w-4 h-4 text-brand-600" />
              Product & Hub
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Product Type</label>
                <select
                  value={filters.selectedProduct || 'all'}
                  onChange={(e) => handleFilterUpdate({
                    selectedProduct: e.target.value === 'all' ? undefined : e.target.value
                  })}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all bg-white"
                >
                  <option value="all">All Products</option>
                  {uniqueValues.products.map(product => (
                    <option key={product} value={product}>{product}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Hub</label>
                <select
                  value={filters.selectedHub || 'all'}
                  onChange={(e) => handleFilterUpdate({
                    selectedHub: e.target.value === 'all' ? undefined : e.target.value
                  })}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all bg-white"
                >
                  <option value="all">All Hubs</option>
                  {uniqueValues.hubs.map(hub => (
                    <option key={hub} value={hub}>{hub}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Advocate Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Filter className="w-4 h-4 text-brand-600" />
              Advocate
            </label>
            <select
              value={filters.selectedAdvocate || 'all'}
              onChange={(e) => handleFilterUpdate({
                selectedAdvocate: e.target.value === 'all' ? undefined : e.target.value
              })}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all bg-white"
            >
              <option value="all">All Advocates</option>
              {uniqueValues.advocates.map(advocate => (
                <option key={advocate} value={advocate}>{advocate}</option>
              ))}
            </select>
          </div>

          {/* Assignment Scope */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Filter className="w-4 h-4 text-brand-600" />
              Assignment Scope
            </label>
            <div className="flex gap-2">
              {(['all', 'TSR', 'LOR', 'PRR'] as const).map(scope => (
                <button
                  key={scope}
                  onClick={() => handleFilterUpdate({ assignmentScope: scope })}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                    filters.assignmentScope === scope
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {scope === 'all' ? 'All Types' : scope}
                </button>
              ))}
            </div>
          </div>

          {/* External Source */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Filter className="w-4 h-4 text-brand-600" />
              Source System
            </label>
            <div className="flex gap-2">
              {(['all', 'PropDD', 'Manual'] as const).map(source => (
                <button
                  key={source}
                  onClick={() => handleFilterUpdate({ externalSource: source })}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                    filters.externalSource === source
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {source === 'all' ? 'All Sources' : source}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
