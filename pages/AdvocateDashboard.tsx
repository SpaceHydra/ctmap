
import React, { useState, useEffect } from 'react';
import { User, Assignment, AssignmentStatus } from '../types';
import { store } from '../services/mockStore';
import { FileText, AlertCircle, Clock, CheckCircle, ArrowRight, BarChart3, Hourglass, Calendar, TrendingUp, Award } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

interface Props {
  user: User;
  onSelectAssignment: (id: string) => void;
}

export const AdvocateDashboard: React.FC<Props> = ({ user, onSelectAssignment }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const all = store.getAssignments();
      setAssignments(all.filter(a => a.advocateId === user.id));
      setIsLoading(false);
    }, 500);
  }, [user.id]);

  const stats = {
    new: assignments.filter(a => a.status === AssignmentStatus.ALLOCATED).length,
    inProgress: assignments.filter(a => a.status === AssignmentStatus.IN_PROGRESS).length,
    query: assignments.filter(a => a.status === AssignmentStatus.QUERY_RAISED).length,
    completed: assignments.filter(a => a.status === AssignmentStatus.COMPLETED).length,
  };
  
  // Calculate upcoming deadlines (assignments with dueDate within 5 days)
  const upcomingDeadlines = assignments
    .filter(a => a.dueDate && a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.PENDING_APPROVAL)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Advocate Portal</h2>
            <p className="text-slate-500 mt-1">Welcome back, <span className="font-semibold text-brand-600">{user.firmName}</span></p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
          <Award className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="text-xs text-slate-500 font-medium">Quality Rating</p>
            <p className="text-lg font-bold text-slate-900">4.8/5.0</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatsCard title="New Requests" value={stats.new} icon={FileText} colorClass="bg-blue-500 text-blue-600" />
                <StatsCard title="In Progress" value={stats.inProgress} icon={Clock} colorClass="bg-indigo-500 text-indigo-600" />
                <StatsCard title="Queries Raised" value={stats.query} icon={AlertCircle} colorClass="bg-red-500 text-red-600" />
                <StatsCard title="Completed" value={stats.completed} icon={CheckCircle} colorClass="bg-green-500 text-green-600" />
              </div>

              {/* Work List */}
              <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Assigned Cases</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{assignments.length} total assignments</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                        <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Assignment Details</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Deadline</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {assignments.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                  <FileText className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-900 font-bold">No assignments allocated yet</p>
                                <p className="text-slate-500 text-sm mt-1">New cases will appear here when assigned to you</p>
                              </div>
                            </td></tr>
                        ) : (
                        assignments.map((a) => {
                            const hasUnresolved = a.queries.some(q => !q.response);
                            const daysRemaining = a.dueDate ? Math.ceil((new Date(a.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                            const isLate = daysRemaining !== null && daysRemaining < 0;
                            
                            return (
                            <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-sm border border-brand-100">
                                      {a.lan.substring(0, 2)}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <div className="text-sm font-bold text-slate-900">{a.lan}</div>
                                        {hasUnresolved && (
                                          <span className="relative flex h-2 w-2" title="Unresolved Queries">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-slate-500 mt-0.5">{a.borrowerName} • {a.district}</div>
                                    </div>
                                </div>
                                </td>
                                <td className="px-6 py-5"><StatusBadge status={a.status} /></td>
                                <td className="px-6 py-5 text-sm">
                                    {a.dueDate ? (
                                        <div className={`flex items-center gap-1.5 ${isLate ? 'text-rose-600 font-bold' : daysRemaining && daysRemaining <= 3 ? 'text-amber-600 font-semibold' : 'text-slate-600'}`}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(a.dueDate).toLocaleDateString()}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${isLate ? 'bg-rose-50 text-rose-700' : daysRemaining && daysRemaining <= 3 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>
                                              {isLate ? `${Math.abs(daysRemaining!)}d overdue` : `${daysRemaining}d left`}
                                            </span>
                                        </div>
                                    ) : <span className="text-slate-400">-</span>}
                                </td>
                                <td className="px-6 py-5 text-right">
                                <button
                                  onClick={() => onSelectAssignment(a.id)}
                                  className="text-brand-600 hover:text-brand-700 font-medium flex items-center justify-end gap-1 ml-auto group-hover:gap-2 transition-all"
                                >
                                    Open Case <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </button>
                                </td>
                            </tr>
                            );
                        }))}
                    </tbody>
                    </table>
                </div>
              </div>
          </div>

          {/* Right Column: Performance & Deadlines */}
          <div className="space-y-6">
              {/* Performance Card */}
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-soft border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-brand-500" /> Performance Metrics
                  </h3>
                  
                  <div className="space-y-6">
                      <div>
                          <div className="flex justify-between items-end mb-3">
                             <span className="text-sm font-medium text-slate-600">Average Turnaround Time</span>
                             <span className="text-2xl font-bold text-brand-600">4.2 <span className="text-sm font-normal text-slate-500">days</span></span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div className="bg-gradient-to-r from-brand-500 to-brand-600 h-3 rounded-full shadow-inner transition-all duration-500" style={{ width: '84%' }}></div>
                          </div>
                          <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> 16% better than target (5 Days)
                          </p>
                      </div>

                      <div>
                          <div className="flex justify-between items-end mb-3">
                             <span className="text-sm font-medium text-slate-600">Acceptance Rate</span>
                             <span className="text-2xl font-bold text-emerald-600">98<span className="text-sm font-normal text-slate-500">%</span></span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full shadow-inner transition-all duration-500" style={{ width: '98%' }}></div>
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between items-end mb-3">
                             <span className="text-sm font-medium text-slate-600">Quality Score</span>
                             <span className="text-2xl font-bold text-purple-600">4.8<span className="text-sm font-normal text-slate-500">/5.0</span></span>
                          </div>
                          <div className="flex gap-1.5">
                              {[1,2,3,4,5].map(s => (
                                  <div key={s} className={`h-2 flex-1 rounded-full transition-all ${s <= 5 ? 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-sm' : 'bg-slate-100'}`}></div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Deadlines Widget */}
              <div className="bg-white rounded-2xl shadow-soft border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                      <Hourglass className="w-5 h-5 text-amber-500" /> Due Soon
                  </h3>

                  {upcomingDeadlines.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-900 font-bold">All caught up!</p>
                        <p className="text-xs text-slate-500 mt-1">No urgent deadlines</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {upcomingDeadlines.map(a => (
                              <div
                                key={a.id}
                                className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group"
                                onClick={() => onSelectAssignment(a.id)}
                              >
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="font-bold text-amber-900 text-sm">{a.lan}</span>
                                      <span className="text-xs bg-white text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 font-semibold shadow-sm">
                                          {a.dueDate ? new Date(a.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : ''}
                                      </span>
                                  </div>
                                  <p className="text-xs text-amber-800 font-medium mb-1">{a.productType}</p>
                                  <p className="text-xs text-amber-700 truncate">{a.propertyAddress}</p>
                                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 group-hover:text-amber-700 transition-colors">
                                    <span className="font-semibold">View Details</span>
                                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};
