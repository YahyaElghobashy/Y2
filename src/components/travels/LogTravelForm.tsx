"use client"

import { useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Camera, Plus, Trash2, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  TRIP_STATUSES,
  TRIP_STATUS_LABELS,
  TRIP_KINDS,
  type TripStatus,
  type TripKind,
  type CreateTripData,
  type CompanionDraft,
} from "@/lib/types/trips.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const KIND_LABELS: Record<TripKind, string> = {
  native: "In Y2",
  hosted: "Trip site",
}

/**
 * The submit payload: the trip data plus the raw cover File (the authed page
 * uploads it via media-upload, then sets cover_image before insert). Keeping
 * upload out of the form preserves the presentational contract.
 */
export type LogTravelSubmit = CreateTripData & { coverFile?: File | null }

type LogTravelFormProps = {
  open: boolean
  onClose: () => void
  /** Real on the authed page; the page performs upload + insert. */
  onSubmit: (data: LogTravelSubmit) => Promise<void>
}

type CompanionRow = CompanionDraft & { key: string }

const newRow = (): CompanionRow => ({
  key: crypto.randomUUID(),
  name: "",
  relation: "",
})

export function LogTravelForm({ open, onClose, onSubmit }: LogTravelFormProps) {
  const [title, setTitle] = useState("")
  const [destination, setDestination] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState<TripStatus>("past")
  const [kind, setKind] = useState<TripKind>("native")
  const [hostedPath, setHostedPath] = useState("")
  const [summary, setSummary] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [companions, setCompanions] = useState<CompanionRow[]>([newRow()])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid =
    title.trim().length > 0 &&
    // hosted trips need a path to be useful
    (kind !== "hosted" || hostedPath.trim().length > 0) &&
    // end >= start when both present
    (!startDate || !endDate || endDate >= startDate)

  const reset = useCallback(() => {
    setTitle("")
    setDestination("")
    setStartDate("")
    setEndDate("")
    setStatus("past")
    setKind("native")
    setHostedPath("")
    setSummary("")
    setCoverFile(null)
    setCoverPreview(null)
    setCompanions([newRow()])
    setError(null)
  }, [])

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    reset()
    onClose()
  }, [isSubmitting, reset, onClose])

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setCoverFile(f)
    const reader = new FileReader()
    reader.onload = () => setCoverPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  const updateCompanion = (
    key: string,
    field: "name" | "relation",
    value: string
  ) => {
    setCompanions((prev) =>
      prev.map((c) => (c.key === key ? { ...c, [field]: value } : c))
    )
  }

  const addCompanionRow = () => setCompanions((prev) => [...prev, newRow()])
  const removeCompanionRow = (key: string) =>
    setCompanions((prev) =>
      prev.length === 1 ? prev : prev.filter((c) => c.key !== key)
    )

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return
    setError(null)
    setIsSubmitting(true)

    const cleanCompanions: CompanionDraft[] = companions
      .filter((c) => c.name.trim().length > 0)
      .map((c) => ({
        name: c.name.trim(),
        relation: c.relation?.trim() || null,
      }))

    try {
      await onSubmit({
        title: title.trim(),
        destination: destination.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        summary: summary.trim() || null,
        status,
        kind,
        hosted_path: kind === "hosted" ? hostedPath.trim() : null,
        companions: cleanCompanions,
        coverFile,
      })
      reset()
      onClose()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50" data-testid="log-travel-form">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(25,26,44,0.5)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />

        {/* Sheet */}
        <motion.div
          className="absolute inset-x-0 bottom-0 mx-auto max-h-[90vh] max-w-[480px] overflow-y-auto rounded-t-[24px] px-5 pb-10 pt-4"
          style={{ background: "var(--card)", color: "var(--card-foreground)" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          {/* Handle */}
          <div className="mb-3 flex justify-center">
            <div
              className="h-1 w-10 rounded-full"
              style={{ background: "var(--border)" }}
            />
          </div>

          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h3
              className="text-[20px] font-extrabold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Log a travel
            </h3>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="p-1"
              style={{ color: "var(--color-ink-soft)" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Cover upload */}
          <label className="mb-4 block cursor-pointer" data-testid="cover-upload">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCover}
              aria-label="Trip cover image"
            />
            <div
              className="relative flex h-[140px] w-full items-center justify-center overflow-hidden rounded-2xl border"
              style={{ borderColor: "var(--border)", background: "var(--color-sand)" }}
            >
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="flex flex-col items-center gap-1.5 text-[13px] font-semibold"
                  style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}
                >
                  <Camera size={24} strokeWidth={1.75} />
                  Add a cover photo
                </span>
              )}
            </div>
          </label>

          {/* Title */}
          <Field label="Where to?">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cambridge & London"
              data-testid="title-input"
            />
          </Field>

          {/* Destination */}
          <Field label="Destination">
            <div className="relative">
              <MapPin
                size={16}
                className="pointer-events-none absolute top-1/2 -translate-y-1/2"
                style={{ insetInlineStart: 10, color: "var(--color-ink-soft)" }}
              />
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="England"
                className="ps-8"
                data-testid="destination-input"
              />
            </div>
          </Field>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="start-input"
              />
            </Field>
            <Field label="End">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                data-testid="end-input"
              />
            </Field>
          </div>

          {/* Status */}
          <Field label="When">
            <div className="flex gap-2">
              {TRIP_STATUSES.map((s) => (
                <Chip
                  key={s}
                  active={status === s}
                  onClick={() => setStatus(s)}
                  testId={`status-${s}`}
                >
                  {TRIP_STATUS_LABELS[s]}
                </Chip>
              ))}
            </div>
          </Field>

          {/* Kind */}
          <Field label="Type">
            <div className="flex gap-2">
              {TRIP_KINDS.map((k) => (
                <Chip
                  key={k}
                  active={kind === k}
                  onClick={() => setKind(k)}
                  testId={`kind-${k}`}
                >
                  {KIND_LABELS[k]}
                </Chip>
              ))}
            </div>
          </Field>

          {/* Hosted bundle key (only for hosted trips). This is the folder
              name under content/trips/ that the gated serve route resolves —
              not a URL. */}
          {kind === "hosted" && (
            <Field label="Trip site bundle">
              <Input
                value={hostedPath}
                onChange={(e) => setHostedPath(e.target.value)}
                placeholder="cambridge-london"
                data-testid="hosted-path-input"
              />
            </Field>
          )}

          {/* Summary */}
          <Field label="A line about it (optional)">
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="The little moments you want to remember…"
              rows={2}
              className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-base outline-none md:text-sm"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              data-testid="summary-input"
            />
          </Field>

          {/* Companions */}
          <div className="mt-2">
            <p
              className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em]"
              style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
            >
              Who came along
            </p>
            <div className="space-y-2">
              {companions.map((c) => (
                <div key={c.key} className="flex items-center gap-2">
                  <Input
                    value={c.name}
                    onChange={(e) => updateCompanion(c.key, "name", e.target.value)}
                    placeholder="Name"
                    className="flex-1"
                    data-testid="companion-name"
                  />
                  <Input
                    value={c.relation ?? ""}
                    onChange={(e) =>
                      updateCompanion(c.key, "relation", e.target.value)
                    }
                    placeholder="Mum, Friend…"
                    className="flex-1"
                    data-testid="companion-relation"
                  />
                  <button
                    type="button"
                    onClick={() => removeCompanionRow(c.key)}
                    aria-label="Remove companion"
                    disabled={companions.length === 1}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md disabled:opacity-30"
                    style={{ color: "var(--color-terracotta)" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCompanionRow}
              className="mt-2 flex items-center gap-1 text-[13px] font-bold"
              style={{ fontFamily: "var(--font-nav)", color: "var(--color-terracotta)" }}
              data-testid="add-companion"
            >
              <Plus size={15} strokeWidth={2.5} /> Add companion
            </button>
          </div>

          {error && (
            <p
              className="mt-3 text-[13px] font-semibold"
              style={{ color: "var(--color-terracotta)" }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="mt-6">
            <Button
              variant="copper"
              className="w-full"
              size="pill"
              disabled={!isValid || isSubmitting}
              onClick={handleSubmit}
              data-testid="submit-travel"
            >
              {isSubmitting ? "Saving…" : "Log this travel"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="mb-3 block">
      <span
        className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.12em]"
        style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

function Chip({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  testId?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
      )}
      style={{
        fontFamily: "var(--font-body)",
        background: active ? "var(--color-terracotta)" : "var(--color-sand)",
        color: active ? "#FFF7EF" : "var(--color-ink-soft)",
      }}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}
