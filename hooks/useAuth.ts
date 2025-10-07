'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { DataLoadingState } from '@/types';

interface UseAuthReturn extends DataLoadingState<User> {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Custom hook for authentication
 * Provides user state and authentication methods
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<DataLoadingState<User>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchUser = useCallback(async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      setState({
        data: user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user',
      });
    }
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setState({
          data: data.user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to sign in',
        });
        throw error;
      }
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setState({
          data: data.user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to sign up',
        });
        throw error;
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setState({
        data: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sign out',
      }));
      throw error;
    }
  }, [supabase]);

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        });

        if (error) throw error;
      } catch (error) {
        throw error;
      }
    },
    [supabase]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) throw error;
      } catch (error) {
        throw error;
      }
    },
    [supabase]
  );

  useEffect(() => {
    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        data: session?.user ?? null,
        isLoading: false,
        error: null,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser, supabase]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!state.data,
  };
}
