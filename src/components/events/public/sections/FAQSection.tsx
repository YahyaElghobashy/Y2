"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { PortalSection } from "@/lib/types/portal.types"

type FAQItem = { question: string; answer: string }
type Props = { section: PortalSection }

function AccordionItem({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="border-b"
      style={{ borderColor: "var(--portal-border)" }}
      data-testid={`faq-item-${index}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-start text-sm font-medium"
        style={{ color: "var(--portal-text)" }}
        aria-expanded={open}
      >
        {item.question}
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--portal-text-muted)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p
              className="pb-4 text-sm leading-relaxed"
              style={{ color: "var(--portal-text-muted)" }}
            >
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const items = (section.content.items as FAQItem[]) ?? []
  const layout = (section.content.layout as string) ?? "accordion"

  if (items.length === 0) return null

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="faq-section">
      {heading && (
        <h2
          className="mb-6 text-center text-2xl font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {heading}
        </h2>
      )}

      {layout === "accordion" ? (
        <div>
          {items.map((item, i) => (
            <AccordionItem key={i} item={item} index={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item, i) => (
            <div key={i} data-testid={`faq-item-${i}`}>
              <h3
                className="mb-1 text-sm font-semibold"
                style={{ color: "var(--portal-text)" }}
              >
                {item.question}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--portal-text-muted)" }}
              >
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
