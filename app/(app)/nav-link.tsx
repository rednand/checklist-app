"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function NavLink({
  href,
  icon,
  label,
  exact = false,
}: {
  href: string
  icon: React.ReactNode
  label: string
  exact?: boolean
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-600"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}
