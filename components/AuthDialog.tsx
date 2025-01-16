"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { signInWithEmail, signUpWithEmail } from "@/app/actions/auth";

interface AuthDialogProps {
  mode?: 'login' | 'signup';
  trigger?: React.ReactNode;
  className?: string;
}

export function AuthDialog({ mode = 'login', trigger, className }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [open, setOpen] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const supabase = getSupabaseBrowser();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    } catch (error) {
      console.error('[Auth] Authentication error:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setError("Please check your email to confirm your account");
      } else {
        await signInWithEmail(email, password);
        setOpen(false);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const customTrigger = trigger || (
    <Button 
      variant="ghost" 
      size="sm" 
      className={`gap-2 ${className}`}
      disabled={isLoading}
    >
      <LogIn className="h-4 w-4" />
      {isSignUp ? "Sign Up" : "Login"}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col space-y-4 py-4">
          <h2 className="text-lg font-semibold text-center">
            {isSignUp ? "Create an account" : "Sign in to your account"}
          </h2>

          {!isEmailMode ? (
            <>
              <Button
                variant="outline"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full"
              >
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setIsEmailMode(true)}
                disabled={isLoading}
              >
                Continue with Email
              </Button>
            </>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 text-center">{error}</div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading
                  ? "Loading..."
                  : isSignUp
                  ? "Sign up"
                  : "Sign in"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsEmailMode(false)}
                disabled={isLoading}
              >
                Back to options
              </Button>
            </form>
          )}

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-500"
              disabled={isLoading}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
