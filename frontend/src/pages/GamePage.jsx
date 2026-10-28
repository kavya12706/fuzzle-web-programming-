import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import GuestBanner from '../components/GuestBanner';

export default function GamePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'easy';

  const { isGuest } = useAuth();
  const navigate = useNavigate();

  // Puzzle State
  const [puzzle, setPuzzle] = useState(null); // { id, difficulty, initial_board, has_saved_attempt, attempt }
  const [board, setBoard] = useState(Array(81).fill('0'));
  const [initialBoard, setInitialBoard] = useState(Array(81).fill('0'));
  const [notes, setNotes] = useState({}); // { [cellIndex]: [1, 2, 4] }
  const [selectedCell, setSelectedCell] = useState(0);
  const [history, setHistory] = useState([]); // for undo

  // Controls & Game status
  const [notesMode, setNotesMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [solveModalOpen, setSolveModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastHintIndex, setLastHintIndex] = useState(null);

  // References to prevent stale closures and overlapping saves
  const saveTimeoutRef = useRef(null);
  const currentPuzzleRef = useRef(null);
  currentPuzzleRef.current = puzzle;

  // Track request reload token for "New Puzzle" button on same difficulty
  const [reloadCount, setReloadCount] = useState(0);

  // Fetch puzzle effect with AbortController and instant state reset
  useEffect(() => {
    const controller = new AbortController();
    let isCancelled = false;

    // 1. Immediately cancel any pending auto-saves from previous puzzle
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // 2. Immediately reset old puzzle state so no stale board lingers
    setLoading(true);
    setPuzzle(null);
    setBoard(Array(81).fill('0'));
    setInitialBoard(Array(81).fill('0'));
    setNotes({});
    setHistory([]);
    setSelectedCell(0);
    setTimerSeconds(0);
    setHintsUsed(0);
    setIsSolved(false);
    setSolveModalOpen(false);
    setStatusMessage('');
    setIsPaused(false);
    setLastHintIndex(null);

    // Is this a request for a fresh puzzle or resuming?
    const isFresh = reloadCount > 0;

    // 3. Fetch puzzle with AbortController signal
    api.puzzles.getRandom(difficulty, isFresh, { signal: controller.signal })
      .then((data) => {
        if (isCancelled || !data) return;

        // Ensure response matches current selected difficulty
        if (data.difficulty !== difficulty) return;

        setPuzzle(data);
        const initArr = data.initial_board.split('');
        setInitialBoard(initArr);

        if (data.has_saved_attempt && data.attempt && !isFresh) {
          // Resume saved attempt
          setBoard(data.attempt.current_board.split(''));
          setNotes(data.attempt.notes || {});
          setTimerSeconds(data.attempt.time_taken || 0);
          setHintsUsed(data.attempt.hints_used || 0);
          setStatusMessage('Resumed your in-progress game ✨');
        } else {
          // Fresh puzzle
          setBoard([...initArr]);
          setNotes({});
          setTimerSeconds(0);
          setHintsUsed(0);
        }

        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError' || isCancelled) {
          // Request was aborted due to rapid difficulty change, ignore cleanly
          return;
        }
        console.error('Failed to load puzzle:', err);
        setStatusMessage('Error loading puzzle. Please check server.');
        setLoading(false);
      });

    // Cleanup: cancel in-flight request if user switches difficulty again
    return () => {
      isCancelled = true;
      controller.abort();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [difficulty, reloadCount]);

  // Timer Tick
  useEffect(() => {
    if (loading || isPaused || isSolved || !puzzle) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, isPaused, isSolved, puzzle]);

  // Format seconds -> mm:ss
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Safe Auto-save for logged-in users
  useEffect(() => {
    // Only auto-save if:
    // - logged in
    // - puzzle is active and loaded
    // - puzzle difficulty matches current difficulty
    // - not solved or loading
    if (isGuest || !puzzle || loading || isSolved) return;
    if (puzzle.difficulty !== difficulty) return;

    const targetPuzzleId = puzzle.id;
    const targetDifficulty = puzzle.difficulty;
    const currentBoardStr = board.join('');

    // Don't save if board is empty
    if (currentBoardStr === Array(81).fill('0').join('')) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      // Re-verify that puzzle hasn't changed during debounce
      if (!currentPuzzleRef.current || 
          currentPuzzleRef.current.id !== targetPuzzleId || 
          currentPuzzleRef.current.difficulty !== targetDifficulty) {
        return;
      }

      try {
        setSaving(true);
        await api.attempts.save({
          puzzle_id: targetPuzzleId,
          current_board: currentBoardStr,
          notes,
          time_taken: timerSeconds,
          hints_used: hintsUsed,
          status: 'in_progress',
        });
      } catch (e) {
        // Silent error on background save
      } finally {
        setSaving(false);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [board, notes, timerSeconds, hintsUsed, isGuest, puzzle, loading, isSolved, difficulty]);

  // Conflict Detection: check if any cell violates Sudoku row, col, or 3x3 block rule
  const conflicts = React.useMemo(() => {
    if (loading || !puzzle) return new Set();
    const conflictSet = new Set();
    const b = board;

    // Check rows and cols
    for (let i = 0; i < 9; i++) {
      const rowSeen = {};
      const colSeen = {};
      for (let j = 0; j < 9; j++) {
        // Row check
        const rIdx = i * 9 + j;
        const rVal = b[rIdx];
        if (rVal !== '0') {
          if (rowSeen[rVal] !== undefined) {
            conflictSet.add(rIdx);
            conflictSet.add(rowSeen[rVal]);
          } else {
            rowSeen[rVal] = rIdx;
          }
        }

        // Col check
        const cIdx = j * 9 + i;
        const cVal = b[cIdx];
        if (cVal !== '0') {
          if (colSeen[cVal] !== undefined) {
            conflictSet.add(cIdx);
            conflictSet.add(colSeen[cVal]);
          } else {
            colSeen[cVal] = cIdx;
          }
        }
      }
    }

    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxSeen = {};
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const idx = (boxRow * 3 + r) * 9 + (boxCol * 3 + c);
            const val = b[idx];
            if (val !== '0') {
              if (boxSeen[val] !== undefined) {
                conflictSet.add(idx);
                conflictSet.add(boxSeen[val]);
              } else {
                boxSeen[val] = idx;
              }
            }
          }
        }
      }
    }

    return conflictSet;
  }, [board, loading, puzzle]);

  // Enter a digit (1-9) or erase (0)
  const handleInputDigit = useCallback((digit) => {
    if (loading || isSolved || isPaused || !puzzle) return;
    if (selectedCell === null || selectedCell < 0 || selectedCell > 80) return;
    if (initialBoard[selectedCell] !== '0') return; // Cannot modify given clues

    const digitStr = digit.toString();

    // Push current state to undo history
    setHistory(prev => [...prev.slice(-30), { board: [...board], notes: { ...notes } }]);

    if (notesMode) {
      if (digit === 0) {
        // Clear notes for cell
        setNotes(prev => {
          const next = { ...prev };
          delete next[selectedCell];
          return next;
        });
        return;
      }

      setNotes(prev => {
        const cellNotes = prev[selectedCell] ? [...prev[selectedCell]] : [];
        const index = cellNotes.indexOf(digit);
        if (index > -1) {
          cellNotes.splice(index, 1);
        } else {
          cellNotes.push(digit);
          cellNotes.sort();
        }
        return { ...prev, [selectedCell]: cellNotes };
      });
    } else {
      // Normal digit input
      const nextBoard = [...board];
      nextBoard[selectedCell] = digitStr;
      setBoard(nextBoard);

      // If user enters digit, clear notes on this cell
      if (digit !== 0) {
        setNotes(prev => {
          const next = { ...prev };
          delete next[selectedCell];
          return next;
        });
      }

      // Check if board is full (no 0s)
      if (!nextBoard.includes('0')) {
        validateAndComplete(nextBoard);
      }
    }
  }, [loading, isSolved, isPaused, puzzle, selectedCell, initialBoard, board, notes, notesMode]);

  // Undo move
  const handleUndo = () => {
    if (history.length === 0 || isSolved || loading) return;
    const last = history[history.length - 1];
    setBoard(last.board);
    setNotes(last.notes);
    setHistory(prev => prev.slice(0, -1));
  };

  // Hint: reveals one cell correctly via server API
  const handleHint = async () => {
    if (!puzzle || isSolved || loading) return;

    let targetIndex = selectedCell;
    // If selected cell already filled or is given, find first empty cell
    if (board[targetIndex] !== '0' || initialBoard[targetIndex] !== '0') {
      targetIndex = board.findIndex(val => val === '0');
    }
    if (targetIndex === -1) return;

    try {
      const data = await api.puzzles.getHint(puzzle.id, targetIndex);
      if (data && data.correct_value) {
        setHistory(prev => [...prev.slice(-30), { board: [...board], notes: { ...notes } }]);
        const nextBoard = [...board];
        nextBoard[targetIndex] = data.correct_value.toString();
        setBoard(nextBoard);
        setSelectedCell(targetIndex);
        setHintsUsed(prev => prev + 1);
        setLastHintIndex(targetIndex);
        setTimeout(() => setLastHintIndex(null), 1200);

        if (!nextBoard.includes('0')) {
          validateAndComplete(nextBoard);
        }
      }
    } catch (err) {
      console.error('Failed to get hint:', err);
    }
  };

  // Solution Validation & Celebration
  const validateAndComplete = async (boardToCheck = board) => {
    if (!puzzle) return;
    const boardStr = boardToCheck.join('');

    try {
      const res = await api.puzzles.validate(puzzle.id, boardStr);
      if (res.is_valid) {
        setIsSolved(true);
        triggerCelebration();

        // If logged in, save completion to database
        if (!isGuest) {
          await api.attempts.save({
            puzzle_id: puzzle.id,
            current_board: boardStr,
            notes,
            time_taken: timerSeconds,
            hints_used: hintsUsed,
            status: 'completed'
          });
        }
        setSolveModalOpen(true);
      } else {
        if (res.errors_count > 0) {
          setStatusMessage(`Almost there! Found ${res.errors_count} misplaced number(s).`);
        } else {
          setStatusMessage('Board is valid so far! Keep going.');
        }
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch (err) {
      setStatusMessage('Validation error. Please try again.');
    }
  };

  // Confetti explosion
  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f472b6', '#c084fc', '#38bdf8', '#4ade80', '#fb923c']
    });
  };

  // Keyboard navigation & inputs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPaused || isSolved || loading) return;

      if (e.key >= '1' && e.key <= '9') {
        handleInputDigit(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleInputDigit(0);
      } else if (e.key === 'n' || e.key === 'N') {
        setNotesMode(prev => !prev);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCell(prev => (prev >= 9 ? prev - 9 : prev));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCell(prev => (prev <= 71 ? prev + 9 : prev));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedCell(prev => (prev % 9 > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedCell(prev => (prev % 9 < 8 ? prev + 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInputDigit, isPaused, isSolved, loading]);

  const selectedValue = board[selectedCell];
  const selectedRow = Math.floor(selectedCell / 9);
  const selectedCol = selectedCell % 9;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <GuestBanner />

      {/* Game Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        background: 'white',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Difficulty Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Difficulty:</span>
          {['easy', 'medium', 'hard'].map(d => (
            <button
              key={d}
              onClick={() => {
                if (difficulty !== d) {
                  setSearchParams({ difficulty: d });
                }
              }}
              className={`btn ${difficulty === d ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.82rem',
                textTransform: 'capitalize'
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Timer & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--pastel-blue-soft)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--pastel-blue)',
            fontWeight: 800,
            fontSize: '1rem',
            color: '#0369a1'
          }}>
            <span>⏱</span>
            <span>{formatTime(timerSeconds)}</span>
          </div>

          <button
            onClick={() => setIsPaused(p => !p)}
            disabled={loading || !puzzle}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>

          <button
            onClick={() => setReloadCount(c => c + 1)}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            title="Load a brand new puzzle of this difficulty"
          >
            🔄 New Puzzle
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div style={{
          background: 'var(--pastel-lavender-soft)',
          border: '1px solid var(--pastel-lavender)',
          color: '#6b21a8',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '0.9rem'
        }}>
          {statusMessage}
        </div>
      )}

      {/* Main Sudoku Board & Assist Panel */}
      <div className="sudoku-container">
        {loading ? (
          <div 
            className="sudoku-board-wrapper" 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: '1 / 1',
              background: 'linear-gradient(135deg, #fdfbf7 0%, #faf5ff 100%)',
              textAlign: 'center',
              padding: '2rem'
            }}
          >
            <span style={{ fontSize: '3rem', display: 'inline-block', animation: 'pulse 1s infinite', marginBottom: '0.75rem' }}>
              🧩
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7e22ce' }}>
              Loading {difficulty.toUpperCase()} Puzzle...
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              Fetching verified board from MariaDB
            </p>
          </div>
        ) : isPaused ? (
          <div className="sudoku-board-wrapper" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: '1 / 1',
            background: '#faf5ff'
          }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>☕</span>
            <h3 style={{ color: '#6b21a8', fontWeight: 800 }}>Game Paused</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Take a breath!</p>
            <button onClick={() => setIsPaused(false)} className="btn btn-primary">
              Resume Solving
            </button>
          </div>
        ) : (
          <div className="sudoku-board-wrapper">
            {/* React key based on puzzle.id forces clean remounting without glitch */}
            <div 
              key={`puzzle-board-${puzzle ? puzzle.id : 'none'}`}
              className="sudoku-board"
            >
              {board.map((val, idx) => {
                const row = Math.floor(idx / 9);
                const col = idx % 9;
                const isGiven = initialBoard[idx] !== '0';
                const isSelected = selectedCell === idx;
                const isMatchingNumber = val !== '0' && selectedValue !== '0' && val === selectedValue;
                const isSameUnit = row === selectedRow || col === selectedCol;
                const hasConflict = conflicts.has(idx);
                const isHinted = lastHintIndex === idx;
                const cellNotes = notes[idx] || [];

                let cellClass = 'sudoku-cell';
                if (isGiven) cellClass += ' given';
                else if (val !== '0') cellClass += ' user-filled';

                if (isSelected) cellClass += ' selected';
                else if (isMatchingNumber) cellClass += ' matching-number';
                else if (isSameUnit) cellClass += ' same-unit';

                if (hasConflict) cellClass += ' conflict';
                if (isHinted) cellClass += ' hinted';
                if (row === 2 || row === 5) cellClass += ' row-boundary';

                return (
                  <div
                    key={`cell-${puzzle ? puzzle.id : 'p'}-${idx}`}
                    className={cellClass}
                    onClick={() => setSelectedCell(idx)}
                  >
                    {val !== '0' ? (
                      val
                    ) : cellNotes.length > 0 ? (
                      <div className="notes-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                          <div key={n} className="note-item">
                            {cellNotes.includes(n) ? n : ''}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Controls & Keypad */}
        <div style={{ maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Action Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            <button
              onClick={handleUndo}
              disabled={loading || history.length === 0}
              className="keypad-btn action-btn"
              title="Undo last move"
            >
              <span>↩️</span>
              <span style={{ fontSize: '0.75rem' }}>Undo</span>
            </button>

            <button
              onClick={() => handleInputDigit(0)}
              disabled={loading}
              className="keypad-btn action-btn"
              title="Erase cell value"
            >
              <span>🧹</span>
              <span style={{ fontSize: '0.75rem' }}>Erase</span>
            </button>

            <button
              onClick={() => setNotesMode(m => !m)}
              disabled={loading}
              className="keypad-btn action-btn"
              style={{
                background: notesMode ? 'var(--pastel-lavender)' : 'white',
                borderColor: notesMode ? '#a855f7' : 'var(--pastel-lavender)'
              }}
              title="Toggle pencil notes mode (N)"
            >
              <span>✏️</span>
              <span style={{ fontSize: '0.75rem', fontWeight: notesMode ? 800 : 700 }}>
                Notes {notesMode ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={handleHint}
              disabled={loading || !puzzle}
              className="keypad-btn action-btn"
              title="Reveal hint for cell"
            >
              <span>💡</span>
              <span style={{ fontSize: '0.75rem' }}>Hint ({hintsUsed})</span>
            </button>
          </div>

          {/* Number Keypad (1 - 9) */}
          <div className="keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleInputDigit(num)}
                disabled={loading}
                className="keypad-btn"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => validateAndComplete()}
              disabled={loading || !puzzle}
              className="keypad-btn action-btn"
              style={{ background: 'var(--pastel-mint-soft)', color: '#15803d', borderColor: 'var(--pastel-mint)' }}
              title="Verify solution with PHP server"
            >
              <span>✓ Check</span>
            </button>
          </div>

          {saving && (
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
              Auto-saving in-progress game to database...
            </div>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {solveModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '3.5rem', display: 'inline-block', marginBottom: '0.5rem' }}>
              🎉
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.25rem' }}>
              Splendidly Solved!
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              You completed the <strong style={{ textTransform: 'capitalize' }}>{difficulty}</strong> puzzle in{' '}
              <strong style={{ color: '#a855f7' }}>{formatTime(timerSeconds)}</strong>.
            </p>

            <div style={{
              background: 'var(--pastel-lavender-soft)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--pastel-lavender)',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-around'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>TIME</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6b21a8' }}>{formatTime(timerSeconds)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>HINTS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6b21a8' }}>{hintsUsed}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>DIFFICULTY</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6b21a8', textTransform: 'capitalize' }}>{difficulty}</div>
              </div>
            </div>

            {isGuest ? (
              <p style={{ fontSize: '0.85rem', color: '#be185d', marginBottom: '1.25rem' }}>
                Note: As a guest, this solve is not logged in your streaks. Sign up to save!
              </p>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#15803d', marginBottom: '1.25rem', fontWeight: 700 }}>
                ✨ Solve recorded in your daily streak and activity calendar!
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setReloadCount(c => c + 1)}
                className="btn btn-primary"
              >
                Play Another
              </button>
              {!isGuest && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-secondary"
                >
                  View Streak
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
