import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ── Mocks ──

const mockUser = { id: "u1", email: "test@test.com" }

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
    profile: { id: "u1", display_name: "Yahya", email: "test@test.com", avatar_url: null, partner_id: "u2", role: "admin", created_at: "", updated_at: "" },
    partner: { id: "u2", display_name: "Yara", email: "yara@test.com", avatar_url: null, partner_id: "u1", role: "user", created_at: "", updated_at: "" },
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

let mockNotificationsReturn = {
  notifications: [] as Array<{ id: string; sender_id: string; recipient_id: string; title: string; body: string; emoji: string | null; status: string; type: string; metadata: Record<string, unknown>; created_at: string }>,
  dailyLimit: null,
  canSend: true,
  remainingSends: 2,
  isLoading: false,
  error: null as string | null,
  sendNotification: vi.fn(),
  purchaseBonusSend: vi.fn(),
  refreshLimits: vi.fn(),
}

vi.mock("@/lib/hooks/use-notifications", () => ({
  useNotifications: () => mockNotificationsReturn,
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>>(
      ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown> & { children?: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => {
        void initial; void animate; void exit; void transition; void whileHover; void whileTap
        return <div ref={ref} {...props}>{children}</div>
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import { PingHistory } from "@/components/ping/PingHistory"

function makePing(overrides: Partial<{ id: string; sender_id: string; recipient_id: string; title: string; body: string; status: string; created_at: string }> = {}) {
  return {
    id: overrides.id ?? "p1",
    sender_id: overrides.sender_id ?? "u1",
    recipient_id: overrides.recipient_id ?? "u2",
    title: overrides.title ?? "Ping",
    body: overrides.body ?? "Hello!",
    emoji: null,
    status: overrides.status ?? "sent",
    type: "custom",
    metadata: {},
    created_at: overrides.created_at ?? new Date().toISOString(),
  }
}

describe("PingHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      notifications: [],
      isLoading: false,
    }
  })

  it("renders empty state when no pings", () => {
    render(<PingHistory />)
    expect(screen.getByText("No pings yet")).toBeInTheDocument()
  })

  it("renders loading skeleton when loading", () => {
    mockNotificationsReturn = { ...mockNotificationsReturn, isLoading: true }
    render(<PingHistory />)
    expect(screen.getByTestId("ping-history-loading")).toBeInTheDocument()
  })

  it("renders sent pings aligned right", () => {
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      notifications: [makePing({ sender_id: "u1", body: "Hey there" })],
    }
    render(<PingHistory />)
    expect(screen.getByTestId("ping-sent")).toBeInTheDocument()
    expect(screen.getByText("Hey there")).toBeInTheDocument()
  })

  it("renders received pings aligned left", () => {
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      notifications: [makePing({ sender_id: "u2", recipient_id: "u1", body: "Hi back" })],
    }
    render(<PingHistory />)
    expect(screen.getByTestId("ping-received")).toBeInTheDocument()
    expect(screen.getByText("Hi back")).toBeInTheDocument()
  })

  it("shows status icon for sent pings", () => {
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      notifications: [makePing({ status: "sent" })],
    }
    render(<PingHistory />)
    expect(screen.getByTestId("status-sent")).toBeInTheDocument()
  })

  it("shows delivered status icon", () => {
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      notifications: [makePing({ status: "delivered" })],
    }
    render(<PingHistory />)
    expect(screen.getByTestId("status-delivered")).toBeInTheDocument()
  })

  it("groups pings by date with headers", () => {
    const today = new Date().toISOString()
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      notifications: [
        makePing({ id: "p1", created_at: today, body: "Ping 1" }),
        makePing({ id: "p2", created_at: today, body: "Ping 2" }),
      ],
    }
    render(<PingHistory />)
    expect(screen.getByText("Today")).toBeInTheDocument()
  })

  it("shows title and emoji when title is not 'Ping'", () => {
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      notifications: [makePing({ title: "Good morning", body: "Rise and shine" })],
    }
    render(<PingHistory />)
    expect(screen.getByText("Good morning")).toBeInTheDocument()
    expect(screen.getByText("Rise and shine")).toBeInTheDocument()
  })
})
