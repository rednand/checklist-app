import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRevalidatePath = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }))
vi.mock('../lib/ai', () => ({ generateWithFallback: vi.fn() }))
vi.mock('../utils/supabase/server', () => ({ createClient: vi.fn() }))

import { redirect } from 'next/navigation'
import { generateWithFallback } from '../lib/ai'
import { createClient } from '../utils/supabase/server'
import {
  generateChecklist,
  generateFromExtraction,
  createFromSpreadsheet,
  createManualChecklist,
  createFromMarkdown,
  toggleItem,
  addItem,
  deleteItem,
  deleteChecklist,
} from './checklists'

const USER = { id: 'u-1' }

type Chainable = {
  then: Promise<unknown>['then']
  catch: Promise<unknown>['catch']
  single: () => Promise<unknown>
  select: (...args: unknown[]) => Chainable
  eq: (...args: unknown[]) => Chainable
  gte: (...args: unknown[]) => Chainable
  order: (...args: unknown[]) => Chainable
  limit: (...args: unknown[]) => Chainable
  insert: (...args: unknown[]) => Chainable
  update: (...args: unknown[]) => Chainable
  delete: (...args: unknown[]) => Chainable
}

function chain(resolved: unknown): Chainable {
  const p = Promise.resolve(resolved)
  const c: Chainable = {
    then: p.then.bind(p),
    catch: p.catch.bind(p),
    single: () => p,
    select: () => c,
    eq: () => c,
    gte: () => c,
    order: () => c,
    limit: () => c,
    insert: () => c,
    update: () => c,
    delete: () => c,
  }
  return c
}

function makeSupabase({
  recentCount = 0,
  checklistId = 'ck-1',
  hasRateLimit = true,
  lastPosition = null as number | null,
  itemsInsertError = null as { message: string } | null,
  checklistInsertError = null as { message: string } | null,
}: {
  recentCount?: number
  checklistId?: string
  hasRateLimit?: boolean
  lastPosition?: number | null
  itemsInsertError?: { message: string } | null
  checklistInsertError?: { message: string } | null
} = {}) {
  let checklistCalls = 0
  let itemsCalls = 0
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: USER } }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'checklist_items') {
        itemsCalls++
        if (lastPosition !== null && itemsCalls === 1) {
          return chain({ data: { position: lastPosition }, error: null })
        }
        return chain({ error: itemsInsertError })
      }
      checklistCalls++
      if (hasRateLimit && checklistCalls === 1) return chain({ count: recentCount, data: null, error: null })
      return chain({ data: { id: checklistId }, error: checklistInsertError })
    }),
  }
}

type Client = Awaited<ReturnType<typeof createClient>>

beforeEach(() => vi.clearAllMocks())

describe('generateChecklist', () => {
  it('returns early without calling AI when prompt is empty', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)
    const fd = new FormData()
    fd.set('prompt', '   ')

    await generateChecklist(fd)

    expect(vi.mocked(generateWithFallback)).not.toHaveBeenCalled()
  })

  it('throws when the hourly rate limit is reached', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ recentCount: 20 }) as unknown as Client)
    const fd = new FormData()
    fd.set('prompt', 'deploy a web app')

    await expect(generateChecklist(fd)).rejects.toThrow('Limite de 20 checklists por hora')
  })

  it('throws when the AI response contains no JSON', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)
    vi.mocked(generateWithFallback).mockResolvedValue('Sorry, cannot help.')
    const fd = new FormData()
    fd.set('prompt', 'deploy a web app')

    await expect(generateChecklist(fd)).rejects.toThrow('Resposta inválida da IA')
  })

  it('throws when the checklist_items insert fails', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ itemsInsertError: { message: 'items insert failed' } }) as unknown as Client
    )
    vi.mocked(generateWithFallback).mockResolvedValue(
      '{"title":"T","items":[{"text":"x","category":"c","position":0}]}'
    )
    const fd = new FormData()
    fd.set('prompt', 'deploy a web app')

    await expect(generateChecklist(fd)).rejects.toThrow('items insert failed')
  })

  it('redirects to the new checklist on success', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ checklistId: 'ck-new' }) as unknown as Client)
    vi.mocked(generateWithFallback).mockResolvedValue(
      '{"title":"My List","items":[{"text":"Step 1","category":"Setup","position":0}]}'
    )
    const fd = new FormData()
    fd.set('prompt', 'deploy a web app')

    await generateChecklist(fd)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/checklists/ck-new')
  })

  it('uses index and null for items missing category and position', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ checklistId: 'ck-nocat' }) as unknown as Client)
    vi.mocked(generateWithFallback).mockResolvedValue(
      '{"title":"List","items":[{"text":"Step 1"},{"text":"Step 2"}]}'
    )
    const fd = new FormData()
    fd.set('prompt', 'test')

    await generateChecklist(fd)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/checklists/ck-nocat')
  })
})

