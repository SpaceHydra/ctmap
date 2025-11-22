import React, { useState, useEffect } from 'react';
import { User, Assignment, AssignmentStatus } from '../types';
import { store } from '../services/mockStore';
import { AlertCircle, ArrowRight, Clock, MessageSquare, FileText, CheckCircle } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

interface Props {
  user: User;
  onSelectAssignment: (id: string) => void;
}

export const ActionRequired: React.FC<Props> = ({ user, onSelectAssignment }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'all' | 'queries' | 'approvals'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const all = store.getAssignments();
      const myAssignments = all.filter(a => a.ownerId === user.id);

      // Filter assignments that need action
      const actionNeeded = myAssignments.filter(a =>
        a.status === AssignmentStatus.QUERY_RAISED ||
        a.status === AssignmentStatus.PENDING_APPROVAL
      );

      setAssignments(actionNeeded);
      setIsLoading(false);
    }, 400);
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'queries') return a.status === AssignmentStatus.QUERY_RAISED;
    if (filter === 'approvals') return a.status === AssignmentStatus.PENDING_APPROVAL;
    return true;
  });

  const stats = {
    total: assignments.length,
    queries: assignments.filter(a => a.status === AssignmentStatus.QUERY_RAISED).length,
    approvals: assignments.filter(a => a.status === AssignmentStatus.PENDING_APPROVAL).length,
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Action Required</h2>
          <p className="text-slate-500 mt-1">Assignments needing your immediate attention</p>
        </div>
        {stats.total > 0 && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span className="text-sm font-bold text-rose-900">{stats.total} items need action</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            filter === 'all' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${filter === 'all' ? 'bg-brand-600' : 'bg-slate-100'}`}>
              <AlertCircle className={`w-6 h-6 ${filter === 'all' ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <span className={`text-3xl font-bold ${filter === 'all' ? 'text-brand-600' : 'text-slate-900'}`}>{stats.total}</span>
          </div>
          <h3 className="font-bold text-slate-900">All Actions</h3>
          <p className="text-xs text-slate-500 mt-1">Total pending items</p>
        </button>

        <button
          onClick={() => setFilter('queries')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            filter === 'queries' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${filter === 'queries' ? 'bg-amber-600' : 'bg-slate-100'}`}>
              <MessageSquare className={`w-6 h-6 ${filter === 'queries' ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <span className={`text-3xl font-bold ${filter === 'queries' ? 'text-amber-600' : 'text-slate-900'}`}>{stats.queries}</span>
          </div>
          <h3 className="font-bold text-slate-900">Queries Raised</h3>
          <p className="text-xs text-slate-500 mt-1">Awaiting your response</p>
        </button>

        <button
          onClick={() => setFilter('approvals')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            filter === 'approvals' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${filter === 'approvals' ? 'bg-emerald-600' : 'bg-slate-100'}`}>
              <CheckCircle className={`w-6 h-6 ${filter === 'approvals' ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <span className={`text-3xl font-bold ${filter === 'approvals' ? 'text-emerald-600' : 'text-slate-900'}`}>{stats.approvals}</span>
          </div>
          <h3 className="font-bold text-slate-900">Pending Approval</h3>
          <p className="text-xs text-slate-500 mt-1">Reports to review</p>
        </button>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Pending Actions</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredAssignments.length} {filter === 'all' ? 'total' : filter} items
          </p>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">All Caught Up!</h3>
            <p className="text-slate-500">No pending actions at the moment</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAssignments.map((assignment) => {
              const unresolvedQueries = assignment.queries.filter(q => !q.response).length;

              return (
                <div
                  key={assignment.id}
                  className="px-8 py-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => onSelectAssignment(assignment.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-slate-900">{assignment.lan}</h4>
                        <StatusBadge status={assignment.status} />
                        {assignment.status === AssignmentStatus.QUERY_RAISED && unresolvedQueries > 0 && (
                          <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {unresolvedQueries} unresolved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{assignment.borrowerName} • {assignment.propertyAddress}</p>

                      {assignment.status === AssignmentStatus.QUERY_RAISED && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mt-3">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          <div className="text-xs text-amber-900">
                            <p className="font-bold mb-1">Query from Advocate:</p>
                            <p>{assignment.queries[assignment.queries.length - 1]?.text}</p>
                          </div>
                        </div>
                      )}

                      {assignment.status === AssignmentStatus.PENDING_APPROVAL && (
                        <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200 mt-3">
                          <FileText className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <div className="text-xs text-emerald-900">
                            <p className="font-bold mb-1">Final report submitted</p>
                            <p>Click to review and approve the report</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button className="px-4 py-2 text-brand-600 hover:bg-brand-50 rounded-lg font-medium text-sm flex items-center gap-2 transition-all group-hover:gap-3">
                      Take Action
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
