import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // Get user's market stand ID from your database
    const { data: profile } = await supabase
      .from('profiles')
      .select('market_stand_id')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      id: user.id,
      email: user.email,
      marketStandId: profile?.market_stand_id
    });
  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
