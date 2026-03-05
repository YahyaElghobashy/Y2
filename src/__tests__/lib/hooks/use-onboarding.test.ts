import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useOnboarding } from "@/lib/hooks/use-onboarding"
import { ONBOARDING_STEPS, TOUR_STEPS } from "@/lib/types/onboarding.types"

// --- Mocks ---

const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: mockFrom,
  }),
}))

const mockRefreshProfile = vi.fn().mockResolvedValue(undefined)

let mockProfile: Record<string, unknown> = {
  id: "user-1",
  onboarding_step: "welcome",
  onboarding_completed_at: null,
  pairing_status: "unpaired",
}

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    profile: mockProfile,
    partner: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: mockRefreshProfile,
  }),
}))

// --- Helpers ---

function setupChainedMock(error: unknown = null) {
  const eqFn = vi.fn().mockResolvedValue({ error })
  mockUpdate.mockReturnValue({ eq: eqFn })
  return eqFn
}

// --- Tests ---

describe("useOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfile = {
      id: "user-1",
      onboarding_step: "welcome",
      onboarding_completed_at: null,
      pairing_status: "unpaired",
    }
    setupChainedMock()
  })

  // --- Unit: Initial state ---

  it("initializes with welcome step from profile", () => {
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.currentStep).toBe("welcome")
    expect(result.current.stepIndex).toBe(0)
    expect(result.current.progress).toBe(0)
    expect(result.current.isComplete).toBe(false)
    expect(result.current.isTourStep).toBe(false)
    expect(result.current.canSkip).toBe(false)
    expect(result.current.direction).toBe("forward")
  })

  it("initializes from profile's saved step", () => {
    mockProfile.onboarding_step = "pairing"
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.currentStep).toBe("pairing")
    expect(result.current.stepIndex).toBe(2)
  })

  it("reports isComplete when onboarding_completed_at is set", () => {
    mockProfile.onboarding_completed_at = "2024-01-01T00:00:00Z"
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.isComplete).toBe(true)
  })

  it("defaults to welcome when profile has no onboarding_step", () => {
    mockProfile.onboarding_step = undefined
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.currentStep).toBe("welcome")
  })

  // --- Unit: totalSteps and progress ---

  it("totalSteps equals the number of onboarding steps", () => {
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.totalSteps).toBe(ONBOARDING_STEPS.length)
  })

  it("progress is 0 at first step and 1 at last step", () => {
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.progress).toBe(0)

    mockProfile.onboarding_step = "ready"
    const { result: result2 } = renderHook(() => useOnboarding())
    expect(result2.current.progress).toBe(1)
  })

  it("progress is proportional for middle steps", () => {
    mockProfile.onboarding_step = "pairing" // index 2 of 9
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.progress).toBeCloseTo(2 / 8) // 0.25
  })

  // --- Unit: isTourStep and canSkip ---

  it("isTourStep is true for tour steps", () => {
    for (const step of TOUR_STEPS) {
      mockProfile.onboarding_step = step
      const { result } = renderHook(() => useOnboarding())
      expect(result.current.isTourStep).toBe(true)
      expect(result.current.canSkip).toBe(true)
    }
  })

  it("isTourStep is false for non-tour steps", () => {
    for (const step of ["welcome", "profile", "pairing", "ready"] as const) {
      mockProfile.onboarding_step = step
      const { result } = renderHook(() => useOnboarding())
      expect(result.current.isTourStep).toBe(false)
      expect(result.current.canSkip).toBe(false)
    }
  })

  // --- Interaction: goNext ---

  it("goNext advances to the next step", async () => {
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.currentStep).toBe("welcome")

    await act(async () => {
      await result.current.goNext()
    })

    expect(result.current.currentStep).toBe("profile")
    expect(result.current.direction).toBe("forward")
    expect(result.current.stepIndex).toBe(1)
  })

  it("goNext does nothing at the last step", async () => {
    mockProfile.onboarding_step = "ready"
    const { result } = renderHook(() => useOnboarding())

    await act(async () => {
      await result.current.goNext()
    })

    expect(result.current.currentStep).toBe("ready")
  })

  // --- Interaction: goBack ---

  it("goBack returns to the previous step", async () => {
    mockProfile.onboarding_step = "profile"
    const { result } = renderHook(() => useOnboarding())

    await act(async () => {
      await result.current.goBack()
    })

    expect(result.current.currentStep).toBe("welcome")
    expect(result.current.direction).toBe("backward")
  })

  it("goBack does nothing at the first step", async () => {
    const { result } = renderHook(() => useOnboarding())

    await act(async () => {
      await result.current.goBack()
    })

    expect(result.current.currentStep).toBe("welcome")
  })

  // --- Interaction: completeOnboarding ---

  it("completeOnboarding sets step to ready and persists timestamp", async () => {
    const eqFn = setupChainedMock()
    const { result } = renderHook(() => useOnboarding())

    await act(async () => {
      await result.current.completeOnboarding()
    })

    expect(result.current.currentStep).toBe("ready")
    expect(mockFrom).toHaveBeenCalledWith("profiles")
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding_step: "ready",
        onboarding_completed_at: expect.any(String),
      })
    )
    expect(eqFn).toHaveBeenCalledWith("id", "user-1")
    expect(mockRefreshProfile).toHaveBeenCalled()
  })

  // --- Interaction: skipOnboarding ---

  it("skipOnboarding completes onboarding from a tour step", async () => {
    mockProfile.onboarding_step = "tour_home"
    const { result } = renderHook(() => useOnboarding())

    await act(async () => {
      await result.current.skipOnboarding()
    })

    expect(result.current.currentStep).toBe("ready")
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding_step: "ready",
        onboarding_completed_at: expect.any(String),
      })
    )
  })

  it("skipOnboarding does nothing from a non-tour step", async () => {
    mockProfile.onboarding_step = "welcome"
    const { result } = renderHook(() => useOnboarding())

    await act(async () => {
      await result.current.skipOnboarding()
    })

    expect(result.current.currentStep).toBe("welcome")
    expect(mockFrom).not.toHaveBeenCalled()
  })

  // --- Integration: DB persistence ---

  it("goNext persists the new step to profiles table", async () => {
    const eqFn = setupChainedMock()
    const { result } = renderHook(() => useOnboarding())

    await act(async () => {
      await result.current.goNext()
    })

    expect(mockFrom).toHaveBeenCalledWith("profiles")
    expect(mockUpdate).toHaveBeenCalledWith({ onboarding_step: "profile" })
    expect(eqFn).toHaveBeenCalledWith("id", "user-1")
    expect(mockRefreshProfile).toHaveBeenCalled()
  })

  it("goBack persists the previous step to profiles table", async () => {
    mockProfile.onboarding_step = "pairing"
    const eqFn = setupChainedMock()
    const { result } = renderHook(() => useOnboarding())

    await act(async () => {
      await result.current.goBack()
    })

    expect(mockFrom).toHaveBeenCalledWith("profiles")
    expect(mockUpdate).toHaveBeenCalledWith({ onboarding_step: "profile" })
    expect(eqFn).toHaveBeenCalledWith("id", "user-1")
  })

  // --- Error handling ---

  it("sets error when DB update fails on goNext", async () => {
    setupChainedMock({ message: "DB error" })
    const { result } = renderHook(() => useOnboarding())

    await act(async () => {
      await result.current.goNext()
    })

    expect(result.current.error).toBe("DB error")
    // Step should NOT have advanced
    expect(result.current.currentStep).toBe("welcome")
  })

  it("sets error when DB update fails on completeOnboarding", async () => {
    setupChainedMock({ message: "Network failure" })
    const { result } = renderHook(() => useOnboarding())

    await act(async () => {
      await result.current.completeOnboarding()
    })

    expect(result.current.error).toBe("Network failure")
  })

  it("clears error on successful next step after failure", async () => {
    // First: fail
    setupChainedMock({ message: "Temporary error" })
    const { result } = renderHook(() => useOnboarding())

    await act(async () => {
      await result.current.goNext()
    })
    expect(result.current.error).toBe("Temporary error")

    // Then: succeed
    setupChainedMock()
    await act(async () => {
      await result.current.goNext()
    })
    expect(result.current.error).toBeNull()
    expect(result.current.currentStep).toBe("profile")
  })

  // --- Loading state ---

  it("sets isLoading during goNext", async () => {
    let resolveUpdate: () => void
    const eqFn = vi.fn().mockReturnValue(
      new Promise<{ error: null }>((resolve) => {
        resolveUpdate = () => resolve({ error: null })
      })
    )
    mockUpdate.mockReturnValue({ eq: eqFn })

    const { result } = renderHook(() => useOnboarding())

    let nextPromise: Promise<void>
    act(() => {
      nextPromise = result.current.goNext()
    })

    // Should be loading while awaiting
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolveUpdate!()
      await nextPromise!
    })

    expect(result.current.isLoading).toBe(false)
  })
})
