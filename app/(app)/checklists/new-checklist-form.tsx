"use client";

import { useTransition, useState, useRef } from "react";
import {
  generateChecklist,
  createManualChecklist,
  generateFromExtraction,
  createFromSpreadsheet,
  createFromMarkdown,
} from "../../actions/checklists";
import {
  Loader2,
  Sparkles,
  Plus,
  X,
  ListChecks,
  FileText,
  Upload,
  Table,
  Hash,
} from "lucide-react";

type Mode = "ai" | "extract" | "spreadsheet" | "manual" | "markdown";

export default function NewChecklistForm() {
  const [mode, setMode] = useState<Mode>("ai");
  const [isPending, startTransition] = useTransition();

  const handleAiSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => generateChecklist(formData));
  };

  const tabs: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: "ai", label: "Gerar com IA", icon: <Sparkles size={13} /> },
    { id: "extract", label: "Extrair PDF/texto", icon: <FileText size={13} /> },
    { id: "spreadsheet", label: "Planilha/CSV", icon: <Table size={13} /> },
    { id: "manual", label: "Manual", icon: <ListChecks size={13} /> },
    { id: "markdown", label: "Markdown", icon: <Hash size={13} /> },
  ];

  return (
    <div>
      <div className="flex border-b border-slate-100 sm:border-b-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`flex items-center justify-center gap-1.5 pb-2.5 px-2 sm:px-3 flex-1 text-[11px] transition-all border-b-2 sm:border-b-0 -mb-px sm:mb-0 ${
              mode === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline" style={{ fontSize: "13px" }}>{tab.label}</span>
          </button>
        ))}
      </div>
      <p className="sm:hidden text-[11px] font-medium text-blue-600 pt-2 mb-3">
        {tabs.find((t) => t.id === mode)?.label}
      </p>

      {mode === "ai" && (
        <AiForm isPending={isPending} onSubmit={handleAiSubmit} />
      )}
      {mode === "extract" && (
        <ExtractForm isPending={isPending} startTransition={startTransition} />
      )}
      {mode === "spreadsheet" && (
        <SpreadsheetForm
          isPending={isPending}
          startTransition={startTransition}
        />
      )}
      {mode === "manual" && (
        <ManualForm isPending={isPending} startTransition={startTransition} />
      )}
      {mode === "markdown" && (
        <MarkdownForm isPending={isPending} startTransition={startTransition} />
      )}
    </div>
  );
}

function AiForm({
  isPending,
  onSubmit,
}: {
  isPending: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        name="prompt"
        placeholder="Ex: Planejamento para lançamento de produto, viagem internacional..."
        rows={3}
        required
        disabled={isPending}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder-slate-400 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
        autoFocus
      />
      <SubmitButton
        isPending={isPending}
        label="Gerar Checklist com IA"
        icon={<Sparkles size={14} />}
      />
    </form>
  );
}

