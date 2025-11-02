import { Card } from '@/components/ui/card';
import prisma from '@/lib/db';
import { getUser } from '@/lib/auth';
import { AccountForm } from '@/components/form/AccountForm';
import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';

async function getUserData(userId: string) {
  try {
    console.log('[Account Page] Fetching user data for ID:', userId);
    const data = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        city: true,
        state: true,
        zipCode: true,
        profileImage: true,
        usernameLastChanged: true,
      },
    });
    console.log('[Account Page] User data fetched:', data ? 'Success' : 'Null');
    return data;
  } catch (error) {
    console.error('[Account Page] Error fetching user data:', error);
    throw error;
  }
}

export default async function AccountPage() {
  noStore();
  
  try {
    console.log('[Account Page] Starting page load');
    const user = await getUser();
    console.log('[Account Page] getUser result:', user ? { id: user.id, email: user.email } : 'null');
    
    if (!user) {
      console.log('[Account Page] No user found, redirecting to login');
      redirect('/auth/login');
    }

    const userData = await getUserData(user.id);
    
    if (!userData) {
      console.error('[Account Page] User data not found in database for ID:', user.id);
      redirect('/auth/login');
    }

    console.log('[Account Page] Rendering AccountForm');
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <Card>
          <AccountForm user={userData} />
        </Card>
      </section>
    );
  } catch (error) {
    console.error('[Account Page] Uncaught error:', error);
    throw error;
  }
}
