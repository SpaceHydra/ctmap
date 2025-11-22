
import React, { useState, useEffect } from 'react';
import { Assignment, AssignmentStatus, UserRole, User } from '../types';
import { store } from '../services/mockStore';
import { Users, Briefcase, AlertTriangle, CheckSquare, Filter, ArrowRight, Activity, Globe, BarChart as BarChartIcon, Clock, TrendingUp, CheckCircle, Zap, X } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

interface Props {
  onSelectAssignment: (id: string) => void;
}

export const OpsDashboard: React.FC<Props> = ({ onSelectAssignment }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<AssignmentStatus | 'ALL'>('ALL');
  const [networkAvailability, setNetworkAvailability] = useState(0);
  const [throughput, setThroughput] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Bulk allocation state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickFilters, setQuickFilters] = useState({
    state: 'ALL',
    productType: 'ALL',
    hub: 'ALL'
  });
  const [showBulkAllocate, setShowBulkAllocate] = useState(false);
  const [selectedAdvocate, setSelectedAdvocate] = useState<string>('');

  // AI allocation state
  const [showAIProgress, setShowAIProgress] = useState(false);
  const [aiProgress, setAIProgress] = useState({ current: 0, total: 0, assignment: '' });
  const [isTestDataLoaded, setIsTestDataLoaded] = useState(false);
  const [geminiAvailable, setGeminiAvailable] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const all = store.getAssignments();
      setAssignments(all.filter(a => a.status !== AssignmentStatus.UNCLAIMED));

    // Calculate Network Availability
    const advocates = store.getAdvocates();
    const availableAdvocates = advocates.filter(adv => store.getAdvocateWorkload(adv.id) < 3);
    setNetworkAvailability(Math.round((availableAdvocates.length / advocates.length) * 100) || 0);

    // Calculate Throughput
    const today = new Date().toISOString().split('T')[0];
    const completedToday = all.filter(a =>
        a.status === AssignmentStatus.COMPLETED &&
        a.completedAt &&
        a.completedAt.startsWith(today)
    ).length;
    setThroughput(completedToday);

    // Check test data and Gemini availability
    setIsTestDataLoaded(store.isTestDataLoaded());
    setGeminiAvailable(store.isGeminiAvailable());

    setIsLoading(false);
    }, 600);
  }, []);

  // Apply status filter + quick filters
  let filteredAssignments = filter === 'ALL'
    ? assignments
    : assignments.filter(a => a.status === filter);

  // Apply quick filters
  if (quickFilters.state !== 'ALL') {
    filteredAssignments = filteredAssignments.filter(a => a.state === quickFilters.state);
  }
  if (quickFilters.productType !== 'ALL') {
    filteredAssignments = filteredAssignments.filter(a => a.productType === quickFilters.productType);
  }
  if (quickFilters.hub !== 'ALL') {
    filteredAssignments = filteredAssignments.filter(a => a.hubId === quickFilters.hub);
  }

  // Bulk selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const pendingIds = filteredAssignments
      .filter(a => a.status === AssignmentStatus.PENDING_ALLOCATION)
      .map(a => a.id);
    setSelectedIds(pendingIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleBulkAllocate = () => {
    if (!selectedAdvocate || selectedIds.length === 0) {
      alert('⚠️ Please select an advocate and at least one assignment');
      return;
    }

    try {
      let successCount = 0;
      selectedIds.forEach(id => {
        try {
          store.allocateAdvocate(id, selectedAdvocate);
          successCount++;
        } catch (error) {
          console.error(`Failed to allocate ${id}:`, error);
        }
      });

      alert(`✅ Successfully allocated ${successCount} of ${selectedIds.length} assignments`);
      setSelectedIds([]);
      setSelectedAdvocate('');
      setShowBulkAllocate(false);
      setBulkMode(false);

      // Refresh data
      const all = store.getAssignments();
      setAssignments(all.filter(a => a.status !== AssignmentStatus.UNCLAIMED));
    } catch (error) {
      alert('❌ Bulk allocation failed. Please try again.');
    }
  };

  const handleAutoAllocateAll = () => {
    const pendingCount = assignments.filter(a => a.status === AssignmentStatus.PENDING_ALLOCATION).length;

    if (pendingCount === 0) {
      alert('⚠️ No assignments pending allocation');
      return;
    }

    const confirmed = window.confirm(
      `🤖 Auto-Allocate ${pendingCount} Pending Assignments?\n\n` +
      `The smart engine will:\n` +
      `• Match assignments to advocates by location\n` +
      `• Balance workload across the network\n` +
      `• Prioritize expertise and hub alignment\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    try {
      const result = store.autoAllocateAll();

      alert(
        `✅ Auto-Allocation Complete!\n\n` +
        `Total: ${result.total}\n` +
        `✅ Successful: ${result.successful}\n` +
        `❌ Failed: ${result.failed}\n\n` +
        (result.failed > 0
          ? `Failures were likely due to no matching advocates or capacity constraints.`
          : `All assignments successfully allocated!`)
      );

      // Refresh data
      const all = store.getAssignments();
      setAssignments(all.filter(a => a.status !== AssignmentStatus.UNCLAIMED));
    } catch (error) {
      alert('❌ Auto-allocation failed. Please try again.');
    }
  };

  const handleLoadTestData = () => {
    const confirmed = window.confirm(
      `🧪 Load Test Dataset?\n\n` +
      `This will load:\n` +
      `• 65 pending assignments\n` +
      `• 25 advocates across 10 cities\n` +
      `• 10 bank hubs\n\n` +
      `Perfect for testing AI allocation!\n\n` +
      `⚠️ This will replace your current data.\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    try {
      store.loadTestData();
      setIsTestDataLoaded(true);

      // Refresh data
      const all = store.getAssignments();
      setAssignments(all.filter(a => a.status !== AssignmentStatus.UNCLAIMED));

      alert(
        `✅ Test Dataset Loaded!\n\n` +
        `📊 Assignments: 65\n` +
        `👥 Advocates: 25\n` +
        `🏢 Hubs: 10\n\n` +
        `Ready for AI allocation testing!`
      );
    } catch (error) {
      alert('❌ Failed to load test data. Please try again.');
    }
  };

  const handleGeminiAllocateAll = async () => {
    if (!geminiAvailable) {
      alert(
        `❌ Gemini AI Not Configured\n\n` +
        `To use AI allocation:\n` +
        `1. Get your API key from: https://makersuite.google.com/app/apikey\n` +
        `2. Create a .env file in the project root\n` +
        `3. Add: VITE_GEMINI_API_KEY=your_api_key_here\n` +
        `4. Restart the dev server`
      );
      return;
    }

    const pendingCount = assignments.filter(a => a.status === AssignmentStatus.PENDING_ALLOCATION).length;

    if (pendingCount === 0) {
      alert('⚠️ No assignments pending allocation');
      return;
    }

    const confirmed = window.confirm(
      `🤖 AI Auto-Allocate ${pendingCount} Assignments using Gemini?\n\n` +
      `Gemini AI will:\n` +
      `• Analyze each assignment's location, product type, and priority\n` +
      `• Match with best-fit advocates based on expertise\n` +
      `• Balance workload across the advocate network\n` +
      `• Provide confidence scores and reasoning\n\n` +
      `⏱️ This will take ~${Math.ceil(pendingCount / 60)} minute(s)\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    try {
      setShowAIProgress(true);
      setAIProgress({ current: 0, total: pendingCount, assignment: '' });

      const result = await store.geminiAllocateAll((current, total, assignment) => {
        setAIProgress({ current, total, assignment: assignment || '' });
      });

      setShowAIProgress(false);

      // Refresh data
      const all = store.getAssignments();
      setAssignments(all.filter(a => a.status !== AssignmentStatus.UNCLAIMED));

      alert(
        `✅ Gemini AI Allocation Complete!\n\n` +
        `Total: ${result.total}\n` +
        `✅ Successful: ${result.successful}\n` +
        `❌ Failed: ${result.failed}\n\n` +
        (result.failed > 0
          ? `Some failures occurred. Check audit trail for details.`
          : `All assignments successfully allocated by AI!`)
      );

    } catch (error: any) {
      setShowAIProgress(false);
      alert(`❌ AI allocation failed: ${error.message || 'Unknown error'}`);
    }
  };

  // Get unique values for quick filters
  const uniqueStates = [...new Set(assignments.map(a => a.state))];
  const uniqueProducts = [...new Set(assignments.map(a => a.productType))];
  const hubs = store.getHubs();

  // Stats
  const stats = {
    pendingAllocation: assignments.filter(a => a.status === AssignmentStatus.PENDING_ALLOCATION).length,
    approvalNeeded: assignments.filter(a => a.status === AssignmentStatus.PENDING_APPROVAL).length,
    total: assignments.length,
    stuck: assignments.filter(a => {
        if (!a.createdAt) return false;
        const days = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 3600 * 24);
        return days > 7 && a.status !== AssignmentStatus.COMPLETED;
    }).length
  };

  // Charts
  const pipelineData = [
    { name: 'Pending Alloc', count: stats.pendingAllocation },
    { name: 'In Progress', count: assignments.filter(a => a.status === AssignmentStatus.ALLOCATED || a.status === AssignmentStatus.IN_PROGRESS).length },
    { name: 'Pending Approval', count: stats.approvalNeeded },
    { name: 'Completed', count: assignments.filter(a => a.status === AssignmentStatus.COMPLETED).length },
  ];

  // Hub Volume Analysis
  const hubData = store.getHubs().map(hub => ({
      name: hub.code,
      value: assignments.filter(a => a.hubId === hub.id).length
  }));

  // Product Mix
  const productMix = [
      { name: 'Home Loan', value: assignments.filter(a => a.productType === 'Home Loan').length, color: '#4f46e5' },
      { name: 'LAP', value: assignments.filter(a => a.productType === 'Loan Against Property').length, color: '#06b6d4' },
      { name: 'BL', value: assignments.filter(a => a.productType === 'Business Loan').length, color: '#8b5cf6' },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Operational Command Center</h2>
          <p className="text-slate-500 mt-1">Real-time pipeline monitoring and management</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isTestDataLoaded && (
            <button
              onClick={handleLoadTestData}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-amber-200 bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-all"
              title="Load 65 assignments + 25 advocates for testing"
            >
              🧪 Load Test Data
            </button>
          )}
          {geminiAvailable ? (
            <button
              onClick={handleGeminiAllocateAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-emerald-200 bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              title="Use Gemini AI to intelligently allocate assignments"
            >
              <Zap className="w-4 h-4" />
              🤖 AI Allocate All
            </button>
          ) : (
            <button
              onClick={handleAutoAllocateAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-purple-200 bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 hover:border-purple-300 transition-all shadow-lg shadow-purple-200"
              title="Automatically allocate all pending assignments using smart matching"
            >
              <Zap className="w-4 h-4" />
              Auto-Allocate All
            </button>
          )}
          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              setSelectedIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
              bulkMode
                ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-200'
                : 'bg-white text-brand-600 border-brand-200 hover:bg-brand-50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Allocate'}
          </button>
          <div className="hidden lg:flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-xs text-slate-500 font-medium">System Health</p>
              <p className="text-lg font-bold text-emerald-600">Optimal</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pipeline Health Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
            title="Pending Allocation" 
            value={stats.pendingAllocation} 
            icon={AlertTriangle} 
            colorClass="bg-rose-500 text-rose-600" 
        />
        <StatsCard 
            title="Network Availability" 
            value={`${networkAvailability}%`} 
            icon={Globe} 
            colorClass="bg-sky-500 text-sky-600" 
        />
        <StatsCard 
            title="Approval Queue" 
            value={stats.approvalNeeded} 
            icon={CheckSquare} 
            colorClass="bg-purple-500 text-purple-600" 
        />
        <StatsCard 
            title="Today's Throughput" 
            value={throughput} 
            icon={Activity} 
            colorClass="bg-emerald-500 text-emerald-600" 
        />
      </div>

      {/* Quick Filters */}
      {bulkMode && (
        <div className="bg-gradient-to-r from-brand-50 to-blue-50 border-2 border-brand-200 rounded-2xl p-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-brand-600" />
              <h4 className="text-sm font-bold text-brand-900 uppercase tracking-wider">Quick Filters</h4>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                className="text-sm border-2 border-brand-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                value={quickFilters.state}
                onChange={(e) => setQuickFilters({ ...quickFilters, state: e.target.value })}
              >
                <option value="ALL">All States</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <select
                className="text-sm border-2 border-brand-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                value={quickFilters.productType}
                onChange={(e) => setQuickFilters({ ...quickFilters, productType: e.target.value })}
              >
                <option value="ALL">All Products</option>
                {uniqueProducts.map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
              <select
                className="text-sm border-2 border-brand-200 rounded-lg px-3 py-2 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                value={quickFilters.hub}
                onChange={(e) => setQuickFilters({ ...quickFilters, hub: e.target.value })}
              >
                <option value="ALL">All Hubs</option>
                {hubs.map(hub => (
                  <option key={hub.id} value={hub.id}>{hub.code} - {hub.name}</option>
                ))}
              </select>
              <button
                onClick={() => setQuickFilters({ state: 'ALL', productType: 'ALL', hub: 'ALL' })}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 bg-white rounded-lg border-2 border-slate-200 hover:border-slate-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: List & Filters */}
        <div className="lg:col-span-2 space-y-8">
            {/* Main Table */}
            <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pipeline Management</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {filteredAssignments.length} assignments in view
                    {bulkMode && selectedIds.length > 0 && (
                      <span className="ml-2 text-brand-600 font-bold">
                        ({selectedIds.length} selected)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {bulkMode && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 px-3 py-1.5 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                      >
                        Select All Pending
                      </button>
                      <button
                        onClick={handleDeselectAll}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <select
                        className="text-sm border-none focus:ring-0 text-slate-700 font-semibold cursor-pointer bg-transparent"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value={AssignmentStatus.PENDING_ALLOCATION}>Pending Allocation</option>
                        <option value={AssignmentStatus.IN_PROGRESS}>In Progress</option>
                        <option value={AssignmentStatus.PENDING_APPROVAL}>Pending Approval</option>
                    </select>
                  </div>
                </div>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
                <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
                    <tr>
                    {bulkMode && (
                      <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">
                        <CheckSquare className="w-4 h-4 text-brand-600" />
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Assignment</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Advocate</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {filteredAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={bulkMode ? 6 : 5} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                              <Briefcase className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-900 font-bold">No assignments found</p>
                            <p className="text-slate-500 text-sm mt-1">Try adjusting your filter</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAssignments.map((a) => {
                        const advocate = store.getAdvocates().find(adv => adv.id === a.advocateId);
                        const hasUnresolved = a.queries.some(q => !q.response);
                        const isSelectable = a.status === AssignmentStatus.PENDING_ALLOCATION;
                        const isSelected = selectedIds.includes(a.id);
                        return (
                            <tr key={a.id} className={`hover:bg-slate-50 group transition-colors ${isSelected ? 'bg-brand-50' : ''}`}>
                                {bulkMode && (
                                  <td className="px-4 py-5">
                                    {isSelectable ? (
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleSelect(a.id)}
                                        className="w-4 h-4 text-brand-600 border-2 border-slate-300 rounded focus:ring-brand-500 focus:ring-2 cursor-pointer"
                                      />
                                    ) : (
                                      <div className="w-4 h-4" />
                                    )}
                                  </td>
                                )}
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-bold text-slate-900">{a.lan}</div>
                                    {hasUnresolved && (
                                        <span className="relative flex h-2 w-2" title="Unresolved Queries">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                        </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-slate-500 mt-0.5">{a.borrowerName}</div>
                                </td>
                                <td className="px-6 py-5 text-sm text-slate-600">{a.district}, {a.state}</td>
                                <td className="px-6 py-5 text-sm">
                                  {advocate ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xs border border-brand-100">
                                        {advocate.name?.charAt(0)}
                                      </div>
                                      <span className="font-medium text-slate-900">{advocate.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-5"><StatusBadge status={a.status} /></td>
                                <td className="px-6 py-5 text-right">
                                    <button
                                        onClick={() => onSelectAssignment(a.id)}
                                        className="text-brand-600 hover:text-brand-700 font-medium flex items-center justify-end gap-1 ml-auto group-hover:gap-2 transition-all"
                                    >
                                        Manage <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </td>
                            </tr>
                        );
                      })
                    )}
                </tbody>
                </table>
            </div>
            </div>

            {/* Hub Performance */}
            <div className="bg-white rounded-2xl shadow-soft border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <BarChartIcon className="w-5 h-5 text-brand-500" /> Hub Performance Volume
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hubData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: '#f8fafc'}} />
                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Right Column: Analytics */}
        <div className="space-y-8">
             {/* Aging Analysis */}
             <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-soft border border-slate-200 p-6">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                     <Clock className="w-5 h-5 text-amber-500" /> Aging Analysis
                 </h3>
                 <div className="space-y-5">
                     <div className="p-5 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 flex justify-between items-center shadow-sm">
                         <div>
                             <p className="text-3xl font-bold text-rose-700">{stats.stuck}</p>
                             <p className="text-xs text-rose-600 font-bold uppercase tracking-wide mt-1">Stuck &gt; 7 Days</p>
                         </div>
                         <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                           <AlertTriangle className="w-6 h-6 text-rose-500" />
                         </div>
                     </div>
                     
                     <div className="h-[200px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={pipelineData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#f1f5f9' }} />
                             </BarChart>
                         </ResponsiveContainer>
                     </div>
                 </div>
             </div>

             {/* Product Mix */}
             <div className="bg-white rounded-2xl shadow-soft border border-slate-200 p-6">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5">
                      Loan Product Mix
                 </h3>
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={productMix}
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {productMix.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
             </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {bulkMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-2xl shadow-2xl border-2 border-brand-500 px-6 py-4 flex items-center gap-4 min-w-[500px]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{selectedIds.length} Assignment{selectedIds.length > 1 ? 's' : ''} Selected</p>
                <p className="text-xs text-brand-100">Ready for bulk allocation</p>
              </div>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setShowBulkAllocate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-brand-600 rounded-lg font-semibold text-sm hover:bg-brand-50 transition-all shadow-lg"
            >
              <Zap className="w-4 h-4" />
              Allocate Selected
            </button>
            <button
              onClick={handleDeselectAll}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Clear Selection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Allocate Modal */}
      {showBulkAllocate && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[70] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6 max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-brand-100">
                <Users className="w-6 h-6 text-brand-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Bulk Allocate {selectedIds.length} Assignment{selectedIds.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Select an advocate to assign all {selectedIds.length} selected assignment{selectedIds.length > 1 ? 's' : ''}.
                </p>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Select Advocate
                  </label>
                  <select
                    value={selectedAdvocate}
                    onChange={(e) => setSelectedAdvocate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="">-- Choose Advocate --</option>
                    {store.getAdvocates().map(adv => {
                      const workload = store.getAdvocateWorkload(adv.id);
                      return (
                        <option key={adv.id} value={adv.id}>
                          {adv.name} ({workload} active)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowBulkAllocate(false);
                      setSelectedAdvocate('');
                    }}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAllocate}
                    disabled={!selectedAdvocate}
                    className="flex-1 px-4 py-2 rounded-lg font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                  >
                    Allocate All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Progress Dialog */}
      {showAIProgress && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-200 p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-4 animate-pulse">
                <Zap className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                🤖 Gemini AI is allocating...
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                Processing assignment {aiProgress.assignment}
              </p>

              <div className="mb-4">
                <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                  <span>Progress</span>
                  <span>{aiProgress.current} / {aiProgress.total}</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                    style={{ width: `${(aiProgress.current / aiProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {Math.round((aiProgress.current / aiProgress.total) * 100)}% complete
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                  <strong>Please wait...</strong> AI is analyzing each assignment and matching with the best advocate based on location, expertise, and workload.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
