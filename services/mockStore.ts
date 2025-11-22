
import { Assignment, AssignmentStatus, User, Hub, UserRole, AuditLogEntry, TransferRequest } from '../types';
import { INITIAL_ASSIGNMENTS as SEED_DATA, MOCK_HUBS as SEED_HUBS, MOCK_USERS as SEED_USERS } from '../constants';

// Singleton Store
class MockStore {
  private assignments: Assignment[] = [...SEED_DATA];
  private users: User[] = [...SEED_USERS];
  private hubs: Hub[] = [...SEED_HUBS];
  
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
      return newHub;
  }

  updateHub(updatedHub: Hub): void {
      this.hubs = this.hubs.map(h => h.id === updatedHub.id ? updatedHub : h);
  }

  deleteHub(id: string): void {
      // Check if any users are linked to this hub
      const linkedUsers = this.users.some(u => u.hubId === id);
      if (linkedUsers) {
          throw new Error("Cannot delete Hub: Active users are mapped to this hub.");
      }
      this.hubs = this.hubs.filter(h => h.id !== id);
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
      return newUser;
  }

  updateUser(updatedUser: User): void {
      this.users = this.users.map(u => u.id === updatedUser.id ? updatedUser : u);
  }

  deleteUser(id: string): void {
      // Check if user has active assignments
      const hasAssignments = this.assignments.some(a => a.ownerId === id || a.advocateId === id);
      if (hasAssignments) {
          throw new Error("Cannot delete User: They have associated assignments.");
      }
      this.users = this.users.filter(u => u.id !== id);
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
    return updated;
  }

  // Bank User approves report
  approveReport(assignmentId: string): Assignment {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) throw new Error("Not found");

    const updated: Assignment = {
      ...assignment,
      status: AssignmentStatus.COMPLETED,
      completedAt: new Date().toISOString(),
      auditTrail: [
        ...(assignment.auditTrail || []),
        { action: 'APPROVED', performedBy: assignment.ownerId || 'UNKNOWN', timestamp: new Date().toISOString() }
      ]
    };

    this.assignments = this.assignments.map(a => a.id === assignmentId ? updated : a);
    return updated;
  }
}

export const store = new MockStore();
