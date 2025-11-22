import React, { useState } from 'react';
import { X, Download, Copy, CheckCircle } from 'lucide-react';
import { ExtractedData } from '../services/documentParser';

interface Props {
  data: ExtractedData;
  documentName: string;
  onClose: () => void;
}

export const ExtractedDataModal: React.FC<Props> = ({ data, documentName, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentName.replace(/\.[^/.]+$/, '')}_extracted_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: ExtractedData): string => {
    const rows: string[][] = [];
    rows.push(['Field', 'Value']);

    // Add basic info
    rows.push(['Document Type', data.documentType]);
    rows.push(['Extraction Date', new Date(data.extractedAt).toLocaleString()]);
    rows.push(['Confidence', `${data.confidence}%`]);

    // Flatten the data
    if (data.parties) {
      rows.push(['From Parties', data.parties.from.join('; ')]);
      rows.push(['To Parties', data.parties.to.join('; ')]);
    }

    if (data.propertyDetails) {
      Object.entries(data.propertyDetails).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            rows.push([`Property ${formatLabel(key)} - ${formatLabel(subKey)}`, String(subValue)]);
          });
        } else if (value) {
          rows.push([`Property ${formatLabel(key)}`, String(value)]);
        }
      });
    }

    if (data.dates) {
      Object.entries(data.dates).forEach(([key, value]) => {
        if (value) rows.push([formatLabel(key), value]);
      });
    }

    if (data.registrationDetails) {
      Object.entries(data.registrationDetails).forEach(([key, value]) => {
        if (value) rows.push([formatLabel(key), String(value)]);
      });
    }

    if (data.financialDetails) {
      Object.entries(data.financialDetails).forEach(([key, value]) => {
        if (value) rows.push([formatLabel(key), `₹${value.toLocaleString('en-IN')}`]);
      });
    }

    if (data.encumbranceDetails) {
      rows.push(['EC Period', data.encumbranceDetails.period]);
      rows.push(['Nil Encumbrance', data.encumbranceDetails.nilEncumbrance ? 'Yes' : 'No']);
      if (data.encumbranceDetails.encumbrances.length > 0) {
        data.encumbranceDetails.encumbrances.forEach((enc, idx) => {
          rows.push([`Encumbrance ${idx + 1}`, enc.details]);
        });
      }
    }

    return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  const getConfidenceColor = () => {
    if (data.confidence >= 80) return 'emerald';
    if (data.confidence >= 60) return 'amber';
    return 'orange';
  };

  const color = getConfidenceColor();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Extracted Data</h3>
            <p className="text-sm text-slate-600">{documentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Confidence Score */}
          <div className={`bg-${color}-50 border-2 border-${color}-200 rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700">Extraction Confidence</span>
              <span className={`text-2xl font-bold text-${color}-600`}>{data.confidence}%</span>
            </div>
            <div className={`h-3 bg-${color}-200 rounded-full overflow-hidden`}>
              <div
                className={`h-full bg-${color}-600 transition-all`}
                style={{ width: `${data.confidence}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 mt-2">
              {data.confidence >= 80 ? '✅ High confidence - Data likely accurate' :
               data.confidence >= 60 ? '⚠️ Medium confidence - Please verify critical fields' :
               '❌ Low confidence - Manual verification recommended'}
            </p>
          </div>

          {/* Parties */}
          {data.parties && (data.parties.from.length > 0 || data.parties.to.length > 0) && (
            <DataSection title="Parties" icon="👥">
              {data.parties.from.length > 0 && (
                <DataField label="From (Vendor/Seller)" value={data.parties.from.join(', ')} />
              )}
              {data.parties.to.length > 0 && (
                <DataField label="To (Purchaser/Buyer)" value={data.parties.to.join(', ')} />
              )}
            </DataSection>
          )}

          {/* Property Details */}
          {data.propertyDetails && (
            <DataSection title="Property Details" icon="🏠">
              {data.propertyDetails.surveyNumber && (
                <DataField label="Survey Number" value={data.propertyDetails.surveyNumber} />
              )}
              {data.propertyDetails.area && (
                <DataField label="Area" value={data.propertyDetails.area} />
              )}
              {data.propertyDetails.address && (
                <DataField label="Address" value={data.propertyDetails.address} />
              )}
              {data.propertyDetails.boundaries && Object.keys(data.propertyDetails.boundaries).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Boundaries</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(data.propertyDetails.boundaries).map(([dir, val]) => (
                      val && <DataField key={dir} label={dir.toUpperCase()} value={val} />
                    ))}
                  </div>
                </div>
              )}
            </DataSection>
          )}

          {/* Dates */}
          {data.dates && Object.values(data.dates).some(v => v) && (
            <DataSection title="Important Dates" icon="📅">
              {Object.entries(data.dates).map(([key, value]) => (
                value && <DataField key={key} label={formatLabel(key)} value={value} />
              ))}
            </DataSection>
          )}

          {/* Registration Details */}
          {data.registrationDetails && Object.values(data.registrationDetails).some(v => v) && (
            <DataSection title="Registration Details" icon="📜">
              {Object.entries(data.registrationDetails).map(([key, value]) => (
                value && <DataField key={key} label={formatLabel(key)} value={value} />
              ))}
            </DataSection>
          )}

          {/* Financial Details */}
          {data.financialDetails && (
            <DataSection title="Financial Details" icon="💰">
              {data.financialDetails.considerationAmount && (
                <DataField
                  label="Consideration Amount"
                  value={`₹ ${data.financialDetails.considerationAmount.toLocaleString('en-IN')}`}
                />
              )}
              {data.financialDetails.stampDuty && (
                <DataField
                  label="Stamp Duty"
                  value={`₹ ${data.financialDetails.stampDuty.toLocaleString('en-IN')}`}
                />
              )}
              {data.financialDetails.registrationFee && (
                <DataField
                  label="Registration Fee"
                  value={`₹ ${data.financialDetails.registrationFee.toLocaleString('en-IN')}`}
                />
              )}
            </DataSection>
          )}

          {/* Encumbrance Details (EC Certificate) */}
          {data.encumbranceDetails && (
            <DataSection title="Encumbrance Details" icon="⚖️">
              <DataField label="Period" value={data.encumbranceDetails.period} />
              <DataField
                label="Status"
                value={data.encumbranceDetails.nilEncumbrance ? '✅ Nil Encumbrance' : '⚠️ Encumbrances Found'}
              />
              {data.encumbranceDetails.encumbrances.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-slate-700 mb-2">Encumbrances:</p>
                  <div className="space-y-2">
                    {data.encumbranceDetails.encumbrances.map((enc, idx) => (
                      <div key={idx} className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                        <p><strong>{enc.type}</strong></p>
                        <p>{enc.details}</p>
                        {enc.amount && <p>Amount: ₹{enc.amount.toLocaleString('en-IN')}</p>}
                        {enc.date && <p>Date: {enc.date}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DataSection>
          )}

          {/* Warnings */}
          {data.warnings && data.warnings.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-900 mb-2">⚠️ Warnings</p>
              <ul className="space-y-1">
                {data.warnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-amber-800">• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw Text Preview */}
          {data.rawText && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span>📄</span>
                Raw Extracted Text (Preview)
              </h4>
              <div className="bg-white border border-slate-200 rounded p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                  {data.rawText.substring(0, 500)}{data.rawText.length > 500 ? '...' : ''}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-slate-50 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-600">
            Extracted on {new Date(data.extractedAt).toLocaleString()}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-2 px-4 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-white transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const DataSection: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
      <span>{icon}</span>
      {title}
    </h4>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const DataField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-xs font-medium text-slate-600 uppercase tracking-wider flex-shrink-0">
      {label}
    </span>
    <span className="text-sm font-semibold text-slate-900 text-right">
      {value}
    </span>
  </div>
);

const formatLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};
