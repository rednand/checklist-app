"use server"

import { createClient } from "../utils/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { generateWithFallback } from "../lib/ai"

type GeneratedItem = {
  text: string
  category: string
  position: number
}

export async function generateChecklist(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const prompt = (formData.get("prompt") as string).trim()
  if (!prompt) return

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from("checklists")
    .select("id", { count: "exact" })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo)

  if ((recentCount ?? 0) >= 20) {
    throw new Error("Limite de 20 checklists por hora atingido. Tente novamente mais tarde.")
  }

  const content = await generateWithFallback({
    system: `Você é um assistente que gera checklists detalhados e práticos.
Responda APENAS com um JSON válido no seguinte formato, sem texto adicional:
{
  "title": "título do checklist",
  "items": [
    { "text": "descrição do item", "category": "Nome da Categoria", "position": 0 },
    ...
  ]
}
Agrupe os itens em categorias relevantes. Gere entre 10 e 25 itens práticos.`,
    user: `Gere um checklist para: ${prompt}`,
    temperature: 0.7,
    maxTokens: 2000,
  })

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("Resposta inválida da IA")

  let title: string, items: GeneratedItem[]
  try {
    ;({ title, items } = JSON.parse(jsonMatch[0]) as { title: string; items: GeneratedItem[] })
  } catch {
    throw new Error("Não foi possível interpretar a resposta da IA. Tente novamente.")
  }

  const { data: checklist, error } = await supabase
    .from("checklists")
    .insert({ title, prompt, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  const { error: itemsError } = await supabase
    .from("checklist_items")
    .insert(
      items.map((item, i) => ({
        checklist_id: checklist.id,
        user_id: user.id,
        text: item.text,
        category: item.category ?? null,
        position: item.position ?? i,
      }))
    )

  if (itemsError) throw new Error(itemsError.message)

  redirect(`/checklists/${checklist.id}`)
}

export async function toggleItem(itemId: string, checked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await supabase
    .from("checklist_items")
    .update({ checked })
    .eq("id", itemId)
    .eq("user_id", user.id)
  revalidatePath("/checklists")
}

export async function generateFromExtraction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const extract = (formData.get("extract") as string).trim()
  let content = (formData.get("text") as string ?? "").trim()

  if (!content || !extract) return

  const MAX_CHARS = 16000
  if (content.length > MAX_CHARS) {
    const lower = content.toLowerCase()
    const extractLower = extract.toLowerCase()
    // Usa última ocorrência: ignora menções no índice/sumário e pega o conteúdo real
    let idx = lower.lastIndexOf(extractLower)
    if (idx === -1) {
      idx = lower.lastIndexOf(extractLower.split(" ")[0])
    }
    const start = idx !== -1 ? Math.max(0, idx - 100) : 0
    content = content.slice(start, start + MAX_CHARS)
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from("checklists")
    .select("id", { count: "exact" })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo)

  if ((recentCount ?? 0) >= 20) {
    throw new Error("Limite de 20 checklists por hora atingido.")
  }

  const responseContent = await generateWithFallback({
    system: `Você é um assistente especialista em análise de documentos.
Sua tarefa é extrair TODOS os tópicos/itens relacionados a "${extract}" do texto e gerar um checklist de estudo completo.
Regras importantes:
- Extraia TODOS os itens encontrados, sem resumir ou omitir nenhum
- Se o texto especificar um cargo ou área, extraia apenas o conteúdo desse cargo/área específico
- Cada tópico do conteúdo programático deve virar um item separado no checklist
- Use as matérias/disciplinas como categorias
Responda APENAS com um JSON válido no seguinte formato, sem texto adicional:
{
  "title": "título descritivo do checklist",
  "items": [
    { "text": "descrição do item", "category": "Nome da Categoria", "position": 0 },
    ...
  ]
}`,
    user: `Extraia "${extract}" do seguinte texto e gere um checklist completo com TODOS os tópicos encontrados:\n\n${content}`,
    temperature: 0.3,
    maxTokens: 4000,
  })

  const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("Resposta inválida da IA")

  let title: string, items: GeneratedItem[]
  try {
    ;({ title, items } = JSON.parse(jsonMatch[0]) as { title: string; items: GeneratedItem[] })
  } catch {
    throw new Error("Não foi possível interpretar a resposta da IA. Tente novamente.")
  }

  const { data: checklist, error } = await supabase
    .from("checklists")
    .insert({ title, prompt: `Extraído de documento: ${extract}`, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase.from("checklist_items").insert(
    items.map((item, i) => ({
      checklist_id: checklist.id,
      user_id: user.id,
      text: item.text,
      category: item.category ?? null,
      position: item.position ?? i,
    }))
  )

  redirect(`/checklists/${checklist.id}`)
}

export async function createFromSpreadsheet(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const title = (formData.get("title") as string).trim()
  const itemsJson = formData.get("items") as string
  const items: { text: string; category: string | null }[] = JSON.parse(itemsJson || "[]")

  if (!title || items.length === 0) return

  const { data: checklist, error } = await supabase
    .from("checklists")
    .insert({ title, prompt: "Importado de planilha", user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase.from("checklist_items").insert(
    items.map((item, i) => ({
      checklist_id: checklist.id,
      user_id: user.id,
      text: item.text,
      category: item.category ?? null,
      position: i,
    }))
  )

  redirect(`/checklists/${checklist.id}`)
}

export async function createManualChecklist(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const title = (formData.get("title") as string).trim()
  if (!title) return

  const itemsJson = formData.get("items") as string
  const items: string[] = JSON.parse(itemsJson || "[]")

  const { data: checklist, error } = await supabase
    .from("checklists")
    .insert({ title, prompt: "Criado manualmente", user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (items.length > 0) {
    await supabase.from("checklist_items").insert(
      items.map((text, i) => ({
        checklist_id: checklist.id,
        user_id: user.id,
        text,
        position: i,
      }))
    )
  }

  redirect(`/checklists/${checklist.id}`)
}

export async function createFromMarkdown(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const title = (formData.get("title") as string).trim()
  const itemsJson = formData.get("items") as string
  const items: { text: string; category: string | null }[] = JSON.parse(itemsJson || "[]")

  if (!title || items.length === 0) return

  const { data: checklist, error } = await supabase
    .from("checklists")
    .insert({ title, prompt: "Importado de markdown", user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase.from("checklist_items").insert(
    items.map((item, i) => ({
      checklist_id: checklist.id,
      user_id: user.id,
      text: item.text,
      category: item.category ?? null,
      position: i,
    }))
  )

  redirect(`/checklists/${checklist.id}`)
}

export async function addItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const checklist_id = formData.get("checklist_id") as string
  const text = (formData.get("text") as string).trim()
  const category = ((formData.get("category") as string | null)?.trim()) || null

  if (!text) return

  const { data: last } = await supabase
    .from("checklist_items")
    .select("position")
    .eq("checklist_id", checklist_id)
    .order("position", { ascending: false })
    .limit(1)
    .single()

  await supabase.from("checklist_items").insert({
    checklist_id,
    user_id: user.id,
    text,
    category,
    position: (last?.position ?? -1) + 1,
  })

  revalidatePath(`/checklists/${checklist_id}`)
}

export async function deleteItem(itemId: string, checklistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await supabase.from("checklist_items").delete().eq("id", itemId).eq("user_id", user.id)
  revalidatePath(`/checklists/${checklistId}`)
}

export async function deleteChecklist(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await supabase.from("checklists").delete().eq("id", id).eq("user_id", user.id)
  revalidatePath("/checklists")
  redirect("/checklists")
}
