
import { Assignment, AssignmentStatus, Hub, ProductType, User, UserRole } from './types';

export const MOCK_HUBS: Hub[] = [
  { id: 'h1', code: 'HUB-MUM-01', name: 'Mumbai Central Hub', email: 'mum-hub@hdfc.mock', state: 'Maharashtra', district: 'Mumbai' },
  { id: 'h2', code: 'HUB-DEL-01', name: 'Delhi NCR Hub', email: 'del-hub@hdfc.mock', state: 'Delhi', district: 'New Delhi' },
  { id: 'h3', code: 'HUB-BLR-01', name: 'Bangalore Tech Hub', email: 'blr-hub@hdfc.mock', state: 'Karnataka', district: 'Bangalore' },
  { id: 'h4', code: 'HUB-PUN-01', name: 'Pune City Hub', email: 'pun-hub@hdfc.mock', state: 'Maharashtra', district: 'Pune' },
];

export const MOCK_USERS: User[] = [
  // Bank Users
  { id: 'u1', name: 'Amit Sharma', email: 'amit.sharma@bank.mock', role: UserRole.BANK_USER, hubId: 'h1' },
  { id: 'u2', name: 'Priya Patel', email: 'priya.patel@bank.mock', role: UserRole.BANK_USER, hubId: 'h2' },
  { id: 'u3', name: 'Rahul Verma', email: 'rahul.verma@bank.mock', role: UserRole.BANK_USER, hubId: 'h3' },
  { id: 'u4', name: 'Sneha Singh', email: 'sneha.singh@bank.mock', role: UserRole.BANK_USER, hubId: 'h4' },
  
  // CT Ops
  { id: 'ops1', name: 'CT Operations Team', email: 'ops@ctmap.mock', role: UserRole.CT_OPS },
  { id: 'ops2', name: 'Admin User', email: 'admin@ctmap.mock', role: UserRole.CT_OPS },
  
  // Advocates
  { 
    id: 'adv1', 
    name: 'Rohan Deshmukh', 
    email: 'rohan@legal.mock', 
    role: UserRole.ADVOCATE, 
    firmName: 'Deshmukh Associates', 
    states: ['Maharashtra'], 
    districts: ['Mumbai', 'Pune', 'Thane'],
    expertise: [ProductType.HL, ProductType.LAP],
    tags: ['High Value Expert', 'Fast TAT']
  },
  { 
    id: 'adv2', 
    name: 'Suresh & Co', 
    email: 'suresh@legal.mock', 
    role: UserRole.ADVOCATE, 
    firmName: 'Suresh Law Firm', 
    states: ['Delhi', 'Haryana'], 
    districts: ['New Delhi', 'Gurgaon'],
    expertise: [ProductType.BL, ProductType.LAP],
    tags: ['Commercial Specialist', 'Litigation Expert']
  },
  { 
    id: 'adv3', 
    name: 'Anjali Legal', 
    email: 'anjali@legal.mock', 
    role: UserRole.ADVOCATE, 
    firmName: 'Anjali & Partners', 
    states: ['Karnataka'], 
    districts: ['Bangalore', 'Mysore'],
    expertise: [ProductType.HL],
    tags: ['Residential Specialist']
  },
  { 
    id: 'adv4', 
    name: 'Legal Minds', 
    email: 'contact@legalminds.mock', 
    role: UserRole.ADVOCATE, 
    firmName: 'Legal Minds LLP', 
    states: ['Maharashtra', 'Gujarat'], 
    districts: ['Pune', 'Ahmedabad'],
    expertise: [ProductType.HL, ProductType.BL],
    tags: ['Multi-State', 'Corporate']
  },
];

const threeDaysFromNow = new Date();
threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

const fiveDaysFromNow = new Date();
fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

