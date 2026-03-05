import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MediaImage } from "@/components/shared/MediaImage"

// ── Mocks ──────────────────────────────────────────────

let mockSelectResult: { data: Record<string, unknown> | null; error: unknown } = {
  data: null,
  error: null,
}

const mockSingle = vi.fn().mockImplementation(() => Promise.resolve(mockSelectResult))
const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: "https://storage.supabase.co/snap-photos/user/file.webp" },
})

const mockSupabaseClient = {
  from: vi.fn().mockReturnValue({ select: mockSelect }),
  storage: {
    from: vi.fn().mockReturnValue({ getPublicUrl: mockGetPublicUrl }),
  },
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabaseClient,
}))

// ── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  mockSelectResult = { data: null, error: null }

  // Re-chain mocks after clear
  mockSingle.mockImplementation(() => Promise.resolve(mockSelectResult))
  mockEq.mockReturnValue({ single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockSupabaseClient.from.mockReturnValue({ select: mockSelect })
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: "https://storage.supabase.co/snap-photos/user/file.webp" },
  })
  mockSupabaseClient.storage.from.mockReturnValue({ getPublicUrl: mockGetPublicUrl })
})

// ── Unit Tests ─────────────────────────────────────────

describe("MediaImage — unit", () => {
  it("renders nothing when no mediaId and no fallbackUrl", () => {
    const { container } = render(<MediaImage alt="test" />)
    expect(container.querySelector("[data-testid='media-image']")).toBeNull()
  })

  it("shows shimmer placeholder while loading", () => {
    mockSelectResult = { data: null, error: null }
    render(<MediaImage mediaId="some-id" alt="test" />)
    expect(screen.getByTestId("media-placeholder")).toBeInTheDocument()
  })

  it("shows blur placeholder when placeholder='blur'", () => {
    render(<MediaImage mediaId="some-id" alt="test" placeholder="blur" />)
    const placeholder = screen.getByTestId("media-placeholder")
    expect(placeholder.className).toContain("backdrop-blur")
  })

  it("passes alt text to img element", async () => {
    mockSelectResult = {
      data: {
        status: "active",
        storage_bucket: "snap-photos",
        storage_path: "user/file.webp",
        google_drive_file_id: null,
      },
      error: null,
    }

    render(<MediaImage mediaId="m1" alt="My photo" />)

    await waitFor(() => {
      expect(screen.getByTestId("media-img")).toBeInTheDocument()
    })
    expect(screen.getByTestId("media-img")).toHaveAttribute("alt", "My photo")
  })

  it("renders with loading='lazy' for lazy loading", async () => {
    mockSelectResult = {
      data: {
        status: "active",
        storage_bucket: "snap-photos",
        storage_path: "user/file.webp",
        google_drive_file_id: null,
      },
      error: null,
    }

    render(<MediaImage mediaId="m1" alt="test" />)

    await waitFor(() => {
      expect(screen.getByTestId("media-img")).toBeInTheDocument()
    })
    expect(screen.getByTestId("media-img")).toHaveAttribute("loading", "lazy")
  })

  it("shows error state with ImageOff icon and Retry button", async () => {
    mockSelectResult = { data: null, error: { message: "not found" } }

    render(<MediaImage mediaId="bad-id" alt="test" />)

    await waitFor(() => {
      expect(screen.getByTestId("media-error")).toBeInTheDocument()
    })
    expect(screen.getByTestId("media-retry-btn")).toBeInTheDocument()
  })
})

// ── Interaction Tests ──────────────────────────────────

describe("MediaImage — interaction", () => {
  it("retry click re-triggers URL resolution", async () => {
    mockSelectResult = { data: null, error: { message: "not found" } }

    render(<MediaImage mediaId="retry-id" alt="test" />)

    await waitFor(() => {
      expect(screen.getByTestId("media-retry-btn")).toBeInTheDocument()
    })

    // First call was the initial resolve
    expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1)

    // Now succeed on retry
    mockSelectResult = {
      data: {
        status: "active",
        storage_bucket: "snap-photos",
        storage_path: "user/file.webp",
        google_drive_file_id: null,
      },
      error: null,
    }

    fireEvent.click(screen.getByTestId("media-retry-btn"))

    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2)
    })

    await waitFor(() => {
      expect(screen.getByTestId("media-img")).toBeInTheDocument()
    })
  })

  it("calls onLoad callback when image loads", async () => {
    mockSelectResult = {
      data: {
        status: "active",
        storage_bucket: "snap-photos",
        storage_path: "user/file.webp",
        google_drive_file_id: null,
      },
      error: null,
    }

    const onLoad = vi.fn()
    render(<MediaImage mediaId="m1" alt="test" onLoad={onLoad} />)

    await waitFor(() => {
      expect(screen.getByTestId("media-img")).toBeInTheDocument()
    })

    fireEvent.load(screen.getByTestId("media-img"))
    expect(onLoad).toHaveBeenCalledOnce()
  })

  it("calls onError callback when image fails", async () => {
    mockSelectResult = {
      data: {
        status: "active",
        storage_bucket: "snap-photos",
        storage_path: "user/file.webp",
        google_drive_file_id: null,
      },
      error: null,
    }

    const onError = vi.fn()
    render(<MediaImage mediaId="m1" alt="test" onError={onError} />)

    await waitFor(() => {
      expect(screen.getByTestId("media-img")).toBeInTheDocument()
    })

    fireEvent.error(screen.getByTestId("media-img"))
    expect(onError).toHaveBeenCalledOnce()

    // Error state should appear
    await waitFor(() => {
      expect(screen.getByTestId("media-error")).toBeInTheDocument()
    })
  })

  it("shows error state after img element fails to load", async () => {
    mockSelectResult = {
      data: {
        status: "active",
        storage_bucket: "snap-photos",
        storage_path: "user/file.webp",
        google_drive_file_id: null,
      },
      error: null,
    }

    render(<MediaImage mediaId="m1" alt="test" />)

    await waitFor(() => {
      expect(screen.getByTestId("media-img")).toBeInTheDocument()
    })

    fireEvent.error(screen.getByTestId("media-img"))

    await waitFor(() => {
      expect(screen.getByTestId("media-error")).toBeInTheDocument()
    })
  })
})

