"use client";

import { useSupabase } from "./providers/SupabaseProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { AuthDialog } from "./AuthDialog";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { getAuthRedirectUrl } from "@/lib/supabase-config";

export function UserNav() {
  const { user, isLoading } = useSupabase();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsAuthenticating(true);
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const navigate = (path: string) => {
    router.push(path);
  };

  if (isLoading || isAuthenticating) {
    return (
      <Button variant="ghost" size="sm" className="relative h-8 w-8">
        <Avatar>
          <AvatarFallback className="animate-pulse">...</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <AuthDialog 
          mode="login"
          trigger={
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={isAuthenticating}
              className="text-white hover:text-white/80"
            >
              Login
            </Button>
          }
        />
        <AuthDialog 
          mode="signup" 
          trigger={
            <Button 
              size="sm" 
              disabled={isAuthenticating}
              className="bg-white text-[#0B4D2C] hover:bg-white/90"
            >
              Create an account
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8">
          <Avatar>
            <AvatarImage
              src={user?.user_metadata?.avatar_url || ''}
              alt={user?.user_metadata?.given_name || 'User'}
            />
            <AvatarFallback>{user?.user_metadata?.given_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.user_metadata?.given_name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/sell')}
        >
          Sell My Products
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/dashboard/market-stand')}
        >
          Market Stands
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/dashboard/local')}
        >
          Farm/Ranch Profiles
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => navigate('/settings')}
        >
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleLogout}
          disabled={isAuthenticating}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
