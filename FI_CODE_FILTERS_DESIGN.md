# FI_Code Integration & Advanced Filters Design

**Date:** 2025-11-23
**Feature:** PropDD FI_Code Integration + Advanced Assignment Filters

---

## 📋 Overview

### Current Gaps

1. **No FI_code tracking**
   - ❌ Assignments from PropDD portal have unique FI_code
   - ❌ No way to reconcile with external system
   - ❌ Missing in assignment data model
   - ❌ Not all assignments are TSR (need to identify)

2. **Limited Filtering**
   - ❌ No date range filters
   - ❌ No historical assignment search
   - ❌ No FI_code search
   - ❌ No advanced multi-criteria filtering
   - ❌ Can't export filtered results

### Proposed Solutions

1. **FI_code Integration**
   - ✅ Add `fiCode` field to Assignment interface
   - ✅ Optional field (not all assignments have it)
   - ✅ Display prominently in assignment details
   - ✅ Search by FI_code
   - ✅ Reconciliation report feature

2. **Advanced Filters**
   - ✅ Date range filter (Created, Completed)
   - ✅ FI_code search
   - ✅ Multi-status filter
   - ✅ Location filter (State, District)
   - ✅ Product type filter
   - ✅ Hub filter
   - ✅ Advocate filter
   - ✅ Export filtered results

---

## 🎯 Feature 1: FI_Code Integration

### Data Model Updates

#### Assignment Interface (types.ts)

```typescript
export interface Assignment {
  // Existing fields...
  id: string;
  lan: string;
  borrowerName: string;
  // ... other fields

  // NEW FIELDS
  fiCode?: string;              // PropDD Portal FI Code (optional)
  isTSR?: boolean;             // Is this a TSR assignment?
  externalSource?: string;      // Source system (e.g., "PropDD", "Manual")
  externalReference?: string;   // Additional external reference
}
```

**Why Optional?**
- Not all assignments come from PropDD
- Manual assignments won't have FI_code
- Legacy data compatibility

---

### UI Integration

#### Assignment Details Display

```typescript
┌─────────────────────────────────────────┐
│  Assignment Details                     │
├─────────────────────────────────────────┤
│                                         │
│  LAN: LAN-2024-001234                   │
│  FI Code: FI-MH-2024-5678  🔗           │  ← New Field
│  Source: PropDD Portal                  │  ← New Field
│  Type: TSR Assignment                   │  ← New Badge
│                                         │
│  Borrower: Rajesh Kumar                 │
│  Location: Pune, Maharashtra            │
│  ...                                    │
└─────────────────────────────────────────┘
```

**Features:**
- FI_code shown with copy button
- "TSR" or "Non-TSR" badge
- External source indicator
- Link to PropDD portal (if applicable)

---

### Search & Filter Integration

**Quick Search Bar:**
- Search by LAN **OR** FI_code
- Auto-detect format (FI-* = FI_code)
- Highlight matched field

**Example:**
```
Search: "FI-MH-2024-5678" → Finds assignment by FI_code
Search: "LAN-2024-001234" → Finds assignment by LAN
Search: "Rajesh" → Finds by borrower name
```

---

### Reconciliation Report

**New Feature:** PropDD Reconciliation Report

```typescript
┌────────────────────────────────────────────────────┐
│  PropDD Reconciliation Report                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  Date Range: [2024-01-01] to [2024-12-31]         │
│  [Generate Report]                                 │
│                                                    │
│  Summary:                                          │
│  • Total Assignments: 1,234                        │
│  • With FI_code: 987 (80%)                         │
│  • Without FI_code: 247 (20%)                      │
│  • TSR Assignments: 856 (69%)                      │
│  • Non-TSR: 378 (31%)                              │
│                                                    │
│  Status Breakdown:                                 │
│  • Completed: 678                                  │
│  • In Progress: 234                                │
│  • Pending: 123                                    │
│  • Forfeited: 12                                   │
│                                                    │
│  [Export CSV] [Export Excel]                       │
└────────────────────────────────────────────────────┘
```

**Export Columns:**
```
FI_code | LAN | Borrower | State | District | Status |
Created | Completed | Advocate | Hub | Product Type
```

---

## 🎯 Feature 2: Advanced Filters

### Filter Component Design

#### AdvancedFilters Component