// Initial Backend Data (Simulating API Load)
export const INITIAL_ASSIGNMENTS: Assignment[] = [
  // -- UNCLAIMED POOL --
  {
    id: 'asn_001',
    lan: 'LN10001',
    pan: 'ABCDE1234F',
    borrowerName: 'Rajesh Kumar',
    propertyAddress: 'Flat 401, Lotus Park, Andheri West',
    state: 'Maharashtra',
    district: 'Mumbai',
    pincode: '400053',
    borrowerState: 'Maharashtra',
    borrowerDistrict: 'Mumbai',
    productType: ProductType.HL,
    scope: 'TSR',
    priority: 'High Value',
    status: AssignmentStatus.UNCLAIMED,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    documents: [],
    queries: [],
    auditTrail: []
  },
  // Duplicate Borrower Check (Same PAN, Diff Property)
  {
    id: 'asn_010',
    lan: 'LN10001-B', 
    pan: 'ABCDE1234F',
    borrowerName: 'Rajesh Kumar',
    propertyAddress: 'Office 202, Business Bay, Bandra',
    state: 'Maharashtra',
    district: 'Mumbai',
    pincode: '400050',
    borrowerState: 'Maharashtra',
    borrowerDistrict: 'Mumbai',
    productType: ProductType.BL,
    scope: 'LOR',
    priority: 'Standard',
    status: AssignmentStatus.UNCLAIMED,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    documents: [],
    queries: [],
    auditTrail: []
  },
  {
    id: 'asn_002',
    lan: 'LN10002',
    pan: 'FGHIJ5678K',
    borrowerName: 'Sneha Gupta',
    propertyAddress: 'Villa 22, Green Valley',
    state: 'Delhi',
    district: 'New Delhi',
    pincode: '110001',
    borrowerState: 'Haryana',
    borrowerDistrict: 'Gurgaon', // Cross-state scenario
    productType: ProductType.LAP,
    scope: 'LOR',
    priority: 'Urgent',
    status: AssignmentStatus.UNCLAIMED,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    documents: [],
    queries: [],
    auditTrail: []
  },
  {
    id: 'asn_004',
    lan: 'LN10003',
    pan: 'KJIHG4321L',
    borrowerName: 'Vikram Singh',
    propertyAddress: 'Plot 45, Indiranagar',
    state: 'Karnataka',
    district: 'Bangalore',
    pincode: '560038',
    borrowerState: 'Karnataka',
    borrowerDistrict: 'Bangalore',
    productType: ProductType.BL,
    scope: 'TSR',
    priority: 'Standard',
    status: AssignmentStatus.UNCLAIMED,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    documents: [],
    queries: [],
    auditTrail: []
  },

  // -- DRAFT (Claimed by u1) --
  {
    id: 'asn_005',
    lan: 'LN20001',
    pan: 'ZZZ999',
    borrowerName: 'Arjun Rampal',
    propertyAddress: 'Penthouse 9, Sky Towers',
    state: 'Maharashtra',
    district: 'Mumbai',
    pincode: '400001',
    borrowerState: 'Maharashtra',
    borrowerDistrict: 'Mumbai',
    productType: ProductType.HL,
    scope: 'TSR',
    priority: 'High Value',
    status: AssignmentStatus.DRAFT,
    ownerId: 'u1',
    hubId: 'h1',
    claimedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    documents: [],
    queries: [],
    auditTrail: []
  },

  // -- PENDING ALLOCATION (Claimed by u1, Docs uploaded) --
  {
    id: 'asn_003',
    lan: 'LN20005',
    pan: 'AAA111',
    borrowerName: 'Demo User',
    propertyAddress: '123 Demo Street',
    state: 'Maharashtra',
    district: 'Mumbai',
    pincode: '400001',
    borrowerState: 'Maharashtra',
    borrowerDistrict: 'Pune', // Borrower lives in Pune, Property in Mumbai
    productType: ProductType.HL,
    scope: 'TSR',
    priority: 'Standard',
    status: AssignmentStatus.PENDING_ALLOCATION,
    ownerId: 'u1',
    hubId: 'h1',
    claimedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    documents: [{ name: 'SaleDeed.pdf', category: 'Sale Deed', uploadedBy: 'u1', date: new Date().toISOString() }],
    queries: [],
    auditTrail: []
  },

  // -- ALLOCATED (Allocated to adv1) --
  {
    id: 'asn_006',
    lan: 'LN30001',
    pan: 'BBB222',
    borrowerName: 'Meera Nair',
    propertyAddress: 'Bungalow 5, Koregaon Park',
    state: 'Maharashtra',
    district: 'Pune',
    pincode: '411001',
    borrowerState: 'Maharashtra',
    borrowerDistrict: 'Pune',
    productType: ProductType.HL,
    scope: 'TSR',
    status: AssignmentStatus.ALLOCATED,
    ownerId: 'u4',
    hubId: 'h4',
    advocateId: 'adv1',
    claimedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    allocatedAt: new Date().toISOString(),
    dueDate: threeDaysFromNow.toISOString(), // Due soon
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    documents: [{ name: 'AllDocs.zip', category: 'Multiple', uploadedBy: 'u4', date: new Date().toISOString() }],
    queries: [],
    auditTrail: []
  },

  // -- QUERY RAISED (Allocated to adv2) --
  {
    id: 'asn_007',
    lan: 'LN40001',
    pan: 'CCC333',
    borrowerName: 'Rajeev Bhatia',
    propertyAddress: 'Shop 12, Karol Bagh',
    state: 'Delhi',
    district: 'New Delhi',
    pincode: '110005',
    borrowerState: 'Delhi',
    borrowerDistrict: 'New Delhi',
    productType: ProductType.LAP,
    scope: 'LOR',
    priority: 'Urgent',
    status: AssignmentStatus.QUERY_RAISED,
    ownerId: 'u2',
    hubId: 'h2',
    advocateId: 'adv2',
    claimedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    allocatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueDate: fiveDaysFromNow.toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    documents: [{ name: 'PropertyTax.pdf', category: 'Tax Receipt', uploadedBy: 'u2', date: new Date().toISOString() }],
    queries: [
      {
        id: 'q1',
        text: 'Previous owner chain link document missing for year 2010-2015.',
        raisedBy: 'adv2',
        raisedAt: new Date().toISOString()
      }
    ],
    auditTrail: []
  },

  // -- PENDING APPROVAL (Report submitted) --
  {
    id: 'asn_008',
    lan: 'LN50001',
    pan: 'DDD444',
    borrowerName: 'Sunil Gavaskar',
    propertyAddress: 'Flat 10, Dadar West',
    state: 'Maharashtra',
    district: 'Mumbai',
    pincode: '400028',
    borrowerState: 'Maharashtra',
    borrowerDistrict: 'Mumbai',
    productType: ProductType.HL,
    scope: 'TSR',
    status: AssignmentStatus.PENDING_APPROVAL,
    ownerId: 'u1',
    hubId: 'h1',
    advocateId: 'adv1',
    claimedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    allocatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 11).toISOString(),
    documents: [{ name: 'Chain.pdf', category: 'Sale Deed', uploadedBy: 'u1', date: new Date().toISOString() }],
    queries: [],
    finalReportUrl: 'report.pdf',
    finalReportVersions: [{ url: 'report.pdf', date: new Date().toISOString(), remarks: 'Clean title found.' }],
    auditTrail: []
  },

  // -- COMPLETED --
  {
    id: 'asn_009',
    lan: 'LN60001',
    pan: 'EEE555',
    borrowerName: 'Virat Kohli',
    propertyAddress: 'Farmhouse, Chhatarpur',
    state: 'Delhi',
    district: 'New Delhi',
    pincode: '110074',
    borrowerState: 'Delhi',
    borrowerDistrict: 'New Delhi',
    productType: ProductType.HL,
    scope: 'TSR',
    priority: 'High Value',
    status: AssignmentStatus.COMPLETED,
    ownerId: 'u2',
    hubId: 'h2',
    advocateId: 'adv2',
    claimedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    allocatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 21).toISOString(),
    documents: [{ name: 'AllDocs.pdf', category: 'Multiple', uploadedBy: 'u2', date: new Date().toISOString() }],
    queries: [],
    finalReportUrl: 'final_report.pdf',
    finalReportVersions: [{ url: 'final_report.pdf', date: new Date().toISOString(), remarks: 'Approved.' }],
    auditTrail: []
  },

  // -- MOCK TRANSFER TEST CASE --
  {
    id: 'asn_099',
    lan: 'LN_TRANSFER_TEST',
    pan: 'TEST12345T',
    borrowerName: 'Transfer User',
    propertyAddress: 'Test Location for Transfer',
    state: 'Delhi',
    district: 'New Delhi',
    pincode: '110001',
    borrowerState: 'Delhi',
    borrowerDistrict: 'New Delhi',
    productType: ProductType.HL,
    scope: 'TSR',
    status: AssignmentStatus.DRAFT,
    ownerId: 'u2', // Owned by Priya (u2), so Amit (u1) can request transfer
    hubId: 'h2',
    claimedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    documents: [],
    queries: [],
    auditTrail: []
  }
];
