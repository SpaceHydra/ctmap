import React, { useEffect, useState } from 'react';
import { User, Assignment, AssignmentStatus, UserRole } from '../types';
import { store } from '../services/mockStore';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';

interface AlertBannerProps {
  user: User;
  onOpenAssignment: (id: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ user, onOpenAssignment }) => {
  const [alerts, setAlerts] = useState<Assignment[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkAlerts = () => {
      const all = store.getAssignments();
      let urgentItems: Assignment[] = [];

      if (user.role === UserRole.ADVOCATE) {
        // Advocates need to know about Query Responses (In Progress) or New Allocations
        urgentItems = all.filter(a => 
          a.advocateId === user.id && 
          (a.status === AssignmentStatus.ALLOCATED || a.status === AssignmentStatus.REJECTED)
        );
      } else if (user.role === UserRole.BANK_USER) {
        // Bank Users need to know about Queries Raised or Reports Pending Approval
        urgentItems = all.filter(a => 
          a.ownerId === user.id && 
          (a.status === AssignmentStatus.QUERY_RAISED || a.status === AssignmentStatus.PENDING_APPROVAL)
        );
      } else if (user.role === UserRole.CT_OPS) {
        // Ops need to know about pending allocations
         urgentItems = all.filter(a => a.status === AssignmentStatus.PENDING_ALLOCATION);
      }

      setAlerts(urgentItems);
    };

    checkAlerts();
    // Poll every few seconds to simulate real-time notifications
    const interval = setInterval(checkAlerts, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (alerts.length === 0 || !isVisible) return null;

  const handleAction = () => {
    if (alerts.length === 1) {
      onOpenAssignment(alerts[0].id);
    } else {
      // Ideally navigate to a filtered list, but for now we open the most recent one
      onOpenAssignment(alerts[0].id);
    }
  };

  const message = alerts.length === 1 
    ? `Action Required: ${alerts[0].lan} is ${alerts[0].status.replace(/_/g, ' ').toLowerCase()}.`
    : `You have ${alerts.length} assignments requiring immediate attention.`;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 relative animate-in slide-in-from-top-2 duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-100 rounded-full">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-amber-900">
                {message}
            </span>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={handleAction}
                className="text-sm font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 hover:underline"
            >
                {alerts.length === 1 ? 'View Details' : 'View All'} <ArrowRight className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setIsVisible(false)}
                className="text-amber-500 hover:text-amber-700"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};