```typescript
┌──────────────────────────────────────────────────────────┐
│  Advanced Filters                          [Clear All]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📅 Date Range                                           │
│  ┌────────────────────┐  ┌────────────────────┐         │
│  │ From: [2024-01-01] │  │ To: [2024-12-31]   │         │
│  └────────────────────┘  └────────────────────┘         │
│  Filter by: ⚪ Created Date  ⚫ Completed Date            │
│                                                          │
│  🔍 Search                                               │
│  ┌──────────────────────────────────────────┐           │
│  │ Search by LAN, FI_code, or Borrower...  │           │
│  └──────────────────────────────────────────┘           │
│                                                          │
│  📊 Status (Multi-Select)                                │
│  ☑ Pending Allocation  ☑ Allocated  ☑ In Progress       │
│  ☑ Completed          ☐ Forfeited   ☐ Query Raised      │
│                                                          │
│  📍 Location                                             │
│  State: [All States ▼]  District: [All Districts ▼]     │
│                                                          │
│  💼 Product & Hub                                        │
│  Product: [All Products ▼]  Hub: [All Hubs ▼]           │
│                                                          │
│  👤 Advocate                                             │
│  [All Advocates ▼]                                       │
│                                                          │
│  🏷️ Assignment Type                                      │
│  ⚪ All  ⚪ TSR Only  ⚪ Non-TSR Only                      │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  Results: 234 assignments found                          │
│                                                          │
│  [Apply Filters]  [Export Results]                       │
└──────────────────────────────────────────────────────────┘
```

---

### Filter Logic

#### Date Range Filtering

**Two Modes:**
1. **Created Date** - Filter by `createdAt` field
2. **Completed Date** - Filter by `completedAt` field

```typescript
const filterByDateRange = (
  assignments: Assignment[],
  fromDate: string,
  toDate: string,
  mode: 'created' | 'completed'
): Assignment[] => {
  return assignments.filter(a => {
    const dateField = mode === 'created' ? a.createdAt : a.completedAt;
    if (!dateField) return false;

    const date = new Date(dateField);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999); // Include full day

    return date >= from && date <= to;
  });
};
```

#### Multi-Status Filter

```typescript
const filterByStatuses = (
  assignments: Assignment[],
  selectedStatuses: AssignmentStatus[]
): Assignment[] => {
  if (selectedStatuses.length === 0) return assignments;
  return assignments.filter(a => selectedStatuses.includes(a.status));
};
```

#### FI_code / LAN / Borrower Search

```typescript
const searchAssignments = (
  assignments: Assignment[],
  searchTerm: string
): Assignment[] => {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return assignments;

  return assignments.filter(a =>
    a.lan.toLowerCase().includes(term) ||
    a.fiCode?.toLowerCase().includes(term) ||
    a.borrowerName.toLowerCase().includes(term)
  );
};
```

---

### Export Functionality

#### Export Formats

**CSV Export:**
```csv
FI_Code,LAN,Borrower,State,District,Product,Status,Created,Completed,Advocate,Hub
FI-MH-2024-5678,LAN-2024-001234,Rajesh Kumar,Maharashtra,Pune,Home Loan,Completed,2024-01-15,2024-02-20,Advocate Law Firm,Pune Hub
```

**Excel Export:**
- Multiple sheets (Summary, Detailed, Status Breakdown)
- Formatted headers
- Auto-width columns
- Conditional formatting for status

---

## 📊 Implementation Plan

### Phase 1: Data Model (Priority 1)

**Files to Modify:**
1. `types.ts` - Add FI_code fields to Assignment
2. `services/mockStore.ts` - Update sample data

**New Fields:**
```typescript
export interface Assignment {
  // ... existing fields
  fiCode?: string;
  isTSR?: boolean;
  externalSource?: string;
  externalReference?: string;
}
```

**Estimated Time:** 30 minutes
**Lines:** ~20 lines

---

### Phase 2: Advanced Filters UI (Priority 2)

**Files to Create:**
1. `components/AdvancedFilters.tsx` - Main filter component
2. `utils/filterHelpers.ts` - Filter logic utilities
3. `utils/exportHelpers.ts` - CSV/Excel export utilities

**Features:**
- Date range picker
- Multi-select status checkboxes
- Location dropdowns (state/district)
- Product/Hub/Advocate dropdowns
- TSR/Non-TSR toggle
- Search bar
- Clear all button
- Results count
- Export button

**Estimated Time:** 2-3 hours
**Lines:** ~400 lines

---

### Phase 3: Assignment Display Updates (Priority 3)

**Files to Modify:**
1. `pages/OpsDashboard.tsx` - Add FI_code column, integrate filters
2. `pages/BankDashboard.tsx` - Add FI_code column, integrate filters
3. `pages/AdvocateDashboard.tsx` - Show FI_code in assignment cards
4. `components/AssignmentDetails.tsx` - Display FI_code prominently

**Features:**
- FI_code column in tables
- Copy FI_code button
- TSR badge
- External source indicator
- Link to PropDD (if applicable)

**Estimated Time:** 1-2 hours
**Lines:** ~200 lines

---

### Phase 4: Reconciliation Report (Priority 4)

**Files to Create:**
1. `pages/ReconciliationReport.tsx` - Report page
2. `services/reconciliationService.ts` - Report generation logic

**Features:**
- Date range selection
- Summary statistics
- Status breakdown
- Missing FI_code list
- Export to CSV/Excel
- Visual charts (optional)

**Estimated Time:** 2 hours
**Lines:** ~300 lines

---

## 🎨 UI/UX Design

### Color Scheme

