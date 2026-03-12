// Import and execute env module first to ensure environment variables are loaded
import '@/lib/env';

export function EnvProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
