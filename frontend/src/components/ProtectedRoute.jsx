import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { hasAccess, loading } = useAuth();

  // Show a gentle pastel loading screen while checking existing PHP session
  if (loading) {
    return (
      <div style={{
        minHeight: '70vh',
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
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Checking authentication session
        </p>
      </div>
    );
  }

  // If user has neither logged in nor clicked "Play as Guest", send to Welcome Entry Gate
  if (!hasAccess) {
    return <Navigate to="/welcome" replace />;
  }

  return <Outlet />;
}

