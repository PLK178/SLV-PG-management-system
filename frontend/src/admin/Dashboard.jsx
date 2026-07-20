import React, { useState, useEffect } from 'react';
import { 
  Home, Users, CreditCard, AlertCircle, LogOut, Plus, Trash2, Edit3, 
  TrendingUp, CheckCircle, Clock, Search, MapPin, Phone, Mail, Calendar, DollarSign
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Load state from our shared API layer
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [outings, setOutings] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const roomsData = await api.getRooms();
        setRooms(roomsData);
        const tenantsData = await api.getTenants();
        setTenants(tenantsData);
        const paymentsData = await api.getPayments();
        setPayments(paymentsData);
        const complaintsData = await api.getComplaints();
        setComplaints(complaintsData);
        const outingsData = await api.getOutings();
        setOutings(outingsData);
      } catch (err) {
        console.error("Failed to load dashboard data from backend", err);
      }
    };
    loadData();
  }, [activeTab]); // reload data when active tab changes

  // Save updates helper
  const updateRooms = async (newRooms) => {
    setRooms(newRooms);
    try {
      await api.saveRooms(newRooms);
    } catch (err) {
      console.error(err);
    }
  };

  const updateTenants = async (newTenants) => {
    setTenants(newTenants);
    try {
      await api.saveTenants(newTenants);
    } catch (err) {
      console.error(err);
    }
  };

  const updateComplaints = async (newComplaints) => {
    setComplaints(newComplaints);
    try {
      await api.saveComplaints(newComplaints);
    } catch (err) {
      console.error(err);
    }
  };

  const updateOutings = async (newOutings) => {
    setOutings(newOutings);
    try {
      await api.saveOutings(newOutings);
    } catch (err) {
      console.error(err);
    }
  };

  // Modal control states
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({ number: '', type: 'Single', rent: '', floor: '1st', status: 'Vacant' });

  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [tenantForm, setTenantForm] = useState({ name: '', email: '', phone: '', room: '', joinDate: '', paymentStatus: 'Paid' });

  // Add search state
  const [searchTerm, setSearchTerm] = useState('');

  // Stats calculation
  const totalRooms = rooms.length;
  const occupiedRoomsCount = rooms.filter(r => r.status === 'Occupied').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRoomsCount / totalRooms) * 100) : 0;
  const activeTenantsCount = tenants.length;
  const totalRevenue = payments.filter(p => p.status === 'Success').reduce((sum, p) => sum + p.amount, 0);
  const pendingComplaintsCount = complaints.filter(c => c.status === 'Pending').length;

  // Handlers for Rooms
  const handleOpenRoomModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setRoomForm({ ...room });
    } else {
      setEditingRoom(null);
      setRoomForm({ number: '', type: 'Single', rent: '', floor: '1st', status: 'Vacant' });
    }
    setRoomModalOpen(true);
  };

  const handleSaveRoom = (e) => {
    e.preventDefault();
    if (editingRoom) {
      updateRooms(rooms.map(r => r.id === editingRoom.id ? { ...editingRoom, ...roomForm, rent: Number(roomForm.rent) } : r));
    } else {
      const newRoom = {
        id: Date.now(),
        ...roomForm,
        rent: Number(roomForm.rent)
      };
      updateRooms([...rooms, newRoom]);
    }
    setRoomModalOpen(false);
  };

  const handleDeleteRoom = (id) => {
    if (confirm('Are you sure you want to delete this room?')) {
      updateRooms(rooms.filter(r => r.id !== id));
    }
  };

  // Handlers for Tenants
  const handleOpenTenantModal = (tenant = null) => {
    if (tenant) {
      setEditingTenant(tenant);
      setTenantForm({ ...tenant, password: '' });
    } else {
      setEditingTenant(null);
      setTenantForm({ name: '', email: '', phone: '', room: rooms[0]?.number || '', joinDate: new Date().toISOString().split('T')[0], paymentStatus: 'Paid', password: '' });
    }
    setTenantModalOpen(true);
  };

  const handleSaveTenant = (e) => {
    e.preventDefault();
    if (editingTenant) {
      updateTenants(tenants.map(t => t.id === editingTenant.id ? { ...editingTenant, ...tenantForm } : t));
    } else {
      const newTenant = {
        id: Date.now(),
        ...tenantForm
      };
      updateTenants([...tenants, newTenant]);
      
      // Automatically make room Occupied
      updateRooms(rooms.map(r => r.number === tenantForm.room ? { ...r, status: 'Occupied' } : r));
    }
    setTenantModalOpen(false);
  };

  const handleDeleteTenant = (id) => {
    if (confirm('Are you sure you want to checkout/remove this tenant?')) {
      const tenantToRemove = tenants.find(t => t.id === id);
      if (tenantToRemove) {
        // Mark room as Vacant
        updateRooms(rooms.map(r => r.number === tenantToRemove.room ? { ...r, status: 'Vacant' } : r));
      }
      updateTenants(tenants.filter(t => t.id !== id));
    }
  };

  // Toggle Complaint Status
  const handleToggleComplaint = (id) => {
    updateComplaints(complaints.map(c => {
      if (c.id === id) {
        return { ...c, status: c.status === 'Pending' ? 'Resolved' : 'Pending' };
      }
      return c;
    }));
  };

  return (
    <div style={styles.appContainer}>
      {/* Sidebar Navigation */}
      <aside className="glass-panel" style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>
            <Home size={22} color="#6366f1" />
          </div>
          <div>
            <h1 style={styles.brandTitle}>StayEase</h1>
            <span style={styles.brandSub}>PG Admin Panel</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <button 
            style={{ ...styles.navItem, ...(activeTab === 'overview' ? styles.activeNavItem : {}) }}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={18} />
            <span>Overview</span>
          </button>
          <button 
            style={{ ...styles.navItem, ...(activeTab === 'rooms' ? styles.activeNavItem : {}) }}
            onClick={() => setActiveTab('rooms')}
          >
            <Home size={18} />
            <span>Rooms</span>
          </button>
          <button 
            style={{ ...styles.navItem, ...(activeTab === 'payments' ? styles.activeNavItem : {}) }}
            onClick={() => setActiveTab('payments')}
          >
            <CreditCard size={18} />
            <span>Payments</span>
          </button>
          <button 
            style={{ ...styles.navItem, ...(activeTab === 'complaints' ? styles.activeNavItem : {}) }}
            onClick={() => setActiveTab('complaints')}
          >
            <AlertCircle size={18} />
            <span>Complaints ({pendingComplaintsCount})</span>
          </button>
          <button 
            style={{ ...styles.navItem, ...(activeTab === 'outings' ? styles.activeNavItem : {}) }}
            onClick={() => setActiveTab('outings')}
          >
            <Users size={18} />
            <span>Residents & Outings ({outings.filter(o => o.status === 'Out').length} Out)</span>
          </button>
        </nav>

        <button onClick={() => onLogout(false)} style={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Panel Content */}
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard
            </h2>
            <p style={styles.headerSubtitle}>Monitor, optimize and manage stay operations seamlessly.</p>
          </div>
          <div style={styles.headerSearch}>
            <Search size={16} color="#64748b" style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field" 
              style={styles.searchInput}
            />
          </div>
        </header>

        {/* Dashboard OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={styles.gridContainer}>
            {/* Analytics Stats Grid */}
            <div style={styles.statsGrid}>
              <div className="glass-card" style={styles.statCard}>
                <div style={{ ...styles.statIconWrapper, background: 'rgba(99, 102, 241, 0.1)' }}>
                  <Users size={20} color="#6366f1" />
                </div>
                <h4 style={styles.statLabel}>Active Tenants</h4>
                <p style={styles.statVal}>{activeTenantsCount}</p>
                <span style={styles.statTrend}>Live checked-in occupants</span>
              </div>

              <div className="glass-card" style={styles.statCard}>
                <div style={{ ...styles.statIconWrapper, background: 'rgba(16, 185, 129, 0.1)' }}>
                  <Home size={20} color="#10b981" />
                </div>
                <h4 style={styles.statLabel}>Occupancy Rate</h4>
                <p style={styles.statVal}>{occupancyRate}%</p>
                <span style={styles.statTrend}>{occupiedRoomsCount} / {totalRooms} rooms filled</span>
              </div>

              <div className="glass-card" style={styles.statCard}>
                <div style={{ ...styles.statIconWrapper, background: 'rgba(6, 182, 212, 0.1)' }}>
                  <DollarSign size={20} color="#06b6d4" />
                </div>
                <h4 style={styles.statLabel}>Total Revenue</h4>
                <p style={styles.statVal}>₹{totalRevenue.toLocaleString()}</p>
                <span style={styles.statTrend}>Cleared monthly receipts</span>
              </div>

              <div className="glass-card" style={styles.statCard}>
                <div style={{ ...styles.statIconWrapper, background: 'rgba(239, 68, 68, 0.1)' }}>
                  <AlertCircle size={20} color="#ef4444" />
                </div>
                <h4 style={styles.statLabel}>Pending Issues</h4>
                <p style={styles.statVal}>{pendingComplaintsCount}</p>
                <span style={styles.statTrend}>Requires urgent response</span>
              </div>
            </div>

            {/* Quick Summary Tables */}
            {/* Quick Summary Tables */}
            <div style={styles.splitGrid}>
              {/* Detailed Room Occupancy Breakdown */}
              <div className="glass-panel" style={styles.summaryBox}>
                <div style={styles.boxHeader}>
                  <h3 style={styles.boxTitle}>Room Capacity & Vacancy Tracker</h3>
                  <button onClick={() => setActiveTab('rooms')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Manage Rooms</button>
                </div>
                <div style={styles.listContainer}>
                  {rooms.map(r => {
                    const count = tenants.filter(t => t.room === r.number).length;
                    const max = r.type.includes('Single') ? 1 : r.type.includes('Double') ? 2 : 3;
                    return (
                      <div key={r.id} style={styles.summaryItem}>
                        <div>
                          <div style={styles.itemName}>Room {r.number}</div>
                          <div style={styles.itemMeta}>{r.type} • Floor {r.floor}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`status-badge status-${r.status.toLowerCase()}`} style={{ marginRight: '8px' }}>
                            {r.status}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                            {count} / {max} Occupants
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Actions / Activity Feed */}
              <div className="glass-panel" style={styles.summaryBox}>
                <div style={styles.boxHeader}>
                  <h3 style={styles.boxTitle}>Recent Payments</h3>
                  <button onClick={() => setActiveTab('payments')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>View All</button>
                </div>
                <div style={styles.listContainer}>
                  {payments.slice(0, 4).map(p => (
                    <div key={p.id} style={styles.summaryItem}>
                      <div>
                        <div style={styles.itemName}>{p.tenant}</div>
                        <div style={styles.itemMeta}>{p.date} • {p.method}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', color: p.status === 'Success' ? '#10b981' : '#f59e0b' }}>₹{p.amount}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="animate-fade-in">
            <div style={styles.actionHeader}>
              <h3 style={styles.subHeading}>All Rooms List</h3>
              <button className="btn btn-primary" onClick={() => handleOpenRoomModal()}>
                <Plus size={16} /> Add Room
              </button>
            </div>

            <div className="glass-panel" style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Room Number</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Floor</th>
                    <th style={styles.th}>Rent (Monthly)</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms
                    .filter(r => r.number.includes(searchTerm) || r.type.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(r => (
                      <tr key={r.id} style={styles.tableRow}>
                        <td style={styles.td}><strong>{r.number}</strong></td>
                        <td style={styles.td}>{r.type}</td>
                        <td style={styles.td}>{r.floor}</td>
                        <td style={styles.td}>₹{r.rent.toLocaleString()}</td>
                        <td style={styles.td}>
                          <span className={`status-badge status-${r.status.toLowerCase()}`}>{r.status}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionBtns}>
                            <button onClick={() => handleOpenRoomModal(r)} style={styles.actionBtn} title="Edit Room"><Edit3 size={14} /></button>
                            <button onClick={() => handleDeleteRoom(r.id)} style={{ ...styles.actionBtn, color: '#ef4444' }} title="Delete Room"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="animate-fade-in">
            <h3 style={styles.subHeading}>Transaction Logs</h3>
            <div className="glass-panel" style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Tenant</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Method</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
              <tbody>
                {payments
                  .filter(p => p.tenant.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(p => (
                    <tr key={p.id} style={styles.tableRow}>
                      <td style={styles.td}><strong>{p.tenant}</strong></td>
                      <td style={styles.td}>₹{p.amount.toLocaleString()}</td>
                      <td style={styles.td}>{p.date}</td>
                      <td style={styles.td}>{p.method}</td>
                      <td style={styles.td}>
                        <span className={`status-badge ${p.status === 'Success' ? 'status-occupied' : 'status-pending'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div className="animate-fade-in">
          <h3 style={styles.subHeading}>Tenant Support Tickets</h3>
          <div style={styles.complaintsGrid}>
            {complaints.map(c => (
              <div key={c.id} className="glass-card" style={styles.complaintCard}>
                <div style={styles.complaintHeader}>
                  <div>
                    <span style={{ 
                      ...styles.severityTag, 
                      backgroundColor: c.severity === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      color: c.severity === 'High' ? '#ef4444' : '#6366f1'
                    }}>
                      {c.severity} Priority
                    </span>
                  </div>
                  <div>
                    <span className={`status-badge status-${c.status === 'Resolved' ? 'occupied' : 'pending'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                <h4 style={styles.complaintTitle}>{c.issue}</h4>
                <div style={styles.complaintFooter}>
                  <div style={styles.complaintTenant}>
                    <strong>{c.tenant}</strong> (Room {c.room})
                  </div>
                  <button 
                    onClick={() => handleToggleComplaint(c.id)} 
                    className={`btn ${c.status === 'Resolved' ? 'btn-secondary' : 'btn-primary'}`} 
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    {c.status === 'Resolved' ? 'Reopen Ticket' : 'Mark Resolved'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outings Tab */}
      {activeTab === 'outings' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Section 1: Registered Residents */}
          <div>
            <div style={styles.actionHeader}>
              <h3 style={styles.subHeading}>Registered Occupants</h3>
              <button className="btn btn-primary" onClick={() => handleOpenTenantModal()}>
                <Plus size={16} /> Add Resident
              </button>
            </div>

            <div className="glass-panel" style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Contact Info</th>
                    <th style={styles.th}>Assigned Room</th>
                    <th style={styles.th}>Check-In Date</th>
                    <th style={styles.th}>Rent Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants
                    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.room.includes(searchTerm))
                    .map(t => (
                      <tr key={t.id} style={styles.tableRow}>
                        <td style={styles.td}><strong>{t.name}</strong></td>
                        <td style={styles.td}>
                          <div style={{ fontSize: '0.85rem' }}>{t.phone}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.email}</div>
                        </td>
                        <td style={styles.td}>Room {t.room}</td>
                        <td style={styles.td}>{t.joinDate}</td>
                        <td style={styles.td}>
                          <span className={`status-badge status-${t.paymentStatus === 'Paid' ? 'occupied' : 'pending'}`}>
                            {t.paymentStatus}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionBtns}>
                            <button onClick={() => handleOpenTenantModal(t)} style={styles.actionBtn} title="Edit Tenant"><Edit3 size={14} /></button>
                            <button onClick={() => handleDeleteTenant(t.id)} style={{ ...styles.actionBtn, color: '#ef4444' }} title="Checkout Tenant"><LogOut size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Outing timings log */}
          <div>
            <h3 style={{ ...styles.subHeading, marginBottom: '20px' }}>Outing & Curfew Logs</h3>
            <div className="glass-panel" style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Tenant</th>
                    <th style={styles.th}>Room</th>
                    <th style={styles.th}>Departure Time</th>
                    <th style={styles.th}>Expected Return</th>
                    <th style={styles.th}>Actual Return</th>
                    <th style={styles.th}>Purpose</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outings
                    .filter(o => o.tenant.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(o => {
                      const isOverdue = o.status === 'Out' && new Date(o.expectedReturnTime) < new Date();
                      return (
                        <tr key={o.id} style={styles.tableRow}>
                          <td style={styles.td}><strong>{o.tenant}</strong></td>
                          <td style={styles.td}>Room {o.room}</td>
                          <td style={styles.td}>{new Date(o.departureTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td style={styles.td}>{new Date(o.expectedReturnTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td style={styles.td}>{o.actualReturnTime ? new Date(o.actualReturnTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                          <td style={styles.td}>{o.purpose}</td>
                          <td style={styles.td}>
                            <span className={`status-badge status-${o.status === 'Returned' ? 'occupied' : isOverdue ? 'pending' : 'maintenance'}`}>
                              {isOverdue ? 'Overdue' : o.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {o.status === 'Out' && (
                              <button 
                                onClick={() => {
                                  const updated = outings.map(item => item.id === o.id ? { ...item, status: 'Returned', actualReturnTime: new Date().toISOString().substring(0, 16) } : item);
                                  updateOutings(updated);
                                }} 
                                className="btn btn-primary" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              >
                                Check In
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </main>

    {/* Room Modal */}
    {roomModalOpen && (
      <div style={styles.modalOverlay}>
        <div className="glass-panel" style={styles.modalCard}>
          <h3 style={styles.modalTitle}>{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
          <form onSubmit={handleSaveRoom} style={styles.modalForm}>
            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Room Number</label>
              <input 
                type="text" 
                className="input-field" 
                value={roomForm.number} 
                onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })}
                required 
              />
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Type</label>
              <select 
                className="input-field"
                style={{ background: '#12141c', color: 'white' }}
                value={roomForm.type} 
                onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
              >
                <option value="Single">Single Occupancy</option>
                <option value="Double Sharing">Double Sharing</option>
                <option value="Triple Sharing">Triple Sharing</option>
              </select>
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Monthly Rent (₹)</label>
              <input 
                type="number" 
                className="input-field" 
                value={roomForm.rent} 
                onChange={(e) => setRoomForm({ ...roomForm, rent: e.target.value })}
                required 
              />
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Floor</label>
              <select 
                className="input-field"
                style={{ background: '#12141c', color: 'white' }}
                value={roomForm.floor} 
                onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
              >
                <option value="Ground">Ground Floor</option>
                <option value="1st">1st Floor</option>
                <option value="2nd">2nd Floor</option>
                <option value="3rd">3rd Floor</option>
              </select>
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Status</label>
              <select 
                className="input-field"
                style={{ background: '#12141c', color: 'white' }}
                value={roomForm.status} 
                onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
              >
                <option value="Vacant">Vacant</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div style={styles.modalActions}>
              <button type="button" className="btn btn-secondary" onClick={() => setRoomModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Room</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Tenant Modal */}
    {tenantModalOpen && (
      <div style={styles.modalOverlay}>
        <div className="glass-panel" style={styles.modalCard}>
          <h3 style={styles.modalTitle}>{editingTenant ? 'Edit Tenant Profile' : 'Register New Tenant'}</h3>
          <form onSubmit={handleSaveTenant} style={styles.modalForm}>
            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={tenantForm.name} 
                onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                required 
              />
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Email</label>
              <input 
                type="email" 
                className="input-field" 
                value={tenantForm.email} 
                onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                required 
              />
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Phone Number</label>
              <input 
                type="tel" 
                className="input-field" 
                value={tenantForm.phone} 
                onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                required 
              />
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Assign Room</label>
              <select 
                className="input-field"
                style={{ background: '#12141c', color: 'white' }}
                value={tenantForm.room} 
                onChange={(e) => setTenantForm({ ...tenantForm, room: e.target.value })}
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.number}>Room {r.number} ({r.type} - {r.status})</option>
                ))}
              </select>
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Check-In Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={tenantForm.joinDate} 
                onChange={(e) => setTenantForm({ ...tenantForm, joinDate: e.target.value })}
                required 
              />
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder={editingTenant ? "Leave blank to keep existing password" : "e.g. tenant123 (defaults to tenant123)"}
                value={tenantForm.password || ''} 
                onChange={(e) => setTenantForm({ ...tenantForm, password: e.target.value })}
              />
            </div>

            <div style={styles.modalFormGroup}>
              <label style={styles.modalLabel}>Initial Rent Payment</label>
              <select 
                className="input-field"
                style={{ background: '#12141c', color: 'white' }}
                value={tenantForm.paymentStatus} 
                onChange={(e) => setTenantForm({ ...tenantForm, paymentStatus: e.target.value })}
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div style={styles.modalActions}>
              <button type="button" className="btn btn-secondary" onClick={() => setTenantModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Register</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
}

const styles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
  },
  sidebar: {
    width: '260px',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    borderRight: '1px solid var(--border-color)',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  brandIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(99, 102, 241, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  brandSub: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexGrow: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all var(--transition-fast)',
  },
  activeNavItem: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    color: '#a5b4fc',
    fontWeight: '600',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    color: '#ef4444',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginTop: 'auto',
    transition: 'all var(--transition-fast)',
  },
  mainContent: {
    marginLeft: '260px',
    flexGrow: 1,
    padding: '40px',
    maxWidth: '1200px',
    width: 'calc(100% - 260px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  headerTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  headerSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  },
  headerSearch: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  searchInput: {
    paddingLeft: '36px',
    width: '240px',
    height: '40px',
  },
  gridContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  statCard: {
    borderRadius: '16px',
    padding: '24px',
  },
  statIconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    fontWeight: '500',
  },
  statVal: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  statTrend: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  summaryBox: {
    borderRadius: '16px',
    padding: '24px',
  },
  boxHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  boxTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.1rem',
    fontWeight: '600',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  itemName: {
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  itemMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  subHeading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  tableCard: {
    borderRadius: '16px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    borderBottom: '1px solid var(--border-color)',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  th: {
    padding: '16px 20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tableRow: {
    borderBottom: '1px solid var(--border-color)',
    transition: 'background var(--transition-fast)',
  },
  td: {
    padding: '16px 20px',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  actionBtns: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    transition: 'all var(--transition-fast)',
  },
  complaintsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  complaintCard: {
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  complaintHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityTag: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  complaintTitle: {
    fontSize: '0.95rem',
    fontWeight: '500',
    lineHeight: '1.5',
    color: 'var(--text-primary)',
    flexGrow: 1,
  },
  complaintFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '14px',
  },
  complaintTenant: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalCard: {
    width: '100%',
    maxWidth: '460px',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: 'var(--shadow-lg)',
  },
  modalTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.35rem',
    fontWeight: '700',
    marginBottom: '20px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalFormGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  modalLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  }
};
