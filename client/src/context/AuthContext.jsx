import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on initial page load
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      try {
        const response = await authApi.checkMe();
        if (isMounted && response.success && response.user) {
          setUser(response.user);
        }
      } catch (err) {
        // Unauthenticated session, normal for guests
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Shared login method
  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    if (response.success && response.user) {
      setUser(response.user);
      return response.user;
    }
    throw new Error(response.message || 'Login failed');
  };

  // Public Member registration
  const registerMember = async (formData) => {
    const response = await authApi.registerMember(formData);
    if (response.success && response.user) {
      setUser(response.user);
      return response.user;
    }
    throw new Error(response.message || 'Registration failed');
  };

  // Logout
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isAuthenticated: !!user,
        login,
        registerMember,
        logout,
      }}
    >
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
