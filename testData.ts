import { Assignment, AssignmentStatus, Hub, ProductType, User, UserRole } from './types';

// Expanded Hubs - 10 major cities
export const TEST_HUBS: Hub[] = [
  { id: 'h1', code: 'HUB-MUM-01', name: 'Mumbai Central Hub', email: 'mum-hub@hdfc.mock', state: 'Maharashtra', district: 'Mumbai' },
  { id: 'h2', code: 'HUB-DEL-01', name: 'Delhi NCR Hub', email: 'del-hub@hdfc.mock', state: 'Delhi', district: 'New Delhi' },
  { id: 'h3', code: 'HUB-BLR-01', name: 'Bangalore Tech Hub', email: 'blr-hub@hdfc.mock', state: 'Karnataka', district: 'Bangalore' },
  { id: 'h4', code: 'HUB-PUN-01', name: 'Pune City Hub', email: 'pun-hub@hdfc.mock', state: 'Maharashtra', district: 'Pune' },
  { id: 'h5', code: 'HUB-HYD-01', name: 'Hyderabad Hub', email: 'hyd-hub@hdfc.mock', state: 'Telangana', district: 'Hyderabad' },
  { id: 'h6', code: 'HUB-CHE-01', name: 'Chennai Hub', email: 'che-hub@hdfc.mock', state: 'Tamil Nadu', district: 'Chennai' },
  { id: 'h7', code: 'HUB-KOL-01', name: 'Kolkata Hub', email: 'kol-hub@hdfc.mock', state: 'West Bengal', district: 'Kolkata' },
  { id: 'h8', code: 'HUB-AHM-01', name: 'Ahmedabad Hub', email: 'ahm-hub@hdfc.mock', state: 'Gujarat', district: 'Ahmedabad' },
  { id: 'h9', code: 'HUB-JAI-01', name: 'Jaipur Hub', email: 'jai-hub@hdfc.mock', state: 'Rajasthan', district: 'Jaipur' },
  { id: 'h10', code: 'HUB-LKO-01', name: 'Lucknow Hub', email: 'lko-hub@hdfc.mock', state: 'Uttar Pradesh', district: 'Lucknow' },
];

