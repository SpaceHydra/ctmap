import React from 'react';
import { AssignmentStatus } from '../types';

const STATUS_CONFIG: Record<AssignmentStatus, string> = {
  [AssignmentStatus.UNCLAIMED]: 'bg-slate-100 text-slate-600 border-slate-200',
  [AssignmentStatus.DRAFT]: 'bg-amber-50 text-amber-700 border-amber-200',
  [AssignmentStatus.PENDING_ALLOCATION]: 'bg-orange-50 text-orange-700 border-orange-200',
  [AssignmentStatus.ALLOCATED]: 'bg-sky-50 text-sky-700 border-sky-200',
  [AssignmentStatus.IN_PROGRESS]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [AssignmentStatus.QUERY_RAISED]: 'bg-rose-50 text-rose-700 border-rose-200',
  [AssignmentStatus.PENDING_APPROVAL]: 'bg-purple-50 text-purple-700 border-purple-200',
  [AssignmentStatus.COMPLETED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [AssignmentStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
};

export const StatusBadge: React.FC<{ status: AssignmentStatus }> = ({ status }) => {
  const classes = STATUS_CONFIG[status] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${classes}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};