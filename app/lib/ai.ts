import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "qwen/qwen3.8-27b",
]

export type AICallOptions = {
  system: string
  user: string
  temperature?: number
  maxTokens?: number
}

export async function generateWithFallback(opts: AICallOptions): Promise<string> {
  const { system, user, temperature = 0.7, maxTokens = 2000 } = opts

  let lastError: unknown

  for (const model of FALLBACK_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature,
        max_tokens: maxTokens,
      })
      return completion.choices[0].message.content ?? ""
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}
