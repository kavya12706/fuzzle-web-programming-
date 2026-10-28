import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [guestMode, setGuestMode] = useState(() => {
    return sessionStorage.getItem('fuzzle_guest_mode') === 'true';
  });
  const [loading, setLoading] = useState(true);

  // Check existing PHP session on app load
  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await api.auth.me();
        if (data && data.user) {
          setUser(data.user);
          // If logged in, clear guest mode flag
          sessionStorage.removeItem('fuzzle_guest_mode');
          setGuestMode(false);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    if (data?.user) {
      setUser(data.user);
      sessionStorage.removeItem('fuzzle_guest_mode');
      setGuestMode(false);
    }
    return data;
  };

  const signup = async (email, password) => {
    const data = await api.auth.signup(email, password);
    if (data?.user) {
      setUser(data.user);
      sessionStorage.removeItem('fuzzle_guest_mode');
      setGuestMode(false);
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      sessionStorage.removeItem('fuzzle_guest_mode');
      setUser(null);
      setGuestMode(false);
    }
  };

  // Enter as guest: persists in sessionStorage until browser tab closes
  const enterAsGuest = () => {
    sessionStorage.setItem('fuzzle_guest_mode', 'true');
    setGuestMode(true);
  };

  // Exit guest mode: clears sessionStorage and returns to welcome gate
  const exitGuest = () => {
    sessionStorage.removeItem('fuzzle_guest_mode');
    setGuestMode(false);
  };

  // isGuest: true if not logged in
  const isGuest = !user;
  // hasAccess: true if logged in OR user clicked "Play as Guest"
  const hasAccess = Boolean(user || guestMode);

  return (
    <AuthContext.Provider value={{
      user,
      isGuest,
      guestMode,
      hasAccess,
      loading,
      login,
      signup,
      logout,
      enterAsGuest,
      exitGuest
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
