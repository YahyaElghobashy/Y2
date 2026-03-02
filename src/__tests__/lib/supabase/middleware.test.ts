import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
const mockSupabaseClient = {
  auth: { getUser: mockGetUser },
}

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('next/server', () => {
  const NextResponse = {
    next: vi.fn(({ request }: { request: unknown }) => ({
      request,
      cookies: {
        set: vi.fn(),
      },
    })),
  }
  return { NextResponse }
})

describe('updateSession', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    mockGetUser.mockClear()
  })

  it('returns a response object', async () => {
    const { updateSession } = await import('@/lib/supabase/middleware')
    const mockRequest = {
      cookies: {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      },
    } as unknown as Parameters<typeof updateSession>[0]

    const response = await updateSession(mockRequest)
    expect(response).toBeDefined()
    expect(response).toHaveProperty('cookies')
  })

  it('calls supabase.auth.getUser() to refresh the session', async () => {
    const { updateSession } = await import('@/lib/supabase/middleware')
    const mockRequest = {
      cookies: {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      },
    } as unknown as Parameters<typeof updateSession>[0]

    await updateSession(mockRequest)
    expect(mockGetUser).toHaveBeenCalled()
  })
})
