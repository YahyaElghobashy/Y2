import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock data ──────────────────────────────────────────────────

const MOCK_FLOWER_DAYS = [
  { id: "gd-1", garden_date: "2026-03-05", yahya_opened: true, yara_opened: true, flower_type: "🌸", created_at: "" },
  { id: "gd-2", garden_date: "2026-03-04", yahya_opened: true, yara_opened: true, flower_type: "🌻", created_at: "" },
  { id: "gd-3", garden_date: "2026-03-03", yahya_opened: true, yara_opened: true, flower_type: "🌹", created_at: "" },
]

const MOCK_PARTIAL_DAY = {
  id: "gd-p1",
  garden_date: "2026-03-02",
  yahya_opened: true,
  yara_opened: false,
  flower_type: null,
  created_at: "",
}

const MOCK_BLANK_DAY = {
  id: "gd-b1",
  garden_date: "2026-03-01",
  yahya_opened: false,
  yara_opened: false,
  flower_type: null,
  created_at: "",
}

let mockGardenReturn = {
  gardenDays: [...MOCK_FLOWER_DAYS, MOCK_PARTIAL_DAY, MOCK_BLANK_DAY],
  recentFlowers: MOCK_FLOWER_DAYS,
  isLoading: false,
  error: null,
  recordOpened: vi.fn(),
}

vi.mock("@/lib/hooks/use-garden", () => ({
  useGarden: () => mockGardenReturn,
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const safeProps: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) {
        if (typeof v !== "object" || v === null) safeProps[k] = v
        else if (k === "className" || k === "style" || k === "title") safeProps[k] = v
        if (k.startsWith("data-")) safeProps[k] = v
      }
      return <div {...safeProps}>{children}</div>
    },
  },
}))

import { SharedGarden } from "@/components/garden/SharedGarden"

describe("SharedGarden", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGardenReturn = {
      gardenDays: [...MOCK_FLOWER_DAYS, MOCK_PARTIAL_DAY, MOCK_BLANK_DAY],
      recentFlowers: MOCK_FLOWER_DAYS,
      isLoading: false,
      error: null,
      recordOpened: vi.fn(),
    }
  })

  // ── Renders ─────────────────────────────────────────────────

  it("renders the garden container", () => {
    render(<SharedGarden />)
    expect(screen.getByTestId("shared-garden")).toBeInTheDocument()
  })

  it("renders the garden grid", () => {
    render(<SharedGarden />)
    expect(screen.getByTestId("garden-grid")).toBeInTheDocument()
  })

  // ── Full mode ───────────────────────────────────────────────

  it("renders all gardenDays in full mode", () => {
    render(<SharedGarden />)
    const grid = screen.getByTestId("garden-grid")
    // 3 flowers + 1 partial + 1 blank = 5 cells
    expect(grid.children).toHaveLength(5)
  })

  it("shows 'Our Garden' heading in full mode", () => {
    render(<SharedGarden />)
    expect(screen.getByText("Our Garden")).toBeInTheDocument()
  })

  // ── Compact mode ────────────────────────────────────────────

  it("renders only recentFlowers (up to 8) in compact mode", () => {
    render(<SharedGarden compact />)
    const grid = screen.getByTestId("garden-grid")
    // recentFlowers has 3 items
    expect(grid.children).toHaveLength(3)
  })

  it("does not show heading in compact mode", () => {
    render(<SharedGarden compact />)
    expect(screen.queryByText("Our Garden")).not.toBeInTheDocument()
  })

  // ── Flowers, seedlings, blanks ──────────────────────────────

  it("renders flower emoji for days with flower_type", () => {
    render(<SharedGarden />)
    expect(screen.getByTestId("flower-0")).toHaveTextContent("🌸")
    expect(screen.getByTestId("flower-1")).toHaveTextContent("🌻")
    expect(screen.getByTestId("flower-2")).toHaveTextContent("🌹")
  })

  it("renders seedling for partial days", () => {
    render(<SharedGarden />)
    expect(screen.getByTestId("seedling-3")).toHaveTextContent("🌱")
  })

  it("renders empty cell for blank days", () => {
    render(<SharedGarden />)
    const cell = screen.getByTestId("garden-cell-4")
    // Blank day — neither flower nor seedling
    expect(cell.textContent).toBe("")
  })

  // ── Empty state ─────────────────────────────────────────────

  it("shows empty state when no garden days", () => {
    mockGardenReturn = {
      ...mockGardenReturn,
      gardenDays: [],
      recentFlowers: [],
    }
    render(<SharedGarden />)
    expect(
      screen.getByText("Open the app together to grow your garden"),
    ).toBeInTheDocument()
  })

  it("shows empty state in compact mode with no recent flowers", () => {
    mockGardenReturn = {
      ...mockGardenReturn,
      gardenDays: [MOCK_PARTIAL_DAY],
      recentFlowers: [],
    }
    render(<SharedGarden compact />)
    expect(
      screen.getByText("Open the app together to grow your garden"),
    ).toBeInTheDocument()
  })

  // ── Loading ─────────────────────────────────────────────────

  it("renders null when loading", () => {
    mockGardenReturn = {
      ...mockGardenReturn,
      isLoading: true,
    }
    const { container } = render(<SharedGarden />)
    expect(container.innerHTML).toBe("")
  })

  // ── Date titles ─────────────────────────────────────────────

  it("each cell has a title attribute with the garden_date", () => {
    render(<SharedGarden />)
    const cell = screen.getByTestId("garden-cell-0")
    expect(cell).toHaveAttribute("title", "2026-03-05")
  })

  // ── className pass-through ─────────────────────────────────

  it("accepts className prop", () => {
    render(<SharedGarden className="mt-4" />)
    const garden = screen.getByTestId("shared-garden")
    expect(garden.className).toContain("mt-4")
  })
})
