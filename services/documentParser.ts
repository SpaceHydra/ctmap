import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export enum DocumentType {
  SALE_DEED = 'Sale Deed',
  EC_CERTIFICATE = 'EC Certificate',
  PROPERTY_CARD = 'Property Card',
  TAX_RECEIPT = 'Tax Receipt',
  INDEX_II = 'Index II',
  TITLE_SEARCH_REPORT = 'Title Search Report',
  NOC = 'NOC',
  SURVEY_PLAN = 'Survey Plan',
  PROPERTY_PHOTOS = 'Property Photos'
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
  private progressCallback?: (progress: number, stage: string) => void;

  /**
   * Parse PDF document and extract structured data
   */
  async parseDocument(
    file: File,
    documentType: DocumentType,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<ExtractedData> {
    this.progressCallback = onProgress;

    try {
      // Step 1: Extract text from PDF
      this.updateProgress(10, 'Loading PDF...');
      const text = await this.extractTextFromPDF(file);

      // Step 2: If text is empty/minimal, try OCR
      let finalText = text;
      if (text.trim().length < 100) {
        this.updateProgress(30, 'Performing OCR...');
        finalText = await this.performOCR(file);
      } else {
        this.updateProgress(40, 'Text extracted successfully');
      }

      // Step 3: Parse based on document type
      this.updateProgress(60, 'Analyzing content...');
      const extractedData = this.parseByDocumentType(finalText, documentType);

      this.updateProgress(90, 'Structuring data...');

      return {
        ...extractedData,
        documentType,
        extractedAt: new Date().toISOString(),
        rawText: finalText
      };
    } catch (error) {
      console.error('Document parsing failed:', error);
      throw new Error(`Failed to parse document: ${(error as Error).message}`);
    } finally {
      this.progressCallback = undefined;
    }
  }

  /**
   * Extract text from PDF using PDF.js
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

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
    try {
      const result = await Tesseract.recognize(
        file,
        'eng', // Language: English
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const progress = Math.round(m.progress * 100);
              this.updateProgress(30 + (progress * 0.3), `OCR Progress: ${progress}%`);
            }
          }
        }
      );

      return result.data.text;
    } catch (error) {
      console.error('OCR failed:', error);
      return ''; // Return empty string if OCR fails
    }
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
        return { confidence: 50, warnings: ['Generic parsing - results may vary'] };
    }
  }

  /**
   * Parse Sale Deed
   */
  private parseSaleDeed(text: string): Partial<ExtractedData> {
    const data: Partial<ExtractedData> = { confidence: 0, warnings: [] };

    // Extract parties (Vendor/Purchaser)
    const vendorMatch = text.match(/(?:vendor|seller|executant)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);
    const purchaserMatch = text.match(/(?:purchaser|buyer|claimant)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);

    if (vendorMatch || purchaserMatch) {
      data.parties = {
        from: vendorMatch ? [vendorMatch[1]] : [],
        to: purchaserMatch ? [purchaserMatch[1]] : []
      };
      data.confidence! += 20;
    } else {
      data.warnings!.push('Could not identify parties (vendor/purchaser)');
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

    if (data.warnings!.length === 0) {
      delete data.warnings;
    }

    return data;
  }

  /**
   * Parse Encumbrance Certificate
   */
  private parseECCertificate(text: string): Partial<ExtractedData> {
    const data: Partial<ExtractedData> = { confidence: 0, warnings: [] };

    // Extract period
    const periodMatch = text.match(/period[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\s+to\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (periodMatch) {
      data.dates = {
        validFrom: periodMatch[1],
        validTo: periodMatch[2]
      };
      data.confidence! += 30;
    } else {
      data.warnings!.push('Could not identify EC period');
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
      } else {
        data.warnings!.push('Could not determine encumbrance status');
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

    if (data.warnings!.length === 0) {
      delete data.warnings;
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
   * Update progress callback
   */
  private updateProgress(progress: number, stage: string) {
    if (this.progressCallback) {
      this.progressCallback(progress, stage);
    }
  }
}

export const documentParser = new DocumentParserService();
