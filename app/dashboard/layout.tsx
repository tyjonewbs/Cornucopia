import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { isUserProducer } from "@/lib/utils/user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const isProducer = await isUserProducer(user.id);

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-gray-50">
      <Sidebar isProducer={isProducer} />
      <main className="flex-1 ml-64 p-6">
        {children}
      </main>
    </div>
  );
}
