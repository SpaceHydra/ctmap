import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { FileText, Download, Calendar, Filter, TrendingUp, FileSpreadsheet, PieChart, BarChart3, FileDown } from 'lucide-react';

interface Props {
  user: User;
}

export const Reports: React.FC<Props> = ({ user }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const isOps = user.role === UserRole.CT_OPS;

  const recentReports = [
    { id: 1, name: 'Assignment Summary - November 2025', type: 'Summary', generatedOn: '2025-11-15', size: '2.4 MB' },
    { id: 2, name: 'Advocate Performance Report - Q4', type: 'Performance', generatedOn: '2025-11-10', size: '1.8 MB' },
    { id: 3, name: 'Hub Wise Distribution - October', type: 'Analytics', generatedOn: '2025-10-31', size: '3.1 MB' },
    { id: 4, name: 'TAT Analysis Report', type: 'Metrics', generatedOn: '2025-11-08', size: '1.2 MB' },
    { id: 5, name: 'Query Resolution Trends', type: 'Analytics', generatedOn: '2025-11-05', size: '920 KB' },
  ];

  const reportTemplates = isOps ? [
    { id: 1, name: 'MIS Dashboard', icon: BarChart3, description: 'Comprehensive operational metrics' },
    { id: 2, name: 'Network Analytics', icon: TrendingUp, description: 'Advocate performance and capacity' },
    { id: 3, name: 'Hub Performance', icon: PieChart, description: 'Hub-wise assignment distribution' },
    { id: 4, name: 'SLA Compliance', icon: FileSpreadsheet, description: 'Turnaround time analysis' },
  ] : [
    { id: 1, name: 'My Assignments Report', icon: FileText, description: 'All your assignment history' },
    { id: 2, name: 'Document Archive', icon: FileSpreadsheet, description: 'Submitted documents and reports' },
    { id: 3, name: 'Activity Log', icon: BarChart3, description: 'Timeline of all actions' },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isOps ? 'MIS Reports' : 'Reports Archive'}
          </h2>
          <p className="text-slate-500 mt-1">
            {isOps ? 'Management information and analytics' : 'Download and view your reports'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Quick Report Generation */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                className="p-6 border-2 border-slate-200 rounded-xl hover:border-brand-500 hover:bg-brand-50/50 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-600 transition-colors">
                  <Icon className="w-6 h-6 text-brand-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{template.name}</h4>
                <p className="text-xs text-slate-500">{template.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Reports</h3>
            <p className="text-sm text-slate-500 mt-0.5">Previously generated reports</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Report Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Generated On</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {recentReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{report.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">PDF Document</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(report.generatedOn).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">{report.size}</td>
                  <td className="px-6 py-5 text-right">
                    <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-all">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gradient-to-r from-brand-50 to-indigo-50 rounded-2xl border border-brand-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <FileDown className="w-6 h-6 text-brand-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 mb-1">Custom Report Builder</h4>
            <p className="text-sm text-slate-600 mb-4">
              Need a specific report? Use our custom builder to select metrics, date ranges, and export formats.
            </p>
            <button className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 shadow-md transition-all">
              Launch Builder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
