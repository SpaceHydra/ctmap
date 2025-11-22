
import React, { useState, useEffect } from 'react';
import { User, Assignment, AssignmentStatus } from '../types';
import { store } from '../services/mockStore';
import { FileText, AlertCircle, Clock, CheckCircle, ArrowRight, BarChart3, Hourglass, Calendar } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  user: User;
  onSelectAssignment: (id: string) => void;
}

export const AdvocateDashboard: React.FC<Props> = ({ user, onSelectAssignment }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const all = store.getAssignments();
    setAssignments(all.filter(a => a.advocateId === user.id));
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Advocate Portal</h2>
            <p className="text-gray-500">Welcome back, {user.firmName}</p>
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-semibold text-gray-900">Assigned Cases</h3>
                  <button className="text-sm text-brand-600 font-medium hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {assignments.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No assignments allocated yet.</td></tr>
                        ) : (
                        assignments.map((a) => {
                            const hasUnresolved = a.queries.some(q => !q.response);
                            const daysRemaining = a.dueDate ? Math.ceil((new Date(a.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                            const isLate = daysRemaining !== null && daysRemaining < 0;
                            
                            return (
                            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-gray-900">{a.lan}</div>
                                    {hasUnresolved && (
                                            <span className="relative flex h-2 w-2" title="Unresolved Queries">
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                            </span>
                                        )}
                                </div>
                                <div className="text-sm text-gray-500">{a.borrowerName} • {a.district}</div>
                                </td>
                                <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                                <td className="px-6 py-4 text-sm">
                                    {a.dueDate ? (
                                        <div className={`flex items-center gap-1.5 ${isLate ? 'text-red-600 font-bold' : daysRemaining && daysRemaining <= 3 ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(a.dueDate).toLocaleDateString()} 
                                            <span className="text-xs font-normal">({isLate ? `${Math.abs(daysRemaining!)}d overdue` : `${daysRemaining}d left`})</span>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                <button onClick={() => onSelectAssignment(a.id)} className="text-brand-600 hover:underline flex items-center justify-end gap-1 ml-auto">
                                    Open Case <ArrowRight className="h-4 w-4" />
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-brand-500" /> Performance Metrics
                  </h3>
                  
                  <div className="space-y-6">
                      <div>
                          <div className="flex justify-between items-end mb-2">
                             <span className="text-sm text-gray-600">Average Turnaround Time</span>
                             <span className="text-lg font-bold text-gray-900">4.2 Days</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-brand-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Target: 5 Days</p>
                      </div>

                      <div>
                          <div className="flex justify-between items-end mb-2">
                             <span className="text-sm text-gray-600">Acceptance Rate</span>
                             <span className="text-lg font-bold text-gray-900">98%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                          </div>
                      </div>

                      <div>
                          <div className="flex justify-between items-end mb-2">
                             <span className="text-sm text-gray-600">Quality Score</span>
                             <span className="text-lg font-bold text-gray-900">4.8/5.0</span>
                          </div>
                          <div className="flex gap-1">
                              {[1,2,3,4,5].map(s => (
                                  <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= 4 ? 'bg-purple-500' : 'bg-purple-100'}`}></div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Deadlines Widget */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Hourglass className="w-4 h-4 text-amber-500" /> Due Soon
                  </h3>
                  
                  {upcomingDeadlines.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No urgent deadlines.</p>
                  ) : (
                      <div className="space-y-4">
                          {upcomingDeadlines.map(a => (
                              <div key={a.id} className="p-3 bg-amber-50 rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => onSelectAssignment(a.id)}>
                                  <div className="flex justify-between items-start mb-1">
                                      <span className="font-bold text-amber-900 text-sm">{a.lan}</span>
                                      <span className="text-xs bg-white text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                          {a.dueDate ? new Date(a.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : ''}
                                      </span>
                                  </div>
                                  <p className="text-xs text-amber-800">{a.productType} • {a.propertyAddress.substring(0, 25)}...</p>
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
