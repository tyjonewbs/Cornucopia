import prisma from "lib/db";
import LocalProfile from './local-profile';
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function LocalPage({ params }: { params: { id: string } }) {
  const [local, user] = await Promise.all([
    prisma.local.findUnique({
      where: {
        id: params.id
      }
    }),
    getUser()
  ]);

  if (!local) {
    notFound();
  }

  const isOwner = user?.id === local.userId;

  return <LocalProfile local={local} isOwner={isOwner} />;
}
