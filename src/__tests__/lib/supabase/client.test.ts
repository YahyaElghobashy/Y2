import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockClient = {
  auth: { getUser: vi.fn(), onAuthStateChange: vi.fn() },
  from: vi.fn(),
  channel: vi.fn(),
}

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => mockClient),
}))

describe('getSupabaseBrowserClient', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.resetModules()
  })

  it('returns an object with auth, from, and channel properties', async () => {
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client')
    const client = getSupabaseBrowserClient()
    expect(client).toHaveProperty('auth')
    expect(client).toHaveProperty('from')
    expect(client).toHaveProperty('channel')
  })

  it('returns the same instance on subsequent calls (singleton)', async () => {
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client')
    const first = getSupabaseBrowserClient()
    const second = getSupabaseBrowserClient()
    expect(first).toBe(second)
  })
})
