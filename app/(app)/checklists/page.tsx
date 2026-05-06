import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function ChecklistsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <Sparkles size={24} className="text-blue-400" />
      </div>
      <p className="font-semibold text-slate-700 mb-1">Selecione um checklist</p>
      <p className="text-slate-400 text-sm max-w-xs mb-6">
        Escolha um checklist na lista ao lado ou crie um novo na página inicial.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:from-blue-600 hover:to-blue-700 transition-all"
      >
        <Sparkles size={14} />
        Criar novo checklist
      </Link>
    </div>
  )
}
