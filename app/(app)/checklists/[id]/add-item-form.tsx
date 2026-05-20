"use client"

import { useTransition, useRef } from "react"
import { addItem } from "../../../actions/checklists"
import { Plus, Loader2 } from "lucide-react"

export default function AddItemForm({ checklistId, categories }: { checklistId: string; categories: string[] }) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await addItem(formData)
      formRef.current?.reset()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
      <input type="hidden" name="checklist_id" value={checklistId} />

      {categories.length > 0 && (
        <select
          name="category"
          disabled={isPending}
          className="text-xs border border-slate-200 rounded-lg px-2 py-2 text-slate-600 bg-white focus:outline-none focus:border-blue-400 disabled:opacity-50 shrink-0"
        >
          <option value="">Sem categoria</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      <input
        name="text"
        type="text"
        placeholder="Adicionar item..."
        required
        disabled={isPending}
        className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 disabled:opacity-50 transition-colors"
      />

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 shrink-0"
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        Adicionar
      </button>
    </form>
  )
}