describe('generateFromExtraction', () => {
  it('returns early when text is missing', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)
    const fd = new FormData()
    fd.set('extract', 'react hooks')

    await generateFromExtraction(fd)

    expect(vi.mocked(generateWithFallback)).not.toHaveBeenCalled()
  })

  it('throws when the hourly rate limit is reached', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ recentCount: 20 }) as unknown as Client)
    const fd = new FormData()
    fd.set('extract', 'react hooks')
    fd.set('text', 'some document content')

    await expect(generateFromExtraction(fd)).rejects.toThrow('Limite de 20 checklists por hora')
  })

  it('truncates content longer than 16000 chars anchored at the last topic occurrence', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ checklistId: 'ck-ext' }) as unknown as Client)
    vi.mocked(generateWithFallback).mockResolvedValue(
      '{"title":"T","items":[{"text":"x","category":"c","position":0}]}'
    )

    const prefix = 'irrelevant content '.repeat(100)
    const topicSection = 'react hooks is a fundamental concept.'
    const suffix = 'z'.repeat(16000)
    const content = prefix + topicSection + suffix

    const fd = new FormData()
    fd.set('extract', 'react hooks')
    fd.set('text', content)

    await generateFromExtraction(fd)

    const userPrompt = vi.mocked(generateWithFallback).mock.calls[0][0].user
    expect(userPrompt).toContain('react hooks')
    expect(userPrompt.length).toBeLessThanOrEqual(16200)
  })

  it('falls back to the first word of extract when the full phrase is not found', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ checklistId: 'ck-ext2' }) as unknown as Client)
    vi.mocked(generateWithFallback).mockResolvedValue(
      '{"title":"T","items":[{"text":"x","category":"c","position":0}]}'
    )

    const prefix = 'a'.repeat(2000)
    const reactSection = 'we cover react in this tutorial, but not the hooks pattern'
    const suffix = 'z'.repeat(16000)
    const content = prefix + reactSection + suffix

    const fd = new FormData()
    fd.set('extract', 'react hooks')
    fd.set('text', content)

    await generateFromExtraction(fd)

    const userPrompt = vi.mocked(generateWithFallback).mock.calls[0][0].user
    expect(userPrompt).toContain('react')
    expect(userPrompt.length).toBeLessThanOrEqual(16200)
  })

  it('uses index and null for items missing category and position', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ checklistId: 'ck-ext3' }) as unknown as Client)
    vi.mocked(generateWithFallback).mockResolvedValue(
      '{"title":"T","items":[{"text":"Step 1"},{"text":"Step 2"}]}'
    )
    const fd = new FormData()
    fd.set('extract', 'topic')
    fd.set('text', 'some content about the topic')

    await generateFromExtraction(fd)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/checklists/ck-ext3')
  })

  it('starts truncation from 0 when the topic is not found anywhere in content', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase({ checklistId: 'ck-notfound' }) as unknown as Client)
    vi.mocked(generateWithFallback).mockResolvedValue(
      '{"title":"T","items":[{"text":"x","category":"c","position":0}]}'
    )

    const content = 'unrelated text about cooking and recipes. '.repeat(400)

    const fd = new FormData()
    fd.set('extract', 'quantum physics xyz')
    fd.set('text', content)

    await generateFromExtraction(fd)

    const userPrompt = vi.mocked(generateWithFallback).mock.calls[0][0].user
    expect(userPrompt.length).toBeLessThanOrEqual(16200)
  })

  it('throws when AI response JSON is malformed', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)
    vi.mocked(generateWithFallback).mockResolvedValue('{invalid json}')
    const fd = new FormData()
    fd.set('extract', 'react hooks')
    fd.set('text', 'some document content')

    await expect(generateFromExtraction(fd)).rejects.toThrow('Não foi possível interpretar a resposta da IA')
  })
})

describe('createFromSpreadsheet', () => {
  it('throws when the checklist insert fails', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ hasRateLimit: false, checklistInsertError: { message: 'db error' } }) as unknown as Client
    )
    const fd = new FormData()
    fd.set('title', 'Test')
    fd.set('items', JSON.stringify([{ text: 'Item', category: null }]))

    await expect(createFromSpreadsheet(fd)).rejects.toThrow('db error')
  })

  it('returns early when title is empty', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)
    const fd = new FormData()
    fd.set('title', '')
    fd.set('items', JSON.stringify([{ text: 'Item 1', category: null }]))

    await createFromSpreadsheet(fd)

    expect(vi.mocked(redirect)).not.toHaveBeenCalled()
  })

  it('returns early when items array is empty', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)
    const fd = new FormData()
    fd.set('title', 'Valid Title')
    fd.set('items', '[]')

    await createFromSpreadsheet(fd)

    expect(vi.mocked(redirect)).not.toHaveBeenCalled()
  })

  it('redirects to the new checklist on success', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ checklistId: 'ck-sheet', hasRateLimit: false }) as unknown as Client
    )
    const fd = new FormData()
    fd.set('title', 'Import Test')
    fd.set('items', JSON.stringify([{ text: 'Row 1', category: 'A' }]))

    await createFromSpreadsheet(fd)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/checklists/ck-sheet')
  })
})

