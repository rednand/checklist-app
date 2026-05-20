import { createClient } from "../../utils/supabase/server"
import ChecklistsSidebar from "./checklists-sidebar"

export default async function ChecklistsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: checklists } = await supabase
    .from("checklists")
    .select("id, title, created_at, checklist_items(id, checked)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  const checklistsWithCounts = (checklists ?? []).map(c => ({
    id: c.id,
    title: c.title,
    created_at: c.created_at,
    total: c.checklist_items?.length ?? 0,
    checked: c.checklist_items?.filter((i: { checked: boolean }) => i.checked).length ?? 0,
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3 md:gap-4 -mx-4 md:-mx-6 -my-6 md:-my-8 p-3 md:p-5 min-h-[calc(100vh-3.5rem)]">
      <ChecklistsSidebar checklists={checklistsWithCounts} />
      <div className="bg-white rounded-2xl overflow-y-auto p-4 md:p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
