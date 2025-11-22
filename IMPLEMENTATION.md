# CT MAP - Title Search Portal: Implementation Guide

## 1. Project Overview
CT MAP is a centralized portal designed to streamline the **Title Search Report (TSR)** and **Legal Opinion Report (LOR)** process, connecting Bank Users, CT Operations, and Advocates in a unified workflow.

---

## 2. Tech Stack & Architecture
*   **Frontend**: React 19 (Functional Components, Hooks).
*   **Styling**: Tailwind CSS with a professional "Modern SaaS" design system (Inter font, Indigo palette).
*   **State Management**: In-memory `MockStore` service simulating a backend database.
*   **AI Engine**: Google Gemini API (`gemini-2.5-flash`) via `@google/genai` SDK.

---

## 3. Data Models (Enhanced)
### 3.1 Assignment
*   **Core Fields**: LAN, Borrower Details, Property Address, Status.
*   **Allocation Fields**: `borrowerState`, `borrowerDistrict` for smart routing.
*   **AI Fields**: `priority` ('Standard' | 'Urgent' | 'High Value'), `tags`.
*   **Lifecycle**: `auditTrail` for tracking all actions, `transferRequest` for ownership changes.

### 3.2 User
*   **Roles**: Bank User, CT Ops, Advocate.
*   **Advocate Profile**: `firmName`, `states` (coverage), `expertise` (HL/LAP), `tags` (AI skills).
*   **Bank User**: Mapped to specific `Hub`.

### 3.3 Hub
*   **Fields**: Code, Name, Location, **Hub Email** (Critical for reporting).

---

## 4. AI Modules (Powered by Gemini)

### 4.1 CT Genius (Chatbot)
*   **Location**: Global Floating Component (`AiAssistant.tsx`).
*   **Engine**: **Google Gemini 2.5 Flash**.
*   **Context Awareness**:
    *   **Dashboard Context**: When no assignment is selected, the AI analyzes the user's role and fetches live stats from the store (e.g., "You have 3 assignments pending allocation").
    *   **Assignment Context**: When viewing a case, the AI consumes the specific JSON data of that assignment to answer questions like "What is the status?" or "Is there a risk?".
*   **System Instruction**: Configured to act as a professional, data-driven portal assistant.

### 4.2 Smart Allocation Engine
*   **Location**: `AssignmentDetails.tsx` (Ops View).
*   **Logic**: A weighted scoring algorithm that matches Advocates to Assignments based on:
    1.  **Location**: Exact District Match (+50), State Match (+20).
    2.  **Expertise**: Product Type match (+30).
    3.  **AI Tags**: Matching 'High Value' or 'Urgent' tags (+15-20).
    4.  **Workload**: Penalty for high active caseloads.
*   **Genius Insight**: Generates a "Why this advocate?" explanation card.

---

## 5. Master Management Module
*   **Access**: Restricted to `CT_OPS`.
*   **Hub Configuration**: Full CRUD (Create, Read, Update, Delete).
    *   Includes validation to prevent deleting Hubs with active users.
    *   **Hub Email** field ensures report delivery routing.
*   **User Management**:
    *   **Bank Users**: Explicit Hub Mapping.
    *   **Advocates**: Rich profile editing (Expertise, Coverage, Tags).

---

## 6. End-to-End Workflow

### Step 1: Initiation (Bank User)
*   **Search**: Fetch assignment by LAN/PAN.
*   **Claim**: View details -> "Save Draft" or "Submit".
*   **Transfer**: If assignment is owned by another, request transfer -> Owner approves -> Ownership swaps.

### Step 2: Documentation
*   Bank User uploads mandatory documents (Sale Deed, etc.).
*   System validates uploads before allowing submission.

### Step 3: Allocation (CT Ops)
*   Ops User views "Pending Allocation" queue.
*   Uses **Smart Allocation** to find best Advocate.
*   **Re-allocation**: If needed, Ops can swap advocate (Mandatory Reason + Audit Log).

### Step 4: Execution (Advocate)
*   Advocate views "My Cases".
*   **Queries**: Threaded chat with Bank User. Ops can also raise directed queries.
*   **Timeline**: Visual progress tracker and Deadline countdown.

### Step 5: Completion
*   Advocate submits Final Report (PDF).
*   Status moves to `PENDING_APPROVAL`.
*   Bank User reviews -> **Approve** or **Reject** (Raise Query).
*   **Timer**: Stops upon completion to record final TAT.

---

## 7. Status & Verification
*   **UI/UX**: Professional "Indigo" theme applied. Inputs and buttons modernized.
*   **Dashboards**: Rich analytics (Charts, Activity Feeds) implemented for Bank & Ops.
*   **Workflow**: Transfer, Re-allocation, and Approval flows verified.
*   **AI**: Real Gemini integration active.