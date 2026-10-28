import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      background: 'rgba(255, 255, 255, 0.75)',
      borderTop: '1px solid rgba(226, 232, 240, 0.8)',
      padding: '2.5rem 1.5rem',
      marginTop: 'auto',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🧩</span>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Fuzzle
          </span>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
            Mindful daily Sudoku for relaxed mental clarity
          </span>
        </div>

        {/* Tech Badges */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem'
        }}>
          <span className="badge badge-medium">⚡ React + Vite</span>
          <span className="badge badge-easy">🐘 PHP 8.5.12 API</span>
          <span className="badge badge-hard">🐬 MariaDB + PDO</span>
          <span className="badge badge-medium" style={{ background: '#fdf2f8', borderColor: '#fbcfe8', color: '#be185d' }}>
            🔒 Prepared Statements & Hashed Passwords
          </span>
        </div>

        {/* Viva tip note */}
        <p style={{
          fontSize: '0.85rem',
          color: '#94a3b8',
          maxWidth: '700px',
          lineHeight: 1.6
        }}>
          <strong>Viva Tip:</strong> React makes HTTP requests with <code style={{ color: '#a855f7' }}>credentials: 'include'</code> to the PHP API on port 8000. PHP uses PDO with prepared statements to query MariaDB and stores session cookies securely using HttpOnly and SameSite=Lax.
        </p>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Runs locally on localhost • Designed with pastel warmth
        </div>
      </div>
    </footer>
  );
}

