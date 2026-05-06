"use client"

import { useTransition, useState, useRef } from "react"
import { generateChecklist, createManualChecklist } from "../../actions/checklists"
import { Loader2, Sparkles, Plus, X, ListChecks } from "lucide-react"

export default function NewChecklistForm() {
  const [mode, setMode] = useState<"ai" | "manual">("ai")
  const [isPending, startTransition] = useTransition()

  const handleAiSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => generateChecklist(formData))
  }

  return (
    <div>
      {mode === "ai" ? (
        <AiForm isPending={isPending} onSubmit={handleAiSubmit} />
      ) : (
        <ManualForm isPending={isPending} startTransition={startTransition} />
      )}

      <div className="mt-4 text-center">
        {mode === "ai" ? (
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="text-sm text-slate-400 hover:text-blue-600 transition-colors underline underline-offset-2"
          >
            Criar checklist manual
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode("ai")}
            className="text-sm text-slate-400 hover:text-blue-600 transition-colors underline underline-offset-2"
          >
            Gerar com IA
          </button>
        )}
      </div>
    </div>
  )
}

function AiForm({ isPending, onSubmit }: { isPending: boolean; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          O que você precisa organizar?
        </label>
        <textarea
          name="prompt"
          placeholder="Ex: Planejamento completo para lançamento de um novo produto digital..."
          rows={4}
          required
          disabled={isPending}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder-slate-400 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
          autoFocus
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <><Loader2 size={15} className="animate-spin" /> Gerando checklist...</>
        ) : (
          <><Sparkles size={15} /> Gerar Checklist com IA</>
        )}
      </button>
      {isPending && (
        <p className="text-center text-slate-400 text-xs pt-1">Aguarde alguns segundos...</p>
      )}
    </form>
  )
}

function ManualForm({ isPending, startTransition }: { isPending: boolean; startTransition: (fn: () => void) => void }) {
  const [items, setItems] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const addItem = () => {
    const text = inputValue.trim()
    if (!text) return
    setItems(prev => [...prev, text])
    setInputValue("")
    inputRef.current?.focus()
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addItem()
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("items", JSON.stringify(items))
    startTransition(() => createManualChecklist(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Título do checklist
        </label>
        <input
          name="title"
          type="text"
          placeholder="Ex: Compras do mês, Tarefas da semana..."
          required
          disabled={isPending}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Itens
        </label>

        {items.length > 0 && (
          <div className="mb-2 space-y-1">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <div className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0" />
                <span className="text-sm text-slate-700 flex-1">{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Adicionar item e pressionar Enter..."
            disabled={isPending}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
          />
          <button
            type="button"
            onClick={addItem}
            disabled={!inputValue.trim()}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium px-3 py-2.5 rounded-xl transition-colors disabled:opacity-40"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || items.length === 0}
        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <><Loader2 size={15} className="animate-spin" /> Criando...</>
        ) : (
          <><ListChecks size={15} /> Criar Checklist ({items.length} {items.length === 1 ? "item" : "itens"})</>
        )}
      </button>
    </form>
  )
}
