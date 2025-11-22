
import React, { useState, useEffect, useRef } from 'react';
import { Assignment, AssignmentStatus, User, UserRole, ProductType } from '../types';
import { store } from '../services/mockStore';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Upload, Send, MessageSquare, CheckCircle, AlertTriangle, Save, ArrowLeft, Paperclip, X, File as FileIcon, Download, Clock, MapPin, Building, UserCircle, Briefcase, ShieldCheck, Star, BadgeCheck, TrendingUp, Users, History, AlertOctagon, GitCommit, Sparkles } from 'lucide-react';

interface Props {
  assignmentId: string;
  currentUser: User;
  onBack: () => void;
}

const AssignmentTimer = ({ start, end, status }: { start?: string, end?: string, status: AssignmentStatus }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status === AssignmentStatus.COMPLETED) return;
    const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, [status]);

  if (!start) return null;

  const startTime = new Date(start).getTime();
  const endTime = status === AssignmentStatus.COMPLETED && end ? new Date(end).getTime() : now;
  const diff = endTime - startTime;

  if (diff < 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold shadow-sm ${
        status === AssignmentStatus.COMPLETED 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{days}d {hours}h {minutes}m</span>
      {status === AssignmentStatus.COMPLETED && <span className="ml-1 text-[10px] uppercase opacity-75">(Final)</span>}
    </div>
  );
};