// 25 Advocates with diverse expertise
export const TEST_ADVOCATES: User[] = [
  // Maharashtra - 5 advocates
  {
    id: 'adv1', name: 'Rohan Deshmukh', email: 'rohan@legal.mock', role: UserRole.ADVOCATE, hubId: 'h1',
    firmName: 'Deshmukh Associates', states: ['Maharashtra'], districts: ['Mumbai', 'Thane', 'Navi Mumbai'],
    expertise: [ProductType.HL, ProductType.LAP], tags: ['High Value Expert', 'Fast TAT', '10+ Years']
  },
  {
    id: 'adv2', name: 'Priya Kulkarni', email: 'priya@legal.mock', role: UserRole.ADVOCATE, hubId: 'h4',
    firmName: 'Kulkarni Law Firm', states: ['Maharashtra'], districts: ['Pune', 'Satara', 'Kolhapur'],
    expertise: [ProductType.HL, ProductType.BL], tags: ['Commercial Specialist', 'Title Expert']
  },
  {
    id: 'adv3', name: 'Vikram Joshi', email: 'vikram@legal.mock', role: UserRole.ADVOCATE, hubId: 'h1',
    firmName: 'Joshi & Partners', states: ['Maharashtra'], districts: ['Mumbai', 'Raigad'],
    expertise: [ProductType.LAP, ProductType.BL], tags: ['Property Law', 'Fast Processing']
  },
  {
    id: 'adv4', name: 'Neha Patil', email: 'neha@legal.mock', role: UserRole.ADVOCATE, hubId: 'h4',
    firmName: 'Patil Associates', states: ['Maharashtra'], districts: ['Pune', 'Nashik'],
    expertise: [ProductType.HL], tags: ['Residential Expert', 'Customer Focused']
  },
  {
    id: 'adv5', name: 'Amit Malhotra', email: 'amit@legal.mock', role: UserRole.ADVOCATE, hubId: 'h1',
    firmName: 'Malhotra Legal', states: ['Maharashtra', 'Goa'], districts: ['Mumbai', 'Thane', 'Panaji'],
    expertise: [ProductType.HL, ProductType.LAP, ProductType.BL], tags: ['Multi-Product', 'Senior Partner']
  },

  // Delhi NCR - 4 advocates
  {
    id: 'adv6', name: 'Suresh Kumar', email: 'suresh@legal.mock', role: UserRole.ADVOCATE, hubId: 'h2',
    firmName: 'Suresh Law Firm', states: ['Delhi', 'Haryana'], districts: ['New Delhi', 'Gurgaon', 'Noida'],
    expertise: [ProductType.BL, ProductType.LAP], tags: ['Commercial Specialist', 'NCR Expert']
  },
  {
    id: 'adv7', name: 'Kavita Sharma', email: 'kavita@legal.mock', role: UserRole.ADVOCATE, hubId: 'h2',
    firmName: 'Sharma Associates', states: ['Delhi'], districts: ['New Delhi', 'South Delhi', 'East Delhi'],
    expertise: [ProductType.HL, ProductType.LAP], tags: ['Delhi Specialist', 'Quick Response']
  },
  {
    id: 'adv8', name: 'Rajesh Verma', email: 'rajesh@legal.mock', role: UserRole.ADVOCATE, hubId: 'h2',
    firmName: 'Verma Legal Services', states: ['Delhi', 'Uttar Pradesh'], districts: ['New Delhi', 'Noida', 'Ghaziabad'],
    expertise: [ProductType.HL, ProductType.BL], tags: ['Cross-State', 'Experienced']
  },
  {
    id: 'adv9', name: 'Deepak Mehta', email: 'deepak@legal.mock', role: UserRole.ADVOCATE, hubId: 'h2',
    firmName: 'Mehta & Co', states: ['Haryana', 'Punjab'], districts: ['Gurgaon', 'Faridabad', 'Chandigarh'],
    expertise: [ProductType.LAP, ProductType.BL], tags: ['Business Loans', 'Corporate']
  },

  // Karnataka - 3 advocates
  {
    id: 'adv10', name: 'Anjali Rao', email: 'anjali@legal.mock', role: UserRole.ADVOCATE, hubId: 'h3',
    firmName: 'Anjali & Partners', states: ['Karnataka'], districts: ['Bangalore', 'Mysore', 'Mangalore'],
    expertise: [ProductType.HL, ProductType.LAP], tags: ['Residential Specialist', 'Tech City Expert']
  },
  {
    id: 'adv11', name: 'Karthik Gowda', email: 'karthik@legal.mock', role: UserRole.ADVOCATE, hubId: 'h3',
    firmName: 'Gowda Law Associates', states: ['Karnataka'], districts: ['Bangalore', 'Hubli'],
    expertise: [ProductType.HL, ProductType.BL], tags: ['IT Park Expert', 'Commercial']
  },
  {
    id: 'adv12', name: 'Srinivas Reddy', email: 'srinivas@legal.mock', role: UserRole.ADVOCATE, hubId: 'h3',
    firmName: 'Reddy Legal Services', states: ['Karnataka', 'Andhra Pradesh'], districts: ['Bangalore', 'Belgaum', 'Vijayawada'],
    expertise: [ProductType.LAP, ProductType.BL], tags: ['Multi-State', 'Property Expert']
  },

  // Tamil Nadu - 3 advocates
  {
    id: 'adv13', name: 'Ramesh Iyer', email: 'ramesh@legal.mock', role: UserRole.ADVOCATE, hubId: 'h6',
    firmName: 'Iyer & Associates', states: ['Tamil Nadu'], districts: ['Chennai', 'Coimbatore', 'Madurai'],
    expertise: [ProductType.HL, ProductType.LAP], tags: ['Tamil Nadu Expert', 'Fast TAT']
  },
  {
    id: 'adv14', name: 'Lakshmi Sundaram', email: 'lakshmi@legal.mock', role: UserRole.ADVOCATE, hubId: 'h6',
    firmName: 'Sundaram Law Firm', states: ['Tamil Nadu'], districts: ['Chennai', 'Trichy'],
    expertise: [ProductType.HL, ProductType.BL], tags: ['Residential', 'Detail Oriented']
  },
  {
    id: 'adv15', name: 'Venkat Krishnan', email: 'venkat@legal.mock', role: UserRole.ADVOCATE, hubId: 'h6',
    firmName: 'Krishnan Legal', states: ['Tamil Nadu', 'Kerala'], districts: ['Chennai', 'Kochi', 'Trivandrum'],
    expertise: [ProductType.LAP, ProductType.BL], tags: ['South India Expert', 'Commercial']
  },

  // Telangana - 2 advocates
  {
    id: 'adv16', name: 'Harish Chowdary', email: 'harish@legal.mock', role: UserRole.ADVOCATE, hubId: 'h5',
    firmName: 'Chowdary Associates', states: ['Telangana'], districts: ['Hyderabad', 'Warangal'],
    expertise: [ProductType.HL, ProductType.LAP], tags: ['Hyderabad Expert', 'IT Sector']
  },
  {
    id: 'adv17', name: 'Madhavi Reddy', email: 'madhavi@legal.mock', role: UserRole.ADVOCATE, hubId: 'h5',
    firmName: 'Madhavi Law Firm', states: ['Telangana', 'Andhra Pradesh'], districts: ['Hyderabad', 'Secunderabad', 'Vijayawada'],
    expertise: [ProductType.HL, ProductType.BL], tags: ['Dual State', 'Commercial']
  },

  // West Bengal - 2 advocates
  {
    id: 'adv18', name: 'Subrata Das', email: 'subrata@legal.mock', role: UserRole.ADVOCATE, hubId: 'h7',
    firmName: 'Das & Co', states: ['West Bengal'], districts: ['Kolkata', 'Howrah', 'Durgapur'],
    expertise: [ProductType.HL, ProductType.LAP], tags: ['Kolkata Expert', 'Quick Processing']
  },
  {
    id: 'adv19', name: 'Ananya Chatterjee', email: 'ananya@legal.mock', role: UserRole.ADVOCATE, hubId: 'h7',
    firmName: 'Chatterjee Legal', states: ['West Bengal'], districts: ['Kolkata', 'Siliguri'],
    expertise: [ProductType.HL, ProductType.BL], tags: ['Heritage Properties', 'Detail Expert']
  },

  // Gujarat - 2 advocates
  {
    id: 'adv20', name: 'Jayesh Patel', email: 'jayesh@legal.mock', role: UserRole.ADVOCATE, hubId: 'h8',
    firmName: 'Patel & Associates', states: ['Gujarat'], districts: ['Ahmedabad', 'Surat', 'Vadodara'],
    expertise: [ProductType.HL, ProductType.BL], tags: ['Gujarat Expert', 'Commercial']
  },
  {
    id: 'adv21', name: 'Nisha Shah', email: 'nisha@legal.mock', role: UserRole.ADVOCATE, hubId: 'h8',
    firmName: 'Shah Law Firm', states: ['Gujarat'], districts: ['Ahmedabad', 'Gandhinagar'],
    expertise: [ProductType.LAP, ProductType.BL], tags: ['Business Focus', 'Fast Response']
  },

  // Rajasthan - 2 advocates
  {
    id: 'adv22', name: 'Arjun Singh', email: 'arjun@legal.mock', role: UserRole.ADVOCATE, hubId: 'h9',
    firmName: 'Singh Associates', states: ['Rajasthan'], districts: ['Jaipur', 'Udaipur', 'Jodhpur'],
    expertise: [ProductType.HL, ProductType.LAP], tags: ['Rajasthan Expert', 'Property Law']
  },
  {
    id: 'adv23', name: 'Meera Rathore', email: 'meera@legal.mock', role: UserRole.ADVOCATE, hubId: 'h9',
    firmName: 'Rathore Legal', states: ['Rajasthan'], districts: ['Jaipur', 'Kota'],
    expertise: [ProductType.HL, ProductType.BL], tags: ['Residential', 'Commercial']
  },

  // Uttar Pradesh - 2 advocates
  {
    id: 'adv24', name: 'Sandeep Yadav', email: 'sandeep@legal.mock', role: UserRole.ADVOCATE, hubId: 'h10',
    firmName: 'Yadav Law Services', states: ['Uttar Pradesh'], districts: ['Lucknow', 'Kanpur', 'Agra'],
    expertise: [ProductType.HL, ProductType.LAP], tags: ['UP Expert', 'Multi-City']
  },
  {
    id: 'adv25', name: 'Pooja Mishra', email: 'pooja@legal.mock', role: UserRole.ADVOCATE, hubId: 'h10',
    firmName: 'Mishra & Partners', states: ['Uttar Pradesh'], districts: ['Lucknow', 'Varanasi'],
    expertise: [ProductType.HL, ProductType.BL], tags: ['Heritage Expert', 'Detailed Review']
  },
];