function ExtractForm({
  isPending,
  startTransition,
}: {
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [extracting, setExtracting] = useState(false);
  const extractRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const extractWhat = extractRef.current?.value.trim() ?? "";
    if (!extractWhat) return;

    const formData = new FormData();
    formData.set("extract", extractWhat);

    if (inputMode === "file") {
      const fileInput =
        form.querySelector<HTMLInputElement>('input[type="file"]');
      const file = fileInput?.files?.[0];
      if (!file) return;

      setExtracting(true);
      try {
        const text = await extractTextFromPDF(file);
        formData.set("text", text);
      } finally {
        setExtracting(false);
      }
    } else {
      const textarea = form.querySelector<HTMLTextAreaElement>("textarea");
      formData.set("text", textarea?.value ?? "");
    }

    startTransition(() => generateFromExtraction(formData));
  };

  const busy = isPending || extracting;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2 mb-1">
        <button
          type="button"
          onClick={() => setInputMode("file")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${inputMode === "file" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"}`}
        >
          Upload PDF
        </button>
        <button
          type="button"
          onClick={() => setInputMode("text")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${inputMode === "text" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"}`}
        >
          Colar texto
        </button>
      </div>

      {inputMode === "file" ? (
        <label
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${fileName ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"}`}
        >
          <Upload
            size={20}
            className={fileName ? "text-blue-500" : "text-slate-400"}
          />
          <span className="text-sm text-slate-500 text-center">
            {fileName ?? "Clique para selecionar um PDF"}
          </span>
          <span className="text-xs text-slate-400">Máximo 50MB</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            disabled={busy}
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      ) : (
        <textarea
          placeholder="Cole aqui o conteúdo do documento..."
          rows={5}
          disabled={busy}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder-slate-400 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
        />
      )}

      <input
        ref={extractRef}
        type="text"
        placeholder="O que extrair? Ex: conteúdo programático, requisitos..."
        required
        disabled={busy}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
      />

      <button
        type="submit"
        disabled={busy}
        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {extracting ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Lendo PDF...
          </>
        ) : isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Gerando checklist...
          </>
        ) : (
          <>
            <FileText size={14} /> Extrair e Gerar Checklist
          </>
        )}
      </button>
    </form>
  );
}

type ParsedRow = Record<string, string>;

async function parseSpreadsheet(
  file: File | null,
  rawText: string,
): Promise<{ headers: string[]; rows: ParsedRow[] }> {
  if (file) {
    const { read, utils } = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const wb = read(buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = utils.sheet_to_json<ParsedRow>(ws, { defval: "" });
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    return { headers, rows: data };
  }

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(sep);
    return Object.fromEntries(
      headers.map((h, i) => [h, (cells[i] ?? "").trim()]),
    );
  });
  return { headers, rows };
}

function SpreadsheetForm({
  isPending,
  startTransition,
}: {
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [itemCol, setItemCol] = useState("");
  const [categoryCol, setCategoryCol] = useState("");
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [parsing, setParsing] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleParse = async (file: File | null) => {
    const text = textRef.current?.value ?? "";
    if (!file && !text.trim()) return;
    setParsing(true);
    try {
      const result = await parseSpreadsheet(file, text);
      setHeaders(result.headers);
      setRows(result.rows);
      if (result.headers.length > 0) {
        const topicCol =
          result.headers.find((h) =>
            /tópico|topic|item|tarefa|assunto|descrição/i.test(h),
          ) ?? result.headers[result.headers.length - 1];
        const catCol =
          result.headers.find((h) =>
            /categor|subcategor|área|area|disciplina|matéria/i.test(h),
          ) ?? "";
        setItemCol(topicCol);
        setCategoryCol(catCol);
      }
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!itemCol || rows.length === 0) return;

    const str = (v: unknown) => (v == null ? "" : String(v).trim());

    const items = rows
      .filter((r) => str(r[itemCol]))
      .map((r) => ({
        text: str(r[itemCol]),
        category: categoryCol ? str(r[categoryCol]) || null : null,
      }));

    const formData = new FormData();
    formData.set("title", title);
    formData.set("items", JSON.stringify(items));
    startTransition(() => createFromSpreadsheet(formData));
  };

  const busy = isPending || parsing;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        {(["file", "text"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setInputMode(m)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${inputMode === m ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"}`}
          >
            {m === "file" ? "Upload arquivo" : "Colar CSV"}
          </button>
        ))}
      </div>

      {inputMode === "file" ? (
        <label
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${fileName ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"}`}
        >
          <Table
            size={20}
            className={fileName ? "text-blue-500" : "text-slate-400"}
          />
          <span className="text-sm text-slate-500">
            {fileName ?? "Clique para selecionar CSV ou Excel"}
          </span>
          <span className="text-xs text-slate-400">.csv · .xlsx · .xls</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0] ?? null;
              if (f) {
                setFileName(f.name);
                await handleParse(f);
              }
            }}
          />
        </label>
      ) : (
        <div className="space-y-2">
          <textarea
            ref={textRef}
            placeholder={"Coluna1;Coluna2;Coluna3\nValor1;Valor2;Valor3"}
            rows={5}
            disabled={busy}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder-slate-400 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-mono"
          />
          <button
            type="button"
            onClick={() => handleParse(null)}
            disabled={busy}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-3 py-1.5 rounded-full transition-colors"
          >
            {parsing ? "Processando..." : "Processar CSV"}
          </button>
        </div>
      )}

      {headers.length > 0 && (
        <>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{rows.length}</span>{" "}
            linhas detectadas ·{" "}
            <span className="font-medium text-slate-700">{headers.length}</span>{" "}
            colunas
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Coluna do item *
              </label>
              <select
                value={itemCol}
                onChange={(e) => setItemCol(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400"
              >
                <option value="">Selecionar...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Coluna da categoria
              </label>
              <select
                value={categoryCol}
                onChange={(e) => setCategoryCol(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400"
              >
                <option value="">Nenhuma</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder="Título do checklist..."
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />

          <SubmitButton
            isPending={isPending}
            label={`Criar Checklist (${rows.length} itens)`}
            icon={<Table size={14} />}
          />
        </>
      )}
    </form>
  );
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: unknown) =>
        typeof item === "object" && item !== null && "str" in item
          ? (item as { str: string }).str
          : "",
      )
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n");
}

function ManualForm({
  isPending,
  startTransition,
}: {
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [items, setItems] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addItem = () => {
    const text = inputValue.trim();
    if (!text) return;
    setItems((prev) => [...prev, text]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("items", JSON.stringify(items));
    startTransition(() => createManualChecklist(formData));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="title"
        type="text"
        placeholder="Título do checklist..."
        required
        disabled={isPending}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
        autoFocus
      />

      {items.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
            >
              <div className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0" />
              <span className="text-sm text-slate-700 flex-1 truncate">
                {item}
              </span>
              <button
                type="button"
                onClick={() =>
                  setItems((prev) => prev.filter((_, j) => j !== i))
                }
                className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
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
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="Adicionar item (Enter para confirmar)..."
          disabled={isPending}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!inputValue.trim()}
          className="flex items-center justify-center w-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors disabled:opacity-40"
        >
          <Plus size={15} />
        </button>
      </div>

      <SubmitButton
        isPending={isPending}
        label={`Criar Checklist${items.length > 0 ? ` (${items.length})` : ""}`}
        icon={<ListChecks size={14} />}
        disabled={items.length === 0}
      />
    </form>
  );
}

function parseMarkdown(md: string): { title: string; items: { text: string; category: string | null }[] } {
  const lines = md.split("\n");
  let title = "";
  let h2: string | null = null;
  let h3: string | null = null;
  const items: { text: string; category: string | null }[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === "---") continue;

    const h1Match = line.match(/^# (.+)/);
    if (h1Match) {
      if (!title) {
        title = h1Match[1].trim();
      } else {
        h2 = h1Match[1].trim();
        h3 = null;
      }
      continue;
    }

    const h2Match = line.match(/^## (.+)/);
    if (h2Match) {
      h2 = h2Match[1].trim();
      h3 = null;
      continue;
    }

    const h3Match = line.match(/^### (.+)/);
    if (h3Match) {
      h3 = h3Match[1].trim();
      continue;
    }

    const checkbox = line.match(/^[-*] \[[ xX]\] (.+)/);
    if (checkbox) {
      const category = h2 && h3 ? `${h2} › ${h3}` : h3 ?? h2;
      items.push({ text: checkbox[1].trim(), category });
    }
  }

  return { title, items };
}

function MarkdownForm({
  isPending,
  startTransition,
}: {
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("");
  const titleManualRef = useRef(false);

  const parsed = parseMarkdown(markdown);

  const categoryOrder: string[] = [];
  const itemsByCategory: Record<string, { text: string; category: string | null }[]> = {};
  for (const item of parsed.items) {
    const key = item.category ?? "";
    if (!itemsByCategory[key]) {
      categoryOrder.push(key);
      itemsByCategory[key] = [];
    }
    itemsByCategory[key].push(item);
  }

  const handleMarkdownChange = (value: string) => {
    setMarkdown(value);
    if (!titleManualRef.current) {
      const p = parseMarkdown(value);
      if (p.title) setTitle(p.title);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || parsed.items.length === 0) return;
    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("items", JSON.stringify(parsed.items));
    startTransition(() => createFromMarkdown(formData));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={markdown}
        onChange={(e) => handleMarkdownChange(e.target.value)}
        placeholder={"# Título do Checklist\n\n## Categoria\n### Subcategoria\n\n- [ ] Item 1\n- [ ] Item 2"}
        rows={8}
        disabled={isPending}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder-slate-400 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 font-mono transition-all"
        autoFocus
      />

      {parsed.items.length > 0 && (
        <>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{parsed.items.length}</span> itens ·{" "}
            <span className="font-medium text-slate-700">{categoryOrder.filter(Boolean).length}</span> categorias
          </div>

          <div className="max-h-44 overflow-y-auto space-y-2.5 border border-slate-100 rounded-xl p-3">
            {categoryOrder.map((cat) => (
              <div key={cat}>
                {cat && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{cat}</p>
                )}
                <div className="space-y-0.5">
                  {itemsByCategory[cat].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-3 h-3 rounded border border-slate-300 shrink-0" />
                      <span className="truncate">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          titleManualRef.current = true;
        }}
        type="text"
        placeholder="Título do checklist..."
        required
        disabled={isPending}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition-all"
      />

      <SubmitButton
        isPending={isPending}
        label={parsed.items.length > 0 ? `Criar Checklist (${parsed.items.length} itens)` : "Criar Checklist"}
        icon={<Hash size={14} />}
        disabled={parsed.items.length === 0 || !title.trim()}
      />
    </form>
  );
}

function SubmitButton({
  isPending,
  label,
  icon,
  disabled,
}: {
  isPending: boolean;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={isPending || disabled}
      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <>
          <Loader2 size={14} className="animate-spin" /> Processando...
        </>
      ) : (
        <>
          {icon} {label}
        </>
      )}
    </button>
  );
}
