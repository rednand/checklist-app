import { createClient } from "../utils/supabase/server"
import { redirect } from "next/navigation"
import { signOut } from "../actions/auth"
import NavLink from "./nav-link"
import { LayoutDashboard, ListChecks } from "lucide-react"
import { Toaster } from "sonner"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const username = user.email?.split("@")[0] ?? "usuário"
  const initials = username.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between backdrop-blur-sm">

          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="Checklist App" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-slate-900 text-sm">Checklist App</span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink href="/" icon={<LayoutDashboard size={14} />} label="Início" exact />
            <NavLink href="/checklists" icon={<ListChecks size={14} />} label="Checklists" />
          </nav>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <span className="text-sm text-slate-700 font-medium hidden sm:block">{username}</span>
            <form action={signOut} className="ml-2">
              <button className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>

      <Toaster position="bottom-right" />
    </div>
  )
}
