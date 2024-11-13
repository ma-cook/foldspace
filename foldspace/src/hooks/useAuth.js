// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase'; // Correctly import the named export

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

        const response = await fetch(
          'https://us-central1-foldspace-6483c.cloudfunctions.net/api/verify-token',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          }
        );

        if (!response.ok) {
          throw new Error('Token verification failed');
        }

        const { customToken } = await response.json();
        await signInWithCustomToken(auth, customToken);
        const currentUser = auth.currentUser;

        if (currentUser) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: currentUser,
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        setAuthState({ isAuthenticated: false, isLoading: false, user: null });
      }
    };

    validateToken();
  }, []);

  return authState;
}
