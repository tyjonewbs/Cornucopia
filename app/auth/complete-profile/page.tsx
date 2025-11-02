import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileCompletionForm } from '@/components/form/ProfileCompletionForm';
import prisma from '@/lib/db';

export default async function CompleteProfilePage() {
  const user = await getUser();
  
  console.log('[Complete Profile] Starting page load');
  console.log('[Complete Profile] User from auth:', user ? { id: user.id, email: user.email } : 'null');

  if (!user) {
    console.log('[Complete Profile] No user, redirecting to login');
    redirect('/auth/login');
  }

  // Get full user data
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      profileComplete: true,
      username: true,
    },
  });
  
  console.log('[Complete Profile] User data from DB:', userData);
  console.log('[Complete Profile] profileComplete:', userData?.profileComplete);
  console.log('[Complete Profile] username:', userData?.username);

  // If profile is already complete, redirect to dashboard
  if (userData?.profileComplete) {
    console.log('[Complete Profile] Profile already complete, redirecting to dashboard');
    redirect('/dashboard/analytics');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-center">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-center">
              Welcome to Cornucopia! Let's set up your profile to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileCompletionForm currentUser={userData} />
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Your username will be displayed on reviews and public content.</p>
          <p className="mt-1">Your location helps us show you relevant local products.</p>
        </div>
      </div>
    </div>
  );
}
