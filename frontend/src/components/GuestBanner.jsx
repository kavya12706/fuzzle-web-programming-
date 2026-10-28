import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GuestBanner() {
  const { isGuest } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!isGuest || dismissed) {
    return null;
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fdf2f8 0%, #faf5ff 50%, #f0f9ff 100%)',
      border: '1px solid var(--pastel-pink)',
      borderRadius: 'var(--radius-md)',
      padding: '0.85rem 1.25rem',
      marginBottom: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.75rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <span style={{ fontSize: '1.2rem' }}>🌱</span>
        <div>
          <strong style={{ color: '#be185d', fontSize: '0.9rem' }}>Playing as Guest: </strong>
          <span style={{ color: '#475569', fontSize: '0.88rem' }}>
            You can solve puzzles freely! However, streaks, calendar history, and in-progress saves require an account.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link 
          to="/login" 
          className="btn btn-primary"
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
        >
          Sign In to Save
        </Link>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0.2rem 0.5rem'
          }}
          title="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