describe('createManualChecklist', () => {
  it('throws when the checklist insert fails', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ hasRateLimit: false, checklistInsertError: { message: 'db error' } }) as unknown as Client
    )
    const fd = new FormData()
    fd.set('title', 'Test')
    fd.set('items', '[]')

    await expect(createManualChecklist(fd)).rejects.toThrow('db error')
  })

  it('returns early when title is empty', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)
    const fd = new FormData()
    fd.set('title', '')
    fd.set('items', '[]')

    await createManualChecklist(fd)

    expect(vi.mocked(redirect)).not.toHaveBeenCalled()
  })

  it('redirects to the new checklist on success', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ checklistId: 'ck-manual', hasRateLimit: false }) as unknown as Client
    )
    const fd = new FormData()
    fd.set('title', 'Manual List')
    fd.set('items', JSON.stringify(['Task A', 'Task B']))

    await createManualChecklist(fd)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/checklists/ck-manual')
  })

  it('redirects without inserting items when the items array is empty', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ checklistId: 'ck-empty', hasRateLimit: false }) as unknown as Client
    )
    const fd = new FormData()
    fd.set('title', 'Empty List')
    fd.set('items', '[]')

    await createManualChecklist(fd)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/checklists/ck-empty')
  })
})

describe('createFromMarkdown', () => {
  it('returns early when title is empty', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)
    const fd = new FormData()
    fd.set('title', '')
    fd.set('items', JSON.stringify([{ text: 'Item', category: null }]))

    await createFromMarkdown(fd)

    expect(vi.mocked(redirect)).not.toHaveBeenCalled()
  })

  it('returns early when items array is empty', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)
    const fd = new FormData()
    fd.set('title', 'Markdown List')
    fd.set('items', '[]')

    await createFromMarkdown(fd)

    expect(vi.mocked(redirect)).not.toHaveBeenCalled()
  })

  it('throws when the checklist insert fails', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ hasRateLimit: false, checklistInsertError: { message: 'db error' } }) as unknown as Client
    )
    const fd = new FormData()
    fd.set('title', 'Markdown List')
    fd.set('items', JSON.stringify([{ text: 'Item 1', category: 'Setup' }]))

    await expect(createFromMarkdown(fd)).rejects.toThrow('db error')
  })

  it('redirects to the new checklist on success', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ checklistId: 'ck-md', hasRateLimit: false }) as unknown as Client
    )
    const fd = new FormData()
    fd.set('title', 'Markdown List')
    fd.set('items', JSON.stringify([
      { text: 'Item 1', category: 'Setup' },
      { text: 'Item 2', category: null },
    ]))

    await createFromMarkdown(fd)

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/checklists/ck-md')
  })
})

describe('toggleItem', () => {
  it('revalidates the checklists path after toggling', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)

    await toggleItem('item-1', true)

    expect(mockRevalidatePath).toHaveBeenCalledWith('/checklists')
  })
})

describe('addItem', () => {
  it('revalidates the checklist path after adding an item', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ hasRateLimit: false, lastPosition: 2 }) as unknown as Client
    )
    const fd = new FormData()
    fd.set('checklist_id', 'ck-1')
    fd.set('text', 'New task')
    fd.set('category', 'General')

    await addItem(fd)

    expect(mockRevalidatePath).toHaveBeenCalledWith('/checklists/ck-1')
  })

  it('assigns position 0 when no existing items', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ hasRateLimit: false }) as unknown as Client
    )
    const fd = new FormData()
    fd.set('checklist_id', 'ck-1')
    fd.set('text', 'First task')
    fd.set('category', '')

    await addItem(fd)

    expect(mockRevalidatePath).toHaveBeenCalledWith('/checklists/ck-1')
  })

  it('returns early when text is empty', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)
    const fd = new FormData()
    fd.set('checklist_id', 'ck-1')
    fd.set('text', '')
    fd.set('category', '')

    await addItem(fd)

    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})

describe('deleteItem', () => {
  it('revalidates the checklist path after deletion', async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabase() as unknown as Client)

    await deleteItem('item-1', 'ck-1')

    expect(mockRevalidatePath).toHaveBeenCalledWith('/checklists/ck-1')
  })
})

describe('deleteChecklist', () => {
  it('revalidates and redirects to /checklists after deletion', async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ hasRateLimit: false }) as unknown as Client
    )

    await deleteChecklist('ck-1')

    expect(mockRevalidatePath).toHaveBeenCalledWith('/checklists')
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/checklists')
  })
})
