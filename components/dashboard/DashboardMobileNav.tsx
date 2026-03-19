'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, ArrowLeft, Settings, Shield, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface DashboardMobileNavProps {
  isProducer: boolean
  userRole?: string
}

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname.startsWith('/dashboard/market-stand')) return 'My Stand'
  if (pathname.startsWith('/dashboard/products')) return 'Products'
  if (pathname.startsWith('/dashboard/delivery-zones')) return 'Delivery'
  if (pathname.startsWith('/dashboard/orders')) return 'Orders'
  if (pathname.startsWith('/dashboard/analytics')) return 'Analytics'
  if (pathname.startsWith('/dashboard/events')) return 'Events'
  if (pathname.startsWith('/dashboard/farm-page')) return 'Farm Page'
  if (pathname.startsWith('/dashboard/purchases')) return 'My Purchases'
  if (pathname.startsWith('/dashboard/my-local-haul')) return 'Saved'
  return 'Dashboard'
}

export function DashboardMobileNav({ isProducer, userRole }: DashboardMobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-gray-700 font-medium"
        >
          <Menu className="h-5 w-5" />
          <span className="text-sm">{getPageTitle(pathname)}</span>
        </button>
        <Link href="/" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          App
        </Link>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 p-0 flex flex-col">
          <SheetHeader className="p-4 border-b bg-[#0B4D2C]">
            <SheetTitle className="text-white text-left">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            <nav className="flex-1 px-3 pt-3 pb-4 overflow-y-auto">
              <div className="space-y-1">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                >
                  <Settings className="h-5 w-5" />
                  <span>Account</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                  >
                    <Shield className="h-5 w-5" />
                    <span>Admin</span>
                  </Link>
                )}
              </div>
            </nav>

            <div className="border-t border-gray-200 px-3 py-4">
              <Link
                href="/auth/logout"
                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
