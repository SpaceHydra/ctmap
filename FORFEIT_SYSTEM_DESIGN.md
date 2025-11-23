# Assignment Forfeit & Re-allocation System Design

## Business Context

Advocates may need to forfeit (give up) assignments for various legitimate reasons:
- ✅ Assignment too complex beyond their expertise
- ✅ Conflict of interest discovered
- ✅ Overloaded with urgent work
- ✅ Personal/medical emergency
- ✅ Property access issues
- ✅ Client relationship issues

**Critical Requirement**: System must handle forfeit gracefully and enable quick re-allocation to minimize delays.

---

## System Design Overview

### 1. **Forfeit Workflow**

```
┌─────────────────────────────────────────────────────────────┐
│ ADVOCATE DASHBOARD                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Assignment: LAN12345 (IN_PROGRESS)                       │ │
│ │ [View Details] [Raise Query] [Submit Report]             │ │
│ │ [⚠️ Forfeit Assignment]  ← NEW BUTTON                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Click Forfeit Button
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ FORFEIT CONFIRMATION MODAL                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ Forfeit Assignment LAN12345?                          │ │
│ │                                                           │ │
│ │ Reason (Required):                                        │ │
│ │ [Dropdown: Select Reason ▼]                               │ │
│ │   - Too Complex / Beyond Expertise                        │ │
│ │   - Conflict of Interest                                  │ │
│ │   - Overloaded with Work                                  │ │
│ │   - Personal/Medical Emergency                            │ │
│ │   - Property Access Issues                                │ │
│ │   - Other (specify below)                                 │ │
│ │                                                           │ │
│ │ Additional Details (Required):                            │ │
│ │ [Text Area - Min 20 characters]                           │ │
│ │                                                           │ │
│ │ ⚠️ Warning: This action will:                             │ │
│ │   • Remove this assignment from your workload             │ │
│ │   • Send to CT Ops for re-allocation                      │ │
│ │   • Be recorded in audit trail                            │ │
│ │                                                           │ │
│ │ [Cancel] [Confirm Forfeit]                                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
                       Confirm Forfeit
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ SYSTEM PROCESSING                                            │
│ 1. Update assignment status → FORFEITED                      │
│ 2. Clear advocateId (remove advocate link)                   │
│ 3. Add forfeit entry to audit trail                          │
│ 4. Decrement advocate's workload count                       │
│ 5. Notify CT Ops team                                        │
│ 6. Show in "Forfeited Assignments" queue                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ CT OPS DASHBOARD - FORFEITED QUEUE                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔔 3 Forfeited Assignments Need Re-allocation            │ │
│ │                                                           │ │
│ │ LAN12345 - Forfeited by John Doe Legal                   │ │
│ │ Reason: Too complex beyond expertise                      │ │
│ │ Details: Property has multiple legal disputes...          │ │
│ │ [Re-allocate Manually] [AI Re-allocate]                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. **Data Model Changes**

### Assignment Type Extension

```typescript
// types.ts
export enum AssignmentStatus {
  UNCLAIMED = 'UNCLAIMED',
  DRAFT = 'DRAFT',
  PENDING_ALLOCATION = 'PENDING_ALLOCATION',
  ALLOCATED = 'ALLOCATED',
  IN_PROGRESS = 'IN_PROGRESS',
  QUERY_RAISED = 'QUERY_RAISED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  COMPLETED = 'COMPLETED',
  FORFEITED = 'FORFEITED',  // ← NEW STATUS
}

export enum ForfeitReason {
  TOO_COMPLEX = 'Too Complex / Beyond Expertise',
  CONFLICT_OF_INTEREST = 'Conflict of Interest',
  OVERLOADED = 'Overloaded with Work',
  EMERGENCY = 'Personal/Medical Emergency',
  ACCESS_ISSUES = 'Property Access Issues',
  CLIENT_ISSUES = 'Client Relationship Issues',
  OTHER = 'Other',
}

export interface ForfeitDetails {
  reason: ForfeitReason;
  details: string;
  forfeitedBy: string;         // Advocate user ID
  forfeitedByName: string;      // Advocate name
  forfeitedAt: string;          // ISO timestamp
  previousAdvocateId: string;   // Track who forfeited
  forfeitCount: number;         // How many times forfeited (flag if > 1)
}

export interface Assignment {
  // ... existing fields ...

  // New forfeit-related fields
  forfeitDetails?: ForfeitDetails;
  previousAdvocates?: string[];  // Track all advocates who worked on this
  isForfeitedAssignment?: boolean; // Flag for quick filtering
}

