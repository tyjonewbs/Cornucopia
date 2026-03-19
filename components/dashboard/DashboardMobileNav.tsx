'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { SidebarContent } from './Sidebar'

interface DashboardMobileNavProps {
  isProducer: boolean
}

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Overview'
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

export function DashboardMobileNav({ isProducer }: DashboardMobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <div className="md:hidden sticky top-14 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
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
            <SheetTitle className="text-white text-left">Dashboard</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            <SidebarContent isProducer={isProducer} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
