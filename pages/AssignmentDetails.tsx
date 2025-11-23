
import React, { useState, useEffect, useRef } from 'react';
import { Assignment, AssignmentStatus, User, UserRole, ProductType } from '../types';
import { store } from '../services/mockStore';
import { StatusBadge } from '../components/StatusBadge';
import { ReportDeliveryCard } from '../components/ReportDeliveryCard';
import { DocumentCard } from '../components/DocumentCard';
import { ExtractedDataModal } from '../components/ExtractedDataModal';
import { FileText, Upload, Send, MessageSquare, CheckCircle, AlertTriangle, Save, ArrowLeft, Paperclip, X, File as FileIcon, Download, Clock, MapPin, Building, UserCircle, Briefcase, ShieldCheck, Star, BadgeCheck, TrendingUp, Users, History, AlertOctagon, GitCommit, Sparkles, Brain, Zap, Lightbulb } from 'lucide-react';
import { geminiDocClassifier, ClassificationResult } from '../services/geminiDocumentClassification';
import { ExtractedData } from '../services/documentParser';

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

  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState<Array<{ file: File; category: string; aiClassification?: ClassificationResult }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiClassificationResults, setAiClassificationResults] = useState<{
    missingDocuments?: string[];
    completenessScore?: number;
  } | null>(null);
  
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

  // Modal State
  const [showExtractedDataModal, setShowExtractedDataModal] = useState(false);
  const [selectedExtractedData, setSelectedExtractedData] = useState<ExtractedData | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState('');

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

  // Auto-categorize documents based on filename
  const autoCategorize = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes('sale') || lower.includes('deed')) return 'Sale Deed';
    if (lower.includes('index') || lower.includes('ii')) return 'Index II';
    if (lower.includes('ec') || lower.includes('encumbrance')) return 'EC Certificate';
    if (lower.includes('title') || lower.includes('search')) return 'Title Search Report';
    if (lower.includes('tax') || lower.includes('receipt')) return 'Tax Receipt';
    if (lower.includes('noc') || lower.includes('clearance')) return 'NOC';
    if (lower.includes('plan') || lower.includes('survey')) return 'Survey Plan';
    if (lower.includes('photo') || lower.includes('image')) return 'Property Photos';
    return 'Sale Deed'; // Default
  };

  // Handle bulk file selection with validation
  const handleBulkFileSelect = (files: FileList | null) => {
    if (!files) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const validFiles: Array<{ file: File; category: string }> = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      // Check file type
      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
        invalidFiles.push(`${file.name} (unsupported format)`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        invalidFiles.push(`${file.name} (file too large: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        return;
      }

      // Check for duplicates
      const isDuplicate = bulkFiles.some(existing => existing.file.name === file.name);
      if (isDuplicate) {
        invalidFiles.push(`${file.name} (already added)`);
        return;
      }

      validFiles.push({
        file,
        category: autoCategorize(file.name)
      });
    });

    // Add valid files
    if (validFiles.length > 0) {
      setBulkFiles(prev => [...prev, ...validFiles]);
    }

    // Show feedback for invalid files
    if (invalidFiles.length > 0) {
      alert(
        `⚠️ Some files were not added:\n\n` +
        invalidFiles.map(f => `• ${f}`).join('\n') +
        `\n\nSupported formats: PDF, JPG, PNG, DOC, DOCX\nMax size: 10MB per file`
      );
    }
  };

  // AI-powered document classification
  const handleAIClassification = async () => {
    if (bulkFiles.length === 0) return;

    setIsClassifying(true);

    try {
      const filenames = bulkFiles.map(f => f.file.name);
      const assignmentContext = {
        propertyAddress: assignment.propertyAddress,
        state: assignment.state,
        district: assignment.district,
        productType: assignment.productType,
        scope: assignment.scope || 'Full Chain'
      };

      const result = await geminiDocClassifier.classifyBulkDocuments(filenames, assignmentContext);

      // Update bulk files with AI classifications
      const updatedFiles = bulkFiles.map((item, index) => {
        const aiResult = result.results.find(r => r.filename === item.file.name);
        if (aiResult) {
          return {
            ...item,
            category: aiResult.classification.category,
            aiClassification: aiResult.classification
          };
        }
        return item;
      });

      setBulkFiles(updatedFiles);
      setAiClassificationResults({
        missingDocuments: result.missingDocuments,
        completenessScore: result.completenessScore
      });

      console.log('✅ AI Classification complete:', result);
    } catch (error) {
      console.error('❌ AI classification failed:', error);
      alert('AI classification failed. Using basic categorization.');
    } finally {
      setIsClassifying(false);
    }
  };

  // Handle drag and drop (improved to prevent flickering)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're actually leaving the drop zone
    // (not just entering a child element)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleBulkFileSelect(files);
    }
  };

  // Remove file from bulk upload list
  const handleRemoveBulkFile = (index: number) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Update category for a bulk file
  const handleUpdateBulkCategory = (index: number, category: string) => {
    setBulkFiles(prev => prev.map((item, i) =>
      i === index ? { ...item, category } : item
    ));
  };

  // Upload all bulk files
  const handleBulkUpload = () => {
    if (bulkFiles.length === 0) return;

    const docs = bulkFiles.map(({ file, category }) => ({
      name: file.name,
      category,
      file,
      size: file.size
    }));

    store.uploadDocuments(assignment.id, docs, currentUser.id);
    setBulkFiles([]);
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
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-full"><AlertOctagon className="w-5 h-5 text-amber-600" /></div>
                          <div>
                            <h3 className="text-lg font-bold text-amber-900">Re-Allocate Assignment</h3>
                            <p className="text-xs text-amber-700">Select a new advocate using smart matching</p>
                          </div>
                      </div>
                      <button onClick={() => setShowReallocationModal(false)} className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-amber-600" />
                      </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                      {/* Strategy Tabs */}
                      <div className="mb-6">
                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Allocation Strategy</h4>
                          <div className="grid grid-cols-3 gap-3">
                              {['property', 'borrower', 'hub'].map((strat) => (
                                  <button
                                      key={strat}
                                      onClick={() => setAllocationStrategy(strat as any)}
                                      className={`p-3 rounded-lg border transition-all text-left ${
                                          allocationStrategy === strat
                                          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                                          : 'border-slate-200 bg-white hover:border-brand-300'
                                      }`}
                                  >
                                      <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${allocationStrategy === strat ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                              {strat === 'property' ? <MapPin className="w-4 h-4" /> : strat === 'borrower' ? <UserCircle className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                                          </div>
                                          <p className={`font-bold text-sm capitalize ${allocationStrategy === strat ? 'text-brand-900' : 'text-slate-700'}`}>{strat}</p>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Ranked Advocates */}
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 sticky top-0 bg-white py-2">
                              Matched Advocates ({rankedAdvocates.length})
                          </h4>
                          {rankedAdvocates.map(({user: adv, score, workload}, idx) => {
                              const isCurrent = assignment.advocateId === adv.id;
                              const isBestMatch = idx === 0;
                              const loadColor = workload < 3 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';

                              return (
                                  <div key={adv.id} className={`bg-white p-4 rounded-lg border transition-all flex items-center gap-4 relative ${isCurrent ? 'border-slate-400 bg-slate-50' : selectedAdvocateForRealloc === adv.id ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50' : 'border-slate-200 hover:border-brand-300'}`}>
                                      {isBestMatch && !isCurrent && (
                                          <div className="absolute -top-2 left-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                              <Star className="w-3 h-3 fill-current" /> Best
                                          </div>
                                      )}
                                      <div className="flex items-center gap-3 flex-1">
                                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200">
                                              {adv.firmName?.charAt(0)}
                                          </div>
                                          <div className="flex-1">
                                              <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                  {adv.firmName}
                                                  {isCurrent && <span className="text-[10px] bg-slate-600 text-white px-2 py-0.5 rounded uppercase font-bold">Current</span>}
                                              </h5>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                  {adv.tags?.slice(0, 2).map(tag => (
                                                      <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">{tag}</span>
                                                  ))}
                                              </div>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <div className="text-center min-w-[70px]">
                                              <div className="text-[10px] font-bold text-slate-400 uppercase">Workload</div>
                                              <div className={`px-2 py-0.5 rounded text-xs font-bold border ${loadColor} mt-1`}>{workload}</div>
                                          </div>
                                          <div className="text-center min-w-[60px]">
                                              <div className="text-[10px] font-bold text-slate-400 uppercase">Score</div>
                                              <div className="text-xl font-bold text-brand-600 mt-1">{score}</div>
                                          </div>
                                      </div>
                                      <button
                                          onClick={() => setSelectedAdvocateForRealloc(selectedAdvocateForRealloc === adv.id ? '' : adv.id)}
                                          disabled={isCurrent}
                                          className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${
                                              isCurrent ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                                              selectedAdvocateForRealloc === adv.id ? 'bg-brand-600 text-white' :
                                              'bg-slate-900 text-white hover:bg-brand-600'
                                          }`}
                                      >
                                          {isCurrent ? 'Current' : selectedAdvocateForRealloc === adv.id ? 'Selected' : 'Select'}
                                      </button>
                                  </div>
                              );
                          })}
                      </div>

                      {/* Reason Field (only shown when advocate selected) */}
                      {selectedAdvocateForRealloc && selectedAdvocateForRealloc !== assignment.advocateId && (
                          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <label className="block text-sm font-bold text-amber-900 mb-2">
                                  Reason for Re-Allocation <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                  className="w-full border-amber-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                                  rows={3}
                                  placeholder="Enter the reason for changing the advocate..."
                                  value={reallocationReason}
                                  onChange={(e) => setReallocationReason(e.target.value)}
                                  autoFocus
                              />
                          </div>
                      )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                      <p className="text-sm text-slate-600">
                          {selectedAdvocateForRealloc && selectedAdvocateForRealloc !== assignment.advocateId ? (
                              <span className="text-brand-600 font-semibold">
                                  Ready to re-allocate to {rankedAdvocates.find(r => r.user.id === selectedAdvocateForRealloc)?.user.firmName}
                              </span>
                          ) : (
                              'Select a new advocate to continue'
                          )}
                      </p>
                      <div className="flex gap-3">
                          <button
                              onClick={() => {
                                  setShowReallocationModal(false);
                                  setSelectedAdvocateForRealloc('');
                                  setReallocationReason('');
                              }}
                              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                              Cancel
                          </button>
                          <button
                              onClick={confirmReallocation}
                              disabled={!selectedAdvocateForRealloc || !reallocationReason.trim() || selectedAdvocateForRealloc === assignment.advocateId}
                              className="px-6 py-2 text-sm font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                          >
                              Confirm Re-Allocate
                          </button>
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

            {/* Report Delivery Card - Show when completed */}
            {assignment.status === AssignmentStatus.COMPLETED && assignment.reportDelivery && (
              <ReportDeliveryCard assignment={assignment} currentUserRole={currentUser.role} />
            )}

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

        {/* TAB: DOCUMENTS */}
        {!isOps && activeTab === 'docs' && (
          <div className="space-y-8">
            {canEditDocs && (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-xl border-2 border-blue-200">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Bulk Document Upload
                    </h3>
                    <p className="text-xs text-slate-500 mb-6">Drag & drop multiple files or click to browse. Files will be auto-categorized.</p>

                    {/* Drag and Drop Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                        isDragging
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-slate-300 bg-white hover:border-brand-400'
                      }`}
                    >
                      <div className="text-center">
                        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-brand-600' : 'text-slate-400'}`} />
                        <p className="text-sm font-semibold text-slate-700 mb-1">
                          {isDragging ? 'Drop files here...' : 'Drag & drop files here'}
                        </p>
                        <p className="text-xs text-slate-500 mb-4">or click below to browse</p>
                        <label className="inline-block px-6 py-2 bg-white border-2 border-brand-600 text-brand-600 rounded-lg font-semibold hover:bg-brand-50 cursor-pointer transition-colors">
                          <input
                            type="file"
                            multiple
                            onChange={(e) => handleBulkFileSelect(e.target.files)}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          />
                          Choose Files
                        </label>
                      </div>
                    </div>

                    {/* File List */}
                    {bulkFiles.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-700">Files to Upload ({bulkFiles.length})</h4>
                          <button
                            onClick={() => setBulkFiles([])}
                            className="text-xs text-slate-500 hover:text-slate-700"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {bulkFiles.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200"
                            >
                              <FileIcon className="w-5 h-5 text-brand-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{item.file.name}</p>
                                <p className="text-xs text-slate-500">{(item.file.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateBulkCategory(index, e.target.value)}
                                className="text-xs border border-slate-200 rounded px-2 py-1 font-medium"
                              >
                                <option value="Sale Deed">Sale Deed</option>
                                <option value="Index II">Index II</option>
                                <option value="EC Certificate">EC Certificate</option>
                                <option value="Title Search Report">Title Search Report</option>
                                <option value="Tax Receipt">Tax Receipt</option>
                                <option value="NOC">NOC</option>
                                <option value="Survey Plan">Survey Plan</option>
                                <option value="Property Photos">Property Photos</option>
                              </select>
                              <button
                                onClick={() => handleRemoveBulkFile(index)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* AI Classification Section */}
                        {geminiDocClassifier.isAvailable() && (
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-purple-600" />
                                <h5 className="text-sm font-bold text-purple-900">AI-Powered Classification</h5>
                              </div>
                              <button
                                onClick={handleAIClassification}
                                disabled={isClassifying}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-all"
                              >
                                {isClassifying ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4" />
                                    AI Classify
                                  </>
                                )}
                              </button>
                            </div>

                            {/* AI Results */}
                            {aiClassificationResults && (
                              <div className="space-y-3">
                                {/* Completeness Score */}
                                <div className="bg-white rounded-lg p-3 border border-purple-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-700">Document Completeness</span>
                                    <span className={`text-sm font-bold ${
                                      (aiClassificationResults.completenessScore || 0) >= 80 ? 'text-emerald-600' :
                                      (aiClassificationResults.completenessScore || 0) >= 60 ? 'text-amber-600' :
                                      'text-rose-600'
                                    }`}>
                                      {aiClassificationResults.completenessScore || 0}%
                                    </span>
                                  </div>
                                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all ${
                                        (aiClassificationResults.completenessScore || 0) >= 80 ? 'bg-emerald-500' :
                                        (aiClassificationResults.completenessScore || 0) >= 60 ? 'bg-amber-500' :
                                        'bg-rose-500'
                                      }`}
                                      style={{ width: `${aiClassificationResults.completenessScore || 0}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Missing Documents */}
                                {aiClassificationResults.missingDocuments && aiClassificationResults.missingDocuments.length > 0 && (
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                                      <span className="text-xs font-bold text-amber-900">Missing Documents</span>
                                    </div>
                                    <ul className="space-y-1">
                                      {aiClassificationResults.missingDocuments.map((doc, idx) => (
                                        <li key={idx} className="text-xs text-amber-800 flex items-start gap-2">
                                          <span className="text-amber-600">•</span>
                                          <span>{doc}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* AI Insights */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-bold text-blue-900">AI Insights</span>
                                  </div>
                                  <p className="text-xs text-blue-800">
                                    Gemini AI has analyzed {bulkFiles.length} document{bulkFiles.length > 1 ? 's' : ''} and provided intelligent categorization based on filename patterns, assignment context, and document requirements for title search.
                                  </p>
                                </div>
                              </div>
                            )}

                            {!aiClassificationResults && !isClassifying && (
                              <p className="text-xs text-purple-700">
                                Click "AI Classify" to let Gemini intelligently categorize your documents, identify missing files, and assess completeness.
                              </p>
                            )}
                          </div>
                        )}

                        <button
                          onClick={handleBulkUpload}
                          className="w-full px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold shadow-md hover:bg-brand-700 flex items-center justify-center gap-2 transition-colors"
                        >
                          <Upload className="w-5 h-5" />
                          Upload {bulkFiles.length} File{bulkFiles.length > 1 ? 's' : ''}
                        </button>
                      </div>
                    )}

                    {canEditDocs && assignment.status === AssignmentStatus.DRAFT && assignment.documents.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
                             <button onClick={handleSubmitForAllocation} className="text-brand-600 font-bold text-sm hover:text-brand-800 flex items-center gap-1.5 px-4 py-2 hover:bg-brand-50 rounded-lg transition-colors">
                               Finish Uploading & Submit <ArrowLeft className="w-4 h-4 rotate-180" />
                             </button>
                        </div>
                    )}
                </div>
            )}
            {/* Document Cards Grid */}
            {assignment.documents.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-sm text-slate-400">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignment.documents.map((doc, idx) => (
                  <DocumentCard
                    key={doc.id || idx}
                    document={doc}
                    onExtracted={(docId, data) => {
                      store.saveExtractedData(assignment.id, docId, data);
                      refresh();
                    }}
                    onViewData={(data, docName) => {
                      setSelectedExtractedData(data);
                      setSelectedDocumentName(docName);
                      setShowExtractedDataModal(true);
                    }}
                  />
                ))}
              </div>
            )}
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
                                         <textarea
                                             className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-4"
                                             rows={3}
                                             autoFocus
                                             placeholder="Type your response..."
                                             value={responseText}
                                             onChange={(e) => setResponseText(e.target.value)}
                                         />

                                         {/* Document Upload Option */}
                                         <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                             <label className="block text-xs font-bold text-blue-900 mb-2">
                                                 📎 Attach Document (Optional)
                                             </label>
                                             <input
                                                 ref={responseFileInputRef}
                                                 type="file"
                                                 onChange={(e) => setResponseFile(e.target.files?.[0] || null)}
                                                 className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer"
                                             />
                                             {responseFile && (
                                                 <div className="mt-2 flex items-center gap-2 text-xs text-blue-700">
                                                     <FileIcon className="w-3.5 h-3.5" />
                                                     <span className="font-medium">{responseFile.name}</span>
                                                     <button
                                                         onClick={() => setResponseFile(null)}
                                                         className="ml-auto text-rose-600 hover:text-rose-700"
                                                     >
                                                         <X className="w-3.5 h-3.5" />
                                                     </button>
                                                 </div>
                                             )}
                                         </div>

                                         {isBankUser && canEditDocs && (
                                             <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                                 <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                 <p className="text-xs text-amber-800">
                                                     <strong>Need to upload additional documents?</strong> Use the "Documents" tab above to add more files like Sale Deed, Index II, etc.
                                                 </p>
                                             </div>
                                         )}

                                         <div className="flex justify-end gap-3">
                                             <button
                                                 onClick={() => {
                                                     setActiveQueryId(null);
                                                     setResponseText('');
                                                     setResponseFile(null);
                                                 }}
                                                 className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                                             >
                                                 Cancel
                                             </button>
                                             <button
                                                 onClick={() => handleRespondQuery(q.id)}
                                                 disabled={!responseText.trim()}
                                                 className="px-6 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                             >
                                                 <Send className="w-3.5 h-3.5" />
                                                 Send Reply
                                             </button>
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

        {/* Extracted Data Modal */}
        {showExtractedDataModal && selectedExtractedData && (
          <ExtractedDataModal
            data={selectedExtractedData}
            documentName={selectedDocumentName}
            onClose={() => {
              setShowExtractedDataModal(false);
              setSelectedExtractedData(null);
              setSelectedDocumentName('');
            }}
          />
        )}
      </div>
    </div>
  );
};
