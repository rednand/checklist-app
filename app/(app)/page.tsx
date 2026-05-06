import { createClient } from "../utils/supabase/server"
import Link from "next/link"
import { Plus, ListChecks, ArrowRight, FileText, CheckCircle, Sparkles } from "lucide-react"
import NewChecklistForm from "./checklists/new-checklist-form"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recentChecklists } = await supabase
    .from("checklists")
    .select("id, title, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const { count: totalChecklists } = await supabase
    .from("checklists")
    .select("id", { count: "exact" })
    .eq("user_id", user!.id)

  const { count: totalItems } = await supabase
    .from("checklist_items")
    .select("id", { count: "exact" })
    .eq("user_id", user!.id)

  const { count: checkedItems } = await supabase
    .from("checklist_items")
    .select("id", { count: "exact" })
    .eq("user_id", user!.id)
    .eq("checked", true)

  const firstName = user!.email?.split("@")[0] ?? "você"

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-7 shadow-md">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-20 w-48 h-48 bg-indigo-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">Bem-vindo de volta 👋</p>
          <h1 className="text-2xl font-bold text-white">{firstName}</h1>
          <p className="text-blue-100 text-sm mt-1">Pronto para organizar o dia com IA?</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: totalChecklists ?? 0, label: "Checklists criados", icon: <FileText size={18} />, border: "border-t-blue-400", iconBg: "bg-blue-50", iconColor: "text-blue-500" },
          { value: totalItems ?? 0, label: "Itens gerados", icon: <ListChecks size={18} />, border: "border-t-teal-400", iconBg: "bg-teal-50", iconColor: "text-teal-500" },
          { value: checkedItems ?? 0, label: "Concluídos", icon: <CheckCircle size={18} />, border: "border-t-green-400", iconBg: "bg-green-50", iconColor: "text-green-500" },
        ].map(({ value, label, icon, border, iconBg, iconColor }) => (
          <div key={label} className={`bg-white border border-slate-200 border-t-4 ${border} rounded-2xl p-5 shadow-sm flex items-start justify-between`}>
            <div>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
            <div className={`w-8 h-8 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
              {icon}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent checklists */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-50 rounded-md flex items-center justify-center">
                <ListChecks size={12} className="text-blue-500" />
              </div>
              Checklists recentes
            </h2>
            <Link href="/checklists" className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <Plus size={14} />
            </Link>
          </div>

          {!recentChecklists || recentChecklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <ListChecks size={18} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-400">Nenhum checklist ainda</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {recentChecklists.map((checklist) => (
                <Link key={checklist.id} href={`/checklists/${checklist.id}`}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 group transition-colors">
                  <span className="text-[10px] text-slate-400 w-14 shrink-0 font-medium">
                    {new Date(checklist.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                  <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors truncate">
                    {checklist.title}
                  </span>
                </Link>
              ))}
              <Link href="/checklists" className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors mt-3 pt-3 border-t border-slate-100 px-2">
                Ver todos <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </div>

        {/* Generate form */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 px-5 py-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles size={13} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Gerar novo checklist</h2>
          </div>
          <div className="p-5">
            <NewChecklistForm />
          </div>
        </div>
      </div>
    </div>
  )
}
