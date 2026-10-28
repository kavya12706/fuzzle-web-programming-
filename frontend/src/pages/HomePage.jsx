import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();

  const difficulties = [
    {
      level: 'easy',
      name: 'Easy Breeze',
      badgeClass: 'badge-easy',
      color: 'var(--pastel-mint-soft)',
      border: 'var(--pastel-mint)',
      textColor: '#15803d',
      desc: '40 clues provided. A relaxing start to wake up your mind.',
      timeEstimate: '3-5 mins',
      emoji: '🌱'
    },
    {
      level: 'medium',
      name: 'Flow State',
      badgeClass: 'badge-medium',
      color: 'var(--pastel-blue-soft)',
      border: 'var(--pastel-blue)',
      textColor: '#0369a1',
      desc: '32 clues provided. Satisfying logical chains and deductions.',
      timeEstimate: '6-10 mins',
      emoji: '🌊'
    },
    {
      level: 'hard',
      name: 'Deep Logic',
      badgeClass: 'badge-hard',
      color: 'var(--pastel-pink-soft)',
      border: 'var(--pastel-pink)',
      textColor: '#be185d',
      desc: '26 clues provided. For seasoned solvers ready for deep focus.',
      timeEstimate: '10-20 mins',
      emoji: '🔥'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '3rem 1rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'white',
          padding: '0.4rem 1rem',
          borderRadius: 'var(--radius-pill)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--pastel-lavender)'
        }}>
          <span style={{ fontSize: '1.1rem' }}>✨</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7e22ce' }}>
            Welcome to Fuzzle • Mindful Sudoku Experience
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-1px',
          color: '#1e293b',
          maxWidth: '820px'
        }}>
          A softer, calmer way to sharpen your mind with{' '}
          <span style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Sudoku
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          color: '#64748b',
          maxWidth: '640px',
          fontWeight: 600,
          lineHeight: 1.6
        }}>
          Dynamic puzzles served straight from MariaDB. Play instantly as a guest, or log in to track your streaks, solve times, and 30-day activity heatmap.
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'center',
          marginTop: '0.5rem'
        }}>
          <button 
            onClick={() => navigate('/play?difficulty=easy')}
            className="btn btn-primary"
            style={{ fontSize: '1.05rem', padding: '0.8rem 2rem' }}
          >
            🎮 Play Now (Easy)
          </button>

          {isGuest ? (
            <Link 
              to="/login"
              className="btn btn-secondary"
              style={{ fontSize: '1.05rem', padding: '0.8rem 1.75rem' }}
            >
              Sign Up to Track Streaks
            </Link>
          ) : (
            <Link 
              to="/dashboard"
              className="btn btn-secondary"
              style={{ fontSize: '1.05rem', padding: '0.8rem 1.75rem' }}
            >
              📊 View Your Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* Difficulty Cards */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#334155' }}>
            Choose Your Pace
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            All puzzles are dynamically loaded from our PHP REST API and MariaDB database.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {difficulties.map(d => (
            <div 
              key={d.level}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: `2px solid ${d.border}`,
                background: d.color,
                borderRadius: 'var(--radius-xl)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>{d.emoji}</span>
                  <span className={`badge ${d.badgeClass}`}>{d.level}</span>
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: d.textColor, marginBottom: '0.5rem' }}>
                  {d.name}
                </h3>

                <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {d.desc}
                </p>
              </div>

              <div style={{ borderTop: `1px solid ${d.border}`, paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>
                  ⏱ ~{d.timeEstimate}
                </span>
                <Link
                  to={`/play?difficulty=${d.level}`}
                  className="btn btn-primary"
                  style={{
                    padding: '0.45rem 1.1rem',
                    fontSize: '0.88rem'
                  }}
                >
                  Start {d.level} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Overview */}
      <section className="card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#334155' }}>
            Crafted for Mindful Solvers
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Built with modern web tools and clean engineering.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.75rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem' }}>✏️</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>Pencil Notes & Assist</h4>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Jot candidate numbers inside cells, undo moves, and highlight matching digits or row/col/box conflicts in real-time.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem' }}>💾</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>In-Progress Auto-Save</h4>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Logged-in players never lose their board. PHP securely stores active progress in MariaDB so you can resume on return.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🔥</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>Streaks & 30-Day Heatmap</h4>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Build consecutive daily streaks and visualize your consistency over the last 30 days with a personalized activity heatmap.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🛡️</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>Server-Verified Solutions</h4>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Sudoku solutions are verified on the PHP backend using PDO prepared statements to keep solutions fair and tamper-proof.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

