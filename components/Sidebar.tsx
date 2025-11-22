import React from 'react';
import { User, UserRole } from '../types';
import { LayoutDashboard, Search, FileText, AlertCircle, CheckSquare, Users, Briefcase, Settings, FileClock, Database } from 'lucide-react';

interface SidebarProps {
  user: User;
  activeModule: string;
  onSelectModule: (module: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, activeModule, onSelectModule }) => {
  
  const getModules = () => {
    const common = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    ];

    switch (user.role) {
      case UserRole.BANK_USER:
        return [
          ...common,
          { id: 'fetch', label: 'Fetch Assignment', icon: Search },
          { id: 'my-assignments', label: 'My Assignments', icon: FileText },
          { id: 'actions', label: 'Action Required', icon: AlertCircle },
          { id: 'reports', label: 'Reports Archive', icon: FileClock },
        ];
      case UserRole.CT_OPS:
        return [
          ...common,
          { id: 'allocation', label: 'Allocation Queue', icon: CheckSquare },
          { id: 'advocates', label: 'Advocate Network', icon: Users },
          { id: 'reports', label: 'MIS Reports', icon: FileClock },
          { id: 'masters', label: 'Master Data', icon: Database },
        ];
      case UserRole.ADVOCATE:
        return [
          ...common,
          { id: 'my-cases', label: 'My Cases', icon: Briefcase },
          { id: 'queries', label: 'Pending Queries', icon: AlertCircle },
          { id: 'submitted', label: 'Submission History', icon: FileText },
        ];
      default:
        return common;
    }
  };

  const modules = getModules();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-16 h-[calc(100vh-64px)] overflow-y-auto shrink-0 z-40">
      <div className="p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Menu</h3>
        <nav className="space-y-1">
          {modules.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">System</h3>
        <nav className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-slate-400" />
            Settings
          </button>
        </nav>
      </div>
    </aside>
  );
};