// Bank users for each hub
export const TEST_BANK_USERS: User[] = [
  { id: 'u1', name: 'Amit Sharma', email: 'amit.sharma@bank.mock', role: UserRole.BANK_USER, hubId: 'h1' },
  { id: 'u2', name: 'Priya Menon', email: 'priya.menon@bank.mock', role: UserRole.BANK_USER, hubId: 'h2' },
  { id: 'u3', name: 'Rahul Krishna', email: 'rahul.krishna@bank.mock', role: UserRole.BANK_USER, hubId: 'h3' },
  { id: 'u4', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@bank.mock', role: UserRole.BANK_USER, hubId: 'h4' },
  { id: 'u5', name: 'Kiran Reddy', email: 'kiran.reddy@bank.mock', role: UserRole.BANK_USER, hubId: 'h5' },
  { id: 'u6', name: 'Divya Nair', email: 'divya.nair@bank.mock', role: UserRole.BANK_USER, hubId: 'h6' },
  { id: 'u7', name: 'Arjun Bose', email: 'arjun.bose@bank.mock', role: UserRole.BANK_USER, hubId: 'h7' },
  { id: 'u8', name: 'Neha Desai', email: 'neha.desai@bank.mock', role: UserRole.BANK_USER, hubId: 'h8' },
  { id: 'u9', name: 'Rajiv Chauhan', email: 'rajiv.chauhan@bank.mock', role: UserRole.BANK_USER, hubId: 'h9' },
  { id: 'u10', name: 'Anita Verma', email: 'anita.verma@bank.mock', role: UserRole.BANK_USER, hubId: 'h10' },
];

// CT Ops users
export const TEST_OPS_USERS: User[] = [
  { id: 'ops1', name: 'CT Operations Team', email: 'ops@ctmap.mock', role: UserRole.CT_OPS },
  { id: 'ops2', name: 'Admin User', email: 'admin@ctmap.mock', role: UserRole.CT_OPS },
];

// Helper function to generate random assignments
const generateAssignments = (): Assignment[] => {
  const assignments: Assignment[] = [];
  const states = [
    { name: 'Maharashtra', districts: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'] },
    { name: 'Delhi', districts: ['New Delhi', 'South Delhi', 'East Delhi'] },
    { name: 'Karnataka', districts: ['Bangalore', 'Mysore', 'Mangalore', 'Hubli'] },
    { name: 'Tamil Nadu', districts: ['Chennai', 'Coimbatore', 'Madurai', 'Trichy'] },
    { name: 'Telangana', districts: ['Hyderabad', 'Warangal', 'Nizamabad'] },
    { name: 'West Bengal', districts: ['Kolkata', 'Howrah', 'Durgapur'] },
    { name: 'Gujarat', districts: ['Ahmedabad', 'Surat', 'Vadodara'] },
    { name: 'Rajasthan', districts: ['Jaipur', 'Udaipur', 'Jodhpur'] },
    { name: 'Uttar Pradesh', districts: ['Lucknow', 'Kanpur', 'Agra', 'Varanasi'] },
    { name: 'Haryana', districts: ['Gurgaon', 'Faridabad', 'Ghaziabad'] },
  ];

  const borrowerNames = [
    'Rajesh Kumar', 'Priya Sharma', 'Anil Patel', 'Sneha Reddy', 'Vikram Singh',
    'Deepa Iyer', 'Rahul Verma', 'Kavita Menon', 'Suresh Rao', 'Anita Desai',
    'Mohit Gupta', 'Pooja Joshi', 'Sanjay Nair', 'Ritu Malhotra', 'Ajay Kulkarni',
    'Meera Sundaram', 'Nitin Chauhan', 'Swati Das', 'Vivek Mishra', 'Nisha Bose',
    'Karan Mehta', 'Divya Pillai', 'Rohit Agarwal', 'Sonia Kapoor', 'Amit Banerjee',
  ];

  const properties = [
    'Flat 401, Lotus Park', 'Villa 12, Green Valley', 'Plot 203, Tech City',
    'Apartment 5B, Lake View', 'Bungalow, Palm Grove', 'Flat 801, Sky Tower',
    'Villa 45, Riverside', 'Plot 156, Industrial Area', 'Apartment 3C, Hill View',
    'Shop 23, Commercial Complex'
  ];

  const productTypes = [ProductType.HL, ProductType.LAP, ProductType.BL];
  const priorities = ['High Value', 'Normal', 'Urgent'];

  for (let i = 0; i < 65; i++) {
    const state = states[i % states.length];
    const district = state.districts[Math.floor(Math.random() * state.districts.length)];
    const borrowerName = borrowerNames[i % borrowerNames.length];
    const productType = productTypes[i % productTypes.length];
    const property = properties[i % properties.length];
    const priority = priorities[i % priorities.length];

    const assignment: Assignment = {
      id: `asn_${String(i + 1).padStart(3, '0')}`,
      lan: `LN${10000 + i}`,
      pan: `ABC${String(i).padStart(2, '0')}${String(1234 + i)}F`,
      borrowerName,
      propertyAddress: `${property}, ${district}`,
      state: state.name,
      district,
      pincode: `${400000 + i * 100}`,
      borrowerState: state.name,
      borrowerDistrict: district,
      productType,
      scope: 'TSR',
      priority,
      status: AssignmentStatus.PENDING_ALLOCATION, // All pending for testing
      createdAt: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString(), // Random within last 10 days
      documents: [],
      queries: [],
      auditTrail: []
    };

    assignments.push(assignment);
  }

  return assignments;
};

export const TEST_ASSIGNMENTS = generateAssignments();

export const TEST_USERS = [...TEST_BANK_USERS, ...TEST_OPS_USERS, ...TEST_ADVOCATES];
