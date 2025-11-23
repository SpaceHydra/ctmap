import React, { useState } from 'react';
import { Assignment, ForfeitReason } from '../types';
import { AlertTriangle, X } from 'lucide-react';

interface ForfeitModalProps {
  assignment: Assignment;
  onClose: () => void;
  onConfirm: (reason: ForfeitReason, details: string) => void;
}

export const ForfeitModal: React.FC<ForfeitModalProps> = ({
  assignment,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState<ForfeitReason>(ForfeitReason.TOO_COMPLEX);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!details || details.trim().length < 20) {
      setError('Please provide detailed reason (minimum 20 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      onConfirm(reason, details);
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Forfeit Assignment</h3>
              <p className="text-sm text-slate-500">{assignment.lan}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Reason for Forfeiting <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ForfeitReason)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
            disabled={isSubmitting}
          >
            {Object.values(ForfeitReason).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Details Textarea */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Additional Details <span className="text-red-500">*</span>
          </label>
          <textarea
            value={details}
            onChange={(e) => {
              setDetails(e.target.value);
              setError('');
            }}
            placeholder="Please provide specific details about why you're forfeiting this assignment..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 h-32 resize-none"
            minLength={20}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-1">
            <p className={`text-xs ${details.length < 20 ? 'text-red-500' : 'text-slate-500'}`}>
              {details.length}/20 characters minimum
            </p>
            {details.length >= 20 && (
              <p className="text-xs text-green-600 font-semibold">✓ Valid</p>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-600 mt-1 font-semibold">{error}</p>
          )}
        </div>

        {/* Warning Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-amber-800 font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            This action will:
          </p>
          <ul className="text-sm text-amber-700 space-y-1 ml-6">
            <li>• Remove this assignment from your workload</li>
            <li>• Send to CT Ops for re-allocation</li>
            <li>• Be recorded in audit trail</li>
            <li>• Notify CT Ops team</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold text-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || details.trim().length < 20}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Forfeiting...' : 'Confirm Forfeit'}
          </button>
        </div>
      </div>
    </div>
  );
};
