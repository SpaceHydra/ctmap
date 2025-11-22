import React, { useState } from 'react';
import { FileText, Eye, Zap, BarChart, Download, Loader } from 'lucide-react';
import { documentParser, ExtractedData, DocumentType } from '../services/documentParser';
import { AssignmentDocument } from '../types';

interface DocumentCardProps {
  document: AssignmentDocument;
  onExtracted?: (documentId: string, data: ExtractedData) => void;
  onViewData?: (data: ExtractedData, documentName: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onExtracted, onViewData }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStage, setParseStage] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    document.extractedData || null
  );
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!document.file) {
      alert('No file available for parsing. Please upload the document first.');
      return;
    }

    setIsParsing(true);
    setParseProgress(0);
    setError(null);

    try {
      // Actual parsing with progress callback
      const data = await documentParser.parseDocument(
        document.file,
        document.category as DocumentType,
        (progress, stage) => {
          setParseProgress(Math.round(progress));
          setParseStage(stage);
        }
      );

      setParseProgress(100);
      setParseStage('Complete!');
      setExtractedData(data);

      if (onExtracted && document.id) {
        onExtracted(document.id, data);
      }

      // Clear the stage after a delay
      setTimeout(() => {
        setParseStage('');
      }, 1000);

    } catch (error) {
      console.error('Parsing failed:', error);
      setError((error as Error).message || 'Failed to parse document. Please try again.');
    } finally {
      setIsParsing(false);
      setTimeout(() => {
        setParseProgress(0);
      }, 1500);
    }
  };

  const getStatusBadge = () => {
    if (isParsing) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
          <Loader className="w-3 h-3 animate-spin" />
          Parsing...
        </span>
      );
    }

    if (extractedData) {
      const color = extractedData.confidence >= 80 ? 'emerald' :
                    extractedData.confidence >= 60 ? 'amber' : 'orange';
      const bgColor = `bg-${color}-100`;
      const textColor = `text-${color}-700`;

      return (
        <span className={`px-2 py-1 rounded-full ${bgColor} ${textColor} text-xs font-bold`}>
          ✓ Extracted ({extractedData.confidence}%)
        </span>
      );
    }

    return (
      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
        Not Parsed
      </span>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
      }
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-brand-300 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-600" />
          <span className="font-bold text-slate-900 text-sm">{document.category}</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Document Info */}
      <div className="flex gap-3 mb-4">
        {/* Thumbnail */}
        <div className="w-16 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded flex items-center justify-center flex-shrink-0">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate mb-1" title={document.name}>
            {document.name}
          </p>
          <p className="text-xs text-slate-500">
            Uploaded {formatDate(document.date)}
          </p>
          <p className="text-xs text-slate-500">
            {formatFileSize(document.size)}
          </p>
        </div>
      </div>

      {/* Extracted Data Preview */}
      {extractedData && !isParsing && (
        <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
          <p className="text-xs font-bold text-emerald-900 mb-2">Quick Preview:</p>
          <div className="space-y-1 text-xs text-emerald-800">
            {extractedData.parties && (extractedData.parties.from.length > 0 || extractedData.parties.to.length > 0) && (
              <div>
                <strong>Parties:</strong> {extractedData.parties.from.join(', ') || 'N/A'} → {extractedData.parties.to.join(', ') || 'N/A'}
              </div>
            )}
            {extractedData.propertyDetails?.surveyNumber && (
              <div>
                <strong>Survey No:</strong> {extractedData.propertyDetails.surveyNumber}
              </div>
            )}
            {extractedData.dates?.executionDate && (
              <div>
                <strong>Date:</strong> {extractedData.dates.executionDate}
              </div>
            )}
            {extractedData.registrationDetails?.registrationNumber && (
              <div>
                <strong>Reg No:</strong> {extractedData.registrationDetails.registrationNumber}
              </div>
            )}
            {extractedData.encumbranceDetails && (
              <div>
                <strong>EC Status:</strong> {extractedData.encumbranceDetails.nilEncumbrance ? '✓ Clear' : `⚠️ ${extractedData.encumbranceDetails.encumbrances.length} found`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-bold text-red-900 mb-1">Error</p>
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {/* Parsing Progress */}
      {isParsing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900">{parseStage}</span>
            <span className="text-xs font-bold text-blue-700">{parseProgress}%</span>
          </div>
          <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${parseProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => alert(`Preview functionality would show PDF viewer for: ${document.name}`)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border-2 border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>

        {!extractedData && !isParsing && (
          <button
            onClick={handleParse}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Parse Document
          </button>
        )}

        {extractedData && onViewData && (
          <button
            onClick={() => onViewData(extractedData, document.name)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            <BarChart className="w-4 h-4" />
            View Data
          </button>
        )}

        <button
          onClick={() => alert(`Download functionality would download: ${document.name}`)}
          className="px-3 py-2 border-2 border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
