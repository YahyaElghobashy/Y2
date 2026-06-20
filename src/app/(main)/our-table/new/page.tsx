"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { MapPin, Clock, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { RestaurantSearch } from "@/components/food/RestaurantSearch"
import { RatingSlider } from "@/components/food/RatingSlider"
import { useFoodJournal } from "@/lib/hooks/use-food-journal"
import {
  CUISINE_TYPES,
  CUISINE_LABELS,
  type CuisineType,
} from "@/lib/types/food-journal.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export type VisitFormData = {
  placeName: string
  placeId: string | null
  lat: number | null
  lng: number | null
  cuisineType: CuisineType
  visitDate: string
  visitTime: string
  notes: string
}

const DEFAULT_FORM: VisitFormData = {
  placeName: "",
  placeId: null,
  lat: null,
  lng: null,
  cuisineType: "arabic",
  visitDate: new Date().toISOString().split("T")[0],
  visitTime: new Date().toTimeString().slice(0, 5),
  notes: "",
}

export default function NewVisitPage() {
  const router = useRouter()
  const { addVisit, addRating } = useFoodJournal()
  const [step, setStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const formRef = useRef<VisitFormData>({ ...DEFAULT_FORM })
  const [formState, setFormState] = useState<VisitFormData>({ ...DEFAULT_FORM })
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [gpsStatus, setGpsStatus] = useState<"loading" | "success" | "denied">(
    "loading"
  )

  // Auto-capture GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("denied")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        formRef.current.lat = pos.coords.latitude
        formRef.current.lng = pos.coords.longitude
        setGpsStatus("success")
      },
      () => {
        setGpsStatus("denied")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const updateForm = (partial: Partial<VisitFormData>) => {
    Object.assign(formRef.current, partial)
    setFormState({ ...formRef.current })
  }

  const handleRestaurantSelect = (data: {
    placeName: string
    placeId: string | null
    lat: number | null
    lng: number | null
  }) => {
    updateForm(data)
  }

  const canProceed = formState.placeName.trim().length > 0

  const handleNext = () => {
    if (!canProceed) return
    // Navigate to step 2 (photos) — will be on same page in future tasks
    // For now store in sessionStorage and proceed
    if (typeof window !== "undefined") {
      sessionStorage.setItem("newVisitForm", JSON.stringify(formRef.current))
    }
    setStep(2)
  }

  // Step 3 submit: persist the visit + rating to Supabase, THEN navigate.
  // Previously this only wrote to sessionStorage and navigated, so a new visit
  // was never saved. The visit is the source of truth; the rating is attached
  // best-effort (a visit with no rating is still valid — it can be rated later).
  const handleRatingSubmit = async (rawScore: number) => {
    if (isSaving) return
    const form = formRef.current
    // RatingSlider uses 0.5 steps; rating columns are integers 1–10.
    const score = Math.max(1, Math.min(10, Math.round(rawScore)))
    setIsSaving(true)
    try {
      const visitId = await addVisit({
        place_name: form.placeName,
        place_id: form.placeId,
        lat: form.lat,
        lng: form.lng,
        cuisine_type: form.cuisineType,
        visit_date: form.visitDate,
        visit_time: form.visitTime || null,
        notes: form.notes || null,
      })

      if (!visitId) {
        toast.error("Couldn't save your visit. Try again.")
        return
      }

      // The form collects a single overall food score; seed every rating
      // dimension from it (all columns are NOT NULL, 1–10). A richer per-
      // dimension flow can refine these later from the visit detail screen.
      try {
        await addRating({
          visit_id: visitId,
          location_score: score,
          parking_score: score,
          service_score: score,
          food_quality: score,
          quantity_score: score,
          price_score: score,
          cuisine_score: score,
          bathroom_score: score,
          vibe_score: score,
        })
      } catch {
        // Visit saved; only the rating failed. Don't lose the visit.
        toast.error("Visit saved, but the rating didn't. Add it from the visit.")
        if (typeof window !== "undefined") sessionStorage.removeItem("newVisitForm")
        router.push("/our-table")
        return
      }

      if (typeof window !== "undefined") sessionStorage.removeItem("newVisitForm")
      toast.success("Visit saved")
      router.push("/our-table")
    } finally {
      setIsSaving(false)
    }
  }

  // Step 3: Full-screen immersive rating experience
  if (step === 3) {
    return (
      <RatingSlider
        question="How was the food?"
        stepLabel="Step 3 of 3"
        stepProgress={1}
        initialScore={7}
        isSubmitting={isSaving}
        onNext={handleRatingSubmit}
        onClose={() => setStep(2)}
      />
    )
  }

  return (
    <PageTransition>
      <PageHeader title="New Visit" backHref="/our-table" />

      {/* Progress dots */}
      <div
        data-testid="progress-dots"
        className="flex items-center justify-center gap-2 px-5 mb-4"
      >
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            data-testid={`progress-dot-${s}`}
            className={cn(
              "h-2 rounded-full transition-all",
              s === step
                ? "w-6 bg-[var(--accent-primary,#C4956A)]"
                : s < step
                  ? "w-2 bg-[var(--accent-primary,#C4956A)]"
                  : "w-2 bg-[var(--border-subtle)]"
            )}
          />
        ))}
      </div>

      <div className="px-5 pb-8">
        {/* Step 1: Location */}
        {step === 1 && (
          <motion.div
            data-testid="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="flex flex-col gap-5"
          >
            {/* GPS status badge */}
            <div
              data-testid="gps-status"
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-[12px]",
                gpsStatus === "success"
                  ? "bg-green-50 text-green-700"
                  : gpsStatus === "denied"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
              )}
            >
              <MapPin size={14} />
              {gpsStatus === "loading" && "Getting location..."}
              {gpsStatus === "success" && "Location captured"}
              {gpsStatus === "denied" && "Location unavailable — enter manually"}
            </div>

            {/* Auto-captured date/time */}
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)] px-3 py-2.5">
                <Calendar size={14} className="text-[var(--text-muted)]" />
                <input
                  data-testid="visit-date-input"
                  type="date"
                  value={formState.visitDate}
                  onChange={(e) => updateForm({ visitDate: e.target.value })}
                  className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] outline-none"
                />
              </div>
              <div className="w-28 flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)] px-3 py-2.5">
                <Clock size={14} className="text-[var(--text-muted)]" />
                <input
                  data-testid="visit-time-input"
                  type="time"
                  value={formState.visitTime}
                  onChange={(e) => updateForm({ visitTime: e.target.value })}
                  className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>

            {/* Restaurant search */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[var(--text-secondary)]">
                Restaurant
              </label>
              <RestaurantSearch
                onSelect={handleRestaurantSelect}
                userLat={userLat}
                userLng={userLng}
              />
              {formState.placeName && (
                <div
                  data-testid="selected-place"
                  className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--accent-soft,#E8D5C0)]/30 px-3 py-2"
                >
                  <MapPin
                    size={14}
                    className="text-[var(--accent-primary,#C4956A)]"
                  />
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">
                    {formState.placeName}
                  </span>
                </div>
              )}
            </div>

            {/* Cuisine type */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[var(--text-secondary)]">
                Cuisine
              </label>
              <div
                data-testid="cuisine-pills"
                className="flex flex-wrap gap-2"
              >
                {CUISINE_TYPES.map((ct) => (
                  <button
                    key={ct}
                    data-testid={`cuisine-${ct}`}
                    onClick={() => updateForm({ cuisineType: ct })}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                      formState.cuisineType === ct
                        ? "bg-[var(--accent-primary,#C4956A)] text-white"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    )}
                  >
                    {CUISINE_LABELS[ct]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[var(--text-secondary)]">
                Notes (optional)
              </label>
              <textarea
                data-testid="notes-input"
                value={formState.notes}
                onChange={(e) => updateForm({ notes: e.target.value })}
                placeholder="First impressions..."
                rows={2}
                maxLength={500}
                className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* Next button */}
            <motion.button
              data-testid="next-btn"
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              onClick={handleNext}
              disabled={!canProceed}
              className="rounded-xl bg-[var(--accent-primary,#C4956A)] py-3 text-[14px] font-medium text-white disabled:opacity-50"
            >
              Next — Photos
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Photos placeholder — will be built in T1304 */}
        {step === 2 && (
          <motion.div
            data-testid="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="flex flex-col items-center justify-center py-16"
          >
            <p className="text-[14px] text-[var(--text-muted)]">
              Photo capture — coming in T1304
            </p>
            <div className="flex gap-3 mt-4">
              <button
                data-testid="back-to-step-1"
                onClick={() => setStep(1)}
                className="text-[13px] text-[var(--accent-primary,#C4956A)] font-medium"
              >
                Back
              </button>
              <button
                data-testid="skip-to-step-3"
                onClick={() => setStep(3)}
                className="text-[13px] text-[var(--accent-primary,#C4956A)] font-medium"
              >
                Skip to Rating →
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
