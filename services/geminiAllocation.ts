import { GoogleGenerativeAI } from '@google/generative-ai';
import { Assignment, User, UserRole } from '../types';

/**
 * Gemini AI-powered Advocate Allocation Service
 * Uses Google's Gemini AI to intelligently match assignments to advocates
 */

interface AllocationResult {
  success: boolean;
  advocateId?: string;
  advocateName?: string;
  reason?: string;
  confidence?: number;
  factors?: string[];
}

class GeminiAllocationService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      console.warn('⚠️ Gemini API key not configured. AI allocation will not be available.');
      console.warn('   Add VITE_GEMINI_API_KEY to .env file to enable AI allocation.');
      this.isInitialized = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.isInitialized = true;
      console.log('✅ Gemini AI allocation engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if Gemini AI is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.model !== null;
  }

  /**
   * Use Gemini AI to find the best advocate for an assignment
   */
  async allocateWithAI(
    assignment: Assignment,
    advocates: User[],
    getWorkload: (advocateId: string) => number
  ): Promise<AllocationResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        reason: 'Gemini AI not configured. Please add VITE_GEMINI_API_KEY to .env file.'
      };
    }

    try {
      // Filter available advocates (workload < 5)
      const availableAdvocates = advocates.filter(adv => {
        const workload = getWorkload(adv.id);
        return workload < 5 && adv.role === UserRole.ADVOCATE;
      });

      if (availableAdvocates.length === 0) {
        return {
          success: false,
          reason: 'No advocates available (all at capacity)'
        };
      }

      // Build the prompt for Gemini
      const prompt = this.buildAllocationPrompt(assignment, availableAdvocates, getWorkload);

      // Call Gemini AI
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the AI response
      const allocation = this.parseAIResponse(text, availableAdvocates);

      return allocation;

    } catch (error: any) {
      console.error('❌ Gemini AI allocation failed:', error);
      return {
        success: false,
        reason: `AI allocation failed: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Build the prompt for Gemini AI
   */
  private buildAllocationPrompt(
    assignment: Assignment,
    advocates: User[],
    getWorkload: (advocateId: string) => number
  ): string {
    const advocatesData = advocates.map(adv => ({
      id: adv.id,
      name: adv.name,
      firmName: adv.firmName,
      states: adv.states || [],
      districts: adv.districts || [],
      expertise: adv.expertise || [],
      tags: adv.tags || [],
      currentWorkload: getWorkload(adv.id),
      hubId: adv.hubId
    }));

    return `You are an expert legal case allocation system. Your task is to select the BEST advocate for the following assignment based on multiple factors.

**ASSIGNMENT DETAILS:**
- LAN: ${assignment.lan}
- Borrower: ${assignment.borrowerName}
- Property Location: ${assignment.propertyAddress}
- State: ${assignment.state}
- District: ${assignment.district}
- Product Type: ${assignment.productType}
- Priority: ${assignment.priority}
- Scope: ${assignment.scope}

**AVAILABLE ADVOCATES:**
${JSON.stringify(advocatesData, null, 2)}

**ALLOCATION CRITERIA (in order of importance):**
1. **Location Match (CRITICAL)**: Advocate MUST operate in the assignment's state and ideally district
2. **Product Expertise**: Advocate should have expertise in the product type (${assignment.productType})
3. **Workload Balance**: Prefer advocates with lower current workload (0-5 max)
4. **Hub Alignment**: Prefer advocates from the same hub if possible
5. **Tags & Specialization**: Consider tags like "Fast TAT", "High Value Expert", etc.

**INSTRUCTIONS:**
- Analyze all advocates carefully
- Select the SINGLE BEST advocate
- Provide reasoning for your choice
- Rate your confidence (1-10)
- List the key factors that influenced your decision

**RESPONSE FORMAT (JSON only, no markdown):**
{
  "advocateId": "adv_id_here",
  "advocateName": "Advocate Name",
  "confidence": 8,
  "factors": [
    "Perfect location match (state + district)",
    "Has expertise in ${assignment.productType}",
    "Low workload (2 active cases)",
    "Tagged as Fast TAT"
  ],
  "reason": "Brief summary of why this advocate is the best choice"
}

**IMPORTANT**: Return ONLY the JSON object, no additional text or markdown formatting.`;
  }

  /**
   * Parse AI response and extract allocation decision
   */
  private parseAIResponse(text: string, advocates: User[]): AllocationResult {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/g, '');
      cleanText = cleanText.replace(/```\n?/g, '');
      cleanText = cleanText.trim();

      // Parse JSON response
      const parsed = JSON.parse(cleanText);

      // Validate advocate ID
      const advocate = advocates.find(adv => adv.id === parsed.advocateId);
      if (!advocate) {
        return {
          success: false,
          reason: 'AI selected invalid advocate ID'
        };
      }

      return {
        success: true,
        advocateId: parsed.advocateId,
        advocateName: parsed.advocateName || advocate.name,
        confidence: parsed.confidence || 0,
        factors: parsed.factors || [],
        reason: parsed.reason || 'AI allocation successful'
      };

    } catch (error: any) {
      console.error('Failed to parse AI response:', error);
      console.error('Response text:', text);
      return {
        success: false,
        reason: `Failed to parse AI response: ${error.message}`
      };
    }
  }

  /**
   * Bulk allocation using AI (parallel batch processing with retry logic)
   */
  async bulkAllocateWithAI(
    assignments: Assignment[],
    advocates: User[],
    getWorkload: (advocateId: string) => number,
    onProgress?: (current: number, total: number) => void,
    options?: {
      batchSize?: number;      // Number of concurrent requests (default: 5)
      delayBetweenBatches?: number;  // Delay in ms between batches (default: 500ms)
      maxRetries?: number;     // Max retries per allocation (default: 3)
    }
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{
      assignmentId: string;
      success: boolean;
      advocateId?: string;
      advocateName?: string;
      reason?: string;
      confidence?: number;
    }>;
  }> {
    const batchSize = options?.batchSize || 5;
    const delayBetweenBatches = options?.delayBetweenBatches || 500;
    const maxRetries = options?.maxRetries || 3;

    const results: Array<any> = [];
    let completed = 0;

    // Helper function to allocate with retry logic
    const allocateWithRetry = async (
      assignment: Assignment,
      retryCount = 0
    ): Promise<any> => {
      try {
        const result = await this.allocateWithAI(assignment, advocates, getWorkload);
        return {
          assignmentId: assignment.id,
          ...result
        };
      } catch (error: any) {
        // Retry logic for rate limiting or transient errors
        if (retryCount < maxRetries && this.isRetryableError(error)) {
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.warn(`⚠️ Retry ${retryCount + 1}/${maxRetries} for ${assignment.lan} after ${backoffDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          return allocateWithRetry(assignment, retryCount + 1);
        }

        // Max retries exceeded or non-retryable error
        console.error(`❌ Failed after ${retryCount} retries for ${assignment.lan}:`, error);
        return {
          assignmentId: assignment.id,
          success: false,
          reason: `Failed after ${retryCount} retries: ${error.message || 'Unknown error'}`
        };
      }
    };

    // Process assignments in batches
    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);

      // Process batch in parallel
      const batchPromises = batch.map(assignment => allocateWithRetry(assignment));
      const batchResults = await Promise.allSettled(batchPromises);

      // Extract results from settled promises
      for (const settledResult of batchResults) {
        const result = settledResult.status === 'fulfilled'
          ? settledResult.value
          : {
              assignmentId: batch[results.length]?.id || 'unknown',
              success: false,
              reason: 'Promise rejected unexpectedly'
            };

        results.push(result);
        completed++;

        // Call progress callback
        if (onProgress) {
          onProgress(completed, assignments.length);
        }
      }

      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < assignments.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    // Calculate success/failure counts
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      total: assignments.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Check if error is retryable (rate limiting, network issues, etc.)
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const statusCode = error?.status || error?.statusCode;

    // Retry on rate limiting (429), server errors (5xx), or network issues
    return (
      statusCode === 429 ||
      statusCode >= 500 ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('ETIMEDOUT')
    );
  }
}

// Singleton instance
export const geminiAllocationService = new GeminiAllocationService();
