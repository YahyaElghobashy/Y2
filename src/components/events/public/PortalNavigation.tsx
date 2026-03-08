"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import type { PortalPage } from "@/lib/types/portal.types"

type PortalNavigationProps = {
  portalSlug: string
  portalTitle: string
  pages: PortalPage[]
}

export function PortalNavigation({
  portalSlug,
  portalTitle,
  pages,
}: PortalNavigationProps) {
  const pathname = usePathname()

  if (pages.length <= 1) return null

  const currentPageSlug = pathname.split("/").pop() ?? ""

  return (
    <nav
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        backgroundColor: "color-mix(in srgb, var(--portal-surface) 90%, transparent)",
        borderColor: "var(--portal-border)",
      }}
      data-testid="portal-navigation"
    >
      <div className="mx-auto max-w-4xl px-4">
        {/* Portal title — mobile */}
        <div className="py-2 text-center sm:hidden">
          <span
            className="text-xs font-medium"
            style={{
              fontFamily: "var(--portal-font-heading)",
              color: "var(--portal-text-muted)",
            }}
          >
            {portalTitle}
          </span>
        </div>

        {/* Page tabs — horizontal scroll */}
        <div className="scrollbar-none -mx-4 flex overflow-x-auto px-4">
          {pages.map((page) => {
            const href = `/e/${portalSlug}/${page.slug}`
            const isActive = currentPageSlug === page.slug

            return (
              <Link
                key={page.id}
                href={href}
                className="relative flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  color: isActive ? "var(--portal-primary)" : "var(--portal-text-muted)",
                }}
                data-testid={`nav-page-${page.slug}`}
              >
                <span className="flex items-center gap-1.5">
                  {page.icon && <span className="text-base">{page.icon}</span>}
                  {page.title}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="portal-nav-indicator"
                    className="absolute inset-x-4 bottom-0 h-0.5"
                    style={{ backgroundColor: "var(--portal-primary)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
