"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { toast } from "sonner"
import { COUNTRIES, COUNTRY_NAME } from "@/lib/data/iso-country-codes"
import type { LogVisitData, Traveler } from "@/lib/types/world-map.types"
import { cn } from "@/lib/utils"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type Who = Traveler | "together"

export type LogVisitFormProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: LogVisitData) => Promise<void>
  /** Pre-select a country (e.g. opened from its detail sheet). */
  presetCountry?: string | null
  meName?: string
  partnerName?: string
}

export function LogVisitForm({
  open,
  onClose,
  onSubmit,
  presetCountry = null,
  meName = "Me",
  partnerName = "Partner",
}: LogVisitFormProps) {
  const [mounted, setMounted] = useState(false)
  const [code, setCode] = useState(presetCountry ?? "")
  const [query, setQuery] = useState(presetCountry ? COUNTRY_NAME[presetCountry] ?? "" : "")
  const [who, setWho] = useState<Who>("together")
  const [place, setPlace] = useState("")
  const [year, setYear] = useState("")
  const [companions, setCompanions] = useState("")
  const [memorable, setMemorable] = useState("")
  const [recommendation, setRecommendation] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (open) {
      setCode(presetCountry ?? "")
      setQuery(presetCountry ? COUNTRY_NAME[presetCountry] ?? "" : "")
      setWho("together")
      setPlace("")
      setYear("")
      setCompanions("")
      setMemorable("")
      setRecommendation("")
    }
  }, [open, presetCountry])

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || code) return []
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6)
  }, [query, code])

  const isTogether = who === "together"

  const handleSubmit = async () => {
    if (!code) {
      toast.error("Pick a country first")
      return
    }
    const y = year.trim() ? Number(year.trim()) : null
    if (y != null && (!Number.isFinite(y) || y < 1900 || y > 2100)) {
      toast.error("Enter a valid year")
      return
    }
    const data: LogVisitData = {
      countryCode: code,
      traveler: who === "partner" ? "partner" : "me",
      isTogether,
      place: place.trim() || null,
      visitedYear: y,
      companions: !isTogether && companions.trim() ? companions.trim() : null,
      memorable: isTogether && memorable.trim() ? memorable.trim() : null,
      recommendation:
        !isTogether && recommendation.trim() ? recommendation.trim() : null,
    }
    setSaving(true)
    try {
      await onSubmit(data)
      toast.success("Visit logged")
      onClose()
    } catch {
      // The hook set + surfaced the error; keep the sheet open so nothing is lost.
      toast.error("Couldn't log this visit")
    } finally {
      setSaving(false)
    }
  }

  if (!mounted || !open) return null

  const whoChips: { key: Who; label: string }[] = [
    { key: "together", label: "Together" },
    { key: "me", label: meName },
    { key: "partner", label: partnerName },
  ]

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50" data-testid="log-visit-form">
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(25,26,44,0.5)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="absolute inset-x-0 bottom-0 mx-auto max-h-[90vh] max-w-[480px] overflow-y-auto rounded-t-[24px] px-5 pb-10 pt-4"
          style={{ background: "var(--card)", color: "var(--card-foreground)" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <div className="mb-3 flex justify-center">
            <div className="h-1 w-10 rounded-full" style={{ background: "var(--border)" }} />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[20px] font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Log a visit
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1.5"
              style={{ color: "var(--color-ink-soft)" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Country */}
          <label className="mb-1 block text-[12px] font-semibold" style={{ fontFamily: "var(--font-nav)" }}>
            Country
          </label>
          <div className="relative mb-3">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setCode("")
              }}
              placeholder="Search a country…"
              className="w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--background)" }}
            />
            {suggestions.length > 0 && (
              <ul
                className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                {suggestions.map((c) => (
                  <li key={c.iso2}>
                    <button
                      type="button"
                      onClick={() => {
                        setCode(c.iso2)
                        setQuery(c.name)
                      }}
                      className="block w-full px-3 py-2 text-left text-[14px] hover:opacity-80"
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Who */}
          <label className="mb-1 block text-[12px] font-semibold" style={{ fontFamily: "var(--font-nav)" }}>
            Who went?
          </label>
          <div className="mb-3 flex gap-2">
            {whoChips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setWho(c.key)}
                className={cn(
                  "flex-1 rounded-full px-3 py-2 text-[13px] font-semibold transition",
                  who === c.key ? "text-white" : ""
                )}
                style={{
                  background: who === c.key ? "var(--color-coral)" : "var(--background)",
                  border: "1px solid var(--border)",
                  color: who === c.key ? "#fff" : "var(--color-ink)",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Place + year */}
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-semibold" style={{ fontFamily: "var(--font-nav)" }}>
                City / place
              </label>
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Amsterdam"
                className="w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--background)" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold" style={{ fontFamily: "var(--font-nav)" }}>
                Year
              </label>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                inputMode="numeric"
                placeholder="2024"
                className="w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--background)" }}
              />
            </div>
          </div>

          {/* Conditional: together → memorable; solo → companions + recommendation */}
          {isTogether ? (
            <div className="mb-4">
              <label className="mb-1 block text-[12px] font-semibold" style={{ fontFamily: "var(--font-nav)" }}>
                What made it special?
              </label>
              <textarea
                value={memorable}
                onChange={(e) => setMemorable(e.target.value)}
                rows={3}
                placeholder="The canal-side breakfast…"
                className="w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none"
                style={{ borderColor: "var(--border)", background: "var(--background)" }}
              />
            </div>
          ) : (
            <>
              <div className="mb-3">
                <label className="mb-1 block text-[12px] font-semibold" style={{ fontFamily: "var(--font-nav)" }}>
                  Who were you with?
                </label>
                <input
                  value={companions}
                  onChange={(e) => setCompanions(e.target.value)}
                  placeholder="With friends"
                  className="w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--background)" }}
                />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-[12px] font-semibold" style={{ fontFamily: "var(--font-nav)" }}>
                  What should we do there together?
                </label>
                <textarea
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  rows={3}
                  placeholder="Rent bikes and find that café again…"
                  className="w-full rounded-xl border px-3 py-2.5 text-[14px] outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--background)" }}
                />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full rounded-full py-3 text-[15px] font-bold text-white disabled:opacity-60"
            style={{ background: "var(--color-coral)", fontFamily: "var(--font-nav)" }}
          >
            {saving ? "Saving…" : "Save visit"}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
