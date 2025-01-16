"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    
    // Get initial session
    // console.log('[Supabase Auth] Checking initial session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
// console.log('[Supabase Auth] Initial session:', JSON.stringify({
//   accessToken: session?.access_token ? '(present)' : null,
//   user: session?.user ? {
//     id: session.user.id,
//     email: session.user.email,
//     role: session.user.role,
//   } : null
// }, null, 2));
      setUser(session?.user ?? null);
      setIsLoading(false);
      // console.log('[Supabase Auth] Loading state set to:', false);
    });

    // Listen for auth changes
    // console.log('Listen for auth changes');
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
// console.log('[Supabase Auth] Auth state changed:', JSON.stringify({
//   event,
//   accessToken: session?.access_token ? '(present)' : null,
//   user: session?.user ? {
//     id: session.user.id,
//     email: session.user.email,
//     role: session.user.role,
//   } : null
// }, null, 2));
      
      // Update state
      setUser(session?.user ?? null);
      setIsLoading(false);
      // console.log('[Supabase Auth] Loading state set to:', false);
      
      // Sync with server
      // console.log('sync with server');
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        const response = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, session })
        });
        
        if (!response.ok) {
          // console.error('[Supabase Auth] Failed to sync session with server');
        }
      }
    });

    return () => subscription.unsubscribe();
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
