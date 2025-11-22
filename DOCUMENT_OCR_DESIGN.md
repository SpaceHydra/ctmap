# Document OCR & Parser Feature Design
## Advocate Portal Enhancement

---

## 1. Document Display Format

### Recommendation: **Card-Grid with Expandable Details**

**Why not pure table?**
- ❌ Documents need visual preview (thumbnail)
- ❌ Action buttons get cramped
- ❌ Extraction status needs prominent display
- ❌ Less mobile-friendly

**Why cards with table hybrid?**
- ✅ Visual document preview
- ✅ Clear action buttons
- ✅ Status badges prominent
- ✅ Expandable for details
- ✅ Mobile responsive

---

## 2. UI Design Mockup

### Document Card Layout

```typescript
┌─────────────────────────────────────────────────────────────┐
│ 📄 Sale Deed                                    🟢 Extracted │
├─────────────────────────────────────────────────────────────┤
│  ┌────────┐                                                  │
│  │ [PDF]  │  sale_deed_plot23_vashi.pdf                     │
│  │ thumb  │  Uploaded: 2h ago by Rohan Deshmukh             │
│  │ [img]  │  Size: 2.4 MB · 12 pages                        │
│  └────────┘                                                  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Extracted Data:                                        │ │
│  │ • Parties: Rajesh Kumar → Priya Sharma                │ │
│  │ • Property: Plot 23, Sector 15, Vashi                 │ │
│  │ • Date: 15-March-2023                                 │ │
│  │ • Registration: MH/2023/12345                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  [👁️ Preview]  [🔍 Parse Document]  [📊 View Data]  [⬇️ Download] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📄 EC Certificate                              ⚪ Not Parsed │
├─────────────────────────────────────────────────────────────┤
│  ┌────────┐                                                  │
│  │ [PDF]  │  encumbrance_certificate_30yrs.pdf              │
│  │ thumb  │  Uploaded: 1h ago by Rohan Deshmukh             │
│  │ [img]  │  Size: 1.8 MB · 8 pages                         │
│  └────────┘                                                  │
│                                                               │
│  ⚠️ Click "Parse Document" to extract key information       │
│                                                               │
│  [👁️ Preview]  [🔍 Parse Document]  [⬇️ Download]            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. OCR & PDF Parsing Implementation

### 3.1 Technology Stack

**For PDF Text Extraction:**
```bash
npm install pdfjs-dist
```
- Mozilla's PDF.js (no AI needed)
- Extracts text from PDF files
- Works for digitally-created PDFs

**For OCR (Scanned Documents):**
```bash
npm install tesseract.js
```
- Pure JavaScript OCR
- Works in browser (no backend!)
- Supports multiple languages

**For Data Extraction:**
```bash
npm install date-fns  # For date parsing
```
- Custom regex patterns
- Date normalization
- Entity extraction

---

### 3.2 Document Parser Service

```typescript
// services/documentParser.ts

import { getDocument } from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

export enum DocumentType {
  SALE_DEED = 'Sale Deed',
  EC_CERTIFICATE = 'EC Certificate',
  PROPERTY_CARD = 'Property Card',
  TAX_RECEIPT = 'Tax Receipt',
  INDEX_II = 'Index II'
}

export interface ExtractedData {
  documentType: DocumentType;
  extractedAt: string;
  confidence: number; // 0-100

  // Common fields
  parties?: {
    from: string[];
    to: string[];
  };
  propertyDetails?: {
    address?: string;
    surveyNumber?: string;
    area?: string;
    boundaries?: {
      north?: string;
      south?: string;
      east?: string;
      west?: string;
    };
  };
  dates?: {
    executionDate?: string;
    registrationDate?: string;
    validFrom?: string;
    validTo?: string;
  };
  registrationDetails?: {
    registrationNumber?: string;
    subRegistrarOffice?: string;
    documentNumber?: string;
  };
  financialDetails?: {
    considerationAmount?: number;
    stampDuty?: number;
    registrationFee?: number;
  };

  // Document-specific
  encumbranceDetails?: {
    period: string;
    encumbrances: Array<{
      type: string;
      amount?: number;
      date?: string;
      details: string;
    }>;
    nilEncumbrance: boolean;
  };

  // Raw text
  rawText: string;
  warnings?: string[];
}

