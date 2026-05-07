import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export type AICallOptions = {
  system: string
  user: string
  temperature?: number
  maxTokens?: number
}

export async function generateWithFallback(opts: AICallOptions): Promise<string> {
  const { system, user, temperature = 0.7, maxTokens = 2000 } = opts

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    max_tokens: maxTokens,
  })
  return completion.choices[0].message.content ?? ""
}
