
import React, { useState, useEffect, useCallback } from 'react';
import { User, Assignment, AssignmentStatus } from '../types';
import { store } from '../services/mockStore';
import { Search, Upload, AlertCircle, CheckCircle, Clock, ArrowRight, Info, FileText, Save, ChevronLeft, Briefcase, Activity, PieChart as PieIcon, RefreshCw, UserCheck, XCircle, Loader2 } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TableSkeleton } from '../components/LoadingSkeleton';

interface Props {
  user: User;
  onSelectAssignment: (id: string) => void;
  initialView?: 'dashboard' | 'claim-form';
}

export const BankDashboard: React.FC<Props> = ({ user, onSelectAssignment, initialView = 'dashboard' }) => {
  // View Mode: 'dashboard' (search & list) | 'claim-form' (review & upload)
  const [viewMode, setViewMode] = useState<'dashboard' | 'claim-form'>('dashboard');
  
  // Sync with prop when it changes (e.g. sidebar click)
  useEffect(() => {
    if (initialView === 'claim-form') {
        setViewMode('dashboard'); 
        setTimeout(() => document.getElementById('assignment-search-input')?.focus(), 100);
    } else {
        setViewMode('dashboard');
    }
  }, [initialView]);

  // Data State
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [selectedUnclaimed, setSelectedUnclaimed] = useState<Assignment | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [transferRequests, setTransferRequests] = useState<Assignment[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Assignment[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Form State (for Claiming)
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState('Sale Deed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Refresh My Assignments
  const refreshMyList = () => {
    const all = store.getAssignments();
    const myOwned = all.filter(a => a.ownerId === user.id);
    setMyAssignments(myOwned);

    // Identify assignments with pending transfer requests where I am the owner
    const pendingTransfers = myOwned.filter(a => !!a.transferRequest);
    setTransferRequests(pendingTransfers);

    // Generate Activity Feed
    const activities = myOwned.flatMap(a => 
      (a.auditTrail || []).map(log => ({
        ...log,
        lan: a.lan,
        assignmentId: a.id
      }))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    setRecentActivity(activities);
  };

  useEffect(() => {
    setIsLoadingDashboard(true);
    // Simulate loading for better UX
    setTimeout(() => {
      refreshMyList();
      setIsLoadingDashboard(false);
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const performSearch = useCallback(() => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    // Simulate API delay with realistic timing
    setTimeout(() => {
      const results = store.searchAssignments(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);
  }, [searchQuery]);

  // Debounced search on input change
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);

    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    if (!value.trim()) {
      setHasSearched(false);
      setSearchResults([]);
      return;
    }

    // Auto-search after 500ms of no typing
    const timer = setTimeout(() => {
      performSearch();
    }, 800);

    setSearchDebounceTimer(timer);
  };

  const handleSelectForClaim = (assignment: Assignment) => {
    setSelectedUnclaimed(assignment);
    setDocFile(null); // Reset form
    setDocCategory('Sale Deed');
    setViewMode('claim-form');
  };

  const handleCancelClaim = () => {
    setSelectedUnclaimed(null);
    setViewMode('dashboard');
  };

  const handleRequestTransfer = (assignment: Assignment) => {
      if(window.confirm(`This assignment is currently owned by someone else. Do you want to request a transfer to your name?`)) {
          try {
              store.requestTransfer(assignment.id, user.id);
              // Refresh search results to show "Pending" status
              const updatedResults = store.searchAssignments(searchQuery);
              setSearchResults(updatedResults);
              alert("Transfer request sent to the current owner.");
          } catch(e) {
              alert((e as Error).message);
          }
      }
  };

  const resolveTransfer = (assignmentId: string, approved: boolean) => {
      try {
          store.resolveTransferRequest(assignmentId, approved);
          refreshMyList(); // Updates list and removes request from panel
      } catch(e) {
          alert((e as Error).message);
      }
  };

  const handleClaimProcess = async (action: 'draft' | 'submit') => {
    if (!selectedUnclaimed) return;
    
    try {
      setIsSubmitting(true);
      
      // 1. Claim the assignment (Set owner, status -> DRAFT)
      const claimed = store.claimAssignment(selectedUnclaimed.id, user.id);

      // 2. Upload Documents if present
      if (docFile) {
        store.uploadDocuments(claimed.id, [{ name: docFile.name, category: docCategory }], user.id);
      }

      // 3. If Submit, change status -> PENDING_ALLOCATION
      if (action === 'submit') {
        store.submitForAllocation(claimed.id);
      }

      // Reset UI
      await new Promise(resolve => setTimeout(resolve, 800)); // Fake loading for UX
      setIsSubmitting(false);
      setSelectedUnclaimed(null);
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setViewMode('dashboard');
      refreshMyList();

    } catch (err) {
      alert((err as Error).message);
      setIsSubmitting(false);
    }
  };

  // Stats & Chart Data
  const stats = {
    draft: myAssignments.filter(a => a.status === AssignmentStatus.DRAFT).length,
    pending: myAssignments.filter(a => a.status === AssignmentStatus.PENDING_ALLOCATION || a.status === AssignmentStatus.IN_PROGRESS).length,
    action: myAssignments.filter(a => a.status === AssignmentStatus.QUERY_RAISED || a.status === AssignmentStatus.PENDING_APPROVAL).length,
    completed: myAssignments.filter(a => a.status === AssignmentStatus.COMPLETED).length,
  };

  const productData = [
    { name: 'Home Loan', value: myAssignments.filter(a => a.productType === 'Home Loan').length, color: '#4f46e5' },
    { name: 'LAP', value: myAssignments.filter(a => a.productType === 'Loan Against Property').length, color: '#06b6d4' },
    { name: 'Business Loan', value: myAssignments.filter(a => a.productType === 'Business Loan').length, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // -- VIEW 1: CLAIM FORM --
  if (viewMode === 'claim-form' && selectedUnclaimed) {
    return (
      <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          onClick={handleCancelClaim}
          className="group flex items-center text-slate-500 hover:text-brand-600 mb-6 text-sm font-medium transition-colors"
        >
          <div className="p-1 rounded-full bg-white border border-slate-200 mr-2 group-hover:border-brand-200 group-hover:bg-brand-50 transition-colors">
             <ChevronLeft className="w-4 h-4" />
          </div>
          Back to Search
        </button>

        <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
          {/* Form Header */}
          <div className="bg-white px-8 py-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Initiate Assignment</h2>
              <p className="text-slate-500 text-sm mt-1">Review details and upload initial documents.</p>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Assignment ID</p>
              <p className="text-lg font-mono font-semibold text-slate-700">{selectedUnclaimed.lan}</p>
            </div>
          </div>

          <div className="p-8">
            {/* Read-Only Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Borrower Name</label>
                <div className="text-slate-900 font-medium text-base">{selectedUnclaimed.borrowerName}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">PAN Number</label>
                <div className="text-slate-900 font-medium text-base">{selectedUnclaimed.pan}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Property Address</label>
                <div className="text-slate-900 font-medium text-base">{selectedUnclaimed.propertyAddress}</div>
                <div className="text-slate-500 text-sm mt-1">{selectedUnclaimed.district}, {selectedUnclaimed.state} - {selectedUnclaimed.pincode}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Product Type</label>
                <div className="text-slate-900 font-medium text-base">{selectedUnclaimed.productType}</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Scope</label>
                 <div className="text-slate-900 font-medium text-base">{selectedUnclaimed.scope}</div>
              </div>
            </div>

            <div className="border-t border-slate-100 my-8"></div>

            {/* Document Upload Section */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-brand-50 rounded-lg">
                    <Upload className="w-5 h-5 text-brand-600" />
                </div>
                Required Documents
              </h3>
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50/80 transition-colors">
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Document</label>
                    <input 
                      type="file" 
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer bg-white rounded-lg border border-slate-200 shadow-sm"
                    />
                  </div>
                  <div className="w-full md:w-1/3">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Document Category</label>
                    <select 
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="block w-full rounded-lg border-slate-200 bg-white text-slate-900 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-3 px-4 transition-shadow"
                    >
                      <option value="Sale Deed">Sale Deed</option>
                      <option value="Index II">Index II</option>
                      <option value="Tax Receipt">Tax Receipt</option>
                      <option value="Allotment Letter">Allotment Letter</option>
                      <option value="Possession Letter">Possession Letter</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                {docFile && (
                   <div className="mt-4 flex items-center text-sm text-emerald-700 bg-emerald-50 w-fit px-4 py-2 rounded-lg border border-emerald-100 shadow-sm">
                      <CheckCircle className="w-4 h-4 mr-2" /> 
                      Ready to upload: <span className="font-semibold ml-1">{docFile.name}</span>
                   </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleClaimProcess('draft')}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save as Draft
              </button>

              <button
                onClick={() => handleClaimProcess('submit')}
                disabled={!docFile || isSubmitting}
                className={`w-full sm:w-auto px-8 py-3 rounded-lg font-semibold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all flex items-center justify-center gap-2
                  ${!docFile || isSubmitting
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/25 hover:shadow-lg active:scale-95'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Upload & Submit
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            {!docFile && (
               <p className="text-xs text-right text-rose-500 mt-3 flex items-center justify-end font-medium">
                 <Info className="w-3 h-3 mr-1" /> Document upload required to submit
               </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -- VIEW 2: DASHBOARD (SEARCH & LIST) --
  if (isLoadingDashboard) {
    return (
      <div className="space-y-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="animate-pulse">
              <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-200">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-soft border border-slate-200">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-6"></div>
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Transfer Request Notification Panel */}
      {transferRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-amber-200 overflow-hidden mb-8 ring-4 ring-amber-50">
              <div className="bg-amber-50 px-6 py-4 flex items-center gap-3 border-b border-amber-100">
                  <div className="bg-amber-100 p-2 rounded-lg">
                      <RefreshCw className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                      <h3 className="text-sm font-bold text-amber-900">Incoming Transfer Requests</h3>
                      <p className="text-xs text-amber-700">Other users have requested to take ownership of these assignments.</p>
                  </div>
              </div>
              <div className="divide-y divide-slate-100">
                  {transferRequests.map(req => (
                      <div key={req.id} className="px-6 py-4 flex items-center justify-between">
                          <div>
                              <p className="text-sm font-bold text-slate-900">{req.lan} <span className="text-slate-400 font-normal mx-2">|</span> {req.borrowerName}</p>
                              <p className="text-xs text-slate-500 mt-1">Requested by <span className="font-semibold text-brand-600">{req.transferRequest?.requestedByName}</span></p>
                          </div>
                          <div className="flex gap-3">
                              <button 
                                onClick={() => resolveTransfer(req.id, false)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-rose-600 transition-colors flex items-center gap-1"
                              >
                                  <XCircle className="w-4 h-4" /> Reject
                              </button>
                              <button 
                                onClick={() => resolveTransfer(req.id, true)}
                                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 shadow-sm flex items-center gap-1"
                              >
                                  <UserCheck className="w-4 h-4" /> Approve Transfer
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Search Section */}
      <div className="bg-white p-8 rounded-2xl shadow-soft border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
             <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Fetch Assignment</h2>
             <p className="text-slate-500 mt-1 text-sm">Search by LAN, PAN, or Borrower Name to claim new work.</p>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 max-w-5xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-brand-500 transition-colors" />
            <input 
              id="assignment-search-input"
              type="text" 
              placeholder="Enter LAN, PAN, or Borrower Name..."
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 bg-white rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-inner"
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={!searchQuery.trim() || isSearching}
            className="bg-brand-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-500/20 hover:shadow-lg active:scale-95 min-w-[140px] flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search
              </>
            )}
          </button>
        </form>

        {/* Loading State */}
        {isSearching && (
          <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden shadow-sm p-8">
            <TableSkeleton rows={3} />
          </div>
        )}

        {/* Search Results */}
        {!isSearching && searchResults.length > 0 && (
          <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Results ({searchResults.length})</h3>
            </div>
            <table className="min-w-full divide-y divide-slate-200">
              <tbody className="bg-white divide-y divide-slate-100">
                {searchResults.map((r) => (
                  <tr key={r.id} className="hover:bg-brand-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                               <Briefcase className="w-5 h-5" />
                           </div>
                           <div>
                                <div className="text-sm font-bold text-slate-900">{r.lan}</div>
                                <div className="text-xs text-slate-500 mt-0.5">LAN Number</div>
                           </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{r.borrowerName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Borrower</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 truncate max-w-xs" title={r.propertyAddress}>{r.propertyAddress}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{r.district}, {r.state}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {r.status === AssignmentStatus.UNCLAIMED ? (
                        <button 
                          onClick={() => handleSelectForClaim(r)}
                          className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 shadow-sm transition-all"
                        >
                          Select & Claim
                        </button>
                      ) : r.ownerId === user.id ? (
                        <span className="text-emerald-600 flex items-center justify-end gap-1 bg-emerald-50 px-3 py-1.5 rounded-full w-fit ml-auto border border-emerald-100 text-xs font-bold uppercase tracking-wide">
                            <CheckCircle className="h-3 w-3"/> Claimed (Open)
                        </span>
                      ) : (
                         <div className="flex justify-end">
                             {r.transferRequest && r.transferRequest.requestedBy === user.id ? (
                                <span className="text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Request Pending
                                </span>
                             ) : (
                                <button 
                                    onClick={() => handleRequestTransfer(r)}
                                    className="text-brand-600 bg-brand-50 border border-brand-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-100 hover:border-brand-300 transition-all flex items-center gap-1"
                                >
                                    <RefreshCw className="w-3 h-3" /> Request Transfer
                                </button>
                             )}
                         </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Empty State / Demo Hints */}
        {!hasSearched && !isSearching && searchResults.length === 0 && (
            <div className="mt-8 p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
              <div className="flex items-center gap-2 font-bold text-slate-700 mb-4 text-xs uppercase tracking-wider">
                <Info className="w-4 h-4 text-brand-500" /> 
                <span>Demo Quick Search Terms</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {['LN10001', 'Rajesh Kumar', 'ABCDE1234F', 'LN_TRANSFER_TEST'].map(term => (
                    <button 
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:border-brand-300 hover:text-brand-600 hover:shadow-sm transition-all"
                    >
                        {term}
                    </button>
                ))}
              </div>
            </div>
        )}

         {/* No Results State */}
         {!isSearching && hasSearched && searchResults.length === 0 && (
             <div className="mt-6 p-12 text-center bg-white rounded-xl border border-slate-100">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                    <Search className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No matching assignments found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">We couldn't find any assignments matching "{searchQuery}". Please check the details and try again.</p>
             </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
               {/* Stats Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard title="Drafts" value={stats.draft} icon={FileText} colorClass="bg-amber-500 text-amber-600" />
                    <StatsCard title="In Progress" value={stats.pending} icon={Clock} colorClass="bg-blue-500 text-blue-600" />
                    <StatsCard title="Action Required" value={stats.action} icon={AlertCircle} colorClass="bg-rose-500 text-rose-600" />
                    <StatsCard title="Completed" value={stats.completed} icon={CheckCircle} colorClass="bg-emerald-500 text-emerald-600" />
               </div>

                {/* My Assignments Table */}
                <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h3 className="text-lg font-bold text-slate-900">My Assignments</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Assignment Detail</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Scope</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {myAssignments.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm">You haven't claimed any assignments yet.</td></tr>
                            ) : (
                            myAssignments.slice(0, 5).map((a) => {
                                const hasUnresolved = a.queries.some(q => !q.response);
                                return (
                                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-bold text-slate-900">{a.lan}</div>
                                                {hasUnresolved && (
                                                    <span className="relative flex h-2.5 w-2.5" title="Unresolved Queries">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-slate-500 mt-0.5">{a.borrowerName}</div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                {a.productType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <StatusBadge status={a.status} />
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => onSelectAssignment(a.id)}
                                                className="text-brand-600 hover:text-brand-800 flex items-center justify-end gap-1 group transition-colors"
                                            >
                                                Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
          </div>
          
          <div className="space-y-6">
               {/* Portfolio Chart */}
               <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200">
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <PieIcon className="w-4 h-4 text-brand-500" /> Portfolio Distribution
                   </h3>
                   <div className="h-[200px] w-full relative">
                        {productData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={productData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {productData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">No Data</div>
                        )}
                   </div>
               </div>

               {/* Activity Feed */}
               <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200">
                   <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <Activity className="w-4 h-4 text-brand-500" /> Recent Updates
                   </h3>
                   <div className="space-y-6">
                       {recentActivity.length === 0 ? (
                           <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
                       ) : (
                           recentActivity.map((act, idx) => (
                               <div key={idx} className="relative pl-4 border-l-2 border-slate-100">
                                   <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                                   <p className="text-xs font-bold text-slate-500 mb-0.5">{new Date(act.timestamp).toLocaleDateString()}</p>
                                   <p className="text-sm font-bold text-slate-800">{act.action.replace(/_/g, ' ')}</p>
                                   <p className="text-xs text-slate-500 truncate w-full">LAN: {act.lan}</p>
                               </div>
                           ))
                       )}
                   </div>
               </div>
          </div>
      </div>
    </div>
  );
};