class DocumentParserService {
  /**
   * Parse PDF document and extract structured data
   */
  async parseDocument(
    file: File,
    documentType: DocumentType
  ): Promise<ExtractedData> {
    try {
      // Step 1: Extract text from PDF
      const text = await this.extractTextFromPDF(file);

      // Step 2: If text is empty/minimal, try OCR
      let finalText = text;
      if (text.trim().length < 100) {
        console.log('PDF has minimal text, attempting OCR...');
        finalText = await this.performOCR(file);
      }

      // Step 3: Parse based on document type
      const extractedData = this.parseByDocumentType(finalText, documentType);

      return {
        ...extractedData,
        documentType,
        extractedAt: new Date().toISOString(),
        rawText: finalText
      };
    } catch (error) {
      console.error('Document parsing failed:', error);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF using PDF.js
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + '\n';
    }

    return fullText;
  }

  /**
   * Perform OCR on scanned PDF using Tesseract.js
   */
  private async performOCR(file: File): Promise<string> {
    // Convert PDF to images first (use pdf-to-image or canvas rendering)
    // For simplicity, assuming we have image extraction

    const result = await Tesseract.recognize(
      file,
      'eng', // Language: English
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    return result.data.text;
  }

  /**
   * Parse text based on document type
   */
  private parseByDocumentType(
    text: string,
    documentType: DocumentType
  ): Partial<ExtractedData> {
    switch (documentType) {
      case DocumentType.SALE_DEED:
        return this.parseSaleDeed(text);
      case DocumentType.EC_CERTIFICATE:
        return this.parseECCertificate(text);
      case DocumentType.PROPERTY_CARD:
        return this.parsePropertyCard(text);
      case DocumentType.TAX_RECEIPT:
        return this.parseTaxReceipt(text);
      case DocumentType.INDEX_II:
        return this.parseIndexII(text);
      default:
        return { confidence: 50 };
    }
  }

  /**
   * Parse Sale Deed
   */
  private parseSaleDeed(text: string): Partial<ExtractedData> {
    const data: Partial<ExtractedData> = { confidence: 0 };

    // Extract parties (Vendor/Purchaser)
    const vendorMatch = text.match(/(?:vendor|seller|executant)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);
    const purchaserMatch = text.match(/(?:purchaser|buyer|claimant)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);

    if (vendorMatch || purchaserMatch) {
      data.parties = {
        from: vendorMatch ? [vendorMatch[1]] : [],
        to: purchaserMatch ? [purchaserMatch[1]] : []
      };
      data.confidence! += 20;
    }

    // Extract property details
    const surveyMatch = text.match(/survey\s+no\.?\s*[:.]?\s*(\d+[-\/\d]*)/i);
    const areaMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:sq\.?\s*(?:ft|feet|mtrs?|meters?))/i);

    if (surveyMatch || areaMatch) {
      data.propertyDetails = {
        surveyNumber: surveyMatch?.[1],
        area: areaMatch?.[0]
      };
      data.confidence! += 20;
    }

