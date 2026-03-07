import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { StorageInfo } from "@/components/settings/StorageInfo"

describe("StorageInfo", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders storage usage when Storage API is available", async () => {
    Object.defineProperty(navigator, "storage", {
      value: {
        estimate: vi.fn().mockResolvedValue({
          usage: 42 * 1024 * 1024, // 42 MB
          quota: 2 * 1024 * 1024 * 1024, // 2 GB
        }),
      },
      configurable: true,
    })

    render(<StorageInfo />)

    await waitFor(() => {
      expect(screen.getByText(/42 MB/)).toBeInTheDocument()
      expect(screen.getByText(/2\.0 GB/)).toBeInTheDocument()
    })
  })

  it("renders fallback when Storage API is unavailable", async () => {
    Object.defineProperty(navigator, "storage", {
      value: undefined,
      configurable: true,
    })

    render(<StorageInfo />)

    await waitFor(() => {
      expect(screen.getByText("Storage info unavailable")).toBeInTheDocument()
    })
  })

  it("renders fallback when estimate throws", async () => {
    Object.defineProperty(navigator, "storage", {
      value: {
        estimate: vi.fn().mockRejectedValue(new Error("Not supported")),
      },
      configurable: true,
    })

    render(<StorageInfo />)

    await waitFor(() => {
      expect(screen.getByText("Storage info unavailable")).toBeInTheDocument()
    })
  })

  it("shows progress bar with correct width", async () => {
    Object.defineProperty(navigator, "storage", {
      value: {
        estimate: vi.fn().mockResolvedValue({
          usage: 500 * 1024 * 1024, // 500 MB
          quota: 2 * 1024 * 1024 * 1024, // 2 GB
        }),
      },
      configurable: true,
    })

    const { container } = render(<StorageInfo />)

    await waitFor(() => {
      const progressBar = container.querySelector(
        ".bg-\\[var\\(--color-accent-primary\\)\\]"
      )
      expect(progressBar).toBeInTheDocument()
    })
  })

  it("formats zero bytes correctly", async () => {
    Object.defineProperty(navigator, "storage", {
      value: {
        estimate: vi.fn().mockResolvedValue({
          usage: 0,
          quota: 1024 * 1024 * 1024,
        }),
      },
      configurable: true,
    })

    render(<StorageInfo />)

    await waitFor(() => {
      expect(screen.getByText(/0 B/)).toBeInTheDocument()
    })
  })

  it("renders Storage label", () => {
    render(<StorageInfo />)
    expect(screen.getByText("Storage")).toBeInTheDocument()
  })
})
