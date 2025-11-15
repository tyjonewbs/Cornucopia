'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface AdminNavProps {
  isSuperAdmin: boolean
}

export function AdminNav({ isSuperAdmin }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav className="hidden sm:ml-6 sm:flex sm:space-x-8" aria-label="Global">
      <NavLink href="/admin">Dashboard</NavLink>
      <NavLink href="/admin/orders">Orders</NavLink>
      <NavLink href="/admin/delivery-zones">Delivery Zones</NavLink>
      <NavLink href="/admin/analytics">Analytics</NavLink>
      <NavLink href="/admin/users">Users</NavLink>
      {isSuperAdmin && (
        <NavLink href="/admin/settings">Settings</NavLink>
      )}
    </nav>
  )
}

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname?.startsWith(`${href}/`)
  
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium",
        isActive
          ? "border-green-500 text-green-600"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      )}
    >
      {children}
    </Link>
  )
}