    // Extract dates
    const datePatterns = [
      /(?:dated|executed on|registered on)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (!data.dates) data.dates = {};
        data.dates.executionDate = match[1];
        data.confidence! += 15;
        break;
      }
    }

    // Extract registration details
    const regNumberMatch = text.match(/(?:registration|document)\s+no\.?\s*[:.]?\s*([A-Z0-9\/-]+)/i);
    if (regNumberMatch) {
      data.registrationDetails = {
        registrationNumber: regNumberMatch[1]
      };
      data.confidence! += 20;
    }

    // Extract consideration amount
    const amountMatch = text.match(/(?:consideration|sale price|amount)[:\s]+Rs\.?\s*([\d,]+)/i);
    if (amountMatch) {
      data.financialDetails = {
        considerationAmount: parseInt(amountMatch[1].replace(/,/g, ''))
      };
      data.confidence! += 15;
    }

    // Extract boundaries
    const boundaries: any = {};
    const directions = ['north', 'south', 'east', 'west'];

    directions.forEach(dir => {
      const pattern = new RegExp(`${dir}[:\\s]+([^,\\.]+)`, 'i');
      const match = text.match(pattern);
      if (match) {
        boundaries[dir] = match[1].trim();
      }
    });

    if (Object.keys(boundaries).length > 0) {
      if (!data.propertyDetails) data.propertyDetails = {};
      data.propertyDetails.boundaries = boundaries;
      data.confidence! += 10;
    }

    return data;
  }

  /**
   * Parse Encumbrance Certificate
   */
  private parseECCertificate(text: string): Partial<ExtractedData> {
    const data: Partial<ExtractedData> = { confidence: 0 };

    // Extract period
    const periodMatch = text.match(/period[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\s+to\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (periodMatch) {
      data.dates = {
        validFrom: periodMatch[1],
        validTo: periodMatch[2]
      };
      data.confidence! += 30;
    }

    // Check for nil encumbrance
    const nilMatch = text.match(/nil encumbrance|no encumbrance|clear title/i);
    const encumbrances: any[] = [];
    let nilEncumbrance = false;

    if (nilMatch) {
      nilEncumbrance = true;
      data.confidence! += 40;
    } else {
      // Extract encumbrances (mortgages, charges, etc.)
      const encumbrancePatterns = [
        /(?:mortgage|charge|lien)[:\s]+([^\n.]+)/gi,
        /encumbrance[:\s]+([^\n.]+)/gi
      ];

      encumbrancePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          encumbrances.push({
            type: 'Encumbrance',
            details: match[1].trim()
          });
        }
      });

      if (encumbrances.length > 0) {
        data.confidence! += 30;
      }
    }

    data.encumbranceDetails = {
      period: periodMatch ? `${periodMatch[1]} to ${periodMatch[2]}` : 'Unknown',
      encumbrances,
      nilEncumbrance
    };

    // Extract property details
    const surveyMatch = text.match(/survey\s+no\.?\s*[:.]?\s*(\d+[-\/\d]*)/i);
    if (surveyMatch) {
      data.propertyDetails = {
        surveyNumber: surveyMatch[1]
      };
      data.confidence! += 15;
    }

    return data;
  }

  /**
   * Parse Property Card (7/12 Extract)
   */
  private parsePropertyCard(text: string): Partial<ExtractedData> {
    const data: Partial<ExtractedData> = { confidence: 0 };

    // Extract survey number (critical for 7/12)
    const surveyMatch = text.match(/(?:survey|gat)\s+no\.?\s*[:.]?\s*(\d+[-\/\d]*)/i);
    if (surveyMatch) {
      if (!data.propertyDetails) data.propertyDetails = {};
      data.propertyDetails.surveyNumber = surveyMatch[1];
      data.confidence! += 30;
    }

    // Extract area
    const areaMatch = text.match(/(?:area|extent)[:\s]+(\d+(?:\.\d+)?)\s*(?:hectare|acre|sq\.?\s*(?:ft|mtrs?))/i);
    if (areaMatch) {
      if (!data.propertyDetails) data.propertyDetails = {};
      data.propertyDetails.area = areaMatch[0];
      data.confidence! += 20;
    }

    // Extract owner name
    const ownerMatch = text.match(/(?:owner|holder)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);
    if (ownerMatch) {
      data.parties = {
        from: [ownerMatch[1]],
        to: []
      };
      data.confidence! += 25;
    }

    // Extract village/location
    const villageMatch = text.match(/(?:village|taluka|district)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);
    if (villageMatch) {
      if (!data.propertyDetails) data.propertyDetails = {};
      data.propertyDetails.address = villageMatch[1];
      data.confidence! += 15;
    }

    return data;
  }

  /**
   * Parse Tax Receipt
   */
  private parseTaxReceipt(text: string): Partial<ExtractedData> {
    const data: Partial<ExtractedData> = { confidence: 0 };

    // Extract receipt number
    const receiptMatch = text.match(/(?:receipt|challan)\s+no\.?\s*[:.]?\s*([A-Z0-9\/-]+)/i);
    if (receiptMatch) {
      data.registrationDetails = {
        documentNumber: receiptMatch[1]
      };
      data.confidence! += 25;
    }

    // Extract payment date
    const dateMatch = text.match(/(?:date|paid on)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (dateMatch) {
      data.dates = {
        executionDate: dateMatch[1]
      };
      data.confidence! += 20;
    }

    // Extract amount
    const amountMatch = text.match(/(?:amount|total|tax)[:\s]+Rs\.?\s*([\d,]+(?:\.\d{2})?)/i);
    if (amountMatch) {
      data.financialDetails = {
        considerationAmount: parseFloat(amountMatch[1].replace(/,/g, ''))
      };
      data.confidence! += 30;
    }

    // Extract property details
    const propertyMatch = text.match(/(?:property|assessment)\s+no\.?\s*[:.]?\s*([A-Z0-9\/-]+)/i);
    if (propertyMatch) {
      data.propertyDetails = {
        surveyNumber: propertyMatch[1]
      };
      data.confidence! += 15;
    }

    return data;
  }

  /**
   * Parse Index II
   */
  private parseIndexII(text: string): Partial<ExtractedData> {
    const data: Partial<ExtractedData> = { confidence: 0 };

    // Extract survey number
    const surveyMatch = text.match(/survey\s+no\.?\s*[:.]?\s*(\d+[-\/\d]*)/i);
    if (surveyMatch) {
      data.propertyDetails = {
        surveyNumber: surveyMatch[1]
      };
      data.confidence! += 30;
    }

    // Extract registration details
    const regMatch = text.match(/(?:registration|document)\s+no\.?\s*[:.]?\s*([A-Z0-9\/-]+)/i);
    if (regMatch) {
      data.registrationDetails = {
        registrationNumber: regMatch[1]
      };
      data.confidence! += 25;
    }

    // Extract parties
    const partyMatches = text.match(/(?:name|party)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/gi);
    if (partyMatches && partyMatches.length > 0) {
      const names = partyMatches.map(m => m.split(/[:]/)[1].trim());
      data.parties = {
        from: names.slice(0, Math.ceil(names.length / 2)),
        to: names.slice(Math.ceil(names.length / 2))
      };
      data.confidence! += 20;
    }

    return data;
  }

  /**
   * Get parsing progress (for UI)
   */
  onProgress(callback: (progress: number, stage: string) => void) {
    // Hook for progress updates during OCR/parsing
    this.progressCallback = callback;
  }

  private progressCallback?: (progress: number, stage: string) => void;
}

