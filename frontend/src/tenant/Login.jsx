import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, User, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function TenantLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const tenants = api.getTenants();
      const match = tenants.find(t => t.email.toLowerCase() === email.toLowerCase());

      if (match && password === 'tenant123') {
        setIsLoading(false);
        onLogin(match);
      } else {
        setIsLoading(false);
        setError('Invalid Email or Password. Default password is tenant123. Hint: Try alice@example.com / tenant123');
      }
    }, 800);
  };

  return (
    <div style={styles.container}>
      <div style={styles.gridOverlay}></div>
      <div style={styles.radialGlow}></div>

      <div className="glass-panel" style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>
            <User size={32} color="#10b981" />
          </div>
          <h2 style={styles.title}>Tenant Portal</h2>
          <p style={styles.subtitle}>Check room status, log tickets, and view payment dues</p>
        </div>

        {error && (
          <div style={styles.errorContainer}>
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tenant Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                className="input-field"
                placeholder="alice@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ ...styles.submitBtn, background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-hover) 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
          >
            {isLoading ? 'Entering Portal...' : 'Sign In as Resident'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Registered demo emails: <strong>alice@example.com</strong> / <strong>tenant123</strong></span>
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
    overflow: 'hidden',
    padding: '20px',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `radial-gradient(rgba(16, 185, 129, 0.08) 1px, transparent 1px)`,
    backgroundSize: '24px 24px',
    pointerEvents: 'none',
  },
  radialGlow: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(9, 10, 15, 0) 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    borderRadius: '20px',
    padding: '40px',
    zIndex: 1,
    animation: 'fadeIn 0.5s ease-out',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    lineHeight: '1.5',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '24px',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#cbd5e1',
    fontSize: '0.85rem',
    fontWeight: '600',
    letterSpacing: '0.02em',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#64748b',
    pointerEvents: 'none',
  },
  submitBtn: {
    width: '100%',
    marginTop: '8px',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '20px',
  },
  footerText: {
    color: '#64748b',
    fontSize: '0.8rem',
  },
};
