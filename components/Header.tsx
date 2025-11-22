import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, Briefcase } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchUser: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onSwitchUser }) => {
  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[64px] py-2 flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 p-2 rounded-lg shadow-glow">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">CT MAP</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Title Search Portal</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 ml-auto">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-white">{currentUser.name}</p>
            <p className="text-xs text-brand-400 capitalize font-semibold">{currentUser.role.replace('_', ' ')}</p>
          </div>

          {/* Dev Tool for Demo - ALWAYS VISIBLE */}
          <div className="flex flex-wrap items-center bg-slate-800/50 rounded-lg p-1 text-xs border border-slate-700/50 gap-1 backdrop-blur-sm">
            <span className="px-2 text-slate-500 font-bold tracking-wide hidden sm:inline">VIEW AS:</span>
            <button onClick={() => onSwitchUser(UserRole.BANK_USER)} className={`px-3 py-1.5 rounded-md transition-all font-bold ${currentUser.role === UserRole.BANK_USER ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>Bank</button>
            <button onClick={() => onSwitchUser(UserRole.CT_OPS)} className={`px-3 py-1.5 rounded-md transition-all font-bold ${currentUser.role === UserRole.CT_OPS ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>Ops</button>
            <button onClick={() => onSwitchUser(UserRole.ADVOCATE)} className={`px-3 py-1.5 rounded-md transition-all font-bold ${currentUser.role === UserRole.ADVOCATE ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>Advocate</button>
          </div>
          
          <div className="h-8 w-px bg-slate-800 mx-1 hidden sm:block"></div>

          <button 
            onClick={onLogout}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};