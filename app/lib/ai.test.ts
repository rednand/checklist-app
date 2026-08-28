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
      model: 'openai/gpt-oss-120b',
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

  it('falls back to the next model when a call fails', async () => {
    mockCreate
      .mockRejectedValueOnce(new Error('model_not_found'))
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'from fallback model' } }],
      })

    const result = await generateWithFallback({ system: 'sys', user: 'usr' })

    expect(result).toBe('from fallback model')
    expect(mockCreate).toHaveBeenCalledTimes(2)
    expect(mockCreate.mock.calls[0][0].model).toBe('openai/gpt-oss-120b')
    expect(mockCreate.mock.calls[1][0].model).toBe('openai/gpt-oss-20b')
  })

  it('throws the last error when every model fails', async () => {
    const finalError = new Error('all models exhausted')
    mockCreate
      .mockRejectedValueOnce(new Error('error 1'))
      .mockRejectedValueOnce(new Error('error 2'))
      .mockRejectedValueOnce(new Error('error 3'))
      .mockRejectedValueOnce(finalError)

    await expect(generateWithFallback({ system: 'sys', user: 'usr' })).rejects.toThrow(
      'all models exhausted'
    )
    expect(mockCreate).toHaveBeenCalledTimes(4)
  })
})
