import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { store } from '../services/mockStore';
import { Users, MapPin, Briefcase, Star, TrendingUp, Award, Search } from 'lucide-react';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

export const AdvocateNetwork: React.FC = () => {
  const [advocates, setAdvocates] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const allAdvocates = store.getUsers().filter(u => u.role === UserRole.ADVOCATE);
      setAdvocates(allAdvocates);
      setIsLoading(false);
    }, 400);
  }, []);

  const filteredAdvocates = advocates.filter(adv =>
    adv.firmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adv.states?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Advocate Network</h2>
          <p className="text-slate-500 mt-1">Manage and monitor your advocate panel</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Users className="w-5 h-5 text-brand-500" />
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Network</p>
            <p className="text-lg font-bold text-slate-900">{advocates.length}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-1">{advocates.length}</h3>
          <p className="text-sm text-slate-500">Total Advocates</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-1">
            {advocates.filter(a => store.getAdvocateWorkload(a.id) < 3).length}
          </h3>
          <p className="text-sm text-slate-500">Available Now</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-1">
            {advocates.reduce((sum, a) => sum + store.getAdvocateWorkload(a.id), 0)}
          </h3>
          <p className="text-sm text-slate-500">Active Cases</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-1">4.6</h3>
          <p className="text-sm text-slate-500">Avg Quality Score</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-200">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by firm name or location..."
            className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 bg-slate-50 rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Advocate Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAdvocates.map((advocate) => {
          const workload = store.getAdvocateWorkload(advocate.id);
          const isAvailable = workload < 3;

          return (
            <div
              key={advocate.id}
              className="bg-white rounded-2xl shadow-soft border border-slate-200 p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-2xl border-2 border-brand-200">
                  {advocate.firmName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{advocate.firmName}</h3>
                      <p className="text-sm text-slate-500">{advocate.email}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isAvailable
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {isAvailable ? 'Available' : 'Busy'}
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Coverage:</span>
                      <div className="flex flex-wrap gap-1">
                        {advocate.states?.map(state => (
                          <span key={state} className="px-2 py-0.5 bg-slate-100 rounded text-xs border border-slate-200">
                            {state}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Expertise:</span>
                      <div className="flex flex-wrap gap-1">
                        {advocate.expertise?.map(exp => (
                          <span key={exp} className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded text-xs border border-brand-200 font-semibold">
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>

                    {advocate.tags && advocate.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                        {advocate.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold border border-purple-200">
                            ✨ {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Workload</p>
                        <p className="font-bold text-slate-900">{workload} cases</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Quality</p>
                        <p className="font-bold text-slate-900 flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          4.8/5.0
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
