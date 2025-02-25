import { AuthDialog } from "@/components/AuthDialog";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getUser();
  const returnTo = searchParams.returnTo as string;

  if (user) {
    redirect(returnTo || '/dashboard/market-stand');
  }

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>

        <div className="mt-10">
          <AuthDialog 
            mode="login"
            returnTo={returnTo}
            trigger={
              <button className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
                Sign in
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}