export const documentParser = new DocumentParserService();
```

---

## 4. UI Implementation

### 4.1 Document Card Component

```typescript
// components/DocumentCard.tsx

import React, { useState } from 'react';
import { FileText, Eye, Zap, BarChart, Download, Loader } from 'lucide-react';
import { documentParser, ExtractedData, DocumentType } from '../services/documentParser';

interface DocumentCardProps {
  document: {
    id: string;
    name: string;
    category: string;
    uploadedBy: string;
    uploadedAt: string;
    size: number;
    file?: File;
  };
  onExtracted: (documentId: string, data: ExtractedData) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onExtracted }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStage, setParseStage] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showDataModal, setShowDataModal] = useState(false);

  const handleParse = async () => {
    setIsParsing(true);
    setParseProgress(0);

    try {
      // Simulate progress updates
      setParseStage('Loading PDF...');
      setParseProgress(10);

      await new Promise(r => setTimeout(r, 500));

      setParseStage('Extracting text...');
      setParseProgress(30);

      // Actual parsing
      const data = await documentParser.parseDocument(
        document.file!,
        document.category as DocumentType
      );

      setParseStage('Analyzing content...');
      setParseProgress(70);

      await new Promise(r => setTimeout(r, 300));

      setParseStage('Structuring data...');
      setParseProgress(90);

      await new Promise(r => setTimeout(r, 200));

      setParseProgress(100);
      setExtractedData(data);
      onExtracted(document.id, data);

    } catch (error) {
      console.error('Parsing failed:', error);
      alert('Failed to parse document. Please try again.');
    } finally {
      setIsParsing(false);
      setParseProgress(0);
      setParseStage('');
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
      return (
        <span className={`px-2 py-1 rounded-full bg-${color}-100 text-${color}-700 text-xs font-bold`}>
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

  return (
    <>
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
            <p className="text-sm font-medium text-slate-900 truncate mb-1">
              {document.name}
            </p>
            <p className="text-xs text-slate-500">
              Uploaded {document.uploadedAt} by {document.uploadedBy}
            </p>
            <p className="text-xs text-slate-500">
              {(document.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>

        {/* Extracted Data Preview */}
        {extractedData && (
          <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
            <p className="text-xs font-bold text-emerald-900 mb-2">Quick Preview:</p>
            <div className="space-y-1 text-xs text-emerald-800">
              {extractedData.parties && (
                <div>
                  <strong>Parties:</strong> {extractedData.parties.from.join(', ')} → {extractedData.parties.to.join(', ')}
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
            </div>
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

          {extractedData && (
            <button
              onClick={() => setShowDataModal(true)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              <BarChart className="w-4 h-4" />
              View Data
            </button>
          )}

          <button className="px-3 py-2 border-2 border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Extracted Data Modal */}
      {showDataModal && extractedData && (
        <ExtractedDataModal
          data={extractedData}
          documentName={document.name}
          onClose={() => setShowDataModal(false)}
        />
      )}
    </>
  );
};
```

### 4.2 Extracted Data Modal

```typescript
// components/ExtractedDataModal.tsx

import React from 'react';
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
    a.download = `${documentName}_extracted_data.csv`;
    a.click();
  };

  const convertToCSV = (data: ExtractedData): string => {
    const rows = [];
    rows.push(['Field', 'Value']);

    // Flatten the data
    if (data.parties) {
      rows.push(['From Parties', data.parties.from.join('; ')]);
      rows.push(['To Parties', data.parties.to.join('; ')]);
    }

    if (data.propertyDetails) {
      Object.entries(data.propertyDetails).forEach(([key, value]) => {
        if (typeof value === 'object') {
          Object.entries(value).forEach(([subKey, subValue]) => {
            rows.push([`${key} - ${subKey}`, String(subValue)]);
          });
        } else {
          rows.push([key, String(value)]);
        }
      });
    }

    // ... more fields

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
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
          {data.parties && (
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
              {data.propertyDetails.boundaries && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Boundaries</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(data.propertyDetails.boundaries).map(([dir, val]) => (
                      <DataField key={dir} label={dir.toUpperCase()} value={val} />
                    ))}
                  </div>
                </div>
              )}
            </DataSection>
          )}

          {/* Dates */}
          {data.dates && (
            <DataSection title="Important Dates" icon="📅">
              {Object.entries(data.dates).map(([key, value]) => (
                value && <DataField key={key} label={formatLabel(key)} value={value} />
              ))}
            </DataSection>
          )}

          {/* Registration Details */}
          {data.registrationDetails && (
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
```

---

## 5. Integration with Assignment Details

Add to advocate's document view:

```typescript
// In AssignmentDetails.tsx (Advocate view)

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {assignment.documents.map(doc => (
    <DocumentCard
      key={doc.id}
      document={doc}
      onExtracted={(docId, data) => {
        // Store extracted data
        store.saveExtractedData(assignment.id, docId, data);
        refresh();
      }}
    />
  ))}
</div>
```

---

## 6. Storage in mockStore

```typescript
// Add to mockStore.ts

interface AssignmentDocument {
  id: string;
  name: string;
  category: string;
  // ... existing fields
  extractedData?: ExtractedData;
}

saveExtractedData(
  assignmentId: string,
  documentId: string,
  data: ExtractedData
): void {
  const assignment = this.getAssignmentById(assignmentId);
  if (!assignment) return;

  const doc = assignment.documents.find(d => d.id === documentId);
  if (!doc) return;

  doc.extractedData = data;

  // Add audit entry
  assignment.auditTrail.push({
    id: uuidv4(),
    action: 'DOCUMENT_PARSED',
    timestamp: new Date().toISOString(),
    performedBy: 'SYSTEM',
    performedByName: 'OCR Engine',
    performedByRole: UserRole.ADVOCATE,
    details: `Document parsed with ${data.confidence}% confidence`
  });

  this.saveToStorage();
}
```

---

## Summary

**Answer: YES - Use Card-Grid format, NOT pure table**

**Key Benefits:**
- ✅ Visual document preview
- ✅ Clear parsing status badges
- ✅ Progress indicators during extraction
- ✅ Inline data preview
- ✅ Multiple action buttons
- ✅ Mobile responsive

**Implementation:**
1. Install: `pdfjs-dist` + `tesseract.js`
2. Create `documentParser.ts` service
3. Build `DocumentCard.tsx` component
4. Build `ExtractedDataModal.tsx`
5. Store extracted data in documents
6. ~2-3 days work

**User Flow:**
1. See document → Click "Parse"
2. Watch progress (10% → 100%)
3. See confidence score + preview
4. Click "View Data" for full details
5. Export as CSV or copy JSON

Ready to implement this?
