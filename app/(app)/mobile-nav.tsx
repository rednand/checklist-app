"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ListChecks, LogOut } from "lucide-react"
import { signOut } from "../actions/auth"

const links = [
  { href: "/", icon: LayoutDashboard, label: "Início", exact: true },
  { href: "/checklists", icon: ListChecks, label: "Checklists", exact: false },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex md:hidden">
      {links.map(({ href, icon: Icon, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold tracking-wide transition-colors ${
              isActive ? "text-blue-600" : "text-slate-400"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        )
      })}
      <form action={signOut} className="flex-1">
        <button className="w-full h-full flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold tracking-wide text-slate-400 hover:text-slate-700 transition-colors">
          <LogOut size={20} />
          Sair
        </button>
      </form>
    </nav>
  )
}
