# Advocate & Document Management Enhancement Design

**Date:** 2025-11-23
**Feature:** Advocate Network Management + Document Edit/Delete

---

## 📋 Overview

### Current Issues

1. **Advocate Network Page**
   - ❌ No way to add/delete coverage areas (states/districts)
   - ❌ No hub assignment/tagging UI
   - ❌ Read-only display - no management capabilities
   - ❌ Expertise cannot be modified

2. **Document Upload**
   - ❌ No delete option for wrong uploads
   - ❌ No replace/re-upload functionality
   - ❌ No edit document metadata

### Proposed Solutions

1. **Advocate Management UI**
   - ✅ Edit advocate profile modal
   - ✅ Add/delete coverage areas (states + districts)
   - ✅ Hub assignment dropdown
   - ✅ Expertise multi-select
   - ✅ Tag management

2. **Document Management**
   - ✅ Delete document with confirmation
   - ✅ Replace document (re-upload)
   - ✅ Edit document category/name
   - ✅ Proper error handling

---

## 🎯 Feature 1: Advocate Network Management

### UI Components

#### 1. Edit Advocate Modal

**Trigger:** "Edit Profile" button on each advocate card

**Modal Sections:**

```typescript
┌─────────────────────────────────────────┐
│  Edit Advocate Profile                  │
├─────────────────────────────────────────┤
│                                         │
│  📍 Coverage Areas                      │
│  ┌──────────────────────────────────┐  │
│  │ States:                          │  │
│  │ [Maharashtra] [×] [Karnataka] [×]│  │
│  │ [+ Add State ▼]                  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Districts (Maharashtra):         │  │
│  │ [Pune] [×] [Mumbai] [×]          │  │
│  │ [+ Add District ▼]               │  │
│  └──────────────────────────────────┘  │
│                                         │
│  🏢 Hub Assignment                      │
│  ┌──────────────────────────────────┐  │
│  │ Select Hub: [Pune Hub ▼]        │  │
│  └──────────────────────────────────┘  │
│                                         │
│  💼 Expertise                           │
│  ┌──────────────────────────────────┐  │
│  │ ☑ Home Loan                      │  │
│  │ ☑ Loan Against Property          │  │
│  │ ☐ Business Loan                  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [Cancel]  [Save Changes]               │
└─────────────────────────────────────────┘
```

**Features:**
- Multi-state selection with remove (×) button
- District selection per state (dynamic based on selected states)
- Hub dropdown (shows all available hubs)
- Expertise checkboxes (product types)
- Validation: At least 1 state required
- Auto-refresh advocate list after save

---

### Data Model Updates

#### Existing User Interface (No Changes Needed)
```typescript
export interface User {
  id: string;
  email: string;
  firmName?: string;
  role: UserRole;
  states?: string[];
  districts?: string[];
  expertise?: string[];
  hubId?: string;     // ← Already exists!
  tags?: string[];
}
```

**No type changes required!** All fields already exist.

---

### mockStore Methods to Add