| Element | Color | Icon |
|---------|-------|------|
| FI_code Badge | Purple | Tag |
| TSR Badge | Green | CheckCircle |
| Non-TSR Badge | Gray | Circle |
| Date Filter | Blue | Calendar |
| Export Button | Emerald | Download |

---

### Filter Behavior

**Persistence:**
- Save filter state to localStorage
- Restore on page reload
- Clear button resets all filters

**Real-time:**
- Filters apply immediately (no "Apply" button needed)
- OR use debounced application for performance
- Show loading indicator while filtering

**URL Parameters:**
- Encode filters in URL for sharing
- Example: `?status=completed&from=2024-01-01&to=2024-12-31`

---

## 📝 Validation Rules

### FI_code Format

**Optional Validation:**
```typescript
const FI_CODE_REGEX = /^FI-[A-Z]{2}-\d{4}-\d{4,6}$/;
// Example: FI-MH-2024-5678

// Or flexible:
const isValidFiCode = (code: string): boolean => {
  return code.trim().length > 0 && code.startsWith('FI-');
};
```

**Uniqueness:**
- FI_code should be unique (if provided)
- Warn if duplicate detected
- Allow override for legacy data

---

## 🚀 Sample Data

### Assignment with FI_code

```typescript
{
  id: 'asgn-001',
  lan: 'LAN-2024-001234',
  fiCode: 'FI-MH-2024-5678',
  isTSR: true,
  externalSource: 'PropDD',
  externalReference: 'https://propdd.com/assignments/5678',
  borrowerName: 'Rajesh Kumar',
  state: 'Maharashtra',
  district: 'Pune',
  productType: 'Home Loan',
  status: AssignmentStatus.COMPLETED,
  createdAt: '2024-01-15T10:00:00Z',
  completedAt: '2024-02-20T15:30:00Z',
  // ... other fields
}
```

---

## 📊 Filter State Management

### Filter Interface

```typescript
export interface AssignmentFilters {
  // Date Range
  dateFrom?: string;
  dateTo?: string;
  dateMode: 'created' | 'completed';

  // Search
  searchTerm?: string;

  // Status
  selectedStatuses: AssignmentStatus[];

  // Location
  selectedState?: string;
  selectedDistrict?: string;

  // Product & Hub
  selectedProduct?: string;
  selectedHub?: string;

  // Advocate
  selectedAdvocate?: string;

  // Type
  assignmentType: 'all' | 'tsr' | 'non-tsr';
}

const DEFAULT_FILTERS: AssignmentFilters = {
  dateMode: 'created',
  selectedStatuses: [],
  assignmentType: 'all'
};
```

---

## ✅ Success Criteria

### FI_code Integration
- ✅ FI_code field added to Assignment type
- ✅ Optional field (nullable)
- ✅ Displayed in all assignment views
- ✅ Searchable by FI_code
- ✅ Copy button for FI_code
- ✅ TSR badge shown
- ✅ Reconciliation report available

### Advanced Filters
- ✅ Date range filter (created/completed)
- ✅ Multi-status filter
- ✅ Location filter (state/district)
- ✅ Product/Hub/Advocate filters
- ✅ TSR/Non-TSR filter
- ✅ Search by LAN/FI_code/Borrower
- ✅ Clear all filters
- ✅ Results count displayed
- ✅ Export filtered results (CSV)
- ✅ Filter state persisted

---

## 📄 mockStore Methods to Add

```typescript
/**
 * Search assignments by FI_code
 */
searchByFiCode(fiCode: string): Assignment | undefined {
  return this.assignments.find(a =>
    a.fiCode?.toLowerCase() === fiCode.toLowerCase()
  );
}

/**
 * Get assignments by date range
 */
getAssignmentsByDateRange(
  from: string,
  to: string,
  mode: 'created' | 'completed'
): Assignment[] {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  return this.assignments.filter(a => {
    const dateField = mode === 'created' ? a.createdAt : a.completedAt;
    if (!dateField) return false;

    const date = new Date(dateField);
    return date >= fromDate && date <= toDate;
  });
}

/**
 * Generate reconciliation report
 */
getReconciliationReport(from: string, to: string): ReconciliationReport {
  const assignments = this.getAssignmentsByDateRange(from, to, 'created');

  return {
    total: assignments.length,
    withFiCode: assignments.filter(a => a.fiCode).length,
    withoutFiCode: assignments.filter(a => !a.fiCode).length,
    tsrAssignments: assignments.filter(a => a.isTSR).length,
    nonTsrAssignments: assignments.filter(a => !a.isTSR).length,
    statusBreakdown: {
      completed: assignments.filter(a => a.status === AssignmentStatus.COMPLETED).length,
      inProgress: assignments.filter(a => a.status === AssignmentStatus.IN_PROGRESS).length,
      // ... other statuses
    },
    assignments: assignments
  };
}
```

---

**Status:** Ready for Implementation
**Estimated Total Time:** 5-7 hours
**Risk Level:** Low (well-isolated features)
**Priority:** High (critical for production)
