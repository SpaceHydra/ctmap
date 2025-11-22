
export enum UserRole {
  BANK_USER = 'BANK_USER',
  CT_OPS = 'CT_OPS',
  ADVOCATE = 'ADVOCATE',
  ADMIN = 'ADMIN'
}

export enum AssignmentStatus {
  UNCLAIMED = 'UNCLAIMED', // Exists in backend but not visible to bank user yet
  DRAFT = 'DRAFT', // Claimed by bank user, docs pending
  PENDING_ALLOCATION = 'PENDING_ALLOCATION', // Docs uploaded, waiting for Ops
  ALLOCATED = 'ALLOCATED', // With Advocate
  IN_PROGRESS = 'IN_PROGRESS', // Advocate working
  QUERY_RAISED = 'QUERY_RAISED', // Advocate asked q
  PENDING_APPROVAL = 'PENDING_APPROVAL', // Report submitted
  COMPLETED = 'COMPLETED', // Approved
  REJECTED = 'REJECTED' // Rework needed
}

export enum ProductType {
  HL = 'Home Loan',
  LAP = 'Loan Against Property',
  BL = 'Business Loan'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hubId?: string; // For Bank Users
  firmName?: string; // For Advocates
  districts?: string[]; // For Advocates
  states?: string[]; // For Advocates
  expertise?: ProductType[]; // For Advocates
  tags?: string[]; // AI Features: e.g. "Fast TAT", "Complex Cases", "High Value"
}

export interface Hub {
  id: string;
  code: string;
  name: string;
  email: string;
  state: string;
  district: string;
}

export interface Query {
  id: string;
  text: string;
  raisedBy: string; // User ID
  raisedAt: string; // ISO Date
  attachments?: string[];
  directedTo?: UserRole; // Target role (e.g. intended for Bank or Advocate)
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
  responseAttachments?: string[];
}

export interface AuditLogEntry {
  action: string;
  performedBy: string; // User ID or 'SYSTEM'
  timestamp: string;
  details?: string;
}

export interface TransferRequest {
  requestedBy: string; // User ID
  requestedByName: string;
  requestedAt: string;
}

export interface Assignment {
  id: string;
  lan: string; // Loan Account Number
  pan: string;
  borrowerName: string;
  propertyAddress: string;
  state: string;
  district: string;
  pincode: string;
  
  // New fields for allocation logic
  borrowerState?: string;
  borrowerDistrict?: string;

  productType: ProductType;
  scope: 'TSR' | 'LOR' | 'PRR';
  priority?: 'Standard' | 'Urgent' | 'High Value'; // AI Logic
  
  status: AssignmentStatus;
  
  // Ownership & Allocation
  ownerId?: string; // Bank User ID
  hubId?: string;
  advocateId?: string;
  transferRequest?: TransferRequest; // Logic for transferring ownership
  
  // Timestamps & Deadlines
  createdAt: string;
  dueDate?: string; // Deadline for advocate
  claimedAt?: string;
  allocatedAt?: string;
  completedAt?: string;
  
  // Data
  documents: { name: string; category: string; uploadedBy: string; date: string }[];
  queries: Query[];
  finalReportUrl?: string;
  finalReportVersions?: { url: string; date: string; remarks: string }[];

  // Report Delivery
  reportDelivery?: {
    deliveredAt: string;
    deliveredTo: Array<{
      name: string;
      email: string;
      role: 'Owner' | 'Hub' | 'CC';
    }>;
    deliveredBy: string; // User ID who approved
    deliveredByName: string;
    reportUrl: string;
  };

  // Audit
  auditTrail: AuditLogEntry[];
}
