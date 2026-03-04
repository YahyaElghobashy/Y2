import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
}))

import { FeelingGenerousCTA } from "@/components/home/FeelingGenerousCTA"

describe("FeelingGenerousCTA", () => {
  it("renders 'Feeling generous?' text", () => {
    render(<FeelingGenerousCTA />)
    expect(screen.getByText("Feeling generous?")).toBeInTheDocument()
  })

  it("renders description text", () => {
    render(<FeelingGenerousCTA />)
    expect(screen.getByText("Create a love coupon for your partner")).toBeInTheDocument()
  })

  it("links to /create-coupon", () => {
    render(<FeelingGenerousCTA />)
    const link = screen.getByTestId("feeling-generous-cta")
    expect(link).toHaveAttribute("href", "/create-coupon")
  })

  it("renders Gift icon", () => {
    render(<FeelingGenerousCTA />)
    const svg = screen.getByTestId("feeling-generous-cta").querySelector("svg")
    expect(svg).toBeInTheDocument()
  })
})
