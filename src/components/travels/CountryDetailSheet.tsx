"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X, MapPin, Star, Plus } from "lucide-react"
import type { CountryVisit } from "@/lib/types/world-map.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export type CountryDetailSheetProps = {
  open: boolean
  onClose: () => void
  iso2: string
  name: string
  region: string
  visits: CountryVisit[]
  isPinned: boolean
  /** True when the user already has 3 pins and this one isn't pinned. */
  pinDisabled: boolean
  meId: string
  partnerId: string | null
  meName: string
  partnerName: string
  onTogglePin: () => void | Promise<void>
  onLogVisit: () => void
  onAddPartnerNote: (visitId: string, note: string) => Promise<void>
}

function whoLabel(
  v: CountryVisit,
  meId: string,
  meName: string,
  partnerName: string
): string {
  if (v.is_together) return "Together"
  return v.traveler_id === meId ? meName : partnerName
}

export function CountryDetailSheet(props: CountryDetailSheetProps) {
  const {
    open,
    onClose,
    name,
    region,
    visits,
    isPinned,
    pinDisabled,
    meId,
    meName,
    partnerName,
    onTogglePin,
    onLogVisit,
    onAddPartnerNote,
  } = props

  const [mounted, setMounted] = useState(false)
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})
  useEffect(() => setMounted(true), [])

  if (!mounted || !open) return null

  const sorted = [...visits].sort(
    (a, b) => (b.visited_year ?? 0) - (a.visited_year ?? 0)
  )

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50" data-testid="country-detail-sheet">
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(25,26,44,0.5)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] max-w-[480px] overflow-y-auto rounded-t-[24px] px-5 pb-10 pt-4"
          style={{ background: "var(--card)", color: "var(--card-foreground)" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <div className="mb-3 flex justify-center">
            <div className="h-1 w-10 rounded-full" style={{ background: "var(--border)" }} />
          </div>

          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-[24px] font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {name}
              </h2>
              <p className="text-[12px]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
                {region}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1.5"
              style={{ color: "var(--color-ink-soft)" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Actions */}
          <div className="mb-5 flex gap-2">
            <button
              type="button"
              onClick={() => onTogglePin()}
              disabled={!isPinned && pinDisabled}
              title={!isPinned && pinDisabled ? "You already have 3 pins" : undefined}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold disabled:opacity-50"
              style={{
                background: isPinned ? "var(--color-coral)" : "var(--background)",
                color: isPinned ? "#fff" : "var(--color-ink)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-nav)",
              }}
            >
              <Star size={15} fill={isPinned ? "#fff" : "none"} />
              {isPinned ? "Pinned" : "Pin as a dream"}
            </button>
            <button
              type="button"
              onClick={onLogVisit}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold"
              style={{
                background: "var(--color-teal)",
                color: "#fff",
                fontFamily: "var(--font-nav)",
              }}
            >
              <Plus size={15} />
              Log a visit
            </button>
          </div>

          {/* Visit timeline */}
          {sorted.length === 0 ? (
            <p
              className="rounded-xl px-4 py-6 text-center text-[14px] italic"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--color-ink-soft)",
                background: "var(--background)",
              }}
            >
              No visits logged yet. Pin it as a dream, or log a memory.
            </p>
          ) : (
            <ul className="space-y-3">
              {sorted.map((v) => {
                const canAddNote = v.is_together && v.created_by !== meId && !v.partner_note
                return (
                  <li
                    key={v.id}
                    className="rounded-xl border p-3"
                    style={{ borderColor: "var(--border)", background: "var(--background)" }}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={{
                          fontFamily: "var(--font-nav)",
                          background: v.is_together ? "var(--color-coral)" : "var(--color-sand)",
                          color: v.is_together ? "#fff" : "var(--color-ink)",
                        }}
                      >
                        {whoLabel(v, meId, meName, partnerName)}
                      </span>
                      {v.visited_year && (
                        <span
                          className="text-[12px]"
                          style={{ fontFamily: "var(--font-mono)", color: "var(--color-ink-soft)" }}
                        >
                          {v.visited_year}
                        </span>
                      )}
                      {v.place && (
                        <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "var(--color-ink-soft)" }}>
                          <MapPin size={12} /> {v.place}
                        </span>
                      )}
                    </div>

                    {v.companions && (
                      <p className="text-[13px]" style={{ color: "var(--color-ink-soft)" }}>
                        {v.companions}
                      </p>
                    )}

                    {v.is_together && v.memorable && (
                      <p className="mt-1 text-[14px] italic" style={{ fontFamily: "var(--font-serif)" }}>
                        “{v.memorable}”
                      </p>
                    )}

                    {!v.is_together && v.recommendation && (
                      <p className="mt-1 text-[13px]" style={{ fontFamily: "var(--font-serif)" }}>
                        <span className="font-semibold not-italic" style={{ fontFamily: "var(--font-nav)" }}>
                          When we go:{" "}
                        </span>
                        <span className="italic">{v.recommendation}</span>
                      </p>
                    )}

                    {v.partner_note && (
                      <p
                        className="mt-2 rounded-lg px-2 py-1.5 text-[13px] italic"
                        style={{ fontFamily: "var(--font-serif)", background: "var(--color-sand)" }}
                      >
                        “{v.partner_note}”
                      </p>
                    )}

                    {canAddNote && (
                      <div className="mt-2 flex gap-2">
                        <input
                          value={noteDraft[v.id] ?? ""}
                          onChange={(e) =>
                            setNoteDraft((d) => ({ ...d, [v.id]: e.target.value }))
                          }
                          placeholder="Add your side of this memory…"
                          className="flex-1 rounded-lg border px-2 py-1.5 text-[13px] outline-none"
                          style={{ borderColor: "var(--border)", background: "var(--card)" }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const note = (noteDraft[v.id] ?? "").trim()
                            if (!note) return
                            try {
                              await onAddPartnerNote(v.id, note)
                              setNoteDraft((d) => ({ ...d, [v.id]: "" }))
                            } catch {
                              /* hook surfaced the error */
                            }
                          }}
                          className="rounded-lg px-3 text-[13px] font-semibold text-white"
                          style={{ background: "var(--color-teal)" }}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
