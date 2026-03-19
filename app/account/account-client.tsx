'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Heart,
  Sprout,
  Edit,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { signOut } from '@/app/actions/sign-out';
import { useTransition } from 'react';
import { toast } from 'sonner';

interface AccountClientProps {
  userData: {
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
  };
  ordersCount: number;
  savedProductsCount: number;
  isProducer: boolean;
}

export function AccountClient({
  userData,
  ordersCount,
  savedProductsCount,
  isProducer,
}: AccountClientProps) {
  const [isPending, startTransition] = useTransition();

  const displayName = userData.firstName && userData.lastName
    ? `${userData.firstName} ${userData.lastName}`
    : userData.firstName || userData.email;

  const initials = userData.firstName
    ? userData.firstName[0].toUpperCase()
    : userData.email[0].toUpperCase();

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        await signOut();
      } catch (error) {
        toast.error('Failed to sign out');
      }
    });
  };

  return (
    <div className="mobile-content-wrapper min-w-0 max-w-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#8B4513] flex items-center justify-center text-white text-2xl font-bold">
            {userData.profileImage ? (
              <img
                src={userData.profileImage}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          {/* Name & Email */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-600 mt-1">{userData.email}</p>
          </div>

          {/* Edit Profile Button */}
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/account/edit">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
        </div>
      </Card>

      {/* My Orders */}
      <Link href="/dashboard/purchases">
        <Card className="mb-3 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900">My Orders</h3>
                {ordersCount > 0 && (
                  <Badge variant="secondary" className="mt-1">
                    {ordersCount}
                  </Badge>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </Card>
      </Link>

      {/* Saved Items */}
      <Link href="/dashboard/my-local-haul">
        <Card className="mb-6 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900">Saved Items</h3>
                {savedProductsCount > 0 && (
                  <Badge variant="secondary" className="mt-1">
                    {savedProductsCount}
                  </Badge>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </Card>
      </Link>

      {/* Producer Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Producer</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {isProducer ? (
          <Link href="/dashboard">
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Sprout className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Manage your stand</h3>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </Card>
          </Link>
        ) : (
          <Link href="/onboarding/producer">
            <Card className="hover:bg-green-50 transition-colors cursor-pointer bg-green-50/50 border-green-200">
              <div className="px-4 py-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Sprout className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">
                      Start selling on Cornucopia
                    </h3>
                    <p className="text-sm text-gray-600">
                      Join local farmers and producers sharing their goods with the community.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="w-full bg-green-600 hover:bg-green-700 mt-2"
                >
                  <span>
                    Start Selling
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </span>
                </Button>
              </div>
            </Card>
          </Link>
        )}
      </div>

      {/* Settings Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Settings</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <Link href="/account/edit">
          <Card className="mb-3 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Edit className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <h3 className="font-medium text-gray-900">Edit Profile</h3>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            </div>
          </Card>
        </Link>

        {/* Future: Notifications */}
        {/* <Card className="hover:bg-gray-50 transition-colors cursor-pointer opacity-50 pointer-events-none">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <Bell className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <h3 className="font-medium text-gray-900">Notifications</h3>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </Card> */}
      </div>

      {/* Sign Out */}
      <Button
        onClick={handleSignOut}
        disabled={isPending}
        variant="destructive"
        className="w-full"
      >
        <LogOut className="h-4 w-4 mr-2" />
        {isPending ? 'Signing out...' : 'Sign Out'}
      </Button>
    </div>
  );
}
