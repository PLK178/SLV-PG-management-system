import React, { useState } from 'react';
import AdminLogin from './admin/Login';
import AdminDashboard from './admin/Dashboard';
import TenantLogin from './tenant/Login';
import TenantDashboard from './tenant/Dashboard';
import { Shield, Users, LogOut, ArrowRight } from 'lucide-react';

export default function App() {
  const [portal, setPortal] = useState(null); // 'admin' | 'tenant' | null
  const [currentUser, setCurrentUser] = useState(null); // stores tenant profile or admin session true/false

  const handleLogout = () => {
    setCurrentUser(null);
    setPortal(null);
  };

  // If user is logged in
  if (portal === 'admin' && currentUser) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (portal === 'tenant' && currentUser) {
    return <TenantDashboard tenant={currentUser} onLogout={handleLogout} />;
  }

  // If user is inside a login flow
  if (portal === 'admin') {
    return (
      <div>
        <button style={styles.backBtn} onClick={() => setPortal(null)}>
          ← Switch Portal
        </button>
        <AdminLogin onLogin={(user) => setCurrentUser(user)} />
      </div>
    );
  }

  if (portal === 'tenant') {
    return (
      <div>
        <button style={styles.backBtn} onClick={() => setPortal(null)}>
          ← Switch Portal
        </button>
        <TenantLogin onLogin={(user) => setCurrentUser(user)} />
      </div>
    );
  }

  // Otherwise, render landing portal selector screen
  return (
    <div style={styles.container}>
      <div style={styles.gridOverlay}></div>
      <div style={styles.radialGlow}></div>

      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>StayEase</h1>
          <p style={styles.subtitle}>Paying Guest Accommodation Management Hub</p>
        </div>

        <div style={styles.options}>
          <div 
            className="glass-card" 
            style={styles.optionCard}
            onClick={() => setPortal('admin')}
          >
            <div style={{ ...styles.iconWrapper, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <Shield size={28} color="#6366f1" />
            </div>
            <h2 style={styles.cardTitle}>Admin Terminal</h2>
            <p style={styles.cardDesc}>Access insights, rooms overview, tenant registers, and billing history.</p>
            <div style={styles.cardLink}>
              <span>Enter Portal</span> <ArrowRight size={16} />
            </div>
          </div>

          <div 
            className="glass-card" 
            style={styles.optionCard}
            onClick={() => setPortal('tenant')}
          >
            <div style={{ ...styles.iconWrapper, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <Users size={28} color="#10b981" />
            </div>
            <h2 style={styles.cardTitle}>Resident Portal</h2>
            <p style={styles.cardDesc}>Check monthly rents, log warden tickets, and view room profiles.</p>
            <div style={{ ...styles.cardLink, color: '#10b981' }}>
              <span>Enter Portal</span> <ArrowRight size={16} />
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <span>StayEase Guest Management Platform v2.0</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090a0f',
    padding: '24px',
    overflow: 'hidden',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
    backgroundSize: '28px 28px',
    pointerEvents: 'none',
  },
  radialGlow: {
    position: 'absolute',
    width: '800px',
    height: '800px',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(9, 10, 15, 0) 70%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '800px',
    zIndex: 1,
    textAlign: 'center',
  },
  header: {
    marginBottom: '48px',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '3rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '12px',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '1rem',
    letterSpacing: '0.02em',
  },
  options: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    marginBottom: '48px',
  },
  optionCard: {
    padding: '36px',
    borderRadius: '20px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  iconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '12px',
  },
  cardDesc: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    marginBottom: '24px',
    flexGrow: 1,
  },
  cardLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    fontSize: '0.9rem',
    color: '#6366f1',
  },
  backBtn: {
    position: 'absolute',
    top: '24px',
    left: '24px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: '#cbd5e1',
    padding: '8px 16px',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    zIndex: 50,
    transition: 'all 0.2s',
  },
  footer: {
    color: '#64748b',
    fontSize: '0.8rem',
  }
};
App.backBtn = {
  hover: {
    background: 'rgba(255, 255, 255, 0.1)',
  }
};
