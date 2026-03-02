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

  it('returns response and user', async () => {
    const { updateSession } = await import('@/lib/supabase/middleware')
    const mockRequest = {
      cookies: {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      },
    } as unknown as Parameters<typeof updateSession>[0]

    const result = await updateSession(mockRequest)
    expect(result).toBeDefined()
    expect(result).toHaveProperty('response')
    expect(result).toHaveProperty('user')
    expect(result.response).toHaveProperty('cookies')
    expect(result.user).toBeNull()
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

  it('returns user when authenticated', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' }
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null })

    const { updateSession } = await import('@/lib/supabase/middleware')
    const mockRequest = {
      cookies: {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      },
    } as unknown as Parameters<typeof updateSession>[0]

    const result = await updateSession(mockRequest)
    expect(result.user).toEqual(mockUser)
  })
})
