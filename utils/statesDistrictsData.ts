/**
 * India States and Districts Data
 * Used for advocate coverage area management
 */

export const INDIA_STATES_DISTRICTS: Record<string, string[]> = {
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad',
    'Solapur', 'Kolhapur', 'Ahmednagar', 'Amravati', 'Satara'
  ],
  'Karnataka': [
    'Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum',
    'Tumkur', 'Shimoga', 'Bellary', 'Gulbarga', 'Davangere'
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem',
    'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul'
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar',
    'Bhavnagar', 'Jamnagar', 'Junagadh', 'Anand', 'Nadiad'
  ],
  'Delhi': [
    'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi',
    'West Delhi', 'Central Delhi', 'North East Delhi',
    'North West Delhi', 'South East Delhi', 'South West Delhi'
  ],
  'Telangana': [
    'Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar',
    'Khammam', 'Mahbubnagar', 'Nalgonda', 'Rangareddy', 'Medak'
  ],
  'West Bengal': [
    'Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol',
    'Bardhaman', 'Malda', 'Darjeeling', 'Midnapore', 'Hooghly'
  ],
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer',
    'Bikaner', 'Alwar', 'Bharatpur', 'Bhilwara', 'Sikar'
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut',
    'Noida', 'Ghaziabad', 'Allahabad', 'Gorakhpur', 'Bareilly'
  ],
  'Madhya Pradesh': [
    'Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain',
    'Sagar', 'Ratlam', 'Satna', 'Dewas', 'Rewa'
  ],
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool',
    'Rajahmundry', 'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur'
  ],
  'Kerala': [
    'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam',
    'Palakkad', 'Alappuzha', 'Kannur', 'Kottayam', 'Malappuram'
  ],
  'Punjab': [
    'Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala',
    'Bathinda', 'Mohali', 'Hoshiarpur', 'Firozpur', 'Pathankot'
  ],
  'Haryana': [
    'Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar',
    'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'
  ],
  'Bihar': [
    'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia',
    'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'
  ]
};

/**
 * Get all available states
 */
export const getAllStates = (): string[] => {
  return Object.keys(INDIA_STATES_DISTRICTS).sort();
};

/**
 * Get districts for a specific state
 */
export const getDistrictsForState = (state: string): string[] => {
  return INDIA_STATES_DISTRICTS[state] || [];
};

/**
 * Get districts for multiple states (combined)
 */
export const getDistrictsForStates = (states: string[]): string[] => {
  const districts: string[] = [];
  states.forEach(state => {
    const stateDistricts = getDistrictsForState(state);
    districts.push(...stateDistricts);
  });
  return districts.sort();
};

/**
 * Validate if a state exists
 */
export const isValidState = (state: string): boolean => {
  return state in INDIA_STATES_DISTRICTS;
};

/**
 * Validate if a district exists in a state
 */
export const isValidDistrict = (state: string, district: string): boolean => {
  const districts = getDistrictsForState(state);
  return districts.includes(district);
};

/**
 * Product types (for expertise selection)
 */
export const PRODUCT_TYPES = [
  'Home Loan',
  'Loan Against Property',
  'Business Loan'
];
