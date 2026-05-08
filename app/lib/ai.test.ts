import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: mockCreate } } }
  }),
}))

import { generateWithFallback } from './ai'

describe('generateWithFallback', () => {
  beforeEach(() => mockCreate.mockReset())

  it('returns the message content from the completion', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'generated text' } }],
    })

    const result = await generateWithFallback({ system: 'sys', user: 'usr' })

    expect(result).toBe('generated text')
  })

  it('calls Groq with the correct model, messages, and options', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '' } }],
    })

    await generateWithFallback({ system: 'sys', user: 'usr', temperature: 0.3, maxTokens: 500 })

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'usr' },
      ],
      temperature: 0.3,
      max_tokens: 500,
    })
  })

  it('returns empty string when the model returns null content', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    })

    const result = await generateWithFallback({ system: '', user: '' })

    expect(result).toBe('')
  })
})
