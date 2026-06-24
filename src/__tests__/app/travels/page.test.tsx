import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Navigation ──
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ── Auth ──
const mockUseAuth = vi.fn()
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// ── useTrips ──
const createTrip = vi.fn()
const updateTrip = vi.fn()
const mockUseTrips = vi.fn()
vi.mock("@/lib/hooks/use-trips", () => ({
  useTrips: () => mockUseTrips(),
}))

// ── uploadMedia ──
const uploadMedia = vi.fn()
vi.mock("@/lib/media-upload", () => ({
  uploadMedia: (...a: unknown[]) => uploadMedia(...a),
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Stub TravelsView to expose the wired callbacks as buttons we can drive.
vi.mock("@/components/travels/TravelsView", () => ({
  TravelsView: ({
    trips,
    onLogTravel,
    onOpenTrip,
  }: {
    trips: { id: string }[]
    onLogTravel?: () => void
    onOpenTrip?: (id: string) => void
  }) => (
    <div>
      <span data-testid="trip-count">{trips.length}</span>
      <button onClick={onLogTravel}>log</button>
      <button onClick={() => onOpenTrip?.("trip-9")}>open</button>
    </div>
  ),
}))

// Stub LogTravelForm to fire onSubmit with a controllable payload (incl. file).
const submitPayload = {
  title: "Cambridge & London",
  destination: "England",
  kind: "hosted" as const,
  hosted_path: "cambridge-london",
  status: "ongoing" as const,
  companions: [],
  coverFile: new File(["x"], "cover.jpg", { type: "image/jpeg" }),
}
let lastFormProps: { open: boolean; onSubmit: (d: typeof submitPayload) => Promise<void> } | null =
  null
vi.mock("@/components/travels/LogTravelForm", () => ({
  LogTravelForm: (props: {
    open: boolean
    onClose: () => void
    onSubmit: (d: typeof submitPayload) => Promise<void>
  }) => {
    lastFormProps = props
    // Mirror the real LogTravelForm contract: it awaits onSubmit inside a
    // try/catch and surfaces an error on rejection (never lets it bubble).
    const submit = () => {
      props.onSubmit(submitPayload).catch(() => {})
    }
    return props.open ? (
      <button data-testid="do-submit" onClick={submit}>
        submit
      </button>
    ) : null
  },
}))

import TravelsPage from "@/app/(main)/travels/page"

describe("TravelsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastFormProps = null
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } })
    createTrip.mockResolvedValue("trip-1")
    updateTrip.mockResolvedValue(undefined)
    uploadMedia.mockResolvedValue({ url: "https://x/cover.webp", mediaId: "m1" })
    mockUseTrips.mockReturnValue({
      trips: [{ id: "a" }, { id: "b" }],
      isLoading: false,
      createTrip,
      updateTrip,
    })
  })

  // ── Interaction ──
  it("passes the trips through to the view", () => {
    render(<TravelsPage />)
    expect(screen.getByTestId("trip-count").textContent).toBe("2")
  })

  it("opens the form when Log a travel is tapped", async () => {
    render(<TravelsPage />)
    expect(screen.queryByTestId("do-submit")).toBeNull()
    fireEvent.click(screen.getByText("log"))
    await waitFor(() => expect(screen.getByTestId("do-submit")).toBeTruthy())
  })

  it("routes to the trip detail page on open", () => {
    render(<TravelsPage />)
    fireEvent.click(screen.getByText("open"))
    expect(mockPush).toHaveBeenCalledWith("/travels/trip-9")
  })

  // ── Integration: the create → upload → patch flow ──
  it("creates the trip, uploads the cover to trip-covers, then patches cover_image", async () => {
    render(<TravelsPage />)
    fireEvent.click(screen.getByText("log"))
    await waitFor(() => screen.getByTestId("do-submit"))
    fireEvent.click(screen.getByTestId("do-submit"))

    await waitFor(() => expect(createTrip).toHaveBeenCalled())

    // 1. createTrip got the trip data WITHOUT the coverFile
    const createArg = createTrip.mock.calls[0][0]
    expect(createArg).toEqual(
      expect.objectContaining({
        title: "Cambridge & London",
        kind: "hosted",
        hosted_path: "cambridge-london",
        status: "ongoing",
      })
    )
    expect(createArg).not.toHaveProperty("coverFile")

    // 2. uploadMedia targeted the trip-covers bucket / trips table / new id
    await waitFor(() => expect(uploadMedia).toHaveBeenCalled())
    expect(uploadMedia.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        bucket: "trip-covers",
        sourceTable: "trips",
        sourceColumn: "cover_image",
        sourceRowId: "trip-1",
        userId: "user-1",
      })
    )

    // 3. updateTrip patched the returned URL onto the new trip
    await waitFor(() =>
      expect(updateTrip).toHaveBeenCalledWith("trip-1", {
        cover_image: "https://x/cover.webp",
      })
    )
  })

  it("does NOT upload or patch when createTrip fails", async () => {
    createTrip.mockResolvedValue(null)
    render(<TravelsPage />)
    fireEvent.click(screen.getByText("log"))
    await waitFor(() => screen.getByTestId("do-submit"))
    fireEvent.click(screen.getByTestId("do-submit"))

    await waitFor(() => expect(createTrip).toHaveBeenCalled())
    expect(uploadMedia).not.toHaveBeenCalled()
    expect(updateTrip).not.toHaveBeenCalled()
  })

  it("still saves the trip when the cover upload fails (non-fatal)", async () => {
    uploadMedia.mockResolvedValue({ error: "upload failed" })
    render(<TravelsPage />)
    fireEvent.click(screen.getByText("log"))
    await waitFor(() => screen.getByTestId("do-submit"))
    fireEvent.click(screen.getByTestId("do-submit"))

    await waitFor(() => expect(createTrip).toHaveBeenCalled())
    await waitFor(() => expect(uploadMedia).toHaveBeenCalled())
    expect(updateTrip).not.toHaveBeenCalled()
  })
})
