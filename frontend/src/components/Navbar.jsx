import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isGuest, hasAccess, logout, exitGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isWelcomePage = location.pathname === '/welcome';

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
  };

  const handleExitGuest = () => {
    exitGuest();
    navigate('/welcome');
  };

  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.85rem 1.5rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand Logo */}
        <Link 
          to={hasAccess ? '/' : '/welcome'} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: '#334155'
          }}
        >
          <span style={{
            fontSize: '1.75rem',
            lineHeight: 1,
            filter: 'drop-shadow(0 2px 4px rgba(192, 132, 252, 0.3))'
          }}>🧩</span>
          <span style={{
            fontSize: '1.45rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>
            Fuzzle
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            background: 'var(--pastel-pink-soft)',
            color: '#be185d',
            border: '1px solid var(--pastel-pink)',
            padding: '0.15rem 0.5rem',
            borderRadius: 'var(--radius-pill)'
          }}>
            Sudoku
          </span>
        </Link>

        {/* If on Welcome Entry Gate: No navbar navigation links are shown or usable */}
        {isWelcomePage ? (
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
            Welcome to Mindful Sudoku
          </div>
        ) : (
          <>
            {/* Navigation Links for Entered Users / Guests */}
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem'
            }}>
              <Link to="/" style={{
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: location.pathname === '/' ? '#a855f7' : '#64748b',
                transition: 'color 0.2s'
              }}>
                Home
              </Link>

              <Link to="/play" style={{
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: location.pathname.startsWith('/play') ? '#a855f7' : '#64748b',
                transition: 'color 0.2s'
              }}>
                Play
              </Link>

              <Link to="/dashboard" style={{
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: location.pathname === '/dashboard' ? '#a855f7' : '#64748b',
                transition: 'color 0.2s'
              }}>
                Dashboard
              </Link>
            </nav>

            {/* User / Auth status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {isGuest ? (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--pastel-blue-soft)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--pastel-blue)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0369a1'
                  }}>
                    <span>🌱</span>
                    <span>Guest Mode</span>
                  </div>

                  <Link to="/login" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
                    Sign In
                  </Link>

                  <button 
                    onClick={handleExitGuest} 
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                    title="Exit guest mode and return to welcome gate"
                  >
                    Exit guest mode
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--pastel-lavender-soft)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--pastel-lavender)'
                  }}>
                    <span style={{ fontSize: '1rem' }}>✨</span>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#6b21a8',
                      maxWidth: '160px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.email}
                    </span>
                  </div>

                  <button 
                    onClick={handleLogout} 
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
                  >
                    Log Out
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