```typescript
/**
 * Update advocate coverage areas
 */
updateAdvocateCoverage(
  advocateId: string,
  states: string[],
  districts: string[]
): User {
  const user = this.getUserById(advocateId);
  if (!user || user.role !== UserRole.ADVOCATE) {
    throw new Error('Advocate not found');
  }

  if (states.length === 0) {
    throw new Error('At least one state must be selected');
  }

  const updated: User = {
    ...user,
    states,
    districts
  };

  this.users = this.users.map(u => u.id === advocateId ? updated : u);
  this.saveToStorage();

  return updated;
}

/**
 * Update advocate hub assignment
 */
updateAdvocateHub(
  advocateId: string,
  hubId: string | undefined
): User {
  const user = this.getUserById(advocateId);
  if (!user || user.role !== UserRole.ADVOCATE) {
    throw new Error('Advocate not found');
  }

  if (hubId) {
    const hub = this.hubs.find(h => h.id === hubId);
    if (!hub) {
      throw new Error('Invalid hub ID');
    }
  }

  const updated: User = {
    ...user,
    hubId
  };

  this.users = this.users.map(u => u.id === advocateId ? updated : u);
  this.saveToStorage();

  return updated;
}

/**
 * Update advocate expertise
 */
updateAdvocateExpertise(
  advocateId: string,
  expertise: string[]
): User {
  const user = this.getUserById(advocateId);
  if (!user || user.role !== UserRole.ADVOCATE) {
    throw new Error('Advocate not found');
  }

  const updated: User = {
    ...user,
    expertise
  };

  this.users = this.users.map(u => u.id === advocateId ? updated : u);
  this.saveToStorage();

  return updated;
}

/**
 * Update advocate profile (all-in-one)
 */
updateAdvocateProfile(
  advocateId: string,
  updates: {
    states?: string[];
    districts?: string[];
    hubId?: string;
    expertise?: string[];
  }
): User {
  const user = this.getUserById(advocateId);
  if (!user || user.role !== UserRole.ADVOCATE) {
    throw new Error('Advocate not found');
  }

  if (updates.states && updates.states.length === 0) {
    throw new Error('At least one state must be selected');
  }

  if (updates.hubId) {
    const hub = this.hubs.find(h => h.id === updates.hubId);
    if (!hub) {
      throw new Error('Invalid hub ID');
    }
  }

  const updated: User = {
    ...user,
    ...updates
  };

  this.users = this.users.map(u => u.id === advocateId ? updated : u);
  this.saveToStorage();

  console.log(`✏️ Updated advocate profile: ${user.firmName}`);

  return updated;
}
```

---

### UI Implementation Plan

#### AdvocateNetwork.tsx Changes

1. **Add "Edit Profile" button** (replaces "View Profile")
2. **Create EditAdvocateModal component**
3. **Add state management for modal**

```typescript
const [showEditModal, setShowEditModal] = useState(false);
const [selectedAdvocate, setSelectedAdvocate] = useState<User | null>(null);

const handleEditAdvocate = (advocate: User) => {
  setSelectedAdvocate(advocate);
  setShowEditModal(true);
};

const handleSaveAdvocate = (updates: AdvocateUpdates) => {
  try {
    store.updateAdvocateProfile(selectedAdvocate.id, updates);
    // Refresh advocate list
    setAdvocates(store.getAdvocates());
    setShowEditModal(false);
    alert('✅ Advocate profile updated successfully!');
  } catch (error: any) {
    alert(`❌ Update failed: ${error.message}`);
  }
};
```

#### EditAdvocateModal Component

**Location:** `components/EditAdvocateModal.tsx`

**Features:**
- State multi-select with add/remove
- District multi-select (filtered by selected states)
- Hub dropdown
- Expertise checkboxes
- Validation before save
- Cancel/Save actions

---

## 🎯 Feature 2: Document Management

### UI Enhancements

#### DocumentCard.tsx Changes

**Add 2 new buttons:**

1. **Delete Button**
   - Icon: Trash icon (from lucide-react)
   - Color: Red
   - Confirmation dialog before delete
   - Position: Next to Download button

2. **Replace Button**
   - Icon: RefreshCw icon
   - Color: Blue
   - Opens file picker to select new document
   - Replaces existing document while keeping metadata
   - Position: Between Preview and Delete

```typescript
┌────────────────────────────────────┐
│ [Preview] [Replace] [Delete] [⬇]  │
└────────────────────────────────────┘
```

---

### Data Flow

#### Delete Document

```typescript
handleDeleteDocument(documentId: string) {
  const confirmed = window.confirm(
    '🗑️ Delete Document?\n\n' +
    'This action cannot be undone.\n\n' +
    'Are you sure you want to delete this document?'
  );

  if (!confirmed) return;

  try {
    store.deleteDocument(assignmentId, documentId);
    onDocumentDeleted(documentId); // Callback to parent
    alert('✅ Document deleted successfully!');
  } catch (error: any) {
    alert(`❌ Delete failed: ${error.message}`);
  }
}
```

#### Replace Document