// ── Integration Tests ──────────────────────────────────

describe("MediaImage — integration", () => {
  it("constructs Storage public URL for active media", async () => {
    mockSelectResult = {
      data: {
        status: "active",
        storage_bucket: "snap-photos",
        storage_path: "user123/abc.webp",
        google_drive_file_id: null,
      },
      error: null,
    }

    render(<MediaImage mediaId="m-active" alt="test" />)

    await waitFor(() => {
      expect(screen.getByTestId("media-img")).toBeInTheDocument()
    })

    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith("snap-photos")
    expect(mockGetPublicUrl).toHaveBeenCalledWith("user123/abc.webp")

    const img = screen.getByTestId("media-img") as HTMLImageElement
    expect(img.src).toContain("storage.supabase.co")
  })

  it("constructs proxy URL for exported media", async () => {
    mockSelectResult = {
      data: {
        status: "exported",
        storage_bucket: "snap-photos",
        storage_path: "user/old.webp",
        google_drive_file_id: "drive-file-id-123",
      },
      error: null,
    }

    render(<MediaImage mediaId="m-exported" alt="test" />)

    await waitFor(() => {
      expect(screen.getByTestId("media-img")).toBeInTheDocument()
    })

    const img = screen.getByTestId("media-img") as HTMLImageElement
    expect(img.src).toContain("media-proxy")
    expect(img.src).toContain("id=m-exported")
  })

  it("falls back to fallbackUrl when media lookup fails", async () => {
    mockSelectResult = { data: null, error: { message: "not found" } }

    render(
      <MediaImage
        mediaId="bad-id"
        fallbackUrl="https://example.com/fallback.jpg"
        alt="test"
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId("media-img")).toBeInTheDocument()
    })

    const img = screen.getByTestId("media-img") as HTMLImageElement
    expect(img.src).toBe("https://example.com/fallback.jpg")
  })

  it("uses fallbackUrl directly when no mediaId", () => {
    render(
      <MediaImage fallbackUrl="https://example.com/direct.jpg" alt="test" />,
    )

    // No DB query should be made
    expect(mockSupabaseClient.from).not.toHaveBeenCalled()

    const img = screen.getByTestId("media-img") as HTMLImageElement
    expect(img.src).toBe("https://example.com/direct.jpg")
  })

  it("queries media_files with correct mediaId", async () => {
    mockSelectResult = {
      data: {
        status: "active",
        storage_bucket: "snap-photos",
        storage_path: "user/file.webp",
        google_drive_file_id: null,
      },
      error: null,
    }

    render(<MediaImage mediaId="test-media-id" alt="test" />)

    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("media_files")
    })

    expect(mockSelect).toHaveBeenCalledWith(
      "status, storage_bucket, storage_path, google_drive_file_id",
    )
    expect(mockEq).toHaveBeenCalledWith("id", "test-media-id")
    expect(mockSingle).toHaveBeenCalled()
  })

  it("falls back to fallbackUrl for non-active/non-exported status", async () => {
    mockSelectResult = {
      data: {
        status: "deleted",
        storage_bucket: "snap-photos",
        storage_path: "user/file.webp",
        google_drive_file_id: null,
      },
      error: null,
    }

    render(
      <MediaImage
        mediaId="deleted-id"
        fallbackUrl="https://example.com/fallback.jpg"
        alt="test"
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId("media-img")).toBeInTheDocument()
    })

    const img = screen.getByTestId("media-img") as HTMLImageElement
    expect(img.src).toBe("https://example.com/fallback.jpg")
  })

  it("shows error for non-active/non-exported status without fallback", async () => {
    mockSelectResult = {
      data: {
        status: "export_failed",
        storage_bucket: "snap-photos",
        storage_path: "user/file.webp",
        google_drive_file_id: null,
      },
      error: null,
    }

    render(<MediaImage mediaId="failed-id" alt="test" />)

    await waitFor(() => {
      expect(screen.getByTestId("media-error")).toBeInTheDocument()
    })
  })
})
