"use server"

import { createClient } from "../utils/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `Você é um assistente que gera checklists detalhados e práticos.
Responda APENAS com um JSON válido no seguinte formato, sem texto adicional:
{
  "title": "título do checklist",
  "items": [
    { "text": "descrição do item", "category": "Nome da Categoria", "position": 0 },
    ...
  ]
}
Agrupe os itens em categorias relevantes. Gere entre 10 e 25 itens práticos.`,
      },
      {
        role: "user",
        content: `Gere um checklist para: ${prompt}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const content = completion.choices[0].message.content ?? ""
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("Resposta inválida da IA")

  const { title, items } = JSON.parse(jsonMatch[0]) as { title: string; items: GeneratedItem[] }

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
  await supabase
    .from("checklist_items")
    .update({ checked })
    .eq("id", itemId)
  revalidatePath("/checklists")
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

export async function addItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const checklist_id = formData.get("checklist_id") as string
  const text = (formData.get("text") as string).trim()
  const category = (formData.get("category") as string).trim() || null

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
  await supabase.from("checklist_items").delete().eq("id", itemId)
  revalidatePath(`/checklists/${checklistId}`)
}

export async function deleteChecklist(id: string) {
  const supabase = await createClient()
  await supabase.from("checklists").delete().eq("id", id)
  revalidatePath("/checklists")
  redirect("/checklists")
}