```typescript
handleReplaceDocument(documentId: string, newFile: File) {
  const confirmed = window.confirm(
    '🔄 Replace Document?\n\n' +
    `Current: ${document.name}\n` +
    `New: ${newFile.name}\n\n` +
    'This will replace the existing document.'
  );

  if (!confirmed) return;

  try {
    store.replaceDocument(assignmentId, documentId, newFile);
    onDocumentReplaced(documentId, newFile); // Callback to parent
    alert('✅ Document replaced successfully!');
  } catch (error: any) {
    alert(`❌ Replace failed: ${error.message}`);
  }
}
```

---

### mockStore Methods to Add

```typescript
/**
 * Delete document from assignment
 */
deleteDocument(
  assignmentId: string,
  documentId: string,
  deletedBy: string
): Assignment {
  const assignment = this.getAssignments().find(a => a.id === assignmentId);
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  const documentIndex = assignment.documents.findIndex(d => d.id === documentId);
  if (documentIndex === -1) {
    throw new Error('Document not found');
  }

  const document = assignment.documents[documentIndex];

  const updated: Assignment = {
    ...assignment,
    documents: assignment.documents.filter(d => d.id !== documentId),
    auditTrail: [
      ...(assignment.auditTrail || []),
      {
        action: 'DOCUMENT_DELETED',
        performedBy: deletedBy,
        timestamp: new Date().toISOString(),
        details: `Deleted document: ${document.category} - ${document.name}`
      }
    ]
  };

  this.assignments = this.assignments.map(a =>
    a.id === assignmentId ? updated : a
  );
  this.saveToStorage();

  console.log(`🗑️ Deleted document: ${document.name} from ${assignment.lan}`);

  return updated;
}

/**
 * Replace document (re-upload with same category)
 */
replaceDocument(
  assignmentId: string,
  documentId: string,
  newFile: File,
  replacedBy: string
): Assignment {
  const assignment = this.getAssignments().find(a => a.id === assignmentId);
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  const documentIndex = assignment.documents.findIndex(d => d.id === documentId);
  if (documentIndex === -1) {
    throw new Error('Document not found');
  }

  const oldDocument = assignment.documents[documentIndex];

  const replacementDocument: AssignmentDocument = {
    ...oldDocument,
    name: newFile.name,
    size: newFile.size,
    date: new Date().toISOString(),
    file: newFile,
    extractedData: undefined // Clear extracted data - needs re-parsing
  };

  const updated: Assignment = {
    ...assignment,
    documents: assignment.documents.map((d, idx) =>
      idx === documentIndex ? replacementDocument : d
    ),
    auditTrail: [
      ...(assignment.auditTrail || []),
      {
        action: 'DOCUMENT_REPLACED',
        performedBy: replacedBy,
        timestamp: new Date().toISOString(),
        details: `Replaced ${oldDocument.category}: ${oldDocument.name} → ${newFile.name}`
      }
    ]
  };

  this.assignments = this.assignments.map(a =>
    a.id === assignmentId ? updated : a
  );
  this.saveToStorage();

  console.log(`🔄 Replaced document: ${oldDocument.name} → ${newFile.name}`);

  return updated;
}

/**
 * Update document metadata (category, name)
 */
updateDocumentMetadata(
  assignmentId: string,
  documentId: string,
  updates: {
    category?: string;
    name?: string;
  },
  updatedBy: string
): Assignment {
  const assignment = this.getAssignments().find(a => a.id === assignmentId);
  if (!assignment) {
    throw new Error('Assignment not found');
  }

  const documentIndex = assignment.documents.findIndex(d => d.id === documentId);
  if (documentIndex === -1) {
    throw new Error('Document not found');
  }

  const oldDocument = assignment.documents[documentIndex];

  const updatedDocument: AssignmentDocument = {
    ...oldDocument,
    ...updates
  };

  const updated: Assignment = {
    ...assignment,
    documents: assignment.documents.map((d, idx) =>
      idx === documentIndex ? updatedDocument : d
    ),
    auditTrail: [
      ...(assignment.auditTrail || []),
      {
        action: 'DOCUMENT_UPDATED',
        performedBy: updatedBy,
        timestamp: new Date().toISOString(),
        details: `Updated document metadata: ${oldDocument.category}`
      }
    ]
  };

  this.assignments = this.assignments.map(a =>
    a.id === assignmentId ? updated : a
  );
  this.saveToStorage();

  return updated;
}
```

