import React from 'react';
import { CheckCircle, Download, Mail, Clock, User, Building2 } from 'lucide-react';
import { Assignment } from '../types';

interface Props {
  assignment: Assignment;
  currentUserRole: string;
}

export const ReportDeliveryCard: React.FC<Props> = ({ assignment, currentUserRole }) => {
  if (!assignment.reportDelivery) {
    return null;
  }

  const { deliveredAt, deliveredTo, deliveredByName, reportUrl } = assignment.reportDelivery;

  const handleDownload = () => {
    // In production: Download from S3/CDN
    // For now: Simulate download
    console.log('Downloading report:', reportUrl);
    alert(`Downloading: ${reportUrl}\n\nIn production, this would download the actual PDF file.`);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Owner':
        return <User className="w-4 h-4" />;
      case 'Hub':
        return <Building2 className="w-4 h-4" />;
      case 'CC':
        return <Mail className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Final Report Delivered</h3>
            <p className="text-sm text-emerald-50">Title Search Report - Ready for Download</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Delivery Time */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
            <Clock className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Delivered On
            </p>
            <p className="text-base font-bold text-slate-900">
              {formatDate(deliveredAt)}
            </p>
          </div>
        </div>

        {/* Delivered By */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <User className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Approved By
            </p>
            <p className="text-base font-semibold text-slate-900">
              {deliveredByName}
            </p>
          </div>
        </div>

        {/* Delivered To */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
            <Mail className="w-5 h-5 text-purple-700" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
              Delivered To
            </p>
            <div className="space-y-2">
              {deliveredTo.map((recipient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-purple-50 rounded text-purple-600">
                      {getRoleIcon(recipient.role)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{recipient.name}</p>
                      <p className="text-xs text-slate-600">{recipient.email}</p>
                    </div>
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                      {recipient.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="pt-4 border-t-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Report Document
              </p>
              <p className="text-sm font-medium text-slate-700">
                {reportUrl ? reportUrl.split('/').pop() : 'final_report.pdf'}
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <Download className="w-5 h-5" />
              Download Report
            </button>
          </div>
        </div>

        {/* Delivery Confirmation Badge */}
        <div className="flex items-center justify-center pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-300 rounded-full">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-900">
              ✓ Delivery Confirmed - {deliveredTo.length} Recipient{deliveredTo.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
