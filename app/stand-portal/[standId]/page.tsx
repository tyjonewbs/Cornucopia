import { getStandPortalData } from "@/app/actions/stand-portal";
import { getUser } from "@/app/actions/auth";
import { notFound } from "next/navigation";
import StandPortalClient from "./portal-client";

export default async function StandPortalPage({
  params,
}: {
  params: Promise<{ standId: string }>;
}) {
  const { standId } = await params;

  // Fetch stand data
  const data = await getStandPortalData(standId);

  if ('error' in data || !data.stand) {
    notFound();
  }

  // Get current user
  const user = await getUser();
  const isOwner = user?.id === data.stand.userId;

  return (
    <StandPortalClient
      stand={data.stand}
      products={data.products}
      seller={data.seller}
      isOwner={isOwner}
      currentUserId={user?.id ?? null}
    />
  );
}