---

## 🎨 UI/UX Design

### Color Scheme

| Action | Color | Icon |
|--------|-------|------|
| Edit Profile | Blue | Edit2 |
| Delete Document | Red | Trash2 |
| Replace Document | Purple | RefreshCw |
| Add Coverage | Green | Plus |
| Remove Coverage | Orange | X |

---

### Validation Rules

#### Advocate Management
- ✅ At least 1 state must be selected
- ✅ Hub ID must be valid (if provided)
- ✅ Expertise can be empty
- ✅ Districts can be empty

#### Document Management
- ✅ Confirm before delete (cannot undo)
- ✅ Confirm before replace
- ✅ Replaced file must be PDF (same type as original)
- ✅ Extracted data cleared after replace (requires re-parse)

---

## 📊 State/District Data

### Available States & Districts

```typescript
const INDIA_STATES_DISTRICTS = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad'],
  'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Noida'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain']
};
```

This will be used in the Edit Advocate Modal for district selection dropdowns.

---

## 🚀 Implementation Plan

### Phase 1: Advocate Management (Priority 1)

**Files to Create:**
1. `components/EditAdvocateModal.tsx` - Modal component
2. `utils/statesDistrictsData.ts` - State/district constants

**Files to Modify:**
1. `pages/AdvocateNetwork.tsx` - Add edit functionality
2. `services/mockStore.ts` - Add 4 new methods

**Estimated Lines:** ~300 lines

---

### Phase 2: Document Management (Priority 2)

**Files to Modify:**
1. `components/DocumentCard.tsx` - Add delete/replace buttons
2. `services/mockStore.ts` - Add 3 new methods
3. Parent components using DocumentCard - Add callbacks

**Estimated Lines:** ~150 lines

---

### Phase 3: Testing

**Test Cases:**
1. ✅ Add/remove coverage areas
2. ✅ Assign hub to advocate
3. ✅ Update expertise
4. ✅ Delete document with confirmation
5. ✅ Replace document clears extracted data
6. ✅ Validation works (at least 1 state required)
7. ✅ Audit trail entries created

---

## 📝 Implementation Checklist

### Advocate Management
- [ ] Create statesDistrictsData.ts with India data
- [ ] Add updateAdvocateProfile() to mockStore
- [ ] Create EditAdvocateModal component
- [ ] Add state management to AdvocateNetwork.tsx
- [ ] Add "Edit Profile" button
- [ ] Implement multi-select for states
- [ ] Implement district dropdown (filtered by state)
- [ ] Implement hub dropdown
- [ ] Implement expertise checkboxes
- [ ] Add validation
- [ ] Test full workflow

### Document Management
- [ ] Add deleteDocument() to mockStore
- [ ] Add replaceDocument() to mockStore
- [ ] Add updateDocumentMetadata() to mockStore
- [ ] Add Delete button to DocumentCard
- [ ] Add Replace button to DocumentCard
- [ ] Add file picker for replace
- [ ] Add confirmation dialogs
- [ ] Add callbacks to parent components
- [ ] Test delete workflow
- [ ] Test replace workflow

---

## 🎯 Success Criteria

### Advocate Management
- ✅ CT Ops can add/remove states from advocate coverage
- ✅ CT Ops can add/remove districts from advocate coverage
- ✅ CT Ops can assign/unassign hub for advocate
- ✅ CT Ops can update advocate expertise
- ✅ All changes saved to localStorage
- ✅ Audit trail maintained
- ✅ UI updates immediately after save

### Document Management
- ✅ Users can delete uploaded documents
- ✅ Users can replace uploaded documents
- ✅ Confirmation dialogs prevent accidental actions
- ✅ Extracted data cleared after replace
- ✅ Audit trail maintained
- ✅ UI updates immediately after action

---

**Status:** Ready for Implementation
**Estimated Time:** 2-3 hours
**Risk Level:** Low (well-isolated features)
