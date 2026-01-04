"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider'; // Adjusted path

export interface UserAuthResult {
  user: User | null;
  isUserLoading: boolean;
  error: Error | null;
}

/**
 * Hook for subscribing to Firebase Auth user state.
 * @returns {UserAuthResult} Object containing user, loading state, and error.
 */
export function useUser(): UserAuthResult {
  const { auth } = useFirebase();
  const [userState, setUserState] = useState<UserAuthResult>({
    user: auth?.currentUser || null,
    isUserLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!auth) {
      setUserState({ user: null, isUserLoading: false, error: new Error("Firebase Auth service not available.") });
      return;
    }

    // Set initial loading state
    setUserState(prevState => ({ ...prevState, isUserLoading: true }));

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUserState({ user, isUserLoading: false, error: null });
      },
      (error) => {
        console.error("useUser - onAuthStateChanged error:", error);
        setUserState({ user: null, isUserLoading: false, error });
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]); // Re-run effect if auth instance changes

  return userState;
}