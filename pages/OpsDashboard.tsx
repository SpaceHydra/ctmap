
import React, { useState, useEffect } from 'react';
import { Assignment, AssignmentStatus, UserRole, User } from '../types';
import { store } from '../services/mockStore';
import { Users, Briefcase, AlertTriangle, CheckSquare, Filter, ArrowRight, Activity, Globe, BarChart as BarChartIcon, Clock } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
  onSelectAssignment: (id: string) => void;
}

export const OpsDashboard: React.FC<Props> = ({ onSelectAssignment }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<AssignmentStatus | 'ALL'>('ALL');
  const [networkAvailability, setNetworkAvailability] = useState(0);
  const [throughput, setThroughput] = useState(0);

  useEffect(() => {
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

  }, []);

  const filteredAssignments = filter === 'ALL' 
    ? assignments 
    : assignments.filter(a => a.status === filter);

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

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">Operational Command Center</h2>
      
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: List & Filters */}
        <div className="lg:col-span-2 space-y-8">
            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-semibold text-gray-900">Pipeline Management</h3>
                <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select 
                    className="text-sm border-none focus:ring-0 text-gray-600 font-medium cursor-pointer bg-transparent"
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
            <div className="overflow-y-auto max-h-[500px]">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white sticky top-0 shadow-sm z-10">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LAN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advocate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssignments.map((a) => {
                        const advocate = store.getAdvocates().find(adv => adv.id === a.advocateId);
                        const hasUnresolved = a.queries.some(q => !q.response);
                        return (
                            <tr key={a.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                                    {a.lan}
                                    {hasUnresolved && (
                                        <span className="relative flex h-2 w-2" title="Unresolved Queries">
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{a.district}, {a.state}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{advocate?.name || '-'}</td>
                                <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => onSelectAssignment(a.id)} 
                                        className="text-slate-400 group-hover:text-brand-600 text-sm font-medium flex items-center justify-end gap-1 ml-auto transition-colors"
                                    >
                                        Manage <ArrowRight className="w-3 h-3" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                </table>
            </div>
            </div>

            {/* Hub Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChartIcon className="w-5 h-5 text-slate-500" /> Hub Performance Volume
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
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <Clock className="w-4 h-4 text-amber-500" /> Aging Analysis
                 </h3>
                 <div className="space-y-4">
                     <div className="p-4 rounded-lg bg-rose-50 border border-rose-100 flex justify-between items-center">
                         <div>
                             <p className="text-2xl font-bold text-rose-700">{stats.stuck}</p>
                             <p className="text-xs text-rose-600 font-semibold">Stuck &gt; 7 Days</p>
                         </div>
                         <AlertTriangle className="w-6 h-6 text-rose-300" />
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
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
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
    </div>
  );
};
