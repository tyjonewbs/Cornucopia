import { Card } from '@/components/ui/card';
import prisma from '@/lib/db';
import { getUser } from '@/lib/auth';
import { AccountForm } from '@/components/form/AccountForm';
import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';

async function getUserData(userId: string) {
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
  return data;
}

export default async function AccountPage() {
  noStore();

  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const userData = await getUserData(user.id);

  if (!userData) {
    redirect('/auth/login');
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <Card>
        <AccountForm user={userData} />
      </Card>
    </section>
  );
}
