import React, { useState } from 'react';
import { RefreshCw, Download, Upload, Trash2, Database, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { store } from '../services/mockStore';

export const DemoControls: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'reset' | 'clear' | null>(null);

  const handleReset = () => {
    store.resetToSeedData();
    setShowConfirm(null);
    alert('✅ Demo data has been reset to initial seed data!');
    window.location.reload();
  };

  const handleExport = () => {
    const data = store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ctmap-demo-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            store.importData(data);
            alert('✅ Data imported successfully!');
            window.location.reload();
          } catch (error) {
            alert('❌ Failed to import data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClear = () => {
    store.clearAllData();
    setShowConfirm(null);
    alert('✅ All demo data has been cleared!');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-24 right-6 z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden max-w-sm">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-between hover:from-slate-100 hover:to-slate-200 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-600 rounded-lg">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">Demo Controls</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          )}
        </button>

        {/* Controls Panel */}
        {isExpanded && (
          <div className="p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Reset to Seed Data */}
            <button
              onClick={() => setShowConfirm('reset')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all text-sm font-medium group"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span>Reset to Seed Data</span>
            </button>

            {/* Export Data */}
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export Backup (JSON)</span>
            </button>

            {/* Import Data */}
            <button
              onClick={handleImport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              <span>Import Backup (JSON)</span>
            </button>

            {/* Clear All Data */}
            <button
              onClick={() => setShowConfirm('clear')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data</span>
            </button>

            {/* Info */}
            <div className="pt-2 border-t border-slate-100 mt-3">
              <p className="text-xs text-slate-500 flex items-start gap-2">
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5 text-brand-500" />
                <span>All data is stored in browser localStorage. Use export/import for backups.</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[70] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-6 max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${showConfirm === 'reset' ? 'bg-blue-100' : 'bg-rose-100'}`}>
                {showConfirm === 'reset' ? (
                  <RefreshCw className="w-6 h-6 text-blue-600" />
                ) : (
                  <Trash2 className="w-6 h-6 text-rose-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {showConfirm === 'reset' ? 'Reset Demo Data?' : 'Clear All Data?'}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {showConfirm === 'reset'
                    ? 'This will restore all demo data to the initial seed state. All current changes will be lost.'
                    : 'This will permanently delete all data from localStorage. This action cannot be undone.'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={showConfirm === 'reset' ? handleReset : handleClear}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all ${
                      showConfirm === 'reset'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {showConfirm === 'reset' ? 'Reset Data' : 'Clear Data'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
