"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
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
import Link from "next/link";
import { LogIn } from "lucide-react";

export function UserNav() {
  const { user, isAuthenticated, isLoading } = useKindeBrowserClient();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className="relative h-8 w-8">
        <Avatar>
          <AvatarFallback className="animate-pulse">...</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href="/api/auth/login">
            <LogIn className="h-4 w-4" />
            Login
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/api/auth/register">
            Sign Up
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8">
          <Avatar>
            <AvatarImage
              src={user?.picture || ''}
              alt={user?.given_name || 'User'}
            />
            <AvatarFallback>{user?.given_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.given_name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/sell" className="w-full">
          <DropdownMenuItem className="cursor-pointer">
            Sell My Products
          </DropdownMenuItem>
        </Link>
        <Link href="/dashboard" className="w-full">
          <DropdownMenuItem className="cursor-pointer">
            Dashboard
          </DropdownMenuItem>
        </Link>
        <Link href="/settings" className="w-full">
          <DropdownMenuItem className="cursor-pointer">
            Settings
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <Link href="/api/auth/logout" className="w-full">
          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
            Logout
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
