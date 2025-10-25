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
    let mounted = true;
    
    const initAuth = async () => {
      try {
        const supabase = getSupabaseBrowser();
        
        // Get initial session with error handling
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Error getting session:', error);
        }
        
        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }

        // Listen for auth changes - Supabase handles all session management
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            setIsLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    const cleanup = initAuth();
    
    return () => {
      mounted = false;
      cleanup?.then(fn => fn?.());
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
