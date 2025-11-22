
import { Assignment, AssignmentStatus, User, Hub, UserRole, AuditLogEntry, TransferRequest } from '../types';
import { INITIAL_ASSIGNMENTS as SEED_DATA, MOCK_HUBS as SEED_HUBS, MOCK_USERS as SEED_USERS } from '../constants';

// Singleton Store with localStorage persistence
class MockStore {
  private static STORAGE_KEY = 'ctmap_demo_data';
  private static VERSION = '1.0';

  private assignments: Assignment[] = [];
  private users: User[] = [];
  private hubs: Hub[] = [];

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
  
  getAdvocateWorkload(advocateId: string): number {
    return this.assignments.filter(a => 
      a.advocateId === advocateId && 
      (a.status === AssignmentStatus.ALLOCATED || 
       a.status === AssignmentStatus.IN_PROGRESS || 
       a.status === AssignmentStatus.QUERY_RAISED)
    ).length;
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
  uploadDocuments(assignmentId: string, docs: {name: string, category: string}[], userId: string): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error("Not found");

    const newDocs = docs.map(d => ({
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

    const updated: Assignment = {
      ...assignment,
      status: AssignmentStatus.COMPLETED,
      completedAt: new Date().toISOString(),
      auditTrail: [
        ...(assignment.auditTrail || []),
        {
          action: 'APPROVED',
          performedBy: assignment.ownerId || 'UNKNOWN',
          timestamp: new Date().toISOString(),
          details: `Report approved. Email sent to: ${owner?.email || 'N/A'} (Owner), ${hub?.hubEmail || 'N/A'} (Hub)`
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
}

export const store = new MockStore();
