"use client"

import { useOptimistic, useTransition } from "react"
import { toggleItem, deleteItem } from "../../../actions/checklists"
import { X } from "lucide-react"

type Item = {
  id: string
  text: string
  checked: boolean
  checklist_id: string
}

export default function ToggleItem({ item }: { item: Item }) {
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(item.checked)
  const [, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      setOptimisticChecked(!optimisticChecked)
      await toggleItem(item.id, !optimisticChecked)
    })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    startTransition(async () => {
      await deleteItem(item.id, item.checklist_id)
    })
  }

  return (
    <div className={`flex items-center gap-2 group/item rounded-lg transition-colors ${optimisticChecked ? "bg-slate-50" : "hover:bg-slate-50"}`}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-3 flex-1 text-left px-4 py-2.5"
      >
        <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all ${
          optimisticChecked
            ? "bg-blue-500 border-blue-500"
            : "border-slate-300 hover:border-blue-400"
        }`}>
          {optimisticChecked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className={`text-sm transition-colors ${
          optimisticChecked ? "text-slate-400 line-through" : "text-slate-700"
        }`}>
          {item.text}
        </span>
      </button>

      <button
        onClick={handleDelete}
        className="opacity-0 group-hover/item:opacity-100 p-1.5 mr-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
        title="Excluir item"
      >
        <X size={13} />
      </button>
    </div>
  )
}
