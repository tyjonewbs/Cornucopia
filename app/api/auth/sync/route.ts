import { getSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { event, session } = await request.json();
    console.log('[Auth Sync] Received event:', event);
    
    // Get server client
    const supabase = getSupabaseServer();
    
    if (event === 'SIGNED_IN') {
      // Set the session cookie
      const response = new NextResponse(JSON.stringify({ status: 'success' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Set auth cookie
      await supabase.auth.setSession(session);
      
      console.log('[Auth Sync] Session synchronized after sign in');
      return response;
    }
    
    if (event === 'SIGNED_OUT') {
      // Clear the session cookie
      const response = new NextResponse(JSON.stringify({ status: 'success' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Sign out to clear the session
      await supabase.auth.signOut();
      
      console.log('[Auth Sync] Session cleared after sign out');
      return response;
    }
    
    return new NextResponse(JSON.stringify({ status: 'ignored' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[Auth Sync] Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
