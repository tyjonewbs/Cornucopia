export const dynamic = 'force-dynamic';

import { getUser } from "@/lib/auth";
import prisma, { executeWithRetry } from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { LocalCard } from "@/components/LocalCard";
import { redirect } from "next/navigation";

async function getLocals(userId: string) {
  try {
    const locals = await executeWithRetry(() => prisma.local.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        locationName: true,
        images: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }));

    // Ensure data is serializable and handle nulls
    return locals.map(local => ({
      ...local,
      description: local.description ?? null,
      images: local.images ?? [],
      _count: {
        products: local._count.products
      }
    }));
  } catch (err) {
    console.error('Failed to fetch locals:', err);
    return [];
  }
}

export default async function LocalDashboard() {
  const user = await getUser();
  
  if (!user) {
    redirect('/');
  }

  const locals = await getLocals(user.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Farm/Ranch Profiles</h1>
          <p className="text-muted-foreground">
            Manage your farm and ranch profiles
          </p>
        </div>
        <Link href="/local/setup">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Profile
          </Button>
        </Link>
      </div>

      {locals.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No profiles yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first farm/ranch profile to showcase your operation
          </p>
          <Link href="/local/setup">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Profile
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locals.map((local) => (
            <LocalCard 
              key={local.id}
              local={local}
              userId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