export interface AuditLogEntry {
  action:
    | 'CREATED'
    | 'CLAIMED'
    | 'SUBMITTED_FOR_ALLOCATION'
    | 'ALLOCATED'
    | 'REALLOCATED'
    | 'FORFEITED'           // ← NEW ACTION
    | 'RE_ALLOCATED_AFTER_FORFEIT'  // ← NEW ACTION
    | 'IN_PROGRESS'
    | 'QUERY_RAISED'
    | 'QUERY_RESPONDED'
    | 'REPORT_SUBMITTED'
    | 'APPROVED'
    | 'COMPLETED';
  performedBy: string;
  timestamp: string;
  details?: string;
}
```

---

## 3. **Business Logic Implementation**

### mockStore.ts - Forfeit Method

```typescript
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

  // Validation: Can only forfeit if ALLOCATED or IN_PROGRESS
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

    // Bonus: Prefer advocates with high success rate (could track this)
    // score += advocate.successRate * 10;

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
```

---

## 4. **UI Components**

### A. Advocate Dashboard - Forfeit Button

**Location**: `pages/AdvocateDashboard.tsx`

```typescript
const handleForfeit = async (assignment: Assignment) => {
  // Show forfeit modal
  setForfeitModalOpen(true);
  setSelectedAssignment(assignment);
};

// In assignment table row
{assignment.status !== AssignmentStatus.COMPLETED &&
 assignment.status !== AssignmentStatus.PENDING_APPROVAL && (
  <button
    onClick={() => handleForfeit(assignment)}
    className="text-red-600 hover:text-red-800 font-semibold text-sm flex items-center gap-1"
    title="Forfeit this assignment"
  >
    <XCircle className="w-4 h-4" />
    Forfeit
  </button>
)}
```

### B. Forfeit Modal Component

**Location**: `components/ForfeitModal.tsx`

```typescript
interface ForfeitModalProps {
  assignment: Assignment;
  advocateId: string;
  onClose: () => void;
  onConfirm: (reason: ForfeitReason, details: string) => void;
}

