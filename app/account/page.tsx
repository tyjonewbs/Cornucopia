import prisma from '@/lib/db';
import { getUser } from '@/lib/auth';
import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { isUserProducer } from '@/lib/utils/user';
import { AccountClient } from './account-client';

async function getAccountData(userId: string) {
  const [userData, ordersCount, savedProductsCount, isProducer] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        profileImage: true,
      },
    }),
    prisma.order.count({ where: { userId } }),
    prisma.savedProduct.count({ where: { userId } }),
    isUserProducer(userId),
  ]);

  return {
    userData,
    ordersCount,
    savedProductsCount,
    isProducer,
  };
}

export default async function AccountPage() {
  noStore();

  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const accountData = await getAccountData(user.id);

  if (!accountData.userData) {
    redirect('/auth/login');
  }

  return (
    <AccountClient
      userData={accountData.userData}
      ordersCount={accountData.ordersCount}
      savedProductsCount={accountData.savedProductsCount}
      isProducer={accountData.isProducer}
    />
  );
}
