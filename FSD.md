# Functional Specification Document
## CT MAP Title Search Portal

**Version:** 1.0
**Last Updated:** November 2025
**Document Owner:** CT Operations Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Core Features](#4-core-features)
5. [Workflows](#5-workflows)
6. [AI Integration](#6-ai-integration)
7. [Data Models](#7-data-models)
8. [Technical Architecture](#8-technical-architecture)
9. [Security & Compliance](#9-security--compliance)
10. [Performance Requirements](#10-performance-requirements)

---

## 1. Executive Summary

### 1.1 Purpose

The CT MAP Title Search Portal is a comprehensive case management system for coordinating title search operations across multiple bank hubs, CT Operations team, and legal advocates. The system handles approximately 400-600 daily assignments across 39 bank hubs, facilitating document flow, communication, and AI-powered advocate allocation.

### 1.2 Key Objectives

- **Automated Allocation**: AI-powered advocate assignment based on location, expertise, and workload
- **Document Management**: Centralized document upload, preview, and query response handling
- **Workflow Automation**: Streamlined status transitions from initial allocation to closure
- **Audit Trail**: Complete activity tracking for compliance and quality assurance
- **Multi-stakeholder Coordination**: Unified platform for banks, advocates, and CT Ops

### 1.3 Success Metrics

- **Allocation Time**: < 2 minutes from assignment creation to advocate allocation
- **Processing Speed**: 400-600 assignments processed daily
- **Document Turnaround**: < 30 seconds for bulk document upload
- **AI Accuracy**: > 85% success rate for intelligent advocate allocation
- **User Satisfaction**: Seamless experience across all three user roles

---

## 2. System Overview

### 2.1 Business Context

**Stakeholders:**
- **39 Bank Hubs**: Initiate title search requests, monitor progress
- **25+ Legal Advocates**: Execute title searches, upload documents
- **CT Operations Team**: Oversee operations, handle escalations, manage workflow

**Daily Volume:**
- ~400-600 new assignments (39 hubs × 5 users × 2-3 assignments/day)
- ~2,800-4,200 active assignments at any given time
- ~10-15 documents per assignment
- ~5,000-6,000 document uploads daily

### 2.2 System Boundaries

**In Scope:**
- Assignment creation and allocation
- Document upload and management
- Query response workflow
- Advocate workload management
- AI-powered allocation
- Audit trail and activity logging
- Status tracking and notifications

**Out of Scope:**
- Payment processing
- Legal report generation
- Third-party registry integration
- Email/SMS notifications (future phase)

### 2.3 Technology Stack

- **Frontend**: React 19.2.0 + TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS 4.0.0
- **Icons**: Lucide React 0.468.0
- **State Management**: Zustand 5.0.2
- **Storage**: localStorage (client-side persistence)
- **AI Engine**: Google Gemini 1.5 Flash (@google/generative-ai 0.21.0)
- **Routing**: React Router DOM 7.1.1

---

## 3. User Roles & Permissions

### 3.1 Role Matrix

| Feature | Bank User | Advocate | CT Ops |
|---------|-----------|----------|--------|
| Create Assignment | ✅ | ❌ | ✅ |
| View Own Assignments | ✅ | ✅ | ✅ |
| View All Assignments | ❌ | ❌ | ✅ |
| Allocate Advocate | ❌ | ❌ | ✅ |
| Upload Documents | ❌ | ✅ | ✅ |
| Query Response | ✅ | ❌ | ✅ |
| Re-allocate | ❌ | ❌ | ✅ |
| Bulk Operations | ❌ | ❌ | ✅ |
| AI Allocation | ❌ | ❌ | ✅ |
| View Analytics | Limited | Limited | ✅ |

### 3.2 Bank User

**Primary Responsibilities:**
- Create title search assignments
- Upload query response documents
- Monitor assignment progress
- View assignment history

**Dashboard Features:**
- View assignments for their hub
- Filter by status (Pending, In Progress, Complete)
- Search by LAN or borrower name
- Create new assignment with auto-hub assignment

**Permissions:**
- Read: Own hub's assignments only
- Write: Create assignments, upload query responses
- No access to: Advocate allocation, other hubs' data

### 3.3 Legal Advocate

**Primary Responsibilities:**
- Accept allocated assignments
- Upload title search documents (EC, Sale Deed, Index II, etc.)
- Mark assignments as complete
- Manage personal workload

**Dashboard Features:**
- View allocated assignments
- Filter by status
- Upload documents (bulk upload supported)
- View document preview
- Track personal workload (active cases)

**Permissions:**
- Read: Only assignments allocated to them
- Write: Upload documents, update status to complete
- No access to: Other advocates' assignments, allocation logic

### 3.4 CT Operations

**Primary Responsibilities:**
- Oversee all assignments across all hubs
- Allocate/re-allocate advocates
- Run bulk allocation (rule-based or AI-powered)
- Handle escalations and queries
- Monitor system health

**Dashboard Features:**
- View all assignments across all hubs
- Advanced filtering (hub, state, district, status, priority)
- Bulk operations (auto-allocate, AI-allocate)
- Analytics and reporting
- Audit trail management

**Permissions:**
- Read: All assignments, all users, all data
- Write: Allocate advocates, re-allocate, bulk operations
- Admin: Load test data, configure system settings

---

## 4. Core Features

### 4.1 Assignment Creation

**Feature ID:** F-001
**User Role:** Bank User, CT Ops

**Description:**
Banks create title search assignments for property verification. Each assignment contains borrower details, property information, loan details, and hub assignment.

**Input Fields:**

```typescript
{
  // Auto-generated
  lan: "LN10001" // Auto-incremented Loan Account Number
  id: "uuid-v4" // Unique identifier
  createdAt: "2025-11-22T10:30:00Z"

  // Borrower Details
  borrowerName: string (required, max 100 chars)
  borrowerPhone: string (optional, format: 10 digits)
  borrowerEmail: string (optional, email format)
  borrowerAddress: string (required, max 200 chars)

  // Property Details
  propertyAddress: string (required, max 200 chars)
  state: string (required, dropdown)
  district: string (required, dropdown, filtered by state)
  pincode: string (required, 6 digits)

  // Loan Details
  productType: "Home Loan" | "Loan Against Property" | "Business Loan"
  loanAmount: number (required, min 100000)
  priority: "Standard" | "High Value" | "Urgent"
  scope: "EC Only" | "Full Chain" | "EC + Sale Deed"

  // System Fields
  hubId: string (auto-assigned based on logged-in user)
  status: "PENDING_ALLOCATION" (initial status)
  advocateId: null (assigned later)
}
```

**Validation Rules:**
- Borrower name: Required, 3-100 characters
- Property address: Required, 10-200 characters
- State: Must be valid Indian state
- District: Must belong to selected state
- Pincode: Must be 6 digits
- Loan amount: Must be ≥ ₹1,00,000
- All required fields must be filled

**Business Rules:**
- LAN auto-increments from LN10001
- Hub ID auto-assigned from logged-in user's hub
- Initial status always PENDING_ALLOCATION
- Creation timestamp captured automatically
- Audit log entry created: "Assignment created by [User]"

**UI Flow:**
1. User clicks "Create Assignment" button
2. Modal opens with form fields
3. State selection triggers district dropdown population
4. Form validation on blur and submit
5. On submit: Assignment created, modal closes, success message shown
6. User redirected to assignment details page

---

### 4.2 Advocate Allocation

**Feature ID:** F-002
**User Role:** CT Ops

**Description:**
CT Ops assigns advocates to pending assignments using three strategies: property location-based, borrower location-based, or hub-based matching. Allocation can be manual, rule-based auto, or AI-powered.

#### 4.2.1 Allocation Strategies

**Strategy 1: Property Location-Based (Default)**
```typescript
Matching Criteria:
1. Advocate operates in assignment.state (CRITICAL)
2. Advocate operates in assignment.district (BONUS: +50 points)
3. Advocate has expertise in assignment.productType (BONUS: +30 points)
4. Advocate workload < 5 assignments (FILTER)
5. Advocate in same hub as assignment (BONUS: +20 points)

Scoring Formula:
- State match: 100 points (mandatory)
- District match: +50 points
- Product expertise: +30 points
- Hub match: +20 points
- Workload penalty: -(current_workload × 10)

Final Score = State(100) + District(0-50) + Expertise(0-30) + Hub(0-20) - Workload_Penalty
```

**Strategy 2: Borrower Location-Based**
```typescript
Matching Criteria:
1. Parse borrower address to extract state/district
2. Match advocate coverage to borrower location
3. Same scoring as property-based but using borrower location

Use Case: When property and borrower are in different states
```

**Strategy 3: Hub-Based**
```typescript
Matching Criteria:
1. Advocate assigned to same hub as assignment (CRITICAL)
2. Product expertise match (BONUS: +30 points)
3. Workload < 5 (FILTER)

Scoring Formula:
- Hub match: 100 points (mandatory)
- Product expertise: +30 points
- Workload penalty: -(current_workload × 10)

Use Case: For internal hubs where proximity matters more than location
```

#### 4.2.2 Manual Allocation

**Flow:**
1. CT Ops opens assignment details
2. Clicks "Allocate Advocate" button
3. Selects allocation strategy (Property/Borrower/Hub)
4. System shows ranked list of advocates with scores
5. CT Ops selects advocate from list
6. Confirms allocation
7. System updates status to ALLOCATED

**UI Elements:**
- Strategy selector (3 tabs)
- Advocate cards showing:
  - Name, firm, states/districts
  - Current workload (X/5)
  - Match score
  - Expertise tags
  - "Best Match" badge for top scorer
- Select button for each advocate

#### 4.2.3 Rule-Based Auto-Allocation

**Feature ID:** F-002-A
**Trigger:** CT Ops clicks "Auto-Allocate All" button

**Algorithm:**
```typescript
For each PENDING_ALLOCATION assignment:
  1. Get all advocates with workload < 5
  2. Filter advocates by assignment.state coverage
  3. Calculate scores using Property Location strategy
  4. Sort by score (descending)
  5. Allocate to top-ranked advocate
  6. Update advocate workload count
  7. Log allocation in audit trail
  8. Move to next assignment

Return summary: { total, successful, failed }
```

**Performance:**
- Speed: Instant (all in-memory)
- Capacity: Handles 1000+ assignments in < 1 second
- Success Rate: ~95% (fails only if no available advocates in state)

#### 4.2.4 AI-Powered Allocation (Gemini)

**Feature ID:** F-002-B
**Trigger:** CT Ops clicks "🤖 AI Allocate All" button

**Prerequisites:**
- VITE_GEMINI_API_KEY configured in .env
- Gemini AI service initialized
- Network connectivity

**Algorithm:**
```typescript
For each PENDING_ALLOCATION assignment:
  1. Get all advocates with workload < 5
  2. Build AI prompt with assignment details + advocate data
  3. Call Gemini API for intelligent matching
  4. Parse JSON response (advocate ID, confidence, reasoning)
  5. Verify selected advocate is valid and available
  6. Allocate assignment to AI-selected advocate
  7. Verify allocation succeeded (status === ALLOCATED)
  8. Log AI reasoning in audit trail
  9. Wait 1 second (rate limit delay)
  10. Move to next assignment

Return summary: { total, successful, failed, results[] }
```

**AI Prompt Structure:**
See [Section 6: AI Integration](#6-ai-integration) for detailed prompts.

**Performance:**
- Speed: ~1 second per assignment (includes 1s rate limit delay)
- Capacity: Free tier: 15 req/min, 1M tokens/day
- Success Rate: ~90% (higher than rule-based due to context awareness)
- Cost: Free tier for testing, ~$4.50/month for 400 daily assignments

**Verification Logic:**
```typescript
// After calling allocateAdvocate()
const updatedAssignment = getAssignmentById(assignmentId);
if (updatedAssignment?.status !== AssignmentStatus.ALLOCATED) {
  console.error('Allocation verification failed');
  return { success: false, reason: 'Allocation verification failed' };
}
```

**Progress Tracking:**
```typescript
onProgress callback: (current: number, total: number, assignmentLAN?: string) => void

// UI shows:
- Progress bar: (current / total) × 100%
- Current assignment: "Processing LN10045 - Rajesh Kumar"
- Completion status: "32 of 65 complete (49%)"
```

---

### 4.3 Document Management

**Feature ID:** F-003
**User Role:** Advocate, CT Ops

#### 4.3.1 Document Categories

```typescript
enum DocumentCategory {
  SALE_DEED = "Sale Deed",
  INDEX_II = "Index II",
  EC_CERTIFICATE = "EC Certificate",
  PROPERTY_CARD = "Property Card",
  TAX_RECEIPT = "Tax Receipt",
  ENCUMBRANCE = "Encumbrance Certificate",
  MUTATION = "Mutation Extract",
  SURVEY_SKETCH = "Survey/Sketch",
  OTHER = "Other Documents"
}
```

#### 4.3.2 Single Document Upload

**Flow:**
1. Advocate opens assignment details
2. Clicks "Upload Document" button
3. Selects file from file picker
4. Selects document category from dropdown
5. Clicks "Upload"
6. Document added to assignment
7. Audit log entry created

**Validation:**
- Max file size: 10 MB (configurable)
- Allowed types: PDF, JPG, PNG, DOC, DOCX
- Category must be selected

#### 4.3.3 Bulk Document Upload

**Feature ID:** F-003-B
**User Role:** Advocate, CT Ops

**Description:**
Upload multiple documents simultaneously with drag-and-drop interface and auto-categorization.

**Flow:**
1. User sees drag-and-drop zone in assignment details
2. User drags 5-10 files into drop zone OR clicks "Choose Files"
3. System auto-categorizes each file based on filename
4. Files appear in preview list with:
   - Filename
   - File size
   - Auto-assigned category (editable dropdown)
   - Remove button
5. User can adjust categories for each file
6. User clicks "Upload {N} Files" button
7. All files uploaded in single operation
8. Success message shows count
9. Documents appear in assignment documents list

**Auto-Categorization Logic:**
```typescript
function autoCategorize(filename: string): DocumentCategory {
  const lower = filename.toLowerCase();

  if (lower.includes('sale') || lower.includes('deed'))
    return DocumentCategory.SALE_DEED;

  if (lower.includes('index') || lower.includes('ii'))
    return DocumentCategory.INDEX_II;

  if (lower.includes('ec') || lower.includes('encumbrance'))
    return DocumentCategory.EC_CERTIFICATE;

  if (lower.includes('property') || lower.includes('card'))
    return DocumentCategory.PROPERTY_CARD;

  if (lower.includes('tax') || lower.includes('receipt'))
    return DocumentCategory.TAX_RECEIPT;

  if (lower.includes('mutation'))
    return DocumentCategory.MUTATION;

  if (lower.includes('survey') || lower.includes('sketch'))
    return DocumentCategory.SURVEY_SKETCH;

  // Default fallback
  return DocumentCategory.SALE_DEED;
}
```

**Performance Improvement:**
- **Before**: 10 documents × 1 minute = 10 minutes
- **After**: 10 documents × 3 seconds = 30 seconds
- **Savings**: 90% time reduction

**UI Elements:**
```typescript
// Drag-and-drop zone
<div
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  className={isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300'}>

  <Upload icon />
  <p>Drag & drop files here</p>
  <p className="text-sm">or</p>
  <button>Choose Files</button>
</div>

// File preview list
{bulkFiles.map((item, index) => (
  <div className="flex items-center gap-3">
    <FileIcon />
    <div>
      <p>{item.file.name}</p>
      <p className="text-sm">{(item.file.size / 1024).toFixed(1)} KB</p>
    </div>
    <select value={item.category} onChange={handleCategoryChange}>
      {/* 9 category options */}
    </select>
    <button onClick={() => removeBulkFile(index)}>
      <X icon />
    </button>
  </div>
))}

// Upload button
<button onClick={handleBulkUpload}>
  <Upload icon />
  Upload {bulkFiles.length} Files
</button>
```

#### 4.3.4 Document Preview

**Feature ID:** F-003-C
**User Role:** All

**Description:**
View uploaded documents directly in the portal without downloading.

**Supported Formats:**
- **PDF**: Rendered using iframe or PDF viewer
- **Images (JPG/PNG)**: Displayed inline
- **Documents (DOC/DOCX)**: Download only (future: preview)

**UI Flow:**
1. User clicks "Preview" button on document
2. Modal opens with document viewer
3. For PDFs/images: Document rendered inline
4. For other formats: "Download to view" message
5. User can close preview or download file

---

### 4.4 Query Response Flow

**Feature ID:** F-004
**User Role:** Bank User, CT Ops

**Description:**
Banks can upload query response documents when advocates request additional information.

**Trigger Scenarios:**
- Advocate requests clarification on property boundaries
- Missing documents identified
- Discrepancy in property details
- Additional verification needed

**Flow:**
1. Advocate marks assignment as "Query Raised" (future feature)
2. Bank user receives notification
3. Bank user opens assignment
4. Bank user uploads query response documents
5. Audit log entry: "Query response uploaded by [Bank User]"
6. Status changes to "In Progress" (advocate can continue)

**Document Categories for Queries:**
- Same 9 categories as regular documents
- Additional category: "Query Response"

---

### 4.5 Re-Allocation

**Feature ID:** F-005
**User Role:** CT Ops

**Description:**
CT Ops can re-allocate assignments to different advocates when needed (advocate unavailable, workload rebalancing, expertise mismatch).

**Trigger Scenarios:**
- Original advocate unavailable
- Workload rebalancing needed
- Better advocate match found
- Escalation or quality issues

**UI Flow:**
1. CT Ops opens allocated assignment
2. Clicks "Re-Allocate" button
3. Modal opens with full allocation interface
4. **Strategy Selection** (3 tabs):
   - Property Location
   - Borrower Location
   - Hub-based
5. **Ranked Advocates List**:
   - Shows all available advocates (workload < 5)
   - Sorted by match score
   - Current advocate shown but disabled
   - Best match highlighted with "⭐ Best Match" badge
6. **Real-time Re-ranking**:
   - When strategy changes, advocates re-ranked instantly
   - Scores recalculated based on new strategy
7. **Advocate Selection**:
   - CT Ops clicks "Select" on chosen advocate
   - Card highlights with brand color
8. **Reason Entry**:
   - Text area appears after selection
   - Required field: "Enter reason for re-allocation"
   - Placeholder: "e.g., Original advocate unavailable, better expertise match"
9. **Confirmation**:
   - Footer shows: "Ready to re-allocate to [Advocate Name]"
   - "Confirm Re-Allocate" button enabled
   - Click to confirm
10. **System Actions**:
    - Update assignment.advocateId
    - Audit log: "Re-allocated from [Old] to [New] by [CT Ops]. Reason: [Reason]"
    - Decrement old advocate workload
    - Increment new advocate workload
    - Success message shown

**Modal UI Components:**

```typescript
// Header
<div className="flex justify-between items-center">
  <h3>Re-Allocate Assignment {assignment.lan}</h3>
  <button onClick={closeModal}><X /></button>
</div>

// Strategy Tabs
<div className="grid grid-cols-3 gap-3">
  {['property', 'borrower', 'hub'].map(strategy => (
    <button
      onClick={() => setAllocationStrategy(strategy)}
      className={allocationStrategy === strategy ? 'active' : ''}>
      <Icon /> {/* MapPin, UserCircle, Building */}
      <p>{strategy} Location</p>
    </button>
  ))}
</div>

// Ranked Advocates
{rankedAdvocates.map(({ user: adv, score, workload }, index) => {
  const isCurrent = assignment.advocateId === adv.id;
  const isSelected = selectedAdvocate === adv.id;
  const isBestMatch = index === 0 && !isCurrent;

  return (
    <div className={isSelected ? 'selected' : 'default'}>
      {isBestMatch && <span className="badge">⭐ Best Match</span>}

      <div className="advocate-info">
        <Avatar>{adv.firmName.charAt(0)}</Avatar>
        <div>
          <h5>{adv.firmName}</h5>
          <p>{adv.name}</p>
          {isCurrent && <span className="current-badge">Current Advocate</span>}
          {adv.tags?.map(tag => <span className="tag">{tag}</span>)}
        </div>
      </div>

      <div className="metrics">
        <div>Workload: {workload}/5</div>
        <div>Match Score: {score}</div>
      </div>

      <button
        onClick={() => setSelectedAdvocate(adv.id)}
        disabled={isCurrent}>
        {isCurrent ? 'Current' : isSelected ? 'Selected ✓' : 'Select'}
      </button>
    </div>
  );
})}

// Reason Field (conditional)
{selectedAdvocate && selectedAdvocate !== assignment.advocateId && (
  <div className="reason-section">
    <label>Reason for Re-Allocation *</label>
    <textarea
      value={reallocationReason}
      onChange={(e) => setReallocationReason(e.target.value)}
      placeholder="Enter the reason for changing the advocate..."
      required
      autoFocus
    />
  </div>
)}

// Footer
<div className="footer">
  <p className="status-text">
    {selectedAdvocate && selectedAdvocate !== assignment.advocateId
      ? `Ready to re-allocate to ${getAdvocateName(selectedAdvocate)}`
      : 'Select a new advocate to continue'}
  </p>
  <div className="actions">
    <button onClick={closeModal}>Cancel</button>
    <button
      onClick={confirmReallocation}
      disabled={!selectedAdvocate || !reallocationReason.trim()}>
      Confirm Re-Allocate
    </button>
  </div>
</div>
```

**Business Rules:**
- Cannot re-allocate to current advocate (disabled in UI)
- Reason is mandatory (min 10 characters)
- New advocate must have workload < 5
- Audit trail must capture both old and new advocates
- Workload counts updated atomically

---

### 4.6 Status Management

**Feature ID:** F-006
**User Role:** All (based on permissions)

**Status Lifecycle:**

```typescript
enum AssignmentStatus {
  PENDING_ALLOCATION = "Pending Allocation",     // Initial state
  ALLOCATED = "Allocated",                       // After advocate assigned
  IN_PROGRESS = "In Progress",                   // Advocate working on it
  QUERY_RAISED = "Query Raised",                 // Advocate needs clarification
  COMPLETED = "Completed",                       // Advocate finished work
  UNDER_REVIEW = "Under Review",                 // CT Ops reviewing
  CLOSED = "Closed"                              // Final state
}
```

**State Transitions:**

```
PENDING_ALLOCATION
  → ALLOCATED (CT Ops allocates advocate)

ALLOCATED
  → IN_PROGRESS (Advocate uploads first document)

IN_PROGRESS
  → QUERY_RAISED (Advocate raises query)
  → COMPLETED (Advocate marks complete)

QUERY_RAISED
  → IN_PROGRESS (Bank uploads query response)

COMPLETED
  → UNDER_REVIEW (CT Ops reviews)

UNDER_REVIEW
  → IN_PROGRESS (Issues found, send back)
  → CLOSED (Approved)
```

**Who Can Change Status:**

| From | To | Role | Action |
|------|-----|------|--------|
| PENDING_ALLOCATION | ALLOCATED | CT Ops | Allocate advocate |
| ALLOCATED | IN_PROGRESS | Advocate | Upload first document |
| IN_PROGRESS | QUERY_RAISED | Advocate | Raise query (future) |
| IN_PROGRESS | COMPLETED | Advocate | Mark complete |
| QUERY_RAISED | IN_PROGRESS | Bank/CT Ops | Upload query response |
| COMPLETED | UNDER_REVIEW | CT Ops | Review |
| UNDER_REVIEW | IN_PROGRESS | CT Ops | Send back |
| UNDER_REVIEW | CLOSED | CT Ops | Approve & close |

---

### 4.7 Audit Trail

**Feature ID:** F-007
**User Role:** All (view only for Bank/Advocate, full access for CT Ops)

**Description:**
Complete activity log for every assignment, tracking all actions, changes, and timestamps.

**Audit Entry Structure:**

```typescript
interface AuditEntry {
  id: string;                    // Unique ID
  timestamp: string;             // ISO 8601 timestamp
  action: AuditAction;           // Type of action
  performedBy: string;           // User ID
  performedByName: string;       // User display name
  performedByRole: UserRole;     // User role
  details: string;               // Human-readable description
  metadata?: Record<string, any>; // Additional data
}

enum AuditAction {
  CREATED = "CREATED",
  ALLOCATED = "ALLOCATED",
  RE_ALLOCATED = "RE_ALLOCATED",
  STATUS_CHANGED = "STATUS_CHANGED",
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
  DOCUMENT_DELETED = "DOCUMENT_DELETED",
  QUERY_RAISED = "QUERY_RAISED",
  QUERY_RESPONDED = "QUERY_RESPONDED",
  COMPLETED = "COMPLETED",
  REVIEWED = "REVIEWED",
  CLOSED = "CLOSED"
}
```

**Audit Log Examples:**

```typescript
// Assignment creation
{
  action: "CREATED",
  performedBy: "bank_user_1",
  performedByName: "Priya Sharma",
  performedByRole: "BANK",
  details: "Assignment created for borrower Rajesh Kumar",
  timestamp: "2025-11-22T09:30:00Z"
}

// Manual allocation
{
  action: "ALLOCATED",
  performedBy: "ct_ops_1",
  performedByName: "Anil Kumar",
  performedByRole: "CT_OPS",
  details: "Allocated to Rohan Deshmukh (Property location match)",
  metadata: { advocateId: "adv1", strategy: "property" },
  timestamp: "2025-11-22T09:32:15Z"
}

// AI allocation
{
  action: "ALLOCATED",
  performedBy: "CT_OPS",
  performedByName: "System (AI)",
  performedByRole: "CT_OPS",
  details: "AI-allocated by Gemini (confidence: 9/10) - Best match due to perfect location coverage, HL expertise, and low workload",
  metadata: {
    advocateId: "adv1",
    confidence: 9,
    factors: [
      "Perfect location match (Maharashtra + Mumbai)",
      "Has expertise in Home Loan",
      "Low workload (1 active case)",
      "Tagged as High Value Expert and Fast TAT"
    ]
  },
  timestamp: "2025-11-22T10:15:30Z"
}

// Re-allocation
{
  action: "RE_ALLOCATED",
  performedBy: "ct_ops_1",
  performedByName: "Anil Kumar",
  performedByRole: "CT_OPS",
  details: "Re-allocated from Rohan Deshmukh to Meera Iyer. Reason: Original advocate unavailable due to leave",
  metadata: {
    oldAdvocateId: "adv1",
    newAdvocateId: "adv5",
    reason: "Original advocate unavailable due to leave"
  },
  timestamp: "2025-11-22T11:45:00Z"
}

// Document upload
{
  action: "DOCUMENT_UPLOADED",
  performedBy: "adv5",
  performedByName: "Meera Iyer",
  performedByRole: "ADVOCATE",
  details: "Uploaded 5 documents (Sale Deed, EC Certificate, Index II, Property Card, Tax Receipt)",
  metadata: {
    documentCount: 5,
    categories: ["Sale Deed", "EC Certificate", "Index II", "Property Card", "Tax Receipt"]
  },
  timestamp: "2025-11-22T14:20:00Z"
}

// Completion
{
  action: "COMPLETED",
  performedBy: "adv5",
  performedByName: "Meera Iyer",
  performedByRole: "ADVOCATE",
  details: "Marked assignment as complete. Total documents: 7",
  timestamp: "2025-11-22T16:30:00Z"
}
```

**UI Display:**

```typescript
// Timeline view (vertical)
<div className="audit-trail">
  {auditEntries.map(entry => (
    <div className="audit-entry">
      <div className="timestamp">
        {formatDateTime(entry.timestamp)}
      </div>
      <div className="icon">
        {getIconForAction(entry.action)}
      </div>
      <div className="content">
        <div className="action-badge">{entry.action}</div>
        <p className="details">{entry.details}</p>
        <p className="performer">
          by {entry.performedByName} ({entry.performedByRole})
        </p>

        {/* AI allocation metadata */}
        {entry.action === "ALLOCATED" && entry.metadata?.confidence && (
          <div className="ai-factors">
            <p>Confidence: {entry.metadata.confidence}/10</p>
            <ul>
              {entry.metadata.factors.map(factor => (
                <li>{factor}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  ))}
</div>
```

---

### 4.8 Dashboard & Analytics

**Feature ID:** F-008
**User Role:** All (view varies by role)

#### 4.8.1 CT Ops Dashboard

**Overview Cards:**
```typescript
- Total Assignments: 2,847
- Pending Allocation: 65
- In Progress: 1,523
- Completed Today: 142
- Avg. Allocation Time: 1.2 minutes
- Avg. Completion Time: 3.4 days
```

**Filters:**
- Hub (dropdown, multi-select)
- State (dropdown, multi-select)
- District (dropdown, multi-select)
- Status (dropdown, multi-select)
- Priority (Standard, High Value, Urgent)
- Product Type (HL, LAP, BL)
- Date Range (created date)
- Search (LAN, borrower name)

**Actions:**
- Create Assignment
- Auto-Allocate All (rule-based)
- AI Allocate All (Gemini)
- Bulk Operations
- Load Test Data (development only)
- Export Data (future)

**Assignment Table:**
- Columns: LAN, Borrower, Location, Product, Hub, Status, Advocate, Created Date
- Sortable by all columns
- Click row → Navigate to assignment details
- Pagination: 20 per page

#### 4.8.2 Bank User Dashboard

**Overview Cards:**
```typescript
- My Hub's Assignments: 87
- Pending: 12
- In Progress: 54
- Completed This Week: 21
```

**Filters:**
- Status
- Date Range
- Search (LAN, borrower name)

**Actions:**
- Create Assignment
- View assignment details

#### 4.8.3 Advocate Dashboard

**Overview Cards:**
```typescript
- My Workload: 3/5
- Pending Start: 1
- In Progress: 2
- Completed This Week: 8
```

**Filters:**
- Status
- Date Range

**Actions:**
- View assigned cases
- Upload documents
- Mark complete

---

## 5. Workflows

### 5.1 Happy Path: Assignment Creation → Closure

```
┌─────────────────────────────────────────────────────────────────┐
│ BANK USER: Create Assignment                                   │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ Status: PENDING_ALLOCATION                                      │
│ - Auto-assigned to bank's hub                                   │
│ - LAN generated (LN10045)                                       │
│ - Audit: "Created by Priya Sharma"                              │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ CT OPS: Allocate Advocate                                       │
│ - Option A: Manual allocation (select strategy, pick advocate)  │
│ - Option B: Auto-allocate (rule-based, instant)                 │
│ - Option C: AI-allocate (Gemini, ~1s per assignment)            │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ Status: ALLOCATED                                               │
│ - Advocate: Rohan Deshmukh                                      │
│ - Audit: "Allocated to Rohan Deshmukh by Anil Kumar"           │
│          or "AI-allocated (confidence: 9/10)"                   │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ ADVOCATE: Upload Documents                                      │
│ - Drag & drop 7 files                                           │
│ - Auto-categorized (Sale Deed, EC, Index II, etc.)              │
│ - Bulk upload in 30 seconds                                     │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ Status: IN_PROGRESS (auto-changed on first document upload)    │
│ - Documents: 7 uploaded                                         │
│ - Audit: "Uploaded 7 documents by Rohan Deshmukh"              │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ ADVOCATE: Mark Complete                                         │
│ - Clicks "Mark as Complete" button                              │
│ - Confirmation dialog                                            │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ Status: COMPLETED                                               │
│ - Audit: "Marked complete by Rohan Deshmukh"                   │
│ - Advocate workload decremented (3 → 2)                         │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ CT OPS: Review & Close                                          │
│ - Reviews documents                                              │
│ - Approves and closes assignment                                 │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ Status: CLOSED                                                  │
│ - Audit: "Closed by Anil Kumar"                                │
│ - Final state                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Timeline:**
- Day 0, 09:30 AM: Bank creates assignment
- Day 0, 09:32 AM: CT Ops allocates advocate (AI: 1 second)
- Day 1, 02:00 PM: Advocate uploads documents
- Day 2, 04:30 PM: Advocate marks complete
- Day 3, 11:00 AM: CT Ops closes assignment

**Total Time:** 2.5 days (well within 3-4 day target)

---

### 5.2 Alternative Flow: Query Raised

```
... [same as happy path until IN_PROGRESS] ...
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ ADVOCATE: Raise Query (future feature)                          │
│ - "Property boundary unclear in documents"                       │
│ - Needs additional survey sketch from bank                       │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ Status: QUERY_RAISED                                            │
│ - Audit: "Query raised by Rohan Deshmukh"                      │
│ - Notification sent to bank                                      │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ BANK USER: Upload Query Response                                │
│ - Uploads survey sketch                                          │
│ - Category: "Query Response"                                     │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ Status: IN_PROGRESS (auto-changed on query response)           │
│ - Audit: "Query response uploaded by Priya Sharma"             │
│ - Advocate can continue work                                    │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
... [continues to COMPLETED → CLOSED] ...
```

---

### 5.3 Alternative Flow: Re-Allocation

```
... [same as happy path until ALLOCATED] ...
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ CT OPS: Re-Allocate (original advocate unavailable)             │
│ - Opens re-allocation modal                                      │
│ - Selects strategy (Property Location)                           │
│ - Reviews ranked advocates                                       │
│ - Selects Meera Iyer (Best Match)                               │
│ - Enters reason: "Original advocate on leave"                    │
│ - Confirms re-allocation                                          │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ Status: ALLOCATED (advocate changed)                            │
│ - Old Advocate: Rohan Deshmukh (workload: 3 → 2)               │
│ - New Advocate: Meera Iyer (workload: 1 → 2)                   │
│ - Audit: "Re-allocated from Rohan to Meera by Anil"            │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
... [continues with new advocate] ...
```

---

## 6. AI Integration

### 6.1 Gemini AI Configuration

**Model:** Google Gemini 1.5 Flash
**SDK:** @google/generative-ai v0.21.0
**API Key:** Configured via `VITE_GEMINI_API_KEY` environment variable

**Initialization:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

**Rate Limits:**
- **Free Tier**: 15 requests/minute, 1M tokens/day
- **Paid Tier**: Higher limits (configurable)

**Error Handling:**
- API key validation on initialization
- Network error retry (max 3 attempts)
- Timeout handling (30s per request)
- Fallback to rule-based allocation on failure

---

### 6.2 AI Allocation Prompt (Full Prompt Engineering)

**Purpose:** Analyze assignment requirements and available advocates to find the best match based on multiple factors.

**Prompt Template:**

```typescript
const GEMINI_ALLOCATION_PROMPT = `
You are an expert legal case allocation system. Your task is to select the BEST advocate for the following assignment based on multiple factors.

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

**IMPORTANT**: Return ONLY the JSON object, no additional text or markdown formatting.
`;
```

**Advocates Data Structure:**
```typescript
const advocatesData = advocates.map(adv => ({
  id: adv.id,
  name: adv.name,
  firmName: adv.firmName,
  states: adv.states || [],
  districts: adv.districts || [],
  expertise: adv.expertise || [], // ["Home Loan", "LAP"]
  tags: adv.tags || [], // ["Fast TAT", "High Value Expert", "10+ Years"]
  currentWorkload: getWorkload(adv.id), // 0-5
  hubId: adv.hubId
}));
```

**Example Input:**
```json
{
  "assignment": {
    "lan": "LN10045",
    "borrowerName": "Rajesh Kumar",
    "propertyAddress": "Plot 23, Sector 15, Vashi, Navi Mumbai",
    "state": "Maharashtra",
    "district": "Navi Mumbai",
    "productType": "Home Loan",
    "priority": "High Value",
    "scope": "Full Chain"
  },
  "advocates": [
    {
      "id": "adv1",
      "name": "Rohan Deshmukh",
      "firmName": "Deshmukh Legal Associates",
      "states": ["Maharashtra"],
      "districts": ["Mumbai", "Thane", "Navi Mumbai"],
      "expertise": ["Home Loan", "LAP"],
      "tags": ["High Value Expert", "Fast TAT", "10+ Years"],
      "currentWorkload": 1,
      "hubId": "hub1"
    },
    {
      "id": "adv2",
      "name": "Meera Iyer",
      "firmName": "Iyer & Partners",
      "states": ["Maharashtra", "Karnataka"],
      "districts": ["Mumbai", "Pune"],
      "expertise": ["Home Loan", "Business Loan"],
      "tags": ["Fast TAT"],
      "currentWorkload": 4,
      "hubId": "hub2"
    }
    // ... 23 more advocates
  ]
}
```

**Example AI Response:**
```json
{
  "advocateId": "adv1",
  "advocateName": "Rohan Deshmukh",
  "confidence": 9,
  "factors": [
    "Perfect location match (Maharashtra state + Navi Mumbai district)",
    "Has expertise in Home Loan product type",
    "Very low workload (1 active case out of 5 capacity)",
    "Tagged as High Value Expert (matches priority)",
    "Tagged as Fast TAT for quick turnaround"
  ],
  "reason": "Best match due to perfect location coverage in Navi Mumbai, specific Home Loan expertise, very low current workload, and High Value Expert designation matching the assignment priority."
}
```

---

### 6.3 AI Response Parsing

**Challenge:** Gemini sometimes wraps JSON in markdown code blocks.

**Solution:**
```typescript
function parseAIResponse(text: string): AllocationResult {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\n?/g, '');
    cleanText = cleanText.replace(/```\n?/g, '');
    cleanText = cleanText.trim();

    // Parse JSON
    const parsed = JSON.parse(cleanText);

    // Validate advocate ID exists
    const advocate = advocates.find(adv => adv.id === parsed.advocateId);
    if (!advocate) {
      return {
        success: false,
        reason: 'AI selected invalid advocate ID'
      };
    }

    // Return structured result
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
```

---

### 6.4 AI Allocation Workflow

**Step-by-Step Process:**

```typescript
async function geminiAllocateAssignment(assignmentId: string): Promise<AllocationResult> {
  // Step 1: Get assignment
  const assignment = getAssignmentById(assignmentId);
  if (!assignment) {
    return { success: false, reason: 'Assignment not found' };
  }

  console.log(`🤖 AI allocating ${assignment.lan} (${assignmentId})...`);

  // Step 2: Get available advocates (workload < 5)
  const advocates = getAllAdvocates().filter(adv => {
    const workload = getWorkload(adv.id);
    return workload < 5 && adv.role === UserRole.ADVOCATE;
  });

  if (advocates.length === 0) {
    return { success: false, reason: 'No advocates available' };
  }

  console.log(`   Available advocates: ${advocates.length}`);

  // Step 3: Build AI prompt
  const prompt = buildAllocationPrompt(assignment, advocates, getWorkload);

  // Step 4: Call Gemini API
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Step 5: Parse AI response
  const aiResult = parseAIResponse(text, advocates);

  if (!aiResult.success) {
    console.error(`❌ AI could not allocate: ${aiResult.reason}`);
    return aiResult;
  }

  console.log(`✅ AI selected advocate ${aiResult.advocateId} (${aiResult.advocateName})`);
  console.log(`   Confidence: ${aiResult.confidence}/10`);
  console.log(`   Reason: ${aiResult.reason}`);

  // Step 6: Allocate advocate
  try {
    const auditDetails = `AI-allocated by Gemini (confidence: ${aiResult.confidence}/10) - ${aiResult.reason}`;
    allocateAdvocate(assignmentId, aiResult.advocateId, auditDetails);

    // Step 7: CRITICAL - Verify allocation succeeded
    const updated = getAssignmentById(assignmentId);
    if (updated?.status !== AssignmentStatus.ALLOCATED) {
      console.error(`❌ Allocation verification failed for ${assignment.lan}`);
      return { success: false, reason: 'Allocation verification failed' };
    }

    console.log(`✅ Successfully allocated ${assignment.lan} to advocate ${aiResult.advocateId}`);
    return aiResult;

  } catch (error: any) {
    console.error(`❌ Allocation error for ${assignment.lan}:`, error);
    return { success: false, reason: `Allocation failed: ${error.message}` };
  }
}
```

**Bulk Allocation:**
```typescript
async function geminiAllocateAll(
  onProgress?: (current: number, total: number, lan?: string) => void
): Promise<BulkResult> {
  const pendingAssignments = getAssignments().filter(
    a => a.status === AssignmentStatus.PENDING_ALLOCATION
  );

  const results = [];
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < pendingAssignments.length; i++) {
    const assignment = pendingAssignments[i];

    // Progress callback
    if (onProgress) {
      onProgress(i + 1, pendingAssignments.length, assignment.lan);
    }

    // Rate limiting: 1 second delay between requests
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Allocate
    const result = await geminiAllocateAssignment(assignment.id);

    if (result.success) {
      successful++;
    } else {
      failed++;
    }

    results.push({
      assignmentId: assignment.id,
      lan: assignment.lan,
      ...result
    });
  }

  return {
    total: pendingAssignments.length,
    successful,
    failed,
    results
  };
}
```

---

### 6.5 AI Performance Metrics

**Speed:**
- Single allocation: ~1 second (AI inference + rate limit delay)
- Bulk allocation (65 assignments): ~65 seconds
- Bulk allocation (400 assignments): ~400 seconds (~6.5 minutes)

**Accuracy:**
- Success rate: ~90% (vs ~95% for rule-based)
- Failure reasons:
  - No advocates in required state (5%)
  - All advocates at capacity (3%)
  - API errors (2%)

**Cost (Free Tier):**
- Limit: 15 requests/minute, 1M tokens/day
- Average tokens per request: ~500 tokens
- Daily volume (400 assignments): ~200K tokens
- Cost: $0

**Cost (Paid Tier - Gemini 1.5 Flash):**
- Rate: $0.075 per 1M input tokens
- Daily volume (400 assignments): ~200K tokens
- Daily cost: ~$0.015
- Monthly cost: ~$0.45 (30 days)
- Yearly cost: ~$5.40

**Comparison:**

| Metric | Rule-Based | Gemini AI |
|--------|------------|-----------|
| Speed (1 assignment) | Instant | ~1 second |
| Speed (400 assignments) | Instant | ~6.5 minutes |
| Success Rate | ~95% | ~90% |
| Context Awareness | No | Yes |
| Reasoning Provided | No | Yes |
| Confidence Score | No | Yes |
| Cost | $0 | ~$5.40/year |
| Offline Support | Yes | No |

---

### 6.6 AI Audit Trail Integration

**Enhanced Audit Logging for AI Allocations:**

```typescript
{
  action: "ALLOCATED",
  performedBy: "CT_OPS",
  performedByName: "System (AI)",
  performedByRole: "CT_OPS",
  details: "AI-allocated by Gemini (confidence: 9/10) - Best match due to perfect location coverage, HL expertise, and low workload",
  metadata: {
    advocateId: "adv1",
    advocateName: "Rohan Deshmukh",
    confidence: 9,
    factors: [
      "Perfect location match (Maharashtra + Navi Mumbai)",
      "Has expertise in Home Loan",
      "Low workload (1 active case)",
      "Tagged as High Value Expert and Fast TAT"
    ],
    aiModel: "gemini-1.5-flash",
    processingTime: "1.2s"
  },
  timestamp: "2025-11-22T10:15:30Z"
}
```

**UI Display in Assignment Details:**

```typescript
<div className="audit-entry ai-allocation">
  <div className="header">
    <span className="badge">🤖 AI ALLOCATED</span>
    <span className="confidence">Confidence: 9/10</span>
  </div>

  <p className="reason">{entry.metadata.reason}</p>

  <div className="ai-factors">
    <h5>AI Analysis:</h5>
    <ul>
      {entry.metadata.factors.map(factor => (
        <li key={factor}>{factor}</li>
      ))}
    </ul>
  </div>

  <div className="meta">
    <span>Model: {entry.metadata.aiModel}</span>
    <span>Time: {entry.metadata.processingTime}</span>
  </div>

  <div className="performer">
    Allocated to {entry.metadata.advocateName}
  </div>
</div>
```

---

## 7. Data Models

### 7.1 User

```typescript
interface User {
  id: string;                    // Unique ID (e.g., "bank_1", "adv_1", "ct_ops_1")
  name: string;                  // Full name
  email: string;                 // Email address
  phone: string;                 // Phone number
  role: UserRole;                // BANK, ADVOCATE, CT_OPS

  // Role-specific fields
  hubId?: string;                // For BANK users: assigned hub
  firmName?: string;             // For ADVOCATE: law firm name
  states?: string[];             // For ADVOCATE: operating states
  districts?: string[];          // For ADVOCATE: operating districts
  expertise?: ProductType[];     // For ADVOCATE: product specialization
  tags?: string[];               // For ADVOCATE: ["Fast TAT", "High Value Expert"]

  createdAt: string;             // ISO 8601 timestamp
}

enum UserRole {
  BANK = "BANK",
  ADVOCATE = "ADVOCATE",
  CT_OPS = "CT_OPS"
}
```

**Example Data:**

```typescript
// Bank User
{
  id: "bank_1",
  name: "Priya Sharma",
  email: "priya.sharma@bank.com",
  phone: "9876543210",
  role: UserRole.BANK,
  hubId: "hub1",
  createdAt: "2025-01-15T09:00:00Z"
}

// Advocate
{
  id: "adv1",
  name: "Rohan Deshmukh",
  email: "rohan@deshmuklegal.com",
  phone: "9876543211",
  role: UserRole.ADVOCATE,
  firmName: "Deshmukh Legal Associates",
  states: ["Maharashtra"],
  districts: ["Mumbai", "Thane", "Navi Mumbai"],
  expertise: [ProductType.HL, ProductType.LAP],
  tags: ["High Value Expert", "Fast TAT", "10+ Years"],
  createdAt: "2025-01-10T10:00:00Z"
}

// CT Ops
{
  id: "ct_ops_1",
  name: "Anil Kumar",
  email: "anil.kumar@ctops.com",
  phone: "9876543212",
  role: UserRole.CT_OPS,
  createdAt: "2025-01-01T08:00:00Z"
}
```

---

### 7.2 Assignment

```typescript
interface Assignment {
  id: string;                    // Unique ID (UUID)
  lan: string;                   // Loan Account Number (e.g., "LN10045")

  // Borrower Details
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  borrowerAddress: string;

  // Property Details
  propertyAddress: string;
  state: string;
  district: string;
  pincode: string;

  // Loan Details
  productType: ProductType;
  loanAmount: number;
  priority: Priority;
  scope: Scope;

  // Assignment Metadata
  hubId: string;                 // Bank hub
  status: AssignmentStatus;
  advocateId?: string;           // Assigned advocate (null if pending)

  // Timestamps
  createdAt: string;
  allocatedAt?: string;
  completedAt?: string;
  closedAt?: string;

  // Relationships
  documents: Document[];
  auditTrail: AuditEntry[];
}

enum ProductType {
  HL = "Home Loan",
  LAP = "Loan Against Property",
  BL = "Business Loan"
}

enum Priority {
  STANDARD = "Standard",
  HIGH_VALUE = "High Value",
  URGENT = "Urgent"
}

enum Scope {
  EC_ONLY = "EC Only",
  FULL_CHAIN = "Full Chain",
  EC_SALE_DEED = "EC + Sale Deed"
}

enum AssignmentStatus {
  PENDING_ALLOCATION = "Pending Allocation",
  ALLOCATED = "Allocated",
  IN_PROGRESS = "In Progress",
  QUERY_RAISED = "Query Raised",
  COMPLETED = "Completed",
  UNDER_REVIEW = "Under Review",
  CLOSED = "Closed"
}
```

**Example Data:**

```typescript
{
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  lan: "LN10045",

  borrowerName: "Rajesh Kumar",
  borrowerPhone: "9123456789",
  borrowerEmail: "rajesh.kumar@email.com",
  borrowerAddress: "Flat 301, Building A, Sector 10, Vashi, Navi Mumbai, Maharashtra 400703",

  propertyAddress: "Plot 23, Sector 15, Vashi, Navi Mumbai, Maharashtra 400703",
  state: "Maharashtra",
  district: "Navi Mumbai",
  pincode: "400703",

  productType: ProductType.HL,
  loanAmount: 5000000,
  priority: Priority.HIGH_VALUE,
  scope: Scope.FULL_CHAIN,

  hubId: "hub1",
  status: AssignmentStatus.IN_PROGRESS,
  advocateId: "adv1",

  createdAt: "2025-11-22T09:30:00Z",
  allocatedAt: "2025-11-22T09:32:15Z",

  documents: [...],
  auditTrail: [...]
}
```

---

### 7.3 Document

```typescript
interface Document {
  id: string;                    // Unique ID
  assignmentId: string;          // Parent assignment
  name: string;                  // Filename
  category: DocumentCategory;
  size: number;                  // Bytes
  uploadedBy: string;            // User ID
  uploadedByName: string;        // User display name
  uploadedAt: string;            // ISO 8601 timestamp

  // File storage (mock - in production would be S3 URL)
  url?: string;
  previewUrl?: string;
}

enum DocumentCategory {
  SALE_DEED = "Sale Deed",
  INDEX_II = "Index II",
  EC_CERTIFICATE = "EC Certificate",
  PROPERTY_CARD = "Property Card",
  TAX_RECEIPT = "Tax Receipt",
  ENCUMBRANCE = "Encumbrance Certificate",
  MUTATION = "Mutation Extract",
  SURVEY_SKETCH = "Survey/Sketch",
  OTHER = "Other Documents"
}
```

**Example Data:**

```typescript
{
  id: "doc_001",
  assignmentId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  name: "sale_deed_plot23_vashi.pdf",
  category: DocumentCategory.SALE_DEED,
  size: 2457600, // 2.4 MB
  uploadedBy: "adv1",
  uploadedByName: "Rohan Deshmukh",
  uploadedAt: "2025-11-22T14:20:00Z",
  url: "/uploads/doc_001.pdf",
  previewUrl: "/previews/doc_001.jpg"
}
```

---

### 7.4 Hub

```typescript
interface Hub {
  id: string;                    // Unique ID (e.g., "hub1")
  name: string;                  // Hub name
  city: string;                  // City
  state: string;                 // State
  address: string;               // Full address
  contactPerson: string;         // POC name
  contactPhone: string;          // POC phone
  contactEmail: string;          // POC email
  isActive: boolean;             // Active status
  createdAt: string;
}
```

**Example Data:**

```typescript
{
  id: "hub1",
  name: "Mumbai Central Hub",
  city: "Mumbai",
  state: "Maharashtra",
  address: "Tower A, Business Park, BKC, Mumbai 400051",
  contactPerson: "Amit Patel",
  contactPhone: "9876543220",
  contactEmail: "amit.patel@bank.com",
  isActive: true,
  createdAt: "2025-01-01T00:00:00Z"
}
```

---

### 7.5 Data Relationships

```
┌──────────────┐
│     Hub      │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼───────┐         ┌──────────────┐
│  Bank User   │    1:N  │  Assignment  │
└──────────────┘◄────────┤              │
                         │              │
┌──────────────┐    1:N  │              │
│   Advocate   │◄────────┤              │
└──────────────┘         │              │
                         │              │
                   ┌─────┤              │
                   │ 1:N └──────────────┘
                   │
          ┌────────▼─────────┐
          │     Document     │
          └──────────────────┘

          ┌─────────────────┐
          │   AuditEntry    │
          └─────────────────┘
```

**Cardinality:**
- 1 Hub → N Bank Users
- 1 Bank User → N Assignments (created)
- 1 Advocate → N Assignments (allocated)
- 1 Assignment → N Documents
- 1 Assignment → N Audit Entries
- 1 User (any role) → N Audit Entries (performer)

---

## 8. Technical Architecture

### 8.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   React Application                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │   Pages     │  │ Components  │  │   Services   │  │  │
│  │  │             │  │             │  │              │  │  │
│  │  │ - Dashboard │  │ - Cards     │  │ - mockStore  │  │  │
│  │  │ - Details   │  │ - Modals    │  │ - geminiAI   │  │  │
│  │  │ - Login     │  │ - Forms     │  │ - utils      │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │        Zustand State Management                 │  │  │
│  │  │  - Assignments, Users, Hubs, Documents          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │          localStorage Persistence               │  │  │
│  │  │  - All data persisted locally                   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTPS
                            │
                   ┌────────▼──────────┐
                   │  Google Gemini    │
                   │    AI API         │
                   │ (gemini-1.5-flash)│
                   └───────────────────┘
```

### 8.2 Frontend Architecture

**Framework:** React 19.2.0 + TypeScript
**Build Tool:** Vite 6.2.0
**Routing:** React Router DOM 7.1.1
**State:** Zustand 5.0.2
**Styling:** Tailwind CSS 4.0.0

**Directory Structure:**
```
src/
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── OpsDashboard.tsx
│   ├── AdvocateDashboard.tsx
│   └── AssignmentDetails.tsx
├── components/
│   ├── AssignmentCard.tsx
│   ├── StatusBadge.tsx
│   ├── FilterBar.tsx
│   └── ... (other UI components)
├── services/
│   ├── mockStore.ts           # Main state management & business logic
│   ├── geminiAllocation.ts    # AI allocation service
│   └── utils.ts               # Helper functions
├── types/
│   └── index.ts               # TypeScript type definitions
├── testData.ts                # Test dataset (65 assignments, 25 advocates)
├── App.tsx                    # Root component with routing
└── main.tsx                   # Entry point
```

### 8.3 State Management (Zustand)

**Store Structure:**

```typescript
interface StoreState {
  // Data
  assignments: Assignment[];
  users: User[];
  hubs: Hub[];
  currentUser: User | null;

  // UI State
  isTestDataLoaded: boolean;

  // Actions - Assignment Management
  createAssignment: (data: CreateAssignmentData) => Assignment;
  getAssignments: () => Assignment[];
  getAssignmentById: (id: string) => Assignment | undefined;
  getAssignmentsByHub: (hubId: string) => Assignment[];
  getAssignmentsByAdvocate: (advocateId: string) => Assignment[];

  // Actions - Allocation
  allocateAdvocate: (assignmentId: string, advocateId: string, reason: string) => void;
  reallocateAdvocate: (assignmentId: string, newAdvocateId: string, reason: string) => void;
  autoAllocateAll: () => BulkAllocationResult;
  geminiAllocateAssignment: (assignmentId: string) => Promise<AllocationResult>;
  geminiAllocateAll: (onProgress?: ProgressCallback) => Promise<BulkAllocationResult>;

  // Actions - Documents
  uploadDocuments: (assignmentId: string, docs: DocumentData[], uploaderId: string) => void;
  deleteDocument: (assignmentId: string, documentId: string) => void;

  // Actions - Status Management
  updateStatus: (assignmentId: string, newStatus: AssignmentStatus, userId: string) => void;

  // Actions - Ranking
  rankAdvocates: (assignment: Assignment, strategy: AllocationStrategy) => RankedAdvocate[];

  // Actions - Test Data
  loadTestData: () => void;
  isTestDataLoaded: () => boolean;

  // Actions - AI
  isGeminiAvailable: () => boolean;

  // Actions - User Management
  login: (email: string, password: string) => User | null;
  logout: () => void;

  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}
```

**Persistence Strategy:**

```typescript
// On every state change
useEffect(() => {
  store.saveToStorage();
}, [store.assignments, store.users, store.hubs]);

// On app load
useEffect(() => {
  store.loadFromStorage();
}, []);

// localStorage keys
const STORAGE_KEYS = {
  assignments: 'ctmap_assignments',
  users: 'ctmap_users',
  hubs: 'ctmap_hubs',
  currentUser: 'ctmap_current_user'
};
```

### 8.4 AI Integration Architecture

**Service Layer:**

```typescript
// services/geminiAllocation.ts
class GeminiAllocationService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Load API key from environment
    // Initialize Gemini client
    // Set isInitialized flag
  }

  isAvailable(): boolean {
    return this.isInitialized && this.model !== null;
  }

  async allocateWithAI(
    assignment: Assignment,
    advocates: User[],
    getWorkload: (id: string) => number
  ): Promise<AllocationResult> {
    // Build prompt
    // Call Gemini API
    // Parse response
    // Return result
  }

  async bulkAllocateWithAI(
    assignments: Assignment[],
    advocates: User[],
    getWorkload: (id: string) => number,
    onProgress?: ProgressCallback
  ): Promise<BulkAllocationResult> {
    // Loop through assignments
    // Rate limiting (1s delay)
    // Progress callbacks
    // Return summary
  }
}

export const geminiAllocationService = new GeminiAllocationService();
```

**Integration with Store:**

```typescript
// In mockStore.ts
import { geminiAllocationService } from './geminiAllocation';

const store = create<StoreState>((set, get) => ({

  isGeminiAvailable: () => {
    return geminiAllocationService.isAvailable();
  },

  geminiAllocateAssignment: async (assignmentId: string) => {
    const assignment = get().getAssignmentById(assignmentId);
    const advocates = get().users.filter(u => u.role === UserRole.ADVOCATE);

    const result = await geminiAllocationService.allocateWithAI(
      assignment,
      advocates,
      get().getWorkload
    );

    if (result.success && result.advocateId) {
      // Verify and allocate
      get().allocateAdvocate(
        assignmentId,
        result.advocateId,
        `AI-allocated (confidence: ${result.confidence}/10) - ${result.reason}`
      );

      // Verify allocation
      const updated = get().getAssignmentById(assignmentId);
      if (updated?.status !== AssignmentStatus.ALLOCATED) {
        return { success: false, reason: 'Verification failed' };
      }
    }

    return result;
  },

  geminiAllocateAll: async (onProgress) => {
    const pending = get().assignments.filter(
      a => a.status === AssignmentStatus.PENDING_ALLOCATION
    );

    const advocates = get().users.filter(u => u.role === UserRole.ADVOCATE);

    return await geminiAllocationService.bulkAllocateWithAI(
      pending,
      advocates,
      get().getWorkload,
      (current, total) => {
        const assignment = pending[current - 1];
        onProgress?.(current, total, assignment?.lan);
      }
    );
  }

}));
```

### 8.5 Security Considerations

**Current Implementation (Client-Side Only):**

1. **API Key Security:**
   - Stored in `.env` (gitignored)
   - Accessed via `import.meta.env.VITE_GEMINI_API_KEY`
   - ⚠️ **Exposed in browser** (acceptable for demo/testing)

2. **Data Storage:**
   - localStorage (client-side only)
   - No server-side persistence
   - Data cleared on browser cache clear

3. **Authentication:**
   - Simple email/password check (mock)
   - No real authentication system
   - No session management

**Production Requirements:**

1. **API Key Security:**
   ```typescript
   // ❌ Current (client-side)
   const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

   // ✅ Production (server-side proxy)
   fetch('/api/ai-allocate', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${userToken}` },
     body: JSON.stringify({ assignmentId })
   });

   // Server handles Gemini API call with secret key
   ```

2. **Data Security:**
   - Move to secure backend (Node.js/Express, Django, etc.)
   - Database encryption at rest
   - HTTPS for all communications
   - Input sanitization and validation

3. **Authentication:**
   - JWT or OAuth 2.0
   - Role-based access control (RBAC)
   - Session management
   - Password hashing (bcrypt)

4. **OWASP Top 10 Protections:**
   - SQL Injection: Use ORMs with parameterized queries
   - XSS: React auto-escapes, but validate all inputs
   - CSRF: Use CSRF tokens for state-changing operations
   - Broken Authentication: Implement proper auth system
   - Sensitive Data Exposure: Encrypt PII, use HTTPS
   - XML External Entities: N/A (no XML processing)
   - Broken Access Control: Implement proper RBAC
   - Security Misconfiguration: Secure headers, disable debug in prod
   - Using Components with Known Vulnerabilities: Keep dependencies updated
   - Insufficient Logging & Monitoring: Implement audit trails

---

## 9. Security & Compliance

### 9.1 Data Privacy

**Sensitive Data Handling:**
- Borrower PII (name, phone, email, address)
- Property details (address, location)
- Loan amounts
- Advocate contact information

**Current State (Client-Side Demo):**
- Data stored in localStorage (unencrypted)
- No data transmission to external servers (except Gemini API)
- API key exposed in browser

**Production Requirements:**
- Encrypt sensitive data at rest (AES-256)
- Use HTTPS for all data transmission
- Implement data masking for PII in logs
- Secure API keys on server-side
- Implement data retention policies
- GDPR/data protection compliance

### 9.2 Access Control

**Role-Based Permissions (RBAC):**

| Resource | Bank User | Advocate | CT Ops |
|----------|-----------|----------|--------|
| View own assignments | ✅ | ✅ | ✅ |
| View all assignments | ❌ | ❌ | ✅ |
| Create assignment | ✅ | ❌ | ✅ |
| Allocate advocate | ❌ | ❌ | ✅ |
| Re-allocate | ❌ | ❌ | ✅ |
| Upload documents | Query response only | ✅ | ✅ |
| Delete documents | ❌ | Own only | ✅ |
| Change status | Limited | Limited | ✅ |
| View audit trail | Own assignments | Own assignments | All |
| Bulk operations | ❌ | ❌ | ✅ |
| AI allocation | ❌ | ❌ | ✅ |

**Implementation:**

```typescript
// Permission check helper
function hasPermission(user: User, action: string, resource: any): boolean {
  switch (action) {
    case 'VIEW_ASSIGNMENT':
      if (user.role === UserRole.CT_OPS) return true;
      if (user.role === UserRole.BANK) return resource.hubId === user.hubId;
      if (user.role === UserRole.ADVOCATE) return resource.advocateId === user.id;
      return false;

    case 'ALLOCATE':
      return user.role === UserRole.CT_OPS;

    case 'UPLOAD_DOCUMENT':
      if (user.role === UserRole.CT_OPS) return true;
      if (user.role === UserRole.ADVOCATE) return resource.advocateId === user.id;
      if (user.role === UserRole.BANK) {
        // Bank can only upload query responses
        return resource.hubId === user.hubId && isQueryResponse;
      }
      return false;

    // ... more permission checks
  }
}

// Usage in components
if (!hasPermission(currentUser, 'ALLOCATE', assignment)) {
  return <Unauthorized />;
}
```

### 9.3 Audit & Compliance

**Audit Trail Requirements:**
- Every action logged with timestamp
- User ID and role captured
- Before/after states for changes
- IP address logging (production)
- Session ID tracking (production)

**Retention Policy:**
- Audit logs: 7 years (compliance requirement)
- Assignment data: 5 years after closure
- Documents: 5 years after closure
- User data: Duration of employment + 2 years

**Compliance Standards:**
- SOC 2 Type II (for data handling)
- ISO 27001 (information security)
- GDPR (if handling EU data)
- Local data protection laws (India: DPDPA)

---

## 10. Performance Requirements

### 10.1 Response Time Targets

| Operation | Target | Current |
|-----------|--------|---------|
| Page load (dashboard) | < 2s | ~0.5s ✅ |
| Search/filter assignments | < 500ms | ~100ms ✅ |
| Create assignment | < 1s | ~200ms ✅ |
| Manual allocation | < 1s | ~300ms ✅ |
| Auto-allocate all (65) | < 5s | ~0.5s ✅ |
| AI allocate (1) | < 2s | ~1s ✅ |
| AI allocate all (65) | < 90s | ~65s ✅ |
| Bulk document upload (10) | < 5s | ~1s ✅ |
| Document preview | < 2s | ~0.5s ✅ |

### 10.2 Scalability Requirements

**Current Capacity:**
- Assignments: Up to 10,000 in localStorage (~5MB)
- Users: Up to 1,000
- Documents: Limited by browser storage (~50MB total)

**Production Targets:**
- Assignments: 50,000+ active, 1M+ historical
- Users: 500+ advocates, 200+ bank users
- Documents: Unlimited (S3 storage)
- Concurrent users: 200+

**Bottlenecks & Solutions:**

| Bottleneck | Impact | Solution |
|------------|--------|----------|
| localStorage limit | Max ~50MB data | Move to backend database |
| Client-side filtering | Slow with 10K+ items | Server-side pagination & search |
| AI rate limiting | 15 req/min (free tier) | Upgrade to paid tier or batch processing |
| No caching | Repeated AI calls expensive | Cache AI decisions with TTL |
| Single-threaded UI | Blocks on long operations | Web Workers for heavy processing |

### 10.3 Availability & Reliability

**Uptime Target:** 99.9% (production)
**Downtime Allowance:** ~8.76 hours/year

**Failure Scenarios & Mitigations:**

1. **Gemini API Down:**
   - Fallback: Use rule-based allocation
   - User notification: "AI allocation unavailable, using rule-based"
   - Retry logic: 3 attempts with exponential backoff

2. **localStorage Full:**
   - Warning at 80% capacity
   - Archive old assignments
   - Prompt user to clear cache or upgrade

3. **Browser Crash:**
   - Auto-save to localStorage on every change
   - No data loss (all persisted)

4. **Network Connectivity Lost:**
   - Offline mode (read-only)
   - Queue operations for sync when online (future)

### 10.4 Monitoring & Alerting (Production)

**Metrics to Track:**
- API response times (p50, p95, p99)
- Error rates by endpoint
- AI allocation success rate
- Document upload success rate
- User session duration
- Concurrent active users

**Alerts:**
- Error rate > 5%
- Response time p95 > 2s
- AI allocation success < 85%
- Gemini API quota approaching limit

---

## Appendix A: Test Data Summary

### Advocates (25 total)

**Distribution:**
- Maharashtra: 5 advocates (Mumbai, Pune, Navi Mumbai)
- Karnataka: 3 advocates (Bangalore, Mysore)
- Delhi: 3 advocates (Delhi NCR)
- Tamil Nadu: 3 advocates (Chennai)
- Gujarat: 2 advocates (Ahmedabad)
- West Bengal: 2 advocates (Kolkata)
- Telangana: 2 advocates (Hyderabad)
- Rajasthan: 2 advocates (Jaipur)
- Kerala: 2 advocates (Kochi)
- Uttar Pradesh: 1 advocate (Lucknow)

**Expertise Distribution:**
- Home Loan (HL): 15 advocates
- Loan Against Property (LAP): 12 advocates
- Business Loan (BL): 8 advocates

**Tags:**
- "Fast TAT": 10 advocates
- "High Value Expert": 8 advocates
- "10+ Years": 7 advocates
- "New Entrant": 3 advocates

### Assignments (65 total)

**By State:**
- Maharashtra: 15 assignments
- Karnataka: 10 assignments
- Delhi: 8 assignments
- Tamil Nadu: 8 assignments
- Gujarat: 6 assignments
- West Bengal: 5 assignments
- Telangana: 5 assignments
- Rajasthan: 4 assignments
- Kerala: 2 assignments
- Uttar Pradesh: 2 assignments

**By Product:**
- Home Loan: 35 assignments
- LAP: 20 assignments
- Business Loan: 10 assignments

**By Priority:**
- Standard: 40 assignments
- High Value: 20 assignments
- Urgent: 5 assignments

**All start in PENDING_ALLOCATION status**

### Hubs (10 total)

- Mumbai Central Hub (Maharashtra)
- Bangalore Tech Hub (Karnataka)
- Delhi NCR Hub (Delhi)
- Chennai South Hub (Tamil Nadu)
- Ahmedabad West Hub (Gujarat)
- Kolkata East Hub (West Bengal)
- Hyderabad Central Hub (Telangana)
- Pune Hub (Maharashtra)
- Jaipur Hub (Rajasthan)
- Kochi Hub (Kerala)

---

## Appendix B: API Endpoints (Future Backend)

**When transitioning to backend, implement these endpoints:**

```typescript
// Authentication
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

// Assignments
GET    /api/assignments
GET    /api/assignments/:id
POST   /api/assignments
PUT    /api/assignments/:id
DELETE /api/assignments/:id

// Allocation
POST   /api/assignments/:id/allocate
POST   /api/assignments/:id/reallocate
POST   /api/assignments/auto-allocate
POST   /api/assignments/ai-allocate       // Proxies to Gemini
POST   /api/assignments/bulk-ai-allocate  // Batch processing

// Documents
GET    /api/assignments/:id/documents
POST   /api/assignments/:id/documents
DELETE /api/documents/:id
GET    /api/documents/:id/preview

// Users
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

// Hubs
GET    /api/hubs
GET    /api/hubs/:id
POST   /api/hubs
PUT    /api/hubs/:id

// Analytics
GET    /api/analytics/dashboard
GET    /api/analytics/assignments
GET    /api/analytics/advocates
GET    /api/analytics/performance

// Audit
GET    /api/audit/:assignmentId
GET    /api/audit/user/:userId
```

---

## Appendix C: Environment Variables

```bash
# .env file

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Future: Backend API
VITE_API_URL=https://api.ctmap.com
VITE_API_TIMEOUT=30000

# Future: File Storage
VITE_S3_BUCKET=ctmap-documents
VITE_CDN_URL=https://cdn.ctmap.com

# Future: Features
VITE_ENABLE_AI_ALLOCATION=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=true

# Environment
VITE_ENV=development  # development | staging | production
```

---

## Appendix D: Deployment Checklist

**Pre-Production:**
- [ ] Move API key to server-side
- [ ] Implement backend API
- [ ] Set up PostgreSQL/MySQL database
- [ ] Configure S3 for document storage
- [ ] Implement proper authentication (JWT/OAuth)
- [ ] Add HTTPS certificates
- [ ] Set up logging and monitoring
- [ ] Configure CORS policies
- [ ] Add rate limiting
- [ ] Implement data backup strategy

**Production Launch:**
- [ ] Load balancer configuration
- [ ] CDN setup for static assets
- [ ] Database read replicas
- [ ] Redis cache for sessions
- [ ] Automated backups (daily)
- [ ] Disaster recovery plan
- [ ] Security audit
- [ ] Penetration testing
- [ ] Performance testing (load testing)
- [ ] User acceptance testing (UAT)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-22 | CT Development Team | Initial FSD with AI integration |

---

**END OF FUNCTIONAL SPECIFICATION DOCUMENT**
