import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini AI-Powered Document Classification Service
 * Intelligently categorizes uploaded documents for title search assignments
 */

export enum DocumentCategory {
  SALE_DEED = 'Sale Deed',
  INDEX_II = 'Index II',
  EC_CERTIFICATE = 'EC Certificate',
  PROPERTY_CARD = 'Property Card',
  TAX_RECEIPT = 'Tax Receipt',
  ENCUMBRANCE = 'Encumbrance Certificate',
  MUTATION = 'Mutation Extract',
  SURVEY_SKETCH = 'Survey/Sketch',
  OTHER = 'Other Documents'
}

export interface ClassificationResult {
  success: boolean;
  category: DocumentCategory;
  confidence: number; // 1-10
  reasoning: string;
  extractedInfo?: {
    propertyDetails?: string;
    dateRange?: string;
    parties?: string[];
    registrationNumber?: string;
  };
  warnings?: string[];
  suggestions?: string[];
}

export interface BulkClassificationResult {
  results: Array<{
    filename: string;
    classification: ClassificationResult;
  }>;
  missingDocuments?: string[];
  completenessScore?: number; // 0-100
}

class GeminiDocumentClassificationService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      console.warn('⚠️ Gemini API key not configured. Document AI will not be available.');
      this.isInitialized = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.isInitialized = true;
      console.log('✅ Gemini Document Classification initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini Document Classification:', error);
      this.isInitialized = false;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized && this.model !== null;
  }

  /**
   * Classify a single document based on filename
   */
  async classifyDocument(
    filename: string,
    assignmentContext?: {
      propertyAddress: string;
      state: string;
      district: string;
      productType: string;
      scope: string;
    }
  ): Promise<ClassificationResult> {
    if (!this.isAvailable()) {
      return this.fallbackClassification(filename);
    }

    try {
      const prompt = this.buildClassificationPrompt(filename, assignmentContext);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseClassificationResponse(text, filename);
    } catch (error: any) {
      console.error('❌ Document classification failed:', error);
      return this.fallbackClassification(filename);
    }
  }

  /**
   * Classify multiple documents and analyze completeness
   */
  async classifyBulkDocuments(
    filenames: string[],
    assignmentContext?: {
      propertyAddress: string;
      state: string;
      district: string;
      productType: string;
      scope: string;
    }
  ): Promise<BulkClassificationResult> {
    if (!this.isAvailable()) {
      const results = filenames.map(filename => ({
        filename,
        classification: this.fallbackClassification(filename)
      }));
      return { results };
    }

    try {
      const prompt = this.buildBulkClassificationPrompt(filenames, assignmentContext);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseBulkClassificationResponse(text, filenames);
    } catch (error: any) {
      console.error('❌ Bulk classification failed:', error);
      const results = filenames.map(filename => ({
        filename,
        classification: this.fallbackClassification(filename)
      }));
      return { results };
    }
  }

  /**
   * Build AI prompt for single document classification
   */
  private buildClassificationPrompt(
    filename: string,
    context?: {
      propertyAddress: string;
      state: string;
      district: string;
      productType: string;
      scope: string;
    }
  ): string {
    const categories = Object.values(DocumentCategory);

    return `You are an expert legal document classifier for title search operations in India. Analyze the filename and classify the document.

**FILENAME:** ${filename}

${context ? `**ASSIGNMENT CONTEXT:**
- Property: ${context.propertyAddress}
- Location: ${context.district}, ${context.state}
- Product Type: ${context.productType}
- Scope: ${context.scope}
` : ''}

**AVAILABLE CATEGORIES:**
${categories.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

**CATEGORY DESCRIPTIONS:**
- **Sale Deed**: Registration deed, sale agreement, conveyance deed, title deed
- **Index II**: Index 2, property index, search index
- **EC Certificate**: Encumbrance Certificate, EC report, no dues certificate
- **Property Card**: 7/12 extract, property card, land records
- **Tax Receipt**: Property tax receipt, tax paid challan, municipal tax
- **Encumbrance**: Encumbrance search report, EC for 30 years
- **Mutation**: Mutation extract, podi, khata transfer
- **Survey/Sketch**: Survey plan, site plan, property sketch, layout
- **Other Documents**: Any document not fitting above categories

**YOUR TASK:**
1. Analyze the filename carefully
2. Select the MOST APPROPRIATE category
3. Rate your confidence (1-10)
4. Extract any identifiable information (property details, dates, parties, registration numbers)
5. Provide warnings if document seems irrelevant or suspicious
6. Suggest what information should be verified in the document

**RESPONSE FORMAT (JSON only, no markdown):**
{
  "category": "Sale Deed",
  "confidence": 9,
  "reasoning": "Filename contains 'sale_deed' and appears to be a property registration document",
  "extractedInfo": {
    "propertyDetails": "Plot 23, extracted from filename",
    "dateRange": "2023 based on filename pattern",
    "parties": ["Seller name if visible", "Buyer name if visible"],
    "registrationNumber": "REG/2023/12345 if visible in filename"
  },
  "warnings": ["Warning if filename seems suspicious or irrelevant"],
  "suggestions": ["Verify registration number", "Check party names match borrower"]
}

**IMPORTANT**: Return ONLY valid JSON, no markdown formatting.`;
  }

  /**
   * Build AI prompt for bulk document classification with completeness analysis
   */
  private buildBulkClassificationPrompt(
    filenames: string[],
    context?: {
      propertyAddress: string;
      state: string;
      district: string;
      productType: string;
      scope: string;
    }
  ): string {
    const categories = Object.values(DocumentCategory);

    return `You are an expert legal document classifier for title search operations in India. Analyze multiple filenames and assess document completeness.

**FILENAMES TO CLASSIFY:**
${filenames.map((f, i) => `${i + 1}. ${f}`).join('\n')}

${context ? `**ASSIGNMENT CONTEXT:**
- Property: ${context.propertyAddress}
- Location: ${context.district}, ${context.state}
- Product Type: ${context.productType}
- Scope: ${context.scope}
` : ''}

**AVAILABLE CATEGORIES:**
${categories.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

**YOUR TASKS:**
1. Classify each document into the most appropriate category
2. Rate confidence for each classification (1-10)
3. Identify which CRITICAL documents are missing for a complete title search
4. Calculate overall completeness score (0-100)
5. Provide suggestions for quality assurance

**CRITICAL DOCUMENTS FOR TITLE SEARCH:**
- Sale Deed (MANDATORY)
- Index II (MANDATORY)
- EC Certificate (MANDATORY)
- Property Card (HIGHLY RECOMMENDED)
- Tax Receipt (RECOMMENDED)
- Encumbrance Certificate (for full chain)
- Survey/Sketch (for property verification)

**RESPONSE FORMAT (JSON only, no markdown):**
{
  "classifications": [
    {
      "filename": "sale_deed_plot23.pdf",
      "category": "Sale Deed",
      "confidence": 9,
      "reasoning": "Clear sale deed based on filename"
    },
    {
      "filename": "ec_certificate.pdf",
      "category": "EC Certificate",
      "confidence": 10,
      "reasoning": "EC certificate for encumbrance verification"
    }
  ],
  "missingDocuments": [
    "Index II - Critical for property search",
    "Property Card - Recommended for verification"
  ],
  "completenessScore": 65,
  "overallAssessment": "Good progress but missing critical Index II document. Property Card would strengthen the case.",
  "suggestions": [
    "Request Index II from sub-registrar office",
    "Verify EC certificate date range covers required period",
    "Obtain property card from revenue department"
  ]
}

**IMPORTANT**: Return ONLY valid JSON, no markdown formatting.`;
  }

  /**
   * Parse single document classification response
   */
  private parseClassificationResponse(text: string, filename: string): ClassificationResult {
    try {
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/g, '');
      cleanText = cleanText.replace(/```\n?/g, '');
      cleanText = cleanText.trim();

      const parsed = JSON.parse(cleanText);

      return {
        success: true,
        category: parsed.category || DocumentCategory.OTHER,
        confidence: parsed.confidence || 5,
        reasoning: parsed.reasoning || 'AI classification',
        extractedInfo: parsed.extractedInfo,
        warnings: parsed.warnings || [],
        suggestions: parsed.suggestions || []
      };
    } catch (error: any) {
      console.error('Failed to parse classification response:', error);
      console.error('Response text:', text);
      return this.fallbackClassification(filename);
    }
  }

  /**
   * Parse bulk classification response
   */
  private parseBulkClassificationResponse(
    text: string,
    filenames: string[]
  ): BulkClassificationResult {
    try {
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/g, '');
      cleanText = cleanText.replace(/```\n?/g, '');
      cleanText = cleanText.trim();

      const parsed = JSON.parse(cleanText);

      const results = (parsed.classifications || []).map((cls: any) => ({
        filename: cls.filename,
        classification: {
          success: true,
          category: cls.category || DocumentCategory.OTHER,
          confidence: cls.confidence || 5,
          reasoning: cls.reasoning || 'AI classification',
          extractedInfo: cls.extractedInfo,
          warnings: cls.warnings,
          suggestions: cls.suggestions
        }
      }));

      // Fill in any missing filenames with fallback
      filenames.forEach(filename => {
        if (!results.find((r: any) => r.filename === filename)) {
          results.push({
            filename,
            classification: this.fallbackClassification(filename)
          });
        }
      });

      return {
        results,
        missingDocuments: parsed.missingDocuments || [],
        completenessScore: parsed.completenessScore || 50
      };
    } catch (error: any) {
      console.error('Failed to parse bulk classification response:', error);
      console.error('Response text:', text);

      // Fallback to individual classifications
      const results = filenames.map(filename => ({
        filename,
        classification: this.fallbackClassification(filename)
      }));

      return { results };
    }
  }

  /**
   * Fallback regex-based classification (when AI unavailable)
   */
  private fallbackClassification(filename: string): ClassificationResult {
    const lower = filename.toLowerCase();

    let category = DocumentCategory.OTHER;
    let confidence = 3;
    let reasoning = 'Fallback regex-based classification';

    if (lower.includes('sale') || lower.includes('deed')) {
      category = DocumentCategory.SALE_DEED;
      confidence = 7;
    } else if (lower.includes('index') || lower.includes('ii')) {
      category = DocumentCategory.INDEX_II;
      confidence = 7;
    } else if (lower.includes('ec') || lower.includes('encumbrance')) {
      category = DocumentCategory.EC_CERTIFICATE;
      confidence = 7;
    } else if (lower.includes('property') || lower.includes('card') || lower.includes('7/12')) {
      category = DocumentCategory.PROPERTY_CARD;
      confidence = 7;
    } else if (lower.includes('tax') || lower.includes('receipt')) {
      category = DocumentCategory.TAX_RECEIPT;
      confidence = 7;
    } else if (lower.includes('mutation') || lower.includes('podi')) {
      category = DocumentCategory.MUTATION;
      confidence = 7;
    } else if (lower.includes('survey') || lower.includes('sketch') || lower.includes('plan')) {
      category = DocumentCategory.SURVEY_SKETCH;
      confidence = 7;
    }

    return {
      success: true,
      category,
      confidence,
      reasoning,
      warnings: ['AI classification unavailable, using basic pattern matching']
    };
  }
}

// Singleton instance
export const geminiDocClassifier = new GeminiDocumentClassificationService();
