import { useState, useEffect } from 'react';

export type AuthState = 'login' | 'signup' | 'authenticated' | 'guest';

export interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  profilePicture?: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>('login');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('wordigo_access_token');
    const storedUser = localStorage.getItem('wordigo_user');

    if (storedToken && storedUser) {
      try {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
        setAuthState('authenticated');
      } catch (err) {
        // Invalid stored data, clear it
        localStorage.removeItem('wordigo_access_token');
        localStorage.removeItem('wordigo_user');
      }
    }
  }, []);

  const handleLoginSuccess = (userData: User, token: string) => {
    setUser(userData);
    setAccessToken(token);
    setAuthState('authenticated');
    localStorage.setItem('wordigo_access_token', token);
    localStorage.setItem('wordigo_user', JSON.stringify(userData));
  };

  const handleSignUpSuccess = (userData: User, token: string) => {
    setUser(userData);
    setAccessToken(token);
    setAuthState('authenticated');
    localStorage.setItem('wordigo_access_token', token);
    localStorage.setItem('wordigo_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    setAuthState('login');
    localStorage.removeItem('wordigo_access_token');
    localStorage.removeItem('wordigo_user');
  };

  const handleContinueAsGuest = () => {
    setAuthState('guest');
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('wordigo_user', JSON.stringify(updatedUser));
  };

  const switchToLogin = () => setAuthState('login');
  const switchToSignup = () => setAuthState('signup');

  return {
    authState,
    user,
    accessToken,
    isAuthenticated: authState === 'authenticated',
    isGuest: authState === 'guest',
    handleLoginSuccess,
    handleSignUpSuccess,
    handleLogout,
    handleContinueAsGuest,
    handleUpdateProfile,
    switchToLogin,
    switchToSignup,
  };
}
