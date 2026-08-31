const API_BASE_URL = '/api';

export const api = {
  // Auth API
  adminLogin: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Invalid email or password');
    }
    return await res.json();
  },

  tenantLogin: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/tenant/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Invalid email or password');
    }
    return await res.json();
  },

  // Rooms API
  getRooms: async () => {
    const res = await fetch(`${API_BASE_URL}/rooms`);
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return await res.json();
  },
  saveRooms: async (rooms) => {
    const res = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rooms)
    });
    if (!res.ok) throw new Error('Failed to save rooms');
    return await res.json();
  },

  // Tenants API
  getTenants: async () => {
    const res = await fetch(`${API_BASE_URL}/tenants`);
    if (!res.ok) throw new Error('Failed to fetch tenants');
    return await res.json();
  },
  saveTenants: async (tenants) => {
    const res = await fetch(`${API_BASE_URL}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenants)
    });
    if (!res.ok) throw new Error('Failed to save tenants');
    return await res.json();
  },

  // Payments API
  getPayments: async () => {
    const res = await fetch(`${API_BASE_URL}/payments`);
    if (!res.ok) throw new Error('Failed to fetch payments');
    return await res.json();
  },
  savePayments: async (payments) => {
    const res = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payments)
    });
    if (!res.ok) throw new Error('Failed to save payments');
    return await res.json();
  },

  // Complaints API
  getComplaints: async () => {
    const res = await fetch(`${API_BASE_URL}/complaints`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    return await res.json();
  },
  saveComplaints: async (complaints) => {
    const res = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaints)
    });
    if (!res.ok) throw new Error('Failed to save complaints');
    return await res.json();
  },

  // Outings API
  getOutings: async () => {
    const res = await fetch(`${API_BASE_URL}/outings`);
    if (!res.ok) throw new Error('Failed to fetch outings');
    return await res.json();
  },
  saveOutings: async (outings) => {
    const res = await fetch(`${API_BASE_URL}/outings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outings)
    });
    if (!res.ok) throw new Error('Failed to save outings');
    return await res.json();
  },
};
