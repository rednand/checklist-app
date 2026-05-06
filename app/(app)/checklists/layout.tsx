import { createClient } from "../../utils/supabase/server"
import ChecklistsSidebar from "./checklists-sidebar"

export default async function ChecklistsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: checklists } = await supabase
    .from("checklists")
    .select("id, title, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  const ids = (checklists ?? []).map(c => c.id)

  const { data: itemCounts } = ids.length > 0
    ? await supabase
        .from("checklist_items")
        .select("checklist_id, checked")
        .in("checklist_id", ids)
    : { data: [] }

  const checklistsWithCounts = (checklists ?? []).map(c => {
    const items = (itemCounts ?? []).filter(i => i.checklist_id === c.id)
    return {
      ...c,
      total: items.length,
      checked: items.filter(i => i.checked).length,
    }
  })

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 -mx-6 -my-8 p-5"
      style={{ minHeight: "calc(100vh - 3.5rem)" }}
    >
      <ChecklistsSidebar checklists={checklistsWithCounts} />
      <div className="bg-white rounded-2xl overflow-y-auto p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
