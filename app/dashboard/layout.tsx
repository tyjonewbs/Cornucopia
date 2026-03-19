import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
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
    <div className="flex min-h-[calc(100vh-56px-64px)] md:min-h-[calc(100vh-80px)] bg-gray-50">
      <Sidebar isProducer={isProducer} />
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <DashboardMobileNav isProducer={isProducer} />
        <main id="main-content" className="flex-1 min-w-0 p-3 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
