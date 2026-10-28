import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        setLoading(true);
        const res = await api.stats.getDashboard();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [isGuest]);

  const formatSeconds = (sec) => {
    if (!sec || sec === 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // If user is guest, show friendly protected route banner
  if (!authLoading && isGuest) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '4rem auto',
        textAlign: 'center',
        padding: '2.5rem',
        borderRadius: 'var(--radius-xl)',
        background: 'white',
        boxShadow: 'var(--shadow-md)',
        border: '2px solid var(--pastel-lavender)'
      }}>
        <span style={{ fontSize: '3.5rem', display: 'inline-block', marginBottom: '1rem' }}>
          🔒
        </span>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>
          Progress Dashboard is Protected
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          Sign in or create a free account to track your consecutive streaks, 30-day activity heatmap, and personal solve records!
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
            Sign In / Sign Up
          </Link>
          <Link to="/play" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem' }}>
            Play as Guest
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#64748b' }}>
        <span style={{ fontSize: '2.5rem', display: 'inline-block', animation: 'pulse 1s infinite' }}>📊</span>
        <p style={{ marginTop: '0.75rem', fontWeight: 700 }}>Calculating your streaks and stats from MariaDB...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem' }}>⚠️</span>
        <h3 style={{ color: '#be185d', marginTop: '0.5rem' }}>{error}</h3>
        <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const { summary, heatmap_30_days, weekly_activity, recent_puzzles } = data || {};
  const maxWeeklyCount = Math.max(...(weekly_activity?.map(w => w.count) || [1]), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #faf5ff 50%, #f0f9ff 100%)',
        padding: '1.5rem 2rem',
        borderRadius: 'var(--radius-xl)',
        border: '1.5px solid var(--pastel-lavender)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.6rem' }}>👋</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1e293b' }}>
              Welcome, {user?.email}
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            Here is your mindful Sudoku progress, daily streaks, and solving statistics.
          </p>
        </div>

        <Link to="/play" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
          🧩 Play Today's Puzzle
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Current Streak */}
        <div className="card" style={{
          background: 'var(--pastel-pink-soft)',
          border: '1.5px solid var(--pastel-pink)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#be185d', textTransform: 'uppercase' }}>
              Current Streak
            </span>
            <span style={{ fontSize: '1.5rem' }}>🔥</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#9d174d', lineHeight: 1 }}>
            {summary?.current_streak || 0}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#be185d' }}>days</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#be185d' }}>
            {summary?.current_streak > 0 ? 'Consecutive daily activity active!' : 'Solve a puzzle today to start!'}
          </div>
        </div>

        {/* Longest Streak */}
        <div className="card" style={{
          background: 'var(--pastel-lavender-soft)',
          border: '1.5px solid var(--pastel-lavender)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7e22ce', textTransform: 'uppercase' }}>
              Longest Streak
            </span>
            <span style={{ fontSize: '1.5rem' }}>⭐</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#581c87', lineHeight: 1 }}>
            {summary?.longest_streak || 0}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#7e22ce' }}>days</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7e22ce' }}>
            Personal best consistency
          </div>
        </div>

        {/* Total Solved */}
        <div className="card" style={{
          background: 'var(--pastel-blue-soft)',
          border: '1.5px solid var(--pastel-blue)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
              Total Solved
            </span>
            <span style={{ fontSize: '1.5rem' }}>🏆</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#075985', lineHeight: 1 }}>
            {summary?.total_solved || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#0369a1' }}>
            Puzzles verified by PHP API
          </div>
        </div>

        {/* Average Solve Time */}
        <div className="card" style={{
          background: 'var(--pastel-mint-soft)',
          border: '1.5px solid var(--pastel-mint)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
              Avg Solve Time
            </span>
            <span style={{ fontSize: '1.5rem' }}>⏱</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#166534', lineHeight: 1 }}>
            {formatSeconds(summary?.avg_time_sec)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#15803d' }}>
            Across all completed games
          </div>
        </div>
      </div>

      {/* Visual Analytics: 30-Day Heatmap & Weekly Chart */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* 30-Day Calendar Heatmap */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#334155' }}>
                30-Day Activity Heatmap
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Every square represents a day over the last month
              </p>
            </div>
            <span style={{ fontSize: '1.2rem' }}>🗓</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '8px',
            marginBottom: '1rem'
          }}>
            {heatmap_30_days?.map((cell) => {
              let bg = '#f1f5f9';
              let border = '#e2e8f0';
              let textCol = '#94a3b8';

              if (cell.count === 1) {
                bg = 'var(--pastel-blue)';
                border = 'var(--pastel-blue-deep)';
                textCol = '#0369a1';
              } else if (cell.count === 2) {
                bg = 'var(--pastel-lavender)';
                border = 'var(--pastel-lavender-deep)';
                textCol = '#6b21a8';
              } else if (cell.count >= 3) {
                bg = 'var(--pastel-pink)';
                border = 'var(--pastel-pink-deep)';
                textCol = '#9d174d';
              }

              return (
                <div
                  key={cell.date}
                  title={`${cell.date}: ${cell.count} solved`}
                  style={{
                    aspectRatio: '1 / 1',
                    borderRadius: 'var(--radius-sm)',
                    background: bg,
                    border: `1px solid ${border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: textCol,
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span>{cell.date.split('-')[2]}</span>
                  {cell.count > 0 && <span>•</span>}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            <span>Less</span>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f1f5f9', border: '1px solid #cbd5e1' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--pastel-blue)', border: '1px solid var(--pastel-blue-deep)' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--pastel-lavender)', border: '1px solid var(--pastel-lavender-deep)' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--pastel-pink)', border: '1px solid var(--pastel-pink-deep)' }} />
            <span>More</span>
          </div>
        </div>

        {/* Weekly Activity Bar Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#334155' }}>
                Weekly Solves (Last 7 Days)
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Puzzles completed per day
              </p>
            </div>
            <span style={{ fontSize: '1.2rem' }}>📈</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: '140px',
            paddingTop: '1rem',
            gap: '0.5rem',
            borderBottom: '2px solid #e2e8f0'
          }}>
            {weekly_activity?.map((w) => {
              const heightPercent = Math.max(12, Math.round((w.count / maxWeeklyCount) * 100));
              const isToday = w.date === new Date().toISOString().slice(0, 10);

              return (
                <div
                  key={w.date}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6b21a8', marginBottom: '4px' }}>
                    {w.count > 0 ? w.count : ''}
                  </span>

                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${w.count === 0 ? 8 : heightPercent}%`,
                      background: w.count === 0 
                        ? '#f1f5f9' 
                        : isToday 
                        ? 'linear-gradient(180deg, #ec4899 0%, #c084fc 100%)' 
                        : 'linear-gradient(180deg, #c084fc 0%, #38bdf8 100%)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'all 0.3s ease'
                    }}
                  />

                  <div style={{
                    marginTop: '6px',
                    fontSize: '0.75rem',
                    fontWeight: isToday ? 800 : 600,
                    color: isToday ? '#a855f7' : '#64748b'
                  }}>
                    {w.day}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Difficulty breakdown pill list */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: '1.25rem',
            fontSize: '0.85rem'
          }}>
            <div>
              <span className="badge badge-easy">Easy: {summary?.by_difficulty?.easy || 0}</span>
            </div>
            <div>
              <span className="badge badge-medium">Medium: {summary?.by_difficulty?.medium || 0}</span>
            </div>
            <div>
              <span className="badge badge-hard">Hard: {summary?.by_difficulty?.hard || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Solved Games Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#334155', marginBottom: '1rem' }}>
          Recent Completed Puzzles
        </h3>

        {(!recent_puzzles || recent_puzzles.length === 0) ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
            No solved puzzles yet! Start with an Easy puzzle to record your first win.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Difficulty</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Time Taken</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Hints Used</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Completed At</th>
                </tr>
              </thead>
              <tbody>
                {recent_puzzles.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className={`badge badge-${p.difficulty}`}>{p.difficulty}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#334155' }}>
                      {formatSeconds(p.time_taken)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>
                      {p.hints_used}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                      {new Date(p.completed_at).toLocaleDateString()} {new Date(p.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

