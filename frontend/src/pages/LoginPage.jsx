import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, enterAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      // Redirect to home or requested destination
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestClick = (e) => {
    e.preventDefault();
    enterAsGuest();
    navigate('/play');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      padding: '1rem'
    }}>
      <div className="card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem 2rem',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '2px solid var(--pastel-lavender)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <span style={{ fontSize: '2.5rem', display: 'inline-block', marginBottom: '0.5rem' }}>
            {mode === 'signup' ? '🌸' : '🧩'}
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#334155' }}>
            {mode === 'signup' ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>
            {mode === 'signup' 
              ? 'Join to track daily streaks, solve times & save in-progress games.' 
              : 'Sign in to access your stats, streak & saved boards.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--pastel-lavender-soft)',
          padding: '4px',
          borderRadius: 'var(--radius-pill)',
          marginBottom: '1.5rem',
          border: '1px solid var(--pastel-lavender)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: mode === 'login' ? 'white' : 'transparent',
              color: mode === 'login' ? '#7e22ce' : '#64748b',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: mode === 'signup' ? 'white' : 'transparent',
              color: mode === 'signup' ? '#7e22ce' : '#64748b',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: mode === 'signup' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'var(--pastel-pink-soft)',
            border: '1px solid var(--pastel-pink)',
            color: '#be185d',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-subtle)',
                fontFamily: 'var(--font-family)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-subtle)',
                fontFamily: 'var(--font-family)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border-subtle)',
                  fontFamily: 'var(--font-family)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--border-focus)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Guest fallback link */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(226, 232, 240, 0.8)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Just want to solve without an account?{' '}
            <button
              onClick={handleGuestClick}
              style={{
                background: 'none',
                border: 'none',
                color: '#a855f7',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                padding: 0
              }}
            >
              Play as Guest →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
