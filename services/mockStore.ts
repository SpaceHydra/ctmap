
import { Assignment, AssignmentStatus, User, Hub, UserRole, AuditLogEntry, TransferRequest, ForfeitReason, ForfeitDetails } from '../types';
import { INITIAL_ASSIGNMENTS as SEED_DATA, MOCK_HUBS as SEED_HUBS, MOCK_USERS as SEED_USERS } from '../constants';
import { TEST_ASSIGNMENTS, TEST_HUBS, TEST_USERS } from '../testData';
import { geminiAllocationService } from './geminiAllocation';

// Singleton Store with localStorage persistence
class MockStore {
  private static STORAGE_KEY = 'ctmap_demo_data';
  private static VERSION = '1.0';

  private assignments: Assignment[] = [];
  private users: User[] = [];
  private hubs: Hub[] = [];

  // Performance optimization: Cache workload calculations
  private workloadCache: Map<string, number> = new Map();
  private workloadCacheValid: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  // -- Storage Management --

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(MockStore.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);

        // Validate version and data integrity
        if (data.version === MockStore.VERSION && data.assignments && data.users && data.hubs) {
          this.assignments = data.assignments;
          this.users = data.users;
          this.hubs = data.hubs;
          console.log('✅ Loaded data from localStorage:', {
            assignments: this.assignments.length,
            users: this.users.length,
            hubs: this.hubs.length
          });
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage, using seed data:', error);
    }

