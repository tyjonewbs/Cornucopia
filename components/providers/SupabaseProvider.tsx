"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface SupabaseContextType {
  user: User | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  isLoading: true,
});

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastSyncedState = useRef<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  const DEBOUNCE_DELAY = 300; // 300ms

  // Enhanced debounced sync function with retry logic
  const syncAuthState = async (event: string, session: any) => {
    // Generate a unique state key including relevant session data
    const stateKey = `${event}-${session?.user?.id || 'none'}-${session?.expires_at || 'no-expiry'}`;
    
    // Skip if this exact state was already synced
    if (stateKey === lastSyncedState.current) {
      return;
    }

    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ event, session })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to sync auth state: ${response.statusText}`);
      }
      
      // Reset retry count on success
      retryCountRef.current = 0;
      // Update last synced state on success
      lastSyncedState.current = stateKey;
    } catch (error) {
      console.error('Auth sync error:', error);
      
      // Implement retry logic with backoff
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        setTimeout(() => {
          syncAuthState(event, session);
        }, RETRY_DELAY * retryCountRef.current);
      }
    }
  };

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session fetch error:', error);
        return;
      }
      const newUser = session?.user ?? null;
      setUser(newUser);
      setIsLoading(false);

      // Initial sync if we have a session
      if (session) {
        syncAuthState('INITIAL', session);
      }
    });

    // Set up auto token refresh
    const refreshInterval = setInterval(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Refresh the session
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session) {
            syncAuthState('TOKEN_REFRESHED', refreshData.session);
          }
        }
      } catch (error) {
        console.error('Token refresh error:', error);
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      
      // Deep compare user state to prevent unnecessary updates
      const userChanged = JSON.stringify(newUser) !== JSON.stringify(user);
      const isAuthEvent = event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED';
      
      if (userChanged || isAuthEvent) {
        setUser(newUser);
        setIsLoading(false);

        // Clear any pending sync
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }

        // Debounce sync operation with increased delay
        syncTimeoutRef.current = setTimeout(() => {
          syncAuthState(event, session);
        }, DEBOUNCE_DELAY);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ user, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};
