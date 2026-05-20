import { createClient } from "../../../utils/supabase/server"
import { notFound } from "next/navigation"
import { deleteChecklist } from "../../../actions/checklists"
import ToggleItem from "./toggle-item"
import AddItemForm from "./add-item-form"
import { Trash2 } from "lucide-react"

const categoryColors = [
  "bg-blue-50 text-blue-700",
  "bg-violet-50 text-violet-700",
  "bg-teal-50 text-teal-700",
  "bg-orange-50 text-orange-700",
  "bg-pink-50 text-pink-700",
  "bg-green-50 text-green-700",
  "bg-amber-50 text-amber-700",
  "bg-cyan-50 text-cyan-700",
]

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: checklist } = await supabase
    .from("checklists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single()

  if (!checklist) notFound()

  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_id", checklist.id)
    .order("position")

  const SEP = " › "
  const allItems = items ?? []
  const categories = [...new Set(allItems.map(i => i.category).filter(Boolean))] as string[]
  const uncategorized = allItems.filter(i => !i.category)
  const checkedCount = allItems.filter(i => i.checked).length
  const progress = allItems.length > 0 ? (checkedCount / allItems.length) * 100 : 0
  const isComplete = allItems.length > 0 && checkedCount === allItems.length

  const isHierarchical = categories.some(c => c.includes(SEP))
  const parentOrder: string[] = []
  const parentChildren: Record<string, string[]> = {}
  if (isHierarchical) {
    for (const cat of categories) {
      const idx = cat.indexOf(SEP)
      if (idx !== -1) {
        const parent = cat.slice(0, idx)
        const child = cat.slice(idx + SEP.length)
        if (!parentChildren[parent]) { parentOrder.push(parent); parentChildren[parent] = [] }
        parentChildren[parent].push(child)
      } else {
        if (!parentChildren[cat]) { parentOrder.push(cat); parentChildren[cat] = [] }
      }
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-1">
        <div className="min-w-0 pr-4">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">{checklist.title}</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5">{checklist.prompt}</p>
        </div>
        <form action={deleteChecklist.bind(null, checklist.id)}>
          <button type="submit" className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 touch-manipulation" title="Excluir">
            <Trash2 size={15} />
          </button>
        </form>
      </div>

      <div className="mt-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">
            {isComplete ? "✅ Concluído!" : `${checkedCount} de ${allItems.length} itens`}
          </span>
          <span className="text-xs font-bold text-blue-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isComplete ? "bg-green-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {isHierarchical ? (
          parentOrder.map((parent, pi) => {
            const children = parentChildren[parent] ?? []
            const directItems = allItems.filter(i => i.category === parent)
            const parentItems = allItems.filter(i => i.category === parent || (i.category ?? "").startsWith(parent + SEP))
            const parentChecked = parentItems.filter(i => i.checked).length
            return (
              <div key={parent}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[pi % categoryColors.length]}`}>
                    {parent}
                  </span>
                  <span className="text-xs text-slate-400">{parentChecked}/{parentItems.length}</span>
                </div>
                {directItems.length > 0 && (
                  <div className="space-y-0.5 mb-3">
                    {directItems.map(item => (
                      <ToggleItem key={item.id} item={{ ...item, checklist_id: checklist.id }} />
                    ))}
                  </div>
                )}
                {children.length > 0 && (
                  <div className="space-y-4 pl-3 border-l-2 border-slate-100">
                    {children.map(child => {
                      const fullCat = `${parent}${SEP}${child}`
                      const childItems = allItems.filter(i => i.category === fullCat)
                      const childChecked = childItems.filter(i => i.checked).length
                      return (
                        <div key={child}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-semibold text-slate-500">{child}</span>
                            <span className="text-[10px] text-slate-300">{childChecked}/{childItems.length}</span>
                          </div>
                          <div className="space-y-0.5">
                            {childItems.map(item => (
                              <ToggleItem key={item.id} item={{ ...item, checklist_id: checklist.id }} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          categories.map((category, index) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[index % categoryColors.length]}`}>
                  {category}
                </span>
                <span className="text-xs text-slate-400">
                  {allItems.filter(i => i.category === category && i.checked).length}/{allItems.filter(i => i.category === category).length}
                </span>
              </div>
              <div className="space-y-0.5">
                {allItems.filter(i => i.category === category).map(item => (
                  <ToggleItem key={item.id} item={{ ...item, checklist_id: checklist.id }} />
                ))}
              </div>
            </div>
          ))
        )}

        {uncategorized.length > 0 && (
          <div>
            {categories.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  Outros
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {uncategorized.map(item => (
                <ToggleItem key={item.id} item={{ ...item, checklist_id: checklist.id }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add item */}
      <div className="mt-8 pt-5 border-t border-slate-100">
        <AddItemForm checklistId={checklist.id} categories={categories} />
      </div>
    </div>
  )
}
