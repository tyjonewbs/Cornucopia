import { getSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { event, session } = await request.json();
    
    // Get server client
    const supabase = getSupabaseServer();

    // Common headers for all responses
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    if (event === 'SIGNED_IN' || event === 'INITIAL' || event === 'TOKEN_REFRESHED') {
      // Set the session cookie
      const response = new NextResponse(JSON.stringify({ 
        status: 'success',
        event,
        timestamp: Date.now()
      }), {
        status: 200,
        headers
      });
      
      // Set auth cookie
      if (session) {
        // Explicitly set the session with the provided session data
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      }
      
      return response;
    }
    
    if (event === 'SIGNED_OUT') {
      // Clear the session cookie
      const response = new NextResponse(JSON.stringify({ 
        status: 'success',
        event,
        timestamp: Date.now()
      }), {
        status: 200,
        headers
      });
      
      // Sign out to clear the session
      await supabase.auth.signOut();
      
      return response;
    }
    
    return new NextResponse(JSON.stringify({ 
      status: 'ignored',
      event,
      timestamp: Date.now()
    }), {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Auth sync error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Internal Server Error',
      timestamp: Date.now()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
}
