// Mock Database Service with LocalStorage persistence

const defaultRooms = [
  { id: 1, number: '101', type: 'Single', rent: 8500, floor: '1st', status: 'Occupied' },
  { id: 2, number: '102', type: 'Double Sharing', rent: 6000, floor: '1st', status: 'Vacant' },
  { id: 3, number: '201', type: 'Single', rent: 9000, floor: '2nd', status: 'Occupied' },
  { id: 4, number: '202', type: 'Triple Sharing', rent: 4500, floor: '2nd', status: 'Maintenance' },
  { id: 5, number: '301', type: 'Double Sharing', rent: 6500, floor: '3rd', status: 'Occupied' }
];

const defaultTenants = [
  { id: 1, name: 'Alice Smith', email: 'alice@example.com', phone: '+91 9876543210', room: '101', joinDate: '2026-01-10', paymentStatus: 'Paid' },
  { id: 2, name: 'Bob Johnson', email: 'bob@example.com', phone: '+91 8765432109', room: '201', joinDate: '2026-03-15', paymentStatus: 'Pending' },
  { id: 3, name: 'Charlie Davis', email: 'charlie@example.com', phone: '+91 7654321098', room: '301', joinDate: '2026-05-01', paymentStatus: 'Paid' }
];

const defaultPayments = [
  { id: 1, tenant: 'Alice Smith', amount: 8500, date: '2026-07-05', method: 'UPI', status: 'Success' },
  { id: 2, tenant: 'Charlie Davis', amount: 6500, date: '2026-07-02', method: 'Net Banking', status: 'Success' },
  { id: 3, tenant: 'Bob Johnson', amount: 9000, date: '2026-07-01', method: 'Cash', status: 'Pending' }
];

const defaultComplaints = [
  { id: 1, tenant: 'Bob Johnson', room: '201', issue: 'AC is leaking water', severity: 'High', status: 'Pending' },
  { id: 2, tenant: 'Alice Smith', room: '101', issue: 'Wifi signal is weak in the corner', severity: 'Low', status: 'Resolved' }
];

const defaultOutings = [
  { id: 1, tenant: 'Alice Smith', room: '101', departureTime: '2026-07-20T10:00', expectedReturnTime: '2026-07-20T18:00', actualReturnTime: '2026-07-20T17:30', purpose: 'Library Study', status: 'Returned' },
  { id: 2, tenant: 'Bob Johnson', room: '201', departureTime: '2026-07-20T14:30', expectedReturnTime: '2026-07-20T21:30', actualReturnTime: null, purpose: 'Dinner with friends', status: 'Out' }
];

const initializeDB = () => {
  if (!localStorage.getItem('pg_rooms')) localStorage.setItem('pg_rooms', JSON.stringify(defaultRooms));
  if (!localStorage.getItem('pg_tenants')) localStorage.setItem('pg_tenants', JSON.stringify(defaultTenants));
  if (!localStorage.getItem('pg_payments')) localStorage.setItem('pg_payments', JSON.stringify(defaultPayments));
  if (!localStorage.getItem('pg_complaints')) localStorage.setItem('pg_complaints', JSON.stringify(defaultComplaints));
  if (!localStorage.getItem('pg_outings')) localStorage.setItem('pg_outings', JSON.stringify(defaultOutings));
};

initializeDB();

export const api = {
  // Rooms API
  getRooms: () => JSON.parse(localStorage.getItem('pg_rooms')),
  saveRooms: (rooms) => localStorage.setItem('pg_rooms', JSON.stringify(rooms)),
  
  // Tenants API
  getTenants: () => JSON.parse(localStorage.getItem('pg_tenants')),
  saveTenants: (tenants) => localStorage.setItem('pg_tenants', JSON.stringify(tenants)),

  // Payments API
  getPayments: () => JSON.parse(localStorage.getItem('pg_payments')),
  savePayments: (payments) => localStorage.setItem('pg_payments', JSON.stringify(payments)),

  // Complaints API
  getComplaints: () => JSON.parse(localStorage.getItem('pg_complaints')),
  saveComplaints: (complaints) => localStorage.setItem('pg_complaints', JSON.stringify(complaints)),

  // Outings API
  getOutings: () => JSON.parse(localStorage.getItem('pg_outings')),
  saveOutings: (outings) => localStorage.setItem('pg_outings', JSON.stringify(outings)),
};