export const AssignmentDetails: React.FC<Props> = ({ assignmentId, currentUser, onBack }) => {
  const isOps = currentUser.role === UserRole.CT_OPS;
  
  const [assignment, setAssignment] = useState<Assignment | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'overview' | 'docs' | 'queries' | 'allocation'>('overview');
  
  // Form States
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState('Sale Deed');
  
  // Allocation States
  const [allocationStrategy, setAllocationStrategy] = useState<'property' | 'borrower' | 'hub'>('property');
  const [showReallocationModal, setShowReallocationModal] = useState(false);
  const [selectedAdvocateForRealloc, setSelectedAdvocateForRealloc] = useState<string | null>(null);
  const [reallocationReason, setReallocationReason] = useState('');
  const [showAiRecommendation, setShowAiRecommendation] = useState(false);
  
  // Query States
  const [queryText, setQueryText] = useState('');
  const [queryFile, setQueryFile] = useState<File | null>(null);
  const [queryTarget, setQueryTarget] = useState<UserRole>(UserRole.BANK_USER);
  const [responseText, setResponseText] = useState('');
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  
  // Report State
  const [reportRemarks, setReportRemarks] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);

  // Refs
  const queryFileInputRef = useRef<HTMLInputElement>(null);
  const responseFileInputRef = useRef<HTMLInputElement>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);
  const newQueryInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const data = store.getAssignmentById(assignmentId);
    setAssignment(data);
    if (data && currentUser.role === UserRole.CT_OPS) {
        setActiveTab('allocation');
    }
  }, [assignmentId, currentUser]);

  if (!assignment) return <div className="p-8 text-center">Loading...</div>;

  const refresh = () => setAssignment(store.getAssignmentById(assignmentId));

  const canEditDocs = (currentUser.role === UserRole.BANK_USER && assignment.ownerId === currentUser.id && 
                      (assignment.status === AssignmentStatus.DRAFT || assignment.status === AssignmentStatus.QUERY_RAISED));
  
  const canAllocate = isOps && (
      assignment.status === AssignmentStatus.PENDING_ALLOCATION || 
      assignment.status === AssignmentStatus.ALLOCATED ||
      assignment.status === AssignmentStatus.IN_PROGRESS
  );
  
  const canSubmitReport = currentUser.role === UserRole.ADVOCATE && assignment.advocateId === currentUser.id &&
                         (assignment.status === AssignmentStatus.ALLOCATED || assignment.status === AssignmentStatus.IN_PROGRESS || assignment.status === AssignmentStatus.REJECTED);

  const canApprove = currentUser.role === UserRole.BANK_USER && assignment.ownerId === currentUser.id && assignment.status === AssignmentStatus.PENDING_APPROVAL;

  const isAdvocate = currentUser.role === UserRole.ADVOCATE;
  const isBankUser = currentUser.role === UserRole.BANK_USER;
  const canRaiseNewQuery = isAdvocate || isOps || (isBankUser && assignment.status === AssignmentStatus.PENDING_APPROVAL);

  const visibleQueries = isOps 
    ? assignment.queries.filter(q => q.raisedBy === currentUser.id || q.directedTo === UserRole.CT_OPS)
    : assignment.queries;

  const unresolvedQueries = visibleQueries.filter(q => !q.response).length;

  const timelineSteps = [
    { id: 'start', label: 'Claimed', completed: !!assignment.claimedAt },
    { id: 'allocation', label: 'Allocated', completed: !!assignment.allocatedAt },
    { id: 'wip', label: 'In Progress', completed: assignment.status === AssignmentStatus.IN_PROGRESS || assignment.queries.length > 0 },
    { id: 'submission', label: 'Submitted', completed: assignment.status === AssignmentStatus.PENDING_APPROVAL },
    { id: 'completion', label: 'Completed', completed: assignment.status === AssignmentStatus.COMPLETED }
  ];

  // -- Smart Allocation Logic --
  const calculateMatchScore = (adv: User) => {
      let score = 0;
      
      // Location
      const targetDistrict = allocationStrategy === 'borrower' ? (assignment.borrowerDistrict || assignment.district) : assignment.district;
      const targetState = allocationStrategy === 'borrower' ? (assignment.borrowerState || assignment.state) : assignment.state;
      if (adv.districts?.includes(targetDistrict)) score += 50;
      else if (adv.states?.includes(targetState)) score += 20;

      // Expertise
      if (adv.expertise?.includes(assignment.productType)) score += 30;

      // AI Tags Matching
      if (assignment.priority === 'High Value' && adv.tags?.includes('High Value Expert')) score += 15;
      if (assignment.priority === 'Urgent' && adv.tags?.includes('Fast TAT')) score += 20;
      if (assignment.productType === ProductType.BL && adv.tags?.includes('Commercial Specialist')) score += 15;

      // Workload Penalty
      const workload = store.getAdvocateWorkload(adv.id);
      score -= (workload * 5);

      return score;
  };

  const getRankedAdvocates = () => {
      const allAdvocates = store.getAdvocates();
      let filtered = allAdvocates;

      if(allocationStrategy === 'property') {
          filtered = allAdvocates.filter(adv => adv.states?.includes(assignment.state));
      } else if(allocationStrategy === 'borrower') {
           const bState = assignment.borrowerState || assignment.state;
           filtered = allAdvocates.filter(adv => adv.states?.includes(bState));
      } else if(allocationStrategy === 'hub') {
          const hub = store.getHubById(assignment.hubId || '');
          if(hub) filtered = allAdvocates.filter(adv => adv.states?.includes(hub.state));
      }

      return filtered.map(adv => ({
          user: adv,
          score: calculateMatchScore(adv),
          workload: store.getAdvocateWorkload(adv.id)
      })).sort((a, b) => b.score - a.score);
  };

  const rankedAdvocates = canAllocate ? getRankedAdvocates() : [];
  const topMatch = rankedAdvocates.length > 0 ? rankedAdvocates[0] : null;

  // -- Handlers --
  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;
    store.uploadDocuments(assignment.id, [{ name: docFile.name, category: docCategory }], currentUser.id);
    setDocFile(null);
    refresh();
  };

  const handleSubmitForAllocation = () => {
    store.submitForAllocation(assignment.id);
    refresh();
  };

  const initiateAllocation = (advId: string) => {
      if (assignment.advocateId && assignment.advocateId !== advId) {
          setSelectedAdvocateForRealloc(advId);
          setReallocationReason('');
          setShowReallocationModal(true);
      } else {
          store.allocateAdvocate(assignment.id, advId);
          refresh();
      }
  };

  const confirmReallocation = () => {
      if (selectedAdvocateForRealloc && reallocationReason.trim()) {
          try {
            store.allocateAdvocate(assignment.id, selectedAdvocateForRealloc, reallocationReason);
            setShowReallocationModal(false);
            refresh();
          } catch(e) {
              alert((e as Error).message);
          }
      }
  };

  const handleRaiseQuery = () => {
    if(!queryText) return;
    const attachments = queryFile ? [queryFile.name] : [];
    const directedTo = isOps ? queryTarget : undefined;
    store.raiseQuery(assignment.id, queryText, currentUser.id, attachments, directedTo);
    setQueryText(''); setQueryFile(null); refresh();
  };

  const handleRespondQuery = (qId: string) => {
    if(!responseText) return;
    const attachments = responseFile ? [responseFile.name] : [];
    store.respondToQuery(assignment.id, qId, responseText, currentUser.id, attachments);
    setResponseText(''); setResponseFile(null); setActiveQueryId(null); refresh();
  };

  const handleSubmitReport = () => {
    if(!reportFile) return;
    store.submitReport(assignment.id, reportFile.name, reportRemarks);
    setReportRemarks(''); setReportFile(null); refresh();
  };

  const handleApprove = () => {
    store.approveReport(assignment.id); refresh();
  };

  const handleRejectClick = () => {
    setActiveTab('queries');
    setTimeout(() => { newQueryInputRef.current?.focus(); }, 100);
  };

  const tabs = isOps 
    ? [{id: 'allocation', label: 'Allocation Workspace'}, {id: 'queries', label: 'Queries'}]
    : [{id: 'overview', label: 'Overview'}, {id: 'docs', label: 'Documents'}, {id: 'queries', label: 'Queries'}];

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-slate-200 min-h-[600px] relative pb-12">
      {/* Reallocation Modal */}
      {showReallocationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                  <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-full"><AlertOctagon className="w-5 h-5 text-amber-600" /></div>
                      <div>
                        <h3 className="text-lg font-bold text-amber-900">Confirm Re-Allocation</h3>
                        <p className="text-xs text-amber-700">Changing advocate requires a mandatory reason.</p>
                      </div>
                  </div>
                  <div className="p-6">
                      <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Change <span className="text-red-500">*</span></label>
                          <textarea 
                              className="w-full border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500" rows={3}
                              value={reallocationReason} onChange={(e) => setReallocationReason(e.target.value)}
                          />
                      </div>
                      <div className="flex justify-end gap-3">
                          <button onClick={() => setShowReallocationModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                          <button onClick={confirmReallocation} disabled={!reallocationReason.trim()} className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">Confirm Re-Allocate</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-white rounded-t-2xl gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full transition-colors border border-transparent hover:border-slate-200">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{assignment.lan}</h2>
              <StatusBadge status={assignment.status} />
              {assignment.priority === 'High Value' && (
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wide border border-indigo-200 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> High Value
                  </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">{assignment.borrowerName} • {assignment.propertyAddress}</p>
          </div>
        </div>
        {assignment.allocatedAt && (
             <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Time Elapsed</span>
                <AssignmentTimer start={assignment.allocatedAt} end={assignment.completedAt} status={assignment.status} />
             </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-8 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 text-sm font-semibold border-b-2 transition-all relative ${
                activeTab === tab.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {tab.id === 'queries' && visibleQueries.length > 0 && (
                 <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${unresolvedQueries > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                    {unresolvedQueries > 0 ? unresolvedQueries : visibleQueries.length}
                 </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        
        {/* --- OPS: ALLOCATION WORKSPACE --- */}
        {isOps && activeTab === 'allocation' && (
           <div className="space-y-8">
              {/* Context Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Property Details</h4>
                      <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-brand-500 mt-0.5" />
                          <div>
                              <p className="font-semibold text-slate-900 text-sm">{assignment.propertyAddress}</p>
                              <p className="text-xs text-slate-500 mt-1">{assignment.district}, {assignment.state}</p>
                          </div>
                      </div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Assignment Profile</h4>
                      <div className="flex items-start gap-3">
                          <BadgeCheck className="w-5 h-5 text-brand-500 mt-0.5" />
                          <div>
                              <p className="font-semibold text-slate-900 text-sm">{assignment.productType}</p>
                              <p className="text-xs text-slate-500 mt-1">Priority: <span className="font-bold text-brand-700">{assignment.priority || 'Standard'}</span></p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Allocation Module */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden ring-1 ring-black/5">
                 <div className="bg-slate-900 text-white px-6 py-5 flex justify-between items-center">
                     <div>
                         <h3 className="text-lg font-bold flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-brand-400" /> Advocate Allocation Console
                        </h3>
                     </div>
                     {!showAiRecommendation && (
                        <button 
                             onClick={() => setShowAiRecommendation(true)}
                             className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 shadow-glow transition-all"
                        >
                             <Sparkles className="w-3.5 h-3.5" /> Generate AI Recommendation
                        </button>
                     )}
                 </div>

                 {/* AI Genius Insight Panel */}
                 {showAiRecommendation && topMatch && (
                     <div className="bg-indigo-50 border-b border-indigo-100 p-6 flex gap-4 animate-in slide-in-from-top-4">
                         <div className="p-3 bg-indigo-100 rounded-full h-fit"><Sparkles className="w-5 h-5 text-indigo-600" /></div>
                         <div className="flex-1">
                             <h4 className="text-sm font-bold text-indigo-900 mb-1">CT Genius Insight</h4>
                             <p className="text-sm text-indigo-800 leading-relaxed">
                                 I recommend allocating to <strong>{topMatch.user.firmName}</strong>. 
                                 {topMatch.user.tags?.includes('High Value Expert') && assignment.priority === 'High Value' ? ' They are a tagged "High Value Expert", matching this assignment profile.' : ''}
                                 {topMatch.user.districts?.includes(assignment.district) ? ` They cover the ${assignment.district} district natively.` : ''}
                                 {topMatch.workload < 3 ? ' Their workload is currently low, ensuring fast turnaround.' : ''}
                             </p>
                             <div className="mt-3 flex gap-2">
                                {topMatch.user.tags?.map(tag => (
                                    <span key={tag} className="text-[10px] font-bold bg-white text-indigo-600 px-2 py-1 rounded border border-indigo-200">{tag}</span>
                                ))}
                             </div>
                         </div>
                         <button onClick={() => setShowAiRecommendation(false)} className="text-indigo-400 hover:text-indigo-700 h-fit"><X className="w-4 h-4" /></button>
                     </div>
                 )}

                 <div className="p-6 bg-slate-50">
                     {/* Strategy Tabs */}
                     <div className="grid grid-cols-3 gap-4 mb-8">
                        {['property', 'borrower', 'hub'].map((strat) => (
                            <button 
                                key={strat}
                                onClick={() => setAllocationStrategy(strat as any)}
                                className={`p-4 rounded-xl border transition-all text-left ${
                                    allocationStrategy === strat 
                                    ? 'border-brand-500 bg-white ring-2 ring-brand-500/20 shadow-md' 
                                    : 'border-slate-200 bg-white hover:border-brand-300'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${allocationStrategy === strat ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {strat === 'property' ? <MapPin className="w-5 h-5" /> : strat === 'borrower' ? <UserCircle className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                                </div>
                                <p className={`font-bold text-sm capitalize ${allocationStrategy === strat ? 'text-brand-900' : 'text-slate-700'}`}>{strat} Location</p>
                            </button>
                        ))}
                     </div>

                     <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {rankedAdvocates.map(({user: adv, score, workload}, idx) => {
                            const isCurrent = assignment.advocateId === adv.id;
                            const isBestMatch = idx === 0;
                            const loadColor = workload < 3 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
                            
                            return (
                                <div key={adv.id} className={`bg-white p-5 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center gap-6 relative ${isCurrent ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/10' : 'border-slate-200'}`}>
                                    {isBestMatch && !isCurrent && (
                                        <div className="absolute -top-2.5 left-6 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1 shadow-sm">
                                            <Star className="w-3 h-3 fill-current" /> Best Match
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 flex-1 min-w-[250px]">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-200">
                                            {adv.firmName?.charAt(0)}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                {adv.firmName}
                                                {isCurrent && <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded-full uppercase font-bold">Assigned</span>}
                                            </h5>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {adv.tags?.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 lg:gap-8 lg:border-l lg:border-slate-100 lg:pl-8 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                                        <div className="text-center min-w-[90px]">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Workload</div>
                                            <div className={`px-2 py-1 rounded-md text-xs font-bold border ${loadColor} inline-block w-full`}>{workload} Active</div>
                                        </div>
                                        <div className="text-center min-w-[90px]">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Match Score</div>
                                            <div className="text-2xl font-bold text-brand-600">{score}</div>
                                        </div>
                                    </div>
                                    <div className="w-full lg:w-auto flex justify-end mt-2 lg:mt-0">
                                            <button 
                                            onClick={() => initiateAllocation(adv.id)}
                                            disabled={isCurrent}
                                            className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wide transition-all w-full lg:w-auto ${
                                                isCurrent ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-brand-600 shadow-md active:scale-95'
                                            }`}
                                        >
                                            {isCurrent ? 'Current' : (assignment.advocateId ? 'Re-Allocate' : 'Allocate')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                     </div>
                 </div>
              </div>
           </div>
        )}


        {/* --- COMMON: OVERVIEW (For Bank/Advocate) --- */}
        {!isOps && activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-8 flex items-center gap-2"><GitCommit className="w-4 h-4" /> Assignment Progress</h3>
                <div className="flex items-center justify-between relative px-2 md:px-6">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-0" />
                    {timelineSteps.map((step) => (
                        <div key={step.id} className="relative z-10 flex flex-col items-center gap-3 group">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all shadow-sm ${
                                step.completed ? 'bg-emerald-500 border-emerald-100 text-white ring-2 ring-emerald-500 ring-offset-2' : 'bg-white border-slate-200 text-slate-300'
                            }`}>
                                {step.completed ? <CheckCircle className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap px-2 py-1 rounded-md ${step.completed ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400'}`}>{step.label}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Property & Loan Details</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-slate-200/60">
                            <span className="text-slate-500 text-sm font-medium">Product</span>
                            <span className="font-bold text-slate-900 text-sm">{assignment.productType}</span>
                        </div>
                        <div className="py-2">
                            <span className="text-slate-500 text-sm block mb-1 font-medium">Property Address</span>
                            <span className="font-semibold text-slate-900 text-sm block leading-relaxed">{assignment.propertyAddress}</span>
                        </div>
                    </div>
                 </div>
              </div>
              
              <div className="space-y-6">
                 {canSubmitReport && (
                    <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-50">
                        <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2"><div className="p-1.5 bg-indigo-100 rounded-lg"><FileText className="w-5 h-5 text-indigo-600" /></div> Submit Final Report</h3>
                        <textarea className="w-full p-4 border border-slate-200 bg-slate-50 rounded-xl text-sm mb-4 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" rows={3} placeholder="Enter remarks..." value={reportRemarks} onChange={(e) => setReportRemarks(e.target.value)} />
                        <div className="mb-6">
                            <input type="file" ref={reportFileInputRef} className="hidden" onChange={(e) => setReportFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx" />
                            <div className="flex items-center gap-3">
                                <button onClick={() => reportFileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50">{reportFile ? 'Change File' : 'Select Report File'}</button>
                                {reportFile && <span className="text-sm text-indigo-700 font-semibold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">{reportFile.name}</span>}
                            </div>
                        </div>
                        <button onClick={handleSubmitReport} disabled={!reportFile} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 shadow-md disabled:opacity-50 transition-all">Submit Report</button>
                    </div>
                 )}
                 {canApprove && (
                    <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-50">
                        <h3 className="text-lg font-bold text-emerald-900 mb-2 flex items-center gap-2"><div className="p-1.5 bg-emerald-100 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-600" /></div> Approval Pending</h3>
                         {assignment.finalReportUrl && (
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6 cursor-pointer hover:border-brand-300">
                                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm"><FileText className="w-5 h-5 text-slate-400" /></div>
                                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{assignment.finalReportUrl}</p></div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={handleRejectClick} className="px-4 py-3 border border-red-200 text-red-700 rounded-xl font-bold hover:bg-red-50">Reject / Query</button>
                            <button onClick={handleApprove} className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md">Approve</button>
                        </div>
                    </div>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: DOCUMENTS (Legacy) */}
        {!isOps && activeTab === 'docs' && (
          <div className="space-y-8">
            {canEditDocs && (
                <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">Upload New Document</h3>
                    <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Select File</label>
                            <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-slate-300 file:border file:bg-white bg-white border border-slate-200 rounded-lg" />
                        </div>
                        <div className="w-full md:w-1/3">
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Category</label>
                            <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="block w-full rounded-lg border-slate-200 shadow-sm py-3 bg-white text-slate-900 font-medium">
                                <option value="Sale Deed">Sale Deed</option>
                                <option value="Index II">Index II</option>
                            </select>
                        </div>
                        <button type="submit" disabled={!docFile} className="w-full md:w-auto px-8 py-3 bg-brand-600 text-white rounded-lg font-semibold shadow-md hover:bg-brand-700 disabled:bg-slate-300 flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Upload</button>
                    </form>
                    {canEditDocs && assignment.status === AssignmentStatus.DRAFT && assignment.documents.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
                             <button onClick={handleSubmitForAllocation} className="text-brand-600 font-bold text-sm hover:text-brand-800 flex items-center gap-1.5 px-4 py-2 hover:bg-brand-50 rounded-lg">Finish Uploading & Submit <ArrowLeft className="w-4 h-4 rotate-180" /></button>
                        </div>
                    )}
                </div>
            )}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Document Name</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {assignment.documents.map((doc, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-sm text-slate-900">{doc.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{doc.category}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* TAB: QUERIES */}
        {activeTab === 'queries' && (
          <div className="max-w-4xl mx-auto space-y-8">
             {visibleQueries.length === 0 ? (
                 <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                     <p className="text-slate-900 font-bold">No queries found</p>
                 </div>
             ) : (
                 <div className="space-y-6">
                     {visibleQueries.map((q) => (
                         <div key={q.id} className="flex flex-col gap-4">
                             <div className="flex gap-4 items-start">
                                 <div className="w-10 h-10 rounded-full bg-white border border-rose-100 shadow-sm flex items-center justify-center font-bold text-rose-600 text-xs">Q</div>
                                 <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-tl-none p-5 flex-1 max-w-[90%]">
                                     <p className="text-sm text-slate-800 leading-relaxed font-medium">{q.text}</p>
                                     {!q.response && activeQueryId !== q.id && (
                                         <button onClick={() => setActiveQueryId(q.id)} className="text-xs font-bold text-brand-600 mt-2 hover:underline">Reply</button>
                                     )}
                                 </div>
                             </div>
                             {q.response ? (
                                 <div className="flex gap-4 items-start flex-row-reverse">
                                     <div className="w-10 h-10 rounded-full bg-brand-600 shadow-md flex items-center justify-center font-bold text-white text-xs">A</div>
                                     <div className="bg-brand-50 border border-brand-100 shadow-sm rounded-2xl rounded-tr-none p-5 flex-1 max-w-[90%]">
                                         <p className="text-sm text-slate-800 leading-relaxed">{q.response}</p>
                                     </div>
                                 </div>
                             ) : (
                                 activeQueryId === q.id && (
                                     <div className="ml-14 bg-white p-6 rounded-xl border border-brand-200 shadow-lg ring-1 ring-brand-100">
                                         <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-4" rows={3} autoFocus placeholder="Type your response..." value={responseText} onChange={(e) => setResponseText(e.target.value)} />
                                         <div className="flex justify-end gap-3">
                                             <button onClick={() => { setActiveQueryId(null); setResponseText(''); }} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                                             <button onClick={() => handleRespondQuery(q.id)} className="px-6 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700">Send Reply</button>
                                         </div>
                                     </div>
                                 )
                             )}
                         </div>
                     ))}
                 </div>
             )}
             {canRaiseNewQuery && (
                 <div className="mt-10 pt-8 border-t border-slate-100">
                     <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">{isBankUser ? 'Reject Report & Raise Query' : 'Raise New Query'}</h4>
                     <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                         {isOps && (
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct To:</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setQueryTarget(UserRole.BANK_USER)} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${queryTarget === UserRole.BANK_USER ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>Bank User</button>
                                    <button onClick={() => setQueryTarget(UserRole.ADVOCATE)} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${queryTarget === UserRole.ADVOCATE ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>Advocate</button>
                                </div>
                            </div>
                         )}
                         <textarea ref={newQueryInputRef} className="w-full p-6 border-none focus:ring-0 text-sm resize-none bg-transparent" rows={4} placeholder="Describe the issue..." value={queryText} onChange={(e) => setQueryText(e.target.value)} />
                         <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                             <button onClick={handleRaiseQuery} disabled={!queryText} className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-50">Send</button>
                         </div>
                     </div>
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
