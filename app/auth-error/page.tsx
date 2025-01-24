import { Suspense } from "react";
import AuthErrorClient from "./auth-error-client";

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="max-w-md space-y-6 px-4 text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    }>
      <AuthErrorClient />
    </Suspense>
  );
}
