"use client";

import { useSupabase } from "./providers/SupabaseProvider";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { AuthDialog } from "./AuthDialog";
import { ProducerOnboardingDialog } from "./ProducerOnboardingDialog";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { checkIsProducer } from "@/app/actions/user";

export function UserNav() {
  const { user, isLoading } = useSupabase();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isProducer, setIsProducer] = useState(false);
  const [isCheckingProducer, setIsCheckingProducer] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      if (user?.id) {
        try {
          // Fetch user profile data including profileImage
          const response = await fetch('/api/user');
          if (response.ok) {
            const userData = await response.json();
            setProfileImage(userData.profileImage);
            setUserName(userData.firstName || user?.user_metadata?.given_name || 'User');
          }
          
          // Check producer status
          const producerStatus = await checkIsProducer(user.id);
          setIsProducer(producerStatus);
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        } finally {
          setIsCheckingProducer(false);
        }
      } else {
        setIsCheckingProducer(false);
      }
    }
    
    fetchUserData();
  }, [user?.id, user?.user_metadata?.given_name]);

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

  if (isLoading || isAuthenticating || isCheckingProducer) {
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-8 w-8">
            <Avatar>
              <AvatarImage
                src={profileImage || user?.user_metadata?.avatar_url || ''}
                alt={userName || 'User'}
              />
              <AvatarFallback>{userName?.[0] || user?.user_metadata?.given_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => navigate('/account')}
          >
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName || user?.user_metadata?.given_name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || ''}
              </p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => navigate('/dashboard/my-local-haul')}
          >
            My Local Haul
          </DropdownMenuItem>
          
          {isProducer ? (
            <>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => navigate('/dashboard/products')}
              >
                My Products
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => navigate('/dashboard/market-stand')}
              >
                Market Stands
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => navigate('/dashboard/delivery-zones')}
              >
                Delivery Zones
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => navigate('/dashboard/local')}
              >
                Farm/Ranch Profile
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setDialogOpen(true)}
            >
              Become a Producer
            </DropdownMenuItem>
          )}
          
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

      <ProducerOnboardingDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
