/**
 * API Client for Fuzzle
 * 
 * VIVA EXPLANATION:
 * 1. Base URL: The PHP backend runs on http://localhost:8000.
 * 2. Credentials: We include `credentials: 'include'` in every fetch request.
 *    This tells the browser to automatically attach the session cookie (fuzzle_session)
 *    even though the request is cross-origin (port 5173 to port 8000).
 * 3. Headers: We pass 'Content-Type': 'application/json' for POST requests so
 *    PHP's file_get_contents('php://input') can parse it.
 * 4. Error Handling: All responses follow a unified envelope { success: true/false, data, error }.
 *    If success is false or HTTP status >= 400, we reject with a clean error message.
 */

const API_BASE_URL = 'http://localhost:8000';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    // CRUCIAL: 'include' sends the session cookie across localhost ports (5173 -> 8000)
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const message = result?.error || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    if (result && result.success === false) {
      throw new Error(result.error || 'Operation failed');
    }

    return result ? result.data : null;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
export const api = {
  auth: {
    signup: (email, password) => 
      apiRequest('/api/auth/signup', { method: 'POST', body: { email, password } }),
    login: (email, password) => 
      apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }),
    logout: () => 
      apiRequest('/api/auth/logout', { method: 'POST' }),
    me: () => 
      apiRequest('/api/auth/me', { method: 'GET' }),
  },

  puzzles: {
    // difficulty: 'easy' | 'medium' | 'hard', fresh: boolean, options: { signal, ... }
    getRandom: (difficulty = 'easy', fresh = false, options = {}) => 
      apiRequest(`/api/puzzles/random?difficulty=${difficulty}&fresh=${fresh ? 1 : 0}`, { method: 'GET', ...options }),
    getById: (id, options = {}) => 
      apiRequest(`/api/puzzles/${id}`, { method: 'GET', ...options }),
    validate: (puzzle_id, board, options = {}) => 
      apiRequest('/api/puzzles/validate', { method: 'POST', body: { puzzle_id, board }, ...options }),
    getHint: (puzzle_id, cell_index, options = {}) => 
      apiRequest('/api/puzzles/hint', { method: 'POST', body: { puzzle_id, cell_index }, ...options }),
  },

  attempts: {
    save: ({ puzzle_id, current_board, notes, time_taken, hints_used, status }) => 
      apiRequest('/api/attempts/save', {
        method: 'POST',
        body: { puzzle_id, current_board, notes, time_taken, hints_used, status }
      }),
    getCurrent: (puzzle_id) => 
      apiRequest(`/api/attempts/current?puzzle_id=${puzzle_id}`, { method: 'GET' }),
  },

  stats: {
    getDashboard: () => 
      apiRequest('/api/user/stats', { method: 'GET' }),
  },
};

