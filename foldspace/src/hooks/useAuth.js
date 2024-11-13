// Create a new file: src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

export function useAuth() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = new URLSearchParams(window.location.search).get('token');
        if (!token) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
          return;
        }

        const auth = getAuth();
        // Firebase will automatically validate the token
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Compare token with current user's token
          const validToken = await currentUser.getIdToken();
          if (token === validToken) {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user: currentUser,
            });
            return;
          }
        }

        setAuthState({ isAuthenticated: false, isLoading: false, user: null });
      } catch (error) {
        console.error('Token validation failed:', error);
        setAuthState({ isAuthenticated: false, isLoading: false, user: null });
      }
    };

    validateToken();
  }, []);

  return authState;
}