    // Fallback to seed data
    this.resetToSeedData();
  }

  private saveToStorage(): void {
    try {
      const data = {
        version: MockStore.VERSION,
        assignments: this.assignments,
        users: this.users,
        hubs: this.hubs,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(MockStore.STORAGE_KEY, JSON.stringify(data));

      // Invalidate workload cache when data changes
      this.workloadCacheValid = false;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // Reset to original seed data (for demo purposes)
  resetToSeedData(): void {
    this.assignments = [...SEED_DATA];
    this.users = [...SEED_USERS];
    this.hubs = [...SEED_HUBS];
    this.saveToStorage();
    console.log('🔄 Reset to seed data');
  }

  // Export current state (for backup)
  exportData() {
    return {
      version: MockStore.VERSION,
      assignments: this.assignments,
      users: this.users,
      hubs: this.hubs,
      exportedAt: new Date().toISOString()
    };
  }

  // Import data (for restore)
  importData(data: any): void {
    if (data.assignments && data.users && data.hubs) {
      this.assignments = data.assignments;
      this.users = data.users;
      this.hubs = data.hubs;
      this.saveToStorage();
      console.log('📥 Imported data successfully');
    }
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem(MockStore.STORAGE_KEY);
    this.resetToSeedData();
  }

  // -- Getters --
  
  getAssignments(): Assignment[] {
    return this.assignments;
  }

  getAssignmentById(id: string): Assignment | undefined {
    return this.assignments.find(a => a.id === id);
  }

  getHubs(): Hub[] {
    return this.hubs;
  }

  getHubById(id: string): Hub | undefined {
    return this.hubs.find(h => h.id === id);
  }

  getUsers(): User[] {
    return this.users;
  }

  getAdvocates(): User[] {
    return this.users.filter(u => u.role === UserRole.ADVOCATE);
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }
  
  /**
   * Rebuild workload cache - single pass through all assignments
   * Significantly faster than repeated filtering (O(n) vs O(n*m))
   */
  private rebuildWorkloadCache(): void {
    this.workloadCache.clear();

    // Single pass through assignments
    for (const assignment of this.assignments) {
      if (assignment.advocateId &&
          (assignment.status === AssignmentStatus.ALLOCATED ||
           assignment.status === AssignmentStatus.IN_PROGRESS ||
           assignment.status === AssignmentStatus.QUERY_RAISED)) {
        const current = this.workloadCache.get(assignment.advocateId) || 0;
        this.workloadCache.set(assignment.advocateId, current + 1);
      }
    }

    this.workloadCacheValid = true;
  }

  /**
   * Get advocate workload (optimized with caching)
   * Called frequently in loops, so caching provides ~10-20x speedup
   */
  getAdvocateWorkload(advocateId: string): number {
    if (!this.workloadCacheValid) {
      this.rebuildWorkloadCache();
    }
    return this.workloadCache.get(advocateId) || 0;
  }

  // -- Master Management --

  addHub(hub: Omit<Hub, 'id'>): Hub {
      const newHub = { ...hub, id: `h${this.hubs.length + 1}` };
      this.hubs = [...this.hubs, newHub];
      this.saveToStorage();
      return newHub;
  }

  updateHub(updatedHub: Hub): void {
      this.hubs = this.hubs.map(h => h.id === updatedHub.id ? updatedHub : h);
      this.saveToStorage();
  }

  deleteHub(id: string): void {
      // Check if any users are linked to this hub
      const linkedUsers = this.users.some(u => u.hubId === id);
      if (linkedUsers) {
          throw new Error("Cannot delete Hub: Active users are mapped to this hub.");
      }
      this.hubs = this.hubs.filter(h => h.id !== id);
      this.saveToStorage();
  }

  addUser(user: Omit<User, 'id'>): User {
      const newUser = {
        ...user,
        id: `u_${Date.now()}`,
        // Ensure arrays are initialized if undefined
        states: user.states || [],
        districts: user.districts || [],
        expertise: user.expertise || [],
        tags: user.tags || []
      };
      this.users = [...this.users, newUser];
      this.saveToStorage();
      return newUser;
  }

  updateUser(updatedUser: User): void {
      this.users = this.users.map(u => u.id === updatedUser.id ? updatedUser : u);
      this.saveToStorage();
  }

  deleteUser(id: string): void {
      // Check if user has active assignments
      const hasAssignments = this.assignments.some(a => a.ownerId === id || a.advocateId === id);
      if (hasAssignments) {
          throw new Error("Cannot delete User: They have associated assignments.");
      }
      this.users = this.users.filter(u => u.id !== id);
      this.saveToStorage();
  }

  // -- Actions --

  // Bank User searches for assignments
  searchAssignments(query: string): Assignment[] {
    const q = query.toUpperCase().trim();
    if (!q) return [];
    
    // Returns exact matches for LAN, PAN, or Name.
    // Includes UNCLAIMED and Assignments owned by others (for Transfer requests)
    return this.assignments.filter(a => 
       (a.lan.toUpperCase() === q || a.pan.toUpperCase() === q || a.borrowerName.toUpperCase().includes(q))
    );
  }

  // Bank User claims an assignment
  claimAssignment(assignmentId: string, userId: string): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    const user = this.users.find(u => u.id === userId);

    if (!assignment || !user) throw new Error("Invalid ID");

    // Allow if UNCLAIMED, or if already owned by THIS user (re-saving draft)
    if (assignment.status !== AssignmentStatus.UNCLAIMED && assignment.ownerId !== userId) {
        throw new Error("Assignment already claimed by another user");
    }

    const updated: Assignment = {
      ...assignment,
      status: AssignmentStatus.DRAFT, // Moves to draft initially
      ownerId: user.id,
      hubId: user.hubId,
      claimedAt: assignment.claimedAt || new Date().toISOString(),
      auditTrail: [
        ...(assignment.auditTrail || []),
        { action: 'CLAIMED', performedBy: userId, timestamp: new Date().toISOString(), details: 'Claimed by Bank User' }
      ]
    };

    this.assignments = this.assignments.map(a => a.id === assignmentId ? updated : a);
    this.saveToStorage();
    return updated;
  }

  // Request Transfer of Ownership
  requestTransfer(assignmentId: string, requestorId: string): Assignment {
      const assignment = this.assignments.find(a => a.id === assignmentId);
      const user = this.users.find(u => u.id === requestorId);
      if (!assignment || !user) throw new Error("Not found");

      if (assignment.ownerId === requestorId) throw new Error("You already own this assignment");
      if (assignment.transferRequest) throw new Error("Transfer request already pending");

      const request: TransferRequest = {
          requestedBy: user.id,
          requestedByName: user.name,
          requestedAt: new Date().toISOString()
      };

      const updated: Assignment = {
          ...assignment,
          transferRequest: request,
          auditTrail: [
            ...(assignment.auditTrail || []),
            { action: 'TRANSFER_REQUESTED', performedBy: requestorId, timestamp: new Date().toISOString(), details: `Transfer requested by ${user.name}` }
          ]
      };

      this.assignments = this.assignments.map(a => a.id === assignmentId ? updated : a);
      this.saveToStorage();
      return updated;
  }

  // Resolve Transfer Request (Approve/Reject)
  resolveTransferRequest(assignmentId: string, approved: boolean): Assignment {
      const assignment = this.assignments.find(a => a.id === assignmentId);
      if (!assignment || !assignment.transferRequest) throw new Error("No pending transfer request");

      let updated: Assignment;

      if (approved) {
          const newOwner = this.getUserById(assignment.transferRequest.requestedBy);
          
          updated = {
              ...assignment,
              ownerId: assignment.transferRequest.requestedBy,
              hubId: newOwner?.hubId || assignment.hubId, // Update hub mapping to new owner
              transferRequest: undefined,
              auditTrail: [
                  ...(assignment.auditTrail || []),
                  { 
                      action: 'OWNERSHIP_TRANSFERRED', 
                      performedBy: assignment.ownerId || 'SYSTEM', 
                      timestamp: new Date().toISOString(),
                      details: `Transferred from ${this.getUserById(assignment.ownerId || '')?.name} to ${assignment.transferRequest.requestedByName}`
                  }
              ]
          };
      } else {
          updated = {
              ...assignment,
              transferRequest: undefined, // Clear request
              auditTrail: [
                ...(assignment.auditTrail || []),
                { action: 'TRANSFER_REJECTED', performedBy: assignment.ownerId || 'SYSTEM', timestamp: new Date().toISOString() }
            ]
          };
      }

      this.assignments = this.assignments.map(a => a.id === assignmentId ? updated : a);
      this.saveToStorage();
      return updated;
  }

  // Bank User uploads documents
  uploadDocuments(assignmentId: string, docs: {name: string, category: string, file?: File, size?: number}[], userId: string): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error("Not found");

    const newDocs = docs.map((d, idx) => ({
      id: `doc_${Date.now()}_${idx}`,
      ...d,
      uploadedBy: userId,
      date: new Date().toISOString()
    }));

    const updated: Assignment = {
      ...assignment,
      documents: [...assignment.documents, ...newDocs]
    };

    this.assignments = this.assignments.map(a => a.id === assignmentId ? updated : a);
    this.saveToStorage();
    return updated;
  }

  // Save extracted data from parser
  saveExtractedData(assignmentId: string, documentId: string, data: any): void {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const docIndex = assignment.documents.findIndex(d => d.id === documentId);
    if (docIndex === -1) return;

    assignment.documents[docIndex].extractedData = data;

    // Add audit entry
    if (!assignment.auditTrail) assignment.auditTrail = [];
    assignment.auditTrail.push({
      action: 'DOCUMENT_PARSED',
      performedBy: 'SYSTEM',
      timestamp: new Date().toISOString(),
      details: `Document "${assignment.documents[docIndex].name}" parsed with ${data.confidence}% confidence`
    });

    this.saveToStorage();
  }

  submitForAllocation(assignmentId: string): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error("Not found");
    
    const updated: Assignment = {
      ...assignment,
      status: AssignmentStatus.PENDING_ALLOCATION,
      auditTrail: [
        ...(assignment.auditTrail || []),
        { action: 'SUBMITTED_FOR_ALLOCATION', performedBy: assignment.ownerId || 'UNKNOWN', timestamp: new Date().toISOString() }
      ]
    };
    this.assignments = this.assignments.map(a => a.id === assignmentId ? updated : a);
    this.saveToStorage();
    return updated;
  }

  // CT Ops allocates advocate
  allocateAdvocate(assignmentId: string, advocateId: string, reason?: string): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error("Not found");
    
    const advocate = this.getUserById(advocateId);
    if (!advocate) throw new Error("Advocate not found");

    const isReallocation = !!assignment.advocateId && assignment.advocateId !== advocateId;
    
    if (isReallocation && !reason) {
        throw new Error("Reason is mandatory for re-allocation.");
    }
    
    // Set due date to 7 days from now if not present
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const logEntry: AuditLogEntry = {
        action: isReallocation ? 'REALLOCATED' : 'ALLOCATED',
        performedBy: 'CT_OPS', // In a real app, this would be the actual Ops User ID
        timestamp: new Date().toISOString(),
        details: isReallocation 
            ? `Re-allocated from ${this.getUserById(assignment.advocateId!)?.name} to ${advocate.name}. Reason: ${reason}`
            : `Allocated to ${advocate.name}`
    };

    const updated: Assignment = {
      ...assignment,
      status: AssignmentStatus.ALLOCATED,
      advocateId: advocateId,
      allocatedAt: new Date().toISOString(),
      dueDate: assignment.dueDate || dueDate.toISOString(), // Set due date on allocation
      auditTrail: [...(assignment.auditTrail || []), logEntry]
    };

    this.assignments = this.assignments.map(a => a.id === assignmentId ? updated : a);
    this.saveToStorage();
    return updated;
  }

  // Advocate submits query
  raiseQuery(assignmentId: string, text: string, userId: string, attachments: string[] = [], directedTo?: UserRole): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error("Not found");

    const query = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      raisedBy: userId,
      raisedAt: new Date().toISOString(),
      attachments,
      directedTo
    };

    const updated: Assignment = {
      ...assignment,
      status: AssignmentStatus.QUERY_RAISED,
      queries: [...assignment.queries, query]
    };

    this.assignments = this.assignments.map(a => a.id === assignmentId ? updated : a);
    this.saveToStorage();
    return updated;
  }

  // Bank User responds to query
  respondToQuery(assignmentId: string, queryId: string, response: string, userId: string, attachments: string[] = []): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error("Not found");

    const updatedQueries = assignment.queries.map(q => {
      if (q.id === queryId) {
        return { 
          ...q, 
          response, 
          respondedBy: userId, 
          respondedAt: new Date().toISOString(),
          responseAttachments: attachments 
        };
      }
      return q;
    });

    const updated: Assignment = {
      ...assignment,
      status: AssignmentStatus.IN_PROGRESS, // Back to advocate
      queries: updatedQueries
    };

    this.assignments = this.assignments.map(a => a.id === assignmentId ? updated : a);
    this.saveToStorage();
    return updated;
  }

  // Advocate submits report
  submitReport(assignmentId: string, reportUrl: string, remarks: string): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error("Not found");

    const updated: Assignment = {
      ...assignment,
      status: AssignmentStatus.PENDING_APPROVAL,
      finalReportUrl: reportUrl,
      finalReportVersions: [
        ...(assignment.finalReportVersions || []),
        { url: reportUrl, date: new Date().toISOString(), remarks }
      ],
      auditTrail: [
        ...(assignment.auditTrail || []),
        { action: 'REPORT_SUBMITTED', performedBy: assignment.advocateId || 'UNKNOWN', timestamp: new Date().toISOString() }
      ]
    };

    this.assignments = this.assignments.map(a => a.id === assignmentId ? updated : a);
    this.saveToStorage();
    return updated;
  }

  // Bank User approves report
  approveReport(assignmentId: string): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error("Not found");

    // Get owner and hub details for email delivery
    const owner = this.getUserById(assignment.ownerId || '');
    const hub = this.getHubs().find(h => h.id === assignment.hubId);
    const currentUser = this.currentUser;

    const deliveredAt = new Date().toISOString();

    const updated: Assignment = {
      ...assignment,
      status: AssignmentStatus.COMPLETED,
      completedAt: deliveredAt,
      reportDelivery: {
        deliveredAt,
        deliveredTo: [
          {
            name: owner?.name || 'Unknown Owner',
            email: owner?.email || 'unknown@example.com',
            role: 'Owner'
          },
          ...(hub ? [{
            name: hub.hubName || 'Hub',
            email: hub.hubEmail || 'hub@example.com',
            role: 'Hub' as const
          }] : [])
        ],
        deliveredBy: currentUser?.id || assignment.ownerId || 'UNKNOWN',
        deliveredByName: currentUser?.name || 'System',
        reportUrl: assignment.finalReportUrl || ''
      },
      auditTrail: [
        ...(assignment.auditTrail || []),
        {
          action: 'APPROVED',
          performedBy: currentUser?.id || assignment.ownerId || 'UNKNOWN',
          timestamp: deliveredAt,
          details: `Report approved and delivered to: ${owner?.email || 'N/A'} (Owner), ${hub?.hubEmail || 'N/A'} (Hub)`
        }
      ]
    };

    // In production: Send email to owner and hub
    console.log('📧 Final Report Delivery:', {
      to: owner?.email,
      cc: hub?.hubEmail,
      subject: `[COMPLETED] ${assignment.lan} - ${assignment.borrowerName}`,
      attachments: [assignment.finalReportUrl],
      body: `Assignment ${assignment.lan} has been completed and approved.`
    });

    this.assignments = this.assignments.map(a => a.id === assignmentId ? updated : a);
    this.saveToStorage();
    return updated;
  }

  // -- Auto-Allocation Engine --

  /**
   * Auto-allocate a single assignment to the best-match advocate
   * Uses smart matching based on location, workload, and expertise
   */
  autoAllocateAssignment(assignmentId: string): { success: boolean; advocateId?: string; reason?: string } {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      return { success: false, reason: 'Assignment not found' };
    }

    if (assignment.status !== AssignmentStatus.PENDING_ALLOCATION) {
      return { success: false, reason: 'Assignment not in PENDING_ALLOCATION status' };
    }

    // Get available advocates (workload < 5)
    const advocates = this.getAdvocates();
    const availableAdvocates = advocates.filter(adv => {
      const workload = this.getAdvocateWorkload(adv.id);
      return workload < 5; // Max 5 active assignments per advocate
    });

    if (availableAdvocates.length === 0) {
      return { success: false, reason: 'No advocates available (all at capacity)' };
    }

    // Score each advocate based on multiple factors
    const scoredAdvocates = availableAdvocates.map(adv => {
      let score = 0;

      // Factor 1: Location match (highest priority)
      const stateMatch = adv.states?.includes(assignment.state);
      const districtMatch = adv.districts?.includes(assignment.district);
      if (stateMatch && districtMatch) {
        score += 100; // Perfect match
      } else if (stateMatch) {
        score += 50; // State match only
      }

      // Factor 2: Product expertise
      if (adv.expertise?.includes(assignment.productType)) {
        score += 30;
      }

      // Factor 3: Workload (prefer less loaded advocates)
      const workload = this.getAdvocateWorkload(adv.id);
      score += (5 - workload) * 10; // 50 points for 0 workload, 0 points for 5 workload

      // Factor 4: Hub alignment (bonus for same hub)
      if (adv.hubId === assignment.hubId) {
        score += 20;
      }

      return { advocate: adv, score };
    });

    // Sort by score (highest first)
    scoredAdvocates.sort((a, b) => b.score - a.score);

    // Allocate to best match
    const bestMatch = scoredAdvocates[0];
    if (!bestMatch) {
      return { success: false, reason: 'No suitable advocate found' };
    }

    try {
      this.allocateAdvocate(assignmentId, bestMatch.advocate.id, 'Auto-allocated by smart engine');
      return {
        success: true,
        advocateId: bestMatch.advocate.id,
        reason: `Matched to ${bestMatch.advocate.name} (score: ${bestMatch.score})`
      };
    } catch (error) {
      return { success: false, reason: `Allocation failed: ${error}` };
    }
  }

  /**
   * Bulk auto-allocate multiple assignments
   * Returns summary of results
   */
  bulkAutoAllocate(assignmentIds: string[]): {
    total: number;
    successful: number;
    failed: number;
    results: Array<{ assignmentId: string; success: boolean; advocateId?: string; reason?: string }>;
  } {
    const results = assignmentIds.map(id => {
      const result = this.autoAllocateAssignment(id);
      return { assignmentId: id, ...result };
    });

    return {
      total: assignmentIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Auto-allocate ALL pending assignments
   * Useful for batch processing new assignments
   */
  autoAllocateAll(): {
    total: number;
    successful: number;
    failed: number;
    results: Array<{ assignmentId: string; success: boolean; advocateId?: string; reason?: string }>;
  } {
    const pendingAssignments = this.assignments.filter(
      a => a.status === AssignmentStatus.PENDING_ALLOCATION
    );
    const ids = pendingAssignments.map(a => a.id);
    return this.bulkAutoAllocate(ids);
  }

  // -- Gemini AI Allocation --

  /**
   * Check if Gemini AI is available
   */
  isGeminiAvailable(): boolean {
    return geminiAllocationService.isAvailable();
  }

  /**
   * Allocate using Gemini AI
   */
  async geminiAllocateAssignment(assignmentId: string): Promise<{
    success: boolean;
    advocateId?: string;
    advocateName?: string;
    reason?: string;
    confidence?: number;
    factors?: string[];
  }> {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      console.error(`❌ Assignment ${assignmentId} not found`);
      return { success: false, reason: 'Assignment not found' };
    }

    if (assignment.status !== AssignmentStatus.PENDING_ALLOCATION) {
      console.error(`❌ Assignment ${assignmentId} not in PENDING_ALLOCATION (status: ${assignment.status})`);
      return { success: false, reason: 'Assignment not in PENDING_ALLOCATION status' };
    }

    console.log(`🤖 AI allocating ${assignment.lan} (${assignmentId})...`);
    const advocates = this.getAdvocates();
    const result = await geminiAllocationService.allocateWithAI(
      assignment,
      advocates,
      (id) => this.getAdvocateWorkload(id)
    );

    if (result.success && result.advocateId) {
      try {
        console.log(`✅ AI selected advocate ${result.advocateId} for ${assignment.lan}`);
        this.allocateAdvocate(
          assignmentId,
          result.advocateId,
          `AI-allocated by Gemini (confidence: ${result.confidence}/10) - ${result.reason}`
        );

        // Verify allocation succeeded
        const updated = this.getAssignmentById(assignmentId);
        if (updated?.status !== AssignmentStatus.ALLOCATED) {
          console.error(`❌ Allocation verification failed for ${assignment.lan}`);
          return { success: false, reason: 'Allocation verification failed' };
        }

        console.log(`✅ Successfully allocated ${assignment.lan} to advocate ${result.advocateId}`);
        return result;
      } catch (error: any) {
        console.error(`❌ Allocation error for ${assignment.lan}:`, error);
        return { success: false, reason: `Allocation failed: ${error.message || error}` };
      }
    }

    if (!result.success) {
      console.warn(`⚠️ AI could not allocate ${assignment.lan}: ${result.reason}`);
    }

    return result;
  }

  /**
   * Bulk allocate using Gemini AI (optimized with parallel processing)
   */
  async geminiAllocateAll(
    onProgress?: (current: number, total: number, assignment?: string) => void,
    options?: {
      batchSize?: number;           // Number of concurrent allocations (default: 5)
      delayBetweenBatches?: number; // Delay in ms between batches (default: 500ms)
      maxRetries?: number;          // Max retries per allocation (default: 3)
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
    const pendingAssignments = this.assignments.filter(
      a => a.status === AssignmentStatus.PENDING_ALLOCATION
    );

    if (pendingAssignments.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        results: []
      };
    }

    const batchSize = options?.batchSize || 5;
    const delayBetweenBatches = options?.delayBetweenBatches || 500;
    const maxRetries = options?.maxRetries || 3;

    const results: Array<any> = [];
    let completed = 0;

    console.log(`🚀 Starting optimized bulk AI allocation for ${pendingAssignments.length} assignments (batch size: ${batchSize})`);

    // Helper function to allocate a single assignment with proper error handling
    const allocateSingle = async (assignment: Assignment, retryCount = 0): Promise<any> => {
      try {
        const result = await this.geminiAllocateAssignment(assignment.id);
        return {
          assignmentId: assignment.id,
          lan: assignment.lan,
          ...result
        };
      } catch (error: any) {
        // Retry logic
        if (retryCount < maxRetries) {
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.warn(`⚠️ Retry ${retryCount + 1}/${maxRetries} for ${assignment.lan} after ${backoffDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          return allocateSingle(assignment, retryCount + 1);
        }

        console.error(`❌ Failed after ${retryCount} retries for ${assignment.lan}:`, error);
        return {
          assignmentId: assignment.id,
          lan: assignment.lan,
          success: false,
          reason: `Failed after ${retryCount} retries: ${error.message || 'Unknown error'}`
        };
      }
    };

    // Process assignments in batches
    for (let i = 0; i < pendingAssignments.length; i += batchSize) {
      const batch = pendingAssignments.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(pendingAssignments.length / batchSize);

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} assignments)...`);

      // Process batch in parallel
      const batchPromises = batch.map(assignment => allocateSingle(assignment));
      const batchResults = await Promise.allSettled(batchPromises);

      // Extract results and update progress
      for (const settledResult of batchResults) {
        const result = settledResult.status === 'fulfilled'
          ? settledResult.value
          : {
              assignmentId: batch[results.length]?.id || 'unknown',
              lan: batch[results.length]?.lan || 'unknown',
              success: false,
              reason: 'Promise rejected unexpectedly'
            };

        results.push(result);
        completed++;

        // Call progress callback with assignment LAN
        if (onProgress) {
          onProgress(completed, pendingAssignments.length, result.lan);
        }
      }

      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < pendingAssignments.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    // Calculate success/failure counts
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Bulk allocation complete: ${successful} successful, ${failed} failed`);

    return {
      total: pendingAssignments.length,
      successful,
      failed,
      results
    };
  }

  // -- Forfeit & Re-allocation Management --

  /**
   * Advocate forfeits an assignment
   * Returns assignment to FORFEITED status for CT Ops re-allocation
   */
  forfeitAssignment(
    assignmentId: string,
    advocateId: string,
    reason: ForfeitReason,
    details: string
  ): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Validation: Only assigned advocate can forfeit
    if (assignment.advocateId !== advocateId) {
      throw new Error('Only the assigned advocate can forfeit this assignment');
    }

    // Validation: Can only forfeit if ALLOCATED, IN_PROGRESS, or QUERY_RAISED
    const validStatuses = [
      AssignmentStatus.ALLOCATED,
      AssignmentStatus.IN_PROGRESS,
      AssignmentStatus.QUERY_RAISED
    ];
    if (!validStatuses.includes(assignment.status)) {
      throw new Error(
        `Cannot forfeit assignment in ${assignment.status} status. ` +
        `Only ALLOCATED, IN_PROGRESS, or QUERY_RAISED assignments can be forfeited.`
      );
    }

    // Validation: Details must be meaningful
    if (!details || details.trim().length < 20) {
      throw new Error('Please provide detailed reason (minimum 20 characters)');
    }

    const advocate = this.getUserById(advocateId);
    if (!advocate) {
      throw new Error('Advocate not found');
    }

    // Track forfeit count
    const forfeitCount = (assignment.forfeitDetails?.forfeitCount || 0) + 1;

    // Flag if assignment has been forfeited multiple times
    if (forfeitCount > 2) {
      console.warn(
        `⚠️ Assignment ${assignment.lan} has been forfeited ${forfeitCount} times! ` +
        `May indicate problematic assignment - review required.`
      );
    }

    const forfeitDetails: ForfeitDetails = {
      reason,
      details: details.trim(),
      forfeitedBy: advocateId,
      forfeitedByName: advocate.name,
      forfeitedAt: new Date().toISOString(),
      previousAdvocateId: assignment.advocateId,
      forfeitCount
    };

    // Track all previous advocates
    const previousAdvocates = assignment.previousAdvocates || [];
    if (assignment.advocateId && !previousAdvocates.includes(assignment.advocateId)) {
      previousAdvocates.push(assignment.advocateId);
    }

    const updated: Assignment = {
      ...assignment,
      status: AssignmentStatus.FORFEITED,
      advocateId: undefined,          // Remove advocate assignment
      allocatedAt: undefined,         // Clear allocation timestamp
      forfeitDetails,
      previousAdvocates,
      isForfeitedAssignment: true,
      auditTrail: [
        ...(assignment.auditTrail || []),
        {
          action: 'FORFEITED',
          performedBy: advocateId,
          timestamp: new Date().toISOString(),
          details: `Forfeited by ${advocate.name}. Reason: ${reason}. Details: ${details}`
        }
      ]
    };

    this.assignments = this.assignments.map(a =>
      a.id === assignmentId ? updated : a
    );
    this.saveToStorage();

    // Log for monitoring
    console.log(
      `📤 Assignment ${assignment.lan} forfeited by ${advocate.name}. ` +
      `Reason: ${reason} (Forfeit #${forfeitCount})`
    );

    return updated;
  }

  /**
   * Re-allocate a forfeited assignment
   * Excludes previous advocates from re-allocation
   */
  reAllocateForfeitedAssignment(
    assignmentId: string,
    newAdvocateId: string,
    opsUserId: string,
    notes?: string
  ): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.status !== AssignmentStatus.FORFEITED) {
      throw new Error('Only FORFEITED assignments can be re-allocated via this method');
    }

    // Validation: Don't re-allocate to previous advocate who forfeited
    if (assignment.previousAdvocates?.includes(newAdvocateId)) {
      const previousAdv = this.getUserById(newAdvocateId);
      throw new Error(
        `Cannot re-allocate to ${previousAdv?.name} - this advocate previously forfeited this assignment`
      );
    }

    const newAdvocate = this.getUserById(newAdvocateId);
    if (!newAdvocate || newAdvocate.role !== UserRole.ADVOCATE) {
      throw new Error('Invalid advocate selected');
    }

    // Check workload
    const workload = this.getAdvocateWorkload(newAdvocateId);
    if (workload >= 5) {
      throw new Error(
        `${newAdvocate.name} is at capacity (${workload}/5 assignments). ` +
        `Please select a different advocate.`
      );
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const updated: Assignment = {
      ...assignment,
      status: AssignmentStatus.ALLOCATED,
      advocateId: newAdvocateId,
      allocatedAt: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
      auditTrail: [
        ...(assignment.auditTrail || []),
        {
          action: 'RE_ALLOCATED_AFTER_FORFEIT',
          performedBy: opsUserId,
          timestamp: new Date().toISOString(),
          details:
            `Re-allocated to ${newAdvocate.name} after forfeit by ` +
            `${assignment.forfeitDetails?.forfeitedByName}. ` +
            (notes ? `Notes: ${notes}` : '')
        }
      ]
    };

    this.assignments = this.assignments.map(a =>
      a.id === assignmentId ? updated : a
    );
    this.saveToStorage();

    console.log(
      `♻️ Forfeited assignment ${assignment.lan} re-allocated to ${newAdvocate.name}`
    );

    return updated;
  }

  /**
   * Get all forfeited assignments for CT Ops queue
   */
  getForfeitedAssignments(): Assignment[] {
    return this.assignments
      .filter(a => a.status === AssignmentStatus.FORFEITED)
      .sort((a, b) => {
        // Sort by forfeit time (most recent first)
        const timeA = new Date(a.forfeitDetails?.forfeitedAt || 0).getTime();
        const timeB = new Date(b.forfeitDetails?.forfeitedAt || 0).getTime();
        return timeB - timeA;
      });
  }

  /**
   * Auto re-allocate forfeited assignment using smart engine
   * Excludes previous advocates who forfeited
   */
  autoReAllocateForfeitedAssignment(
    assignmentId: string
  ): { success: boolean; advocateId?: string; reason?: string } {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      return { success: false, reason: 'Assignment not found' };
    }

    if (assignment.status !== AssignmentStatus.FORFEITED) {
      return { success: false, reason: 'Assignment is not in FORFEITED status' };
    }

    // Get available advocates, EXCLUDING those who previously forfeited
    const advocates = this.getAdvocates();
    const availableAdvocates = advocates.filter(adv => {
      const workload = this.getAdvocateWorkload(adv.id);
      const notPreviouslyForfeited = !assignment.previousAdvocates?.includes(adv.id);
      return workload < 5 && notPreviouslyForfeited;
    });

    if (availableAdvocates.length === 0) {
      return {
        success: false,
        reason: 'No suitable advocates available (excluding previous advocates who forfeited)'
      };
    }

    // Use existing scoring algorithm
    const scoredAdvocates = availableAdvocates.map(adv => {
      let score = 0;

      // Location match
      const stateMatch = adv.states?.includes(assignment.state);
      const districtMatch = adv.districts?.includes(assignment.district);
      if (stateMatch && districtMatch) score += 100;
      else if (stateMatch) score += 50;

      // Product expertise
      if (adv.expertise?.includes(assignment.productType)) score += 30;

      // Workload
      const workload = this.getAdvocateWorkload(adv.id);
      score += (5 - workload) * 10;

      // Hub alignment
      if (adv.hubId === assignment.hubId) score += 20;

      return { advocate: adv, score };
    });

    scoredAdvocates.sort((a, b) => b.score - a.score);

    const bestMatch = scoredAdvocates[0];
    if (!bestMatch) {
      return { success: false, reason: 'No suitable advocate found' };
    }

    try {
      this.reAllocateForfeitedAssignment(
        assignmentId,
        bestMatch.advocate.id,
        'AUTO_SYSTEM',
        `Auto re-allocated after forfeit (score: ${bestMatch.score})`
      );

      return {
        success: true,
        advocateId: bestMatch.advocate.id,
        reason: `Matched to ${bestMatch.advocate.name} (score: ${bestMatch.score})`
      };
    } catch (error: any) {
      return { success: false, reason: `Re-allocation failed: ${error.message}` };
    }
  }

  // -- Test Data Management --

  /**
   * Load test dataset (65 assignments, 25 advocates, 10 hubs)
   */
  loadTestData(): void {
    this.assignments = [...TEST_ASSIGNMENTS];
    this.hubs = [...TEST_HUBS];
    this.users = [...TEST_USERS];
    this.saveToStorage();
    console.log('🧪 Loaded test dataset:', {
      assignments: this.assignments.length,
      hubs: this.hubs.length,
      advocates: this.getAdvocates().length,
      users: this.users.length
    });
  }

  /**
   * Check if test data is loaded
   */
  isTestDataLoaded(): boolean {
    return this.assignments.length >= 60 && this.getAdvocates().length >= 20;
  }
}

export const store = new MockStore();
