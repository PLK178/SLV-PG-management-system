import React, { useState, useEffect } from 'react';
import { 
  Home, CreditCard, AlertCircle, LogOut, CheckCircle, Clock, 
  MapPin, Phone, Mail, Calendar, Sparkles, Send, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function TenantDashboard({ tenant, onLogout }) {
  const [roomDetails, setRoomDetails] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [payments, setPayments] = useState([]);
  const [outings, setOutings] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(tenant);
  
  // Forms state
  const [newComplaint, setNewComplaint] = useState('');
  const [severity, setSeverity] = useState('Low');
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Outing timings form states
  const [outingPurpose, setOutingPurpose] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');

  useEffect(() => {
    // Load fresh data
    const rooms = api.getRooms();
    const matchRoom = rooms.find(r => r.number === tenantInfo.room);
    setRoomDetails(matchRoom || { number: tenantInfo.room, type: 'Standard Sharing', rent: 6000, floor: 'Ground', status: 'Occupied' });

    const allComplaints = api.getComplaints();
    setComplaints(allComplaints.filter(c => c.tenant === tenantInfo.name));

    const allPayments = api.getPayments();
    setPayments(allPayments.filter(p => p.tenant === tenantInfo.name));

    const allOutings = api.getOutings();
    setOutings(allOutings.filter(o => o.tenant === tenantInfo.name));
  }, [tenantInfo]);

  // Submit Outing Timing request
  const handleRegisterOuting = (e) => {
    e.preventDefault();
    if (!departureTime || !expectedReturn || !outingPurpose.trim()) return;

    const newOuting = {
      id: Date.now(),
      tenant: tenantInfo.name,
      room: tenantInfo.room,
      departureTime,
      expectedReturnTime: expectedReturn,
      actualReturnTime: null,
      purpose: outingPurpose,
      status: 'Out'
    };

    const updatedOutings = [newOuting, ...api.getOutings()];
    api.saveOutings(updatedOutings);
    setOutings(updatedOutings.filter(o => o.tenant === tenantInfo.name));
    setOutingPurpose('');
    setDepartureTime('');
    setExpectedReturn('');
    alert('Outing timing registered successfully!');
  };

  // Submit Complaint ticket
  const handleAddComplaint = (e) => {
    e.preventDefault();
    if (!newComplaint.trim()) return;

    const newTicket = {
      id: Date.now(),
      tenant: tenantInfo.name,
      room: tenantInfo.room,
      issue: newComplaint,
      severity,
      status: 'Pending'
    };

    const updatedComplaints = [newTicket, ...api.getComplaints()];
    api.saveComplaints(updatedComplaints);
    setComplaints(updatedComplaints.filter(c => c.tenant === tenantInfo.name));
    setNewComplaint('');
    alert('Complaint registered successfully! The warden will inspect shortly.');
  };

  // Mock Pay Rent transaction
  const handlePayRent = () => {
    setPaying(true);
    
    setTimeout(() => {
      // Create transaction receipt
      const newReceipt = {
        id: Date.now(),
        tenant: tenantInfo.name,
        amount: roomDetails?.rent || 6000,
        date: new Date().toISOString().split('T')[0],
        method: 'UPI Instant',
        status: 'Success'
      };

      const updatedPayments = [newReceipt, ...api.getPayments()];
      api.savePayments(updatedPayments);

      // Update tenant status to Paid in DB
      const allTenants = api.getTenants();
      const updatedTenants = allTenants.map(t => t.id === tenantInfo.id ? { ...t, paymentStatus: 'Paid' } : t);
      api.saveTenants(updatedTenants);

      // Update local state
      setPayments(updatedPayments.filter(p => p.tenant === tenantInfo.name));
      setTenantInfo({ ...tenantInfo, paymentStatus: 'Paid' });
      setPaying(false);
      setPaymentSuccess(true);
      
      setTimeout(() => setPaymentSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div style={styles.appContainer}>
      <header className="glass-panel" style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>
            <Sparkles size={20} color="#10b981" />
          </div>
          <div>
            <h1 style={styles.brandTitle}>StayEase Portal</h1>
            <span style={styles.brandSub}>Resident dashboard</span>
          </div>
        </div>
        <div style={styles.userInfo}>
          <span style={styles.welcomeText}>Hello, <strong>{tenantInfo.name}</strong></span>
          <button onClick={() => onLogout(null)} style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main style={styles.mainContent}>
        {/* Welcome Section / Notification */}
        <div className="glass-card glow-primary" style={styles.heroCard}>
          <div style={styles.heroLeft}>
            <h2>Your Stay Overview</h2>
            <p>Access billing receipts, lodge service complaints, and manage hostel stay information.</p>
          </div>
          <div style={styles.heroRight}>
            <div style={styles.roomLabel}>Assigned Room</div>
            <div style={styles.roomNum}>Room {tenantInfo.room}</div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={styles.grid}>
          {/* Room & Stay Details Card */}
          <div className="glass-panel" style={styles.sectionCard}>
            <h3 style={styles.cardHeading}>
              <Home size={18} color="#10b981" /> Accommodation Details
            </h3>
            {roomDetails && (
              <div style={styles.detailsList}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Sharing Type</span>
                  <span style={styles.detailValue}>{roomDetails.type}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Floor Location</span>
                  <span style={styles.detailValue}>{roomDetails.floor} Floor</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Monthly Rent</span>
                  <span style={styles.detailValue}>{formatCurrency(roomDetails.rent)}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Resident Status</span>
                  <span className="status-badge status-occupied" style={{ fontSize: '0.7rem' }}>Active Checked-In</span>
                </div>
              </div>
            )}
          </div>

          {/* Billing & Payments Card */}
          <div className="glass-panel" style={styles.sectionCard}>
            <h3 style={styles.cardHeading}>
              <CreditCard size={18} color="#10b981" /> Rental Payments
            </h3>
            <div style={styles.billingStatus}>
              <div>
                <span style={styles.detailLabel}>Current Month Invoice</span>
                <div style={styles.rentDueVal}>{formatCurrency(roomDetails?.rent || 0)}</div>
              </div>
              <div>
                <span className={`status-badge status-${tenantInfo.paymentStatus === 'Paid' ? 'occupied' : 'pending'}`}>
                  {tenantInfo.paymentStatus}
                </span>
              </div>
            </div>

            {tenantInfo.paymentStatus !== 'Paid' ? (
              <button 
                onClick={handlePayRent} 
                disabled={paying} 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                {paying ? 'Processing Payment...' : 'Instant Pay via UPI'}
              </button>
            ) : (
              <div style={styles.paidFeedback}>
                <ShieldCheck size={20} color="#10b981" />
                <span>Monthly Rent cleared. Receipt generated!</span>
              </div>
            )}

            {paymentSuccess && (
              <div style={styles.toastSuccess}>
                <CheckCircle size={18} /> Rent Paid Successfully! Status Updated.
              </div>
            )}
          </div>
        </div>

        {/* Complaints and History Lists */}
        <div style={styles.splitGrid}>
          {/* Lodge Maintenance Ticket */}
          <div className="glass-panel" style={styles.sectionCard}>
            <h3 style={styles.cardHeading}>
              <AlertCircle size={18} color="#ef4444" /> Raise Maintenance Request
            </h3>
            <form onSubmit={handleAddComplaint} style={styles.complaintForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Describe the issue</label>
                <textarea
                  className="input-field"
                  placeholder="E.g., Bathroom lightbulb needs replacement, wifi not working, etc."
                  value={newComplaint}
                  onChange={(e) => setNewComplaint(e.target.value)}
                  rows="3"
                  required
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Urgency / Priority Level</label>
                <select 
                  className="input-field" 
                  value={severity} 
                  onChange={(e) => setSeverity(e.target.value)}
                  style={{ background: '#12141c', color: 'white' }}
                >
                  <option value="Low">Low (General suggestion)</option>
                  <option value="Medium">Medium (Affects daily use)</option>
                  <option value="High">High (Urgent replacement required)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
                <Send size={14} /> Submit Ticket
              </button>
            </form>
          </div>

          {/* Ticket & Transaction History Tabs */}
          <div className="glass-panel" style={styles.sectionCard}>
            <h3 style={styles.cardHeading}>
              Your Recent Activity Logs
            </h3>
            
            <div style={styles.activityBox}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>COMPLAINTS STATUS</div>
              <div style={styles.logsList}>
                {complaints.length === 0 ? (
                  <p style={styles.emptyText}>No registered issues</p>
                ) : (
                  complaints.map(c => (
                    <div key={c.id} style={styles.logItem}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>{c.issue}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Priority: {c.severity}</div>
                      </div>
                      <span className={`status-badge status-${c.status === 'Resolved' ? 'occupied' : 'pending'}`} style={{ fontSize: '0.65rem' }}>
                        {c.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '20px', marginBottom: '8px' }}>PAST INVOICES</div>
              <div style={styles.logsList}>
                {payments.length === 0 ? (
                  <p style={styles.emptyText}>No transactions found</p>
                ) : (
                  payments.map(p => (
                    <div key={p.id} style={styles.logItem}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{formatCurrency(p.amount)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(p.date)} via {p.method}</div>
                      </div>
                      <span className="status-badge status-occupied" style={{ fontSize: '0.65rem' }}>
                        Success
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Outing timings section */}
        <div style={styles.splitGrid}>
          {/* Register Outing Card */}
          <div className="glass-panel" style={styles.sectionCard}>
            <h3 style={styles.cardHeading}>
              <Clock size={18} color="#10b981" /> Register Outing Timing
            </h3>
            <form onSubmit={handleRegisterOuting} style={styles.complaintForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Departure Date & Time</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Expected Return Date & Time</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Purpose / Destination</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="E.g., Going home for weekend, buying groceries"
                  value={outingPurpose}
                  onChange={(e) => setOutingPurpose(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
                <Send size={14} /> Log Outing
              </button>
            </form>
          </div>

          {/* Outing Logs History Card */}
          <div className="glass-panel" style={styles.sectionCard}>
            <h3 style={styles.cardHeading}>
              Outing & Curfew Logs
            </h3>
            <div style={styles.activityBox}>
              <div style={styles.logsList}>
                {outings.length === 0 ? (
                  <p style={styles.emptyText}>No registered outings</p>
                ) : (
                  outings.map(o => {
                    const isOverdue = o.status === 'Out' && new Date(o.expectedReturnTime) < new Date();
                    return (
                      <div key={o.id} style={styles.logItem}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{o.purpose}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Out: {new Date(o.departureTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Expected: {new Date(o.expectedReturnTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                          {o.actualReturnTime && (
                            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '500' }}>
                              Returned: {new Date(o.actualReturnTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          )}
                        </div>
                        <span className={`status-badge status-${o.status === 'Returned' ? 'occupied' : isOverdue ? 'pending' : 'maintenance'}`} style={{ fontSize: '0.65rem' }}>
                          {isOverdue ? 'Overdue' : o.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 40px',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(16, 185, 129, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.15rem',
    fontWeight: '700',
    lineHeight: 1,
  },
  brandSub: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  welcomeText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  mainContent: {
    flexGrow: 1,
    padding: '40px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  heroCard: {
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(9, 10, 15, 0.4) 100%)',
  },
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  heroRight: {
    textAlign: 'right',
  },
  roomLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  roomNum: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#10b981',
    marginTop: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  sectionCard: {
    borderRadius: '16px',
    padding: '24px',
  },
  cardHeading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.1rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
  },
  detailsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
  },
  detailLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  detailValue: {
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  billingStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentDueVal: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.6rem',
    fontWeight: '800',
    marginTop: '4px',
  },
  paidFeedback: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '20px',
    padding: '12px',
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '10px',
    fontSize: '0.85rem',
    color: '#34d399',
  },
  toastSuccess: {
    marginTop: '12px',
    padding: '12px',
    background: '#10b981',
    color: 'white',
    borderRadius: '8px',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  complaintForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  activityBox: {
    display: 'flex',
    flexDirection: 'column',
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  logItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
  },
  emptyText: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  }
};
