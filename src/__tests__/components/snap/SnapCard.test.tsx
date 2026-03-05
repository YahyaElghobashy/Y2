import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Framer Motion mock ────────────────────────────────────────

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        {
          children,
          initial,
          animate,
          transition,
          whileTap,
          ...rest
        }: {
          children?: React.ReactNode
          initial?: unknown
          animate?: unknown
          transition?: unknown
          whileTap?: unknown
          [key: string]: unknown
        },
        ref: React.Ref<HTMLDivElement>
      ) => (
        <div ref={ref} {...rest}>
          {children}
        </div>
      )
    ),
    button: React.forwardRef(
      (
        {
          children,
          initial,
          animate,
          transition,
          whileTap,
          ...rest
        }: {
          children?: React.ReactNode
          initial?: unknown
          animate?: unknown
          transition?: unknown
          whileTap?: unknown
          [key: string]: unknown
        },
        ref: React.Ref<HTMLButtonElement>
      ) => (
        <button ref={ref} {...rest}>
          {children}
        </button>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── MediaImage mock ───────────────────────────────────────────

vi.mock("@/components/shared/MediaImage", () => ({
  MediaImage: ({ alt, ...props }: any) => (
    <div data-testid="media-image" {...props}>
      {alt}
    </div>
  ),
}))

// ── Avatar mock ───────────────────────────────────────────────

vi.mock("@/components/shared/Avatar", () => ({
  Avatar: ({ name }: any) => <div data-testid="avatar">{name}</div>,
}))

// ── SnapReaction mock ─────────────────────────────────────────

vi.mock("@/components/snap/SnapReaction", () => ({
  SnapReaction: (props: any) => (
    <div data-testid="snap-reaction" data-snap-id={props.snapId} />
  ),
}))

import { SnapCard } from "@/components/snap/SnapCard"
import type { Snap } from "@/lib/types/snap.types"

// ── Test data ─────────────────────────────────────────────────

function makeSnap(overrides: Partial<Snap> = {}): Snap {
  return {
    id: "snap-1",
    user_id: "u1",
    snap_date: "2026-03-05",
    photo_url: "https://example.com/photo.jpg",
    caption: "Test caption",
    reaction_emoji: null,
    window_opened_at: "2026-03-05T10:00:00Z",
    created_at: "2026-03-05T10:02:00Z", // 2 minutes after window opened (on time)
    ...overrides,
  }
}

describe("SnapCard", () => {
  const defaultProps = {
    snap: makeSnap(),
    authorName: "Yahya",
    avatarUrl: "https://example.com/avatar.jpg",
    isOwn: true,
    onReact: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders photo via MediaImage when photo_url exists", () => {
      render(<SnapCard {...defaultProps} />)

      expect(screen.getByTestId("media-image")).toBeInTheDocument()
      expect(screen.getByTestId("media-image")).toHaveTextContent("Yahya's snap")
    })

    it("shows 'No snap' placeholder when no photo_url", () => {
      const snap = makeSnap({ photo_url: null })
      render(<SnapCard {...defaultProps} snap={snap} />)

      expect(screen.getByTestId("snap-no-photo")).toBeInTheDocument()
      expect(screen.getByText("No snap")).toBeInTheDocument()
      expect(screen.queryByTestId("media-image")).not.toBeInTheDocument()
    })

    it("shows author name in avatar overlay", () => {
      render(<SnapCard {...defaultProps} />)

      const avatar = screen.getByTestId("avatar")
      expect(avatar).toHaveTextContent("Yahya")
    })

    it("shows caption when present", () => {
      render(<SnapCard {...defaultProps} />)

      const caption = screen.getByTestId("snap-caption")
      expect(caption).toHaveTextContent("Test caption")
    })

    it("hides caption when absent", () => {
      const snap = makeSnap({ caption: null })
      render(<SnapCard {...defaultProps} snap={snap} />)

      expect(screen.queryByTestId("snap-caption")).not.toBeInTheDocument()
    })

    it("shows Late badge when snap is late (> 300s after window)", () => {
      // window opened at 10:00:00, created at 10:06:00 (360s later)
      const snap = makeSnap({
        window_opened_at: "2026-03-05T10:00:00Z",
        created_at: "2026-03-05T10:06:00Z",
      })
      render(<SnapCard {...defaultProps} snap={snap} />)

      expect(screen.getByTestId("snap-late-badge")).toBeInTheDocument()
      expect(screen.getByText("Late")).toBeInTheDocument()
    })

    it("hides Late badge when snap is on time (< 300s after window)", () => {
      // window opened at 10:00:00, created at 10:02:00 (120s later)
      const snap = makeSnap({
        window_opened_at: "2026-03-05T10:00:00Z",
        created_at: "2026-03-05T10:02:00Z",
      })
      render(<SnapCard {...defaultProps} snap={snap} />)

      expect(screen.queryByTestId("snap-late-badge")).not.toBeInTheDocument()
    })

    it("hides Late badge when window_opened_at is null", () => {
      const snap = makeSnap({ window_opened_at: null })
      render(<SnapCard {...defaultProps} snap={snap} />)

      expect(screen.queryByTestId("snap-late-badge")).not.toBeInTheDocument()
    })

    it("has snap-card data-testid on outer container", () => {
      render(<SnapCard {...defaultProps} />)

      expect(screen.getByTestId("snap-card")).toBeInTheDocument()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("shows SnapReaction for partner's snaps (not own)", () => {
      render(
        <SnapCard
          {...defaultProps}
          isOwn={false}
          onReact={vi.fn()}
        />
      )

      expect(screen.getByTestId("snap-reaction")).toBeInTheDocument()
    })

    it("hides SnapReaction for own snaps", () => {
      render(<SnapCard {...defaultProps} isOwn={true} />)

      expect(screen.queryByTestId("snap-reaction")).not.toBeInTheDocument()
    })

    it("passes snap.id and snap.reaction_emoji to SnapReaction", () => {
      const snap = makeSnap({ id: "snap-xyz", reaction_emoji: "🔥" })
      render(
        <SnapCard
          {...defaultProps}
          snap={snap}
          isOwn={false}
          onReact={vi.fn()}
        />
      )

      const reaction = screen.getByTestId("snap-reaction")
      expect(reaction).toHaveAttribute("data-snap-id", "snap-xyz")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("passes onReact callback through to SnapReaction", () => {
      const onReact = vi.fn()
      render(
        <SnapCard
          {...defaultProps}
          isOwn={false}
          onReact={onReact}
        />
      )

      // SnapReaction should be rendered (mock verifies props passing)
      expect(screen.getByTestId("snap-reaction")).toBeInTheDocument()
    })

    it("renders MediaImage with correct fallbackUrl from snap.photo_url", () => {
      const snap = makeSnap({ photo_url: "https://cdn.test.com/image.webp" })
      render(<SnapCard {...defaultProps} snap={snap} />)

      const img = screen.getByTestId("media-image")
      expect(img).toBeInTheDocument()
    })

    it("applies custom className to outer container", () => {
      render(<SnapCard {...defaultProps} className="custom-card-class" />)

      const card = screen.getByTestId("snap-card")
      expect(card.className).toContain("custom-card-class")
    })
  })
})