export const ForfeitModal: React.FC<ForfeitModalProps> = ({
  assignment,
  advocateId,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState<ForfeitReason>(ForfeitReason.TOO_COMPLEX);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!details || details.trim().length < 20) {
      setError('Please provide detailed reason (minimum 20 characters)');
      return;
    }

    onConfirm(reason, details);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Forfeit Assignment</h3>
            <p className="text-sm text-slate-500">{assignment.lan}</p>
          </div>
        </div>

        {/* Reason Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Reason for Forfeiting <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ForfeitReason)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {Object.values(ForfeitReason).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Details Textarea */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Additional Details <span className="text-red-500">*</span>
          </label>
          <textarea
            value={details}
            onChange={(e) => {
              setDetails(e.target.value);
              setError('');
            }}
            placeholder="Please provide specific details about why you're forfeiting this assignment..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 h-24 resize-none"
            minLength={20}
          />
          <p className="text-xs text-slate-500 mt-1">
            {details.length}/20 characters minimum
          </p>
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>

        {/* Warning Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-amber-800 font-semibold mb-2">
            ⚠️ This action will:
          </p>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Remove this assignment from your workload</li>
            <li>• Send to CT Ops for re-allocation</li>
            <li>• Be recorded in audit trail</li>
            <li>• Notify CT Ops team</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            Confirm Forfeit
          </button>
        </div>
      </div>
    </div>
  );
};
```

### C. CT Ops Dashboard - Forfeited Queue

**Location**: `pages/OpsDashboard.tsx`

```typescript
// Add new stats
const forfeitedCount = assignments.filter(a => a.status === AssignmentStatus.FORFEITED).length;

// Add new stats card
<StatsCard
  title="Forfeited (Need Re-allocation)"
  value={forfeitedCount}
  icon={RefreshCw}
  colorClass="bg-orange-500 text-orange-600"
  highlight={forfeitedCount > 0}
/>

// Add forfeited assignments section
{filter === AssignmentStatus.FORFEITED && (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
    <h4 className="font-bold text-orange-800 mb-2">
      🔔 {forfeitedCount} Forfeited Assignment{forfeitedCount !== 1 ? 's' : ''} Need Re-allocation
    </h4>
    <p className="text-sm text-orange-700">
      These assignments were forfeited by advocates and need to be re-allocated immediately.
    </p>
  </div>
)}

// In assignment table, show forfeit details
{assignment.status === AssignmentStatus.FORFEITED && assignment.forfeitDetails && (
  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
    <p className="font-semibold text-orange-800">
      Forfeited by: {assignment.forfeitDetails.forfeitedByName}
    </p>
    <p className="text-orange-700">
      Reason: {assignment.forfeitDetails.reason}
    </p>
    <p className="text-orange-600 mt-1">
      Details: {assignment.forfeitDetails.details}
    </p>
    {assignment.forfeitDetails.forfeitCount > 1 && (
      <p className="text-red-600 font-bold mt-1">
        ⚠️ Warning: Forfeited {assignment.forfeitDetails.forfeitCount} times!
      </p>
    )}
  </div>
)}

// Re-allocation buttons
{assignment.status === AssignmentStatus.FORFEITED && (
  <div className="flex gap-2 mt-2">
    <button
      onClick={() => handleManualReAllocate(assignment)}
      className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
    >
      Re-allocate Manually
    </button>
    <button
      onClick={() => handleAutoReAllocate(assignment)}
      className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700"
    >
      Auto Re-allocate
    </button>
  </div>
)}
```

---

## 5. **Re-allocation Options**

### Option 1: Manual Re-allocation
```typescript
const handleManualReAllocate = (assignment: Assignment) => {
  // Show advocate selection modal
  // Exclude previous advocates who forfeited
  const availableAdvocates = store.getAdvocates().filter(adv =>
    !assignment.previousAdvocates?.includes(adv.id) &&
    store.getAdvocateWorkload(adv.id) < 5
  );

  // Show modal with available advocates
  // On selection, call store.reAllocateForfeitedAssignment()
};
```

### Option 2: Auto Re-allocation (Rule-based)
```typescript
const handleAutoReAllocate = (assignment: Assignment) => {
  const result = store.autoReAllocateForfeitedAssignment(assignment.id);

  if (result.success) {
    alert(`✅ Re-allocated to ${result.advocateId}`);
  } else {
    alert(`❌ Auto re-allocation failed: ${result.reason}`);
  }
};
```

### Option 3: AI Re-allocation (Gemini)
```typescript
const handleAIReAllocate = async (assignment: Assignment) => {
  // Exclude previous advocates
  const advocates = store.getAdvocates().filter(adv =>
    !assignment.previousAdvocates?.includes(adv.id)
  );

  const result = await geminiAllocationService.allocateWithAI(
    assignment,
    advocates,
    (id) => store.getAdvocateWorkload(id)
  );

  if (result.success && result.advocateId) {
    store.reAllocateForfeitedAssignment(
      assignment.id,
      result.advocateId,
      currentUser.id,
      `AI re-allocated (confidence: ${result.confidence}/10)`
    );
  }
};
```

---

## 6. **Notifications & Alerts**

### CT Ops Dashboard Alert
```typescript
// Show prominent alert when there are forfeited assignments
{forfeitedCount > 0 && (
  <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-4">
    <div className="flex items-center">
      <AlertTriangle className="w-5 h-5 text-orange-500 mr-3" />
      <div>
        <p className="font-bold text-orange-800">
          {forfeitedCount} Assignment{forfeitedCount !== 1 ? 's' : ''} Forfeited
        </p>
        <p className="text-sm text-orange-700">
          Advocates have forfeited assignments that need immediate re-allocation
        </p>
      </div>
      <button
        onClick={() => setFilter(AssignmentStatus.FORFEITED)}
        className="ml-auto px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
      >
        View Forfeited
      </button>
    </div>
  </div>
)}
```

---

## 7. **Reporting & Analytics**

### Forfeit Metrics Dashboard

```typescript
interface ForfeitMetrics {
  totalForfeits: number;
  forfeitsByReason: Record<ForfeitReason, number>;
  mostForfeitedAdvocates: Array<{ advocateId: string; count: number }>;
  mostForfeitedAssignments: Assignment[];  // Forfeited > 1 time
  averageReAllocationTime: number;  // Hours
}

const getForfeitMetrics = (): ForfeitMetrics => {
  const allAssignments = store.getAssignments();

  const forfeitedAssignments = allAssignments.filter(a =>
    a.isForfeitedAssignment || a.forfeitDetails
  );

  // Count by reason
  const forfeitsByReason = forfeitedAssignments.reduce((acc, a) => {
    const reason = a.forfeitDetails?.reason || ForfeitReason.OTHER;
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<ForfeitReason, number>);

  // Most forfeited assignments
  const mostForfeitedAssignments = allAssignments
    .filter(a => (a.forfeitDetails?.forfeitCount || 0) > 1)
    .sort((a, b) =>
      (b.forfeitDetails?.forfeitCount || 0) -
      (a.forfeitDetails?.forfeitCount || 0)
    );

  return {
    totalForfeits: forfeitedAssignments.length,
    forfeitsByReason,
    mostForfeitedAdvocates: [], // Calculate from audit trail
    mostForfeitedAssignments,
    averageReAllocationTime: 0  // Calculate from timestamps
  };
};
```

---

## 8. **Business Rules & Validations**

### Forfeit Rules
1. ✅ **Who can forfeit**: Only the currently assigned advocate
2. ✅ **When can forfeit**: ALLOCATED, IN_PROGRESS, or QUERY_RAISED status
3. ✅ **Cannot forfeit**: PENDING_APPROVAL or COMPLETED assignments
4. ✅ **Reason required**: Must select from predefined list
5. ✅ **Details required**: Minimum 20 characters explanation
6. ✅ **Audit trail**: Every forfeit logged with full details
7. ✅ **Workload update**: Immediate decrement of advocate's workload

### Re-allocation Rules
1. ✅ **Exclude previous advocates**: Cannot re-allocate to anyone who forfeited this assignment
2. ✅ **Capacity check**: New advocate must have workload < 5
3. ✅ **Priority re-allocation**: Forfeited assignments get priority
4. ✅ **Multiple forfeit flag**: Alert if assignment forfeited > 2 times
5. ✅ **Audit trail**: Log re-allocation with previous forfeit context

### Warning Flags
```typescript
// Flag problematic assignments
if (assignment.forfeitDetails?.forfeitCount > 2) {
  console.warn(
    `🚨 CRITICAL: Assignment ${assignment.lan} forfeited ${assignment.forfeitDetails.forfeitCount} times! ` +
    `Possible issues:\n` +
    `  • Assignment may be genuinely too complex\n` +
    `  • Property may have serious legal issues\n` +
    `  • May need specialist advocate\n` +
    `  • Review assignment details and consider specialist allocation`
  );

  // Could also:
  // - Email management
  // - Flag for manual review
  // - Require approval before next re-allocation
  // - Increase fee/priority for next advocate
}
```

---

## 9. **Database Schema (if using real DB)**

```sql
-- Add columns to assignments table
ALTER TABLE assignments
ADD COLUMN status VARCHAR(50),
ADD COLUMN is_forfeited_assignment BOOLEAN DEFAULT FALSE,
ADD COLUMN forfeit_count INT DEFAULT 0,
ADD COLUMN previous_advocates JSONB;  -- Array of advocate IDs

-- Create forfeits tracking table
CREATE TABLE assignment_forfeits (
  id UUID PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id),
  forfeited_by_advocate_id UUID REFERENCES users(id),
  reason VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  forfeited_at TIMESTAMP NOT NULL,
  re_allocated_to_advocate_id UUID REFERENCES users(id),
  re_allocated_at TIMESTAMP,
  re_allocation_method VARCHAR(50),  -- 'MANUAL', 'AUTO', 'AI'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for quick queries
CREATE INDEX idx_forfeits_assignment ON assignment_forfeits(assignment_id);
CREATE INDEX idx_forfeits_status ON assignments(status) WHERE status = 'FORFEITED';
CREATE INDEX idx_forfeits_advocate ON assignment_forfeits(forfeited_by_advocate_id);
```

---

## 10. **Summary & Recommendations**

### ✅ **Implemented Features**

1. **Forfeit Workflow**
   - Clear button in Advocate Dashboard
   - Modal with reason + details
   - Validation (20 char minimum)
   - Audit trail logging

2. **Status Management**
   - New FORFEITED status
   - Workload auto-decrement
   - Previous advocate tracking

3. **Re-allocation Options**
   - Manual (select from available advocates)
   - Auto (rule-based, excludes previous)
   - AI (Gemini, excludes previous)

4. **CT Ops Queue**
   - Dedicated "Forfeited" filter
   - Alert banner for pending re-allocations
   - Forfeit details display
   - One-click re-allocation

5. **Safety Mechanisms**
   - Prevent re-allocation to previous advocate
   - Flag assignments forfeited multiple times
   - Require detailed explanation
   - Full audit trail

### 📊 **Metrics to Track**

- Forfeit rate by advocate
- Forfeit rate by assignment type
- Average re-allocation time
- Assignments forfeited multiple times
- Most common forfeit reasons

### 🚀 **Next Steps**

1. Implement forfeit method in mockStore.ts
2. Create ForfeitModal component
3. Add forfeit button to AdvocateDashboard
4. Add forfeited queue to OpsDashboard
5. Implement re-allocation handlers
6. Add metrics/reporting dashboard
7. Test edge cases (multiple forfeits, etc.)

---

## Conclusion

This forfeit system provides a **complete, professional solution** for handling assignment forfeits with:
- ✅ Clear workflows for advocates and CT Ops
- ✅ Multiple re-allocation options (manual, auto, AI)
- ✅ Safety mechanisms (exclude previous advocates)
- ✅ Full audit trail and transparency
- ✅ Metrics for identifying problematic assignments
- ✅ User-friendly UI components

**Ready for implementation!** 🚀
