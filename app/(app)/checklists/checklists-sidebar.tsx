"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"

type Checklist = {
  id: string
  title: string
  total: number
  checked: number
}

export default function ChecklistsSidebar({ checklists }: { checklists: Checklist[] }) {
  const pathname = usePathname()

  return (
    <aside className="bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-sm font-bold text-slate-900">Meus Checklists</span>
        <Link
          href="/"
          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Novo checklist"
        >
          <Plus size={16} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {checklists.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-slate-400 text-xs">Nenhum checklist ainda</p>
          </div>
        ) : (
          <nav className="space-y-1">
            {checklists.map((checklist) => {
              const isActive = pathname === `/checklists/${checklist.id}`
              const progress = checklist.total > 0 ? (checklist.checked / checklist.total) * 100 : 0

              return (
                <Link
                  key={checklist.id}
                  href={`/checklists/${checklist.id}`}
                  className={`block px-3 py-3 rounded-xl transition-colors ${
                    isActive ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <p className={`text-sm font-medium truncate ${isActive ? "text-blue-600" : "text-slate-700"}`}>
                    {checklist.title}
                  </p>
                  {checklist.total > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                        {checklist.checked}/{checklist.total}
                      </span>
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </aside>
  )
}
