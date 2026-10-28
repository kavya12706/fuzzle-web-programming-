import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function WelcomePage() {
  const { user, loading, enterAsGuest } = useAuth();
  const navigate = useNavigate();

  // If already authenticated via PHP session, skip welcome gate and proceed directly into site
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{
        minHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: '#64748b'
      }}>
        <span style={{ fontSize: '3rem', display: 'inline-block', animation: 'pulse 1s infinite' }}>
          🧩
        </span>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7e22ce' }}>
          Loading Fuzzle...
        </div>
      </div>
    );
  }

  const handlePlayAsGuest = () => {
    enterAsGuest();
    navigate('/play');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '75vh',
      padding: '1.5rem'
    }}>
      <div className="card" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '3rem 2.25rem',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '2px solid var(--pastel-lavender)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 245, 255, 0.95) 100%)'
      }}>
        {/* Brand Icon & Name */}
        <div>
          <div style={{
            fontSize: '3.5rem',
            lineHeight: 1,
            marginBottom: '0.75rem',
            filter: 'drop-shadow(0 4px 10px rgba(192, 132, 252, 0.35))'
          }}>
            🧩
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
            lineHeight: 1.15
          }}>
            Fuzzle
          </h1>
          <p style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#475569',
            marginTop: '0.5rem'
          }}>
            Mindful daily Sudoku for relaxed mental fitness.
          </p>
          <p style={{
            fontSize: '0.9rem',
            color: '#64748b',
            marginTop: '0.35rem',
            lineHeight: 1.5
          }}>
            Choose how you would like to begin your solving journey today.
          </p>
        </div>

        {/* Three Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          width: '100%',
          marginTop: '0.5rem'
        }}>
          <button
            onClick={() => navigate('/login?mode=login')}
            className="btn btn-primary"
            style={{
              padding: '0.85rem 1.5rem',
              fontSize: '1.05rem',
              width: '100%'
            }}
          >
            🔑 Sign In
          </button>

          <button
            onClick={() => navigate('/login?mode=signup')}
            className="btn btn-secondary"
            style={{
              padding: '0.85rem 1.5rem',
              fontSize: '1.05rem',
              width: '100%',
              background: 'white',
              borderColor: 'var(--pastel-pink)',
              color: '#be185d'
            }}
          >
            ✨ Sign Up (Free)
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '0.25rem 0',
            color: '#cbd5e1'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ padding: '0 0.75rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <button
            onClick={handlePlayAsGuest}
            className="btn btn-pastel-blue"
            style={{
              padding: '0.85rem 1.5rem',
              fontSize: '1.05rem',
              width: '100%',
              fontWeight: 800
            }}
          >
            🌱 Play as Guest
          </button>
        </div>

        {/* Guest info tip */}
        <p style={{
          fontSize: '0.78rem',
          color: '#94a3b8',
          lineHeight: 1.4,
          margin: 0
        }}>
          Guests can play puzzles without logging in. Create an account anytime to save your streaks, time records, and in-progress games.
        </p>
      </div>
    </div>
  );
}

