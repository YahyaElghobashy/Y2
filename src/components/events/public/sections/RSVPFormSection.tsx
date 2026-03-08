"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { usePortalData } from "@/components/events/public/PortalDataProvider"
import type { PortalSection } from "@/lib/types/portal.types"

type Props = { section: PortalSection }

type FormData = {
  name: string
  email: string
  attending: "yes" | "no" | "maybe"
  plus_ones: number
  meal_preference: string
  dietary_notes: string
  hotel_choice: string
  message: string
  sub_event_ids: string[]
}

const EMPTY_FORM: FormData = {
  name: "",
  email: "",
  attending: "yes",
  plus_ones: 0,
  meal_preference: "",
  dietary_notes: "",
  hotel_choice: "",
  message: "",
  sub_event_ids: [],
}

export function RSVPFormSection({ section }: Props) {
  const { portal } = usePortalData()
  const content = section.content

  const heading = (content.heading as string) ?? "RSVP"
  const description = (content.description as string) ?? ""
  const showMessage = (content.show_message as boolean) ?? true
  const showPlusOnes = (content.show_plus_ones as boolean) ?? false
  const maxPlusOnes = (content.max_plus_ones as number) ?? 5
  const showMealPref = (content.show_meal_preference as boolean) ?? false
  const mealOptions = (content.meal_options as string[]) ?? []
  const showDietaryNotes = (content.show_dietary_notes as boolean) ?? false
  const showHotelChoice = (content.show_hotel_choice as boolean) ?? false
  const hotelOptions = (content.hotel_options as string[]) ?? []
  const confirmationMessage =
    (content.confirmation_message as string) || "Thank you for your RSVP!"
  const deadline = (content.deadline as string) ?? ""

  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM })
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const isPastDeadline = deadline ? new Date(deadline) < new Date() : false

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setStatus("submitting")
    setErrorMsg("")

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = getSupabaseBrowserClient() as any

      const { error } = await supabase.from("portal_rsvps").insert({
        portal_id: portal.id,
        name: form.name.trim(),
        email: form.email.trim() || null,
        attending: form.attending,
        plus_ones: showPlusOnes ? form.plus_ones : 0,
        meal_preference: showMealPref ? form.meal_preference || null : null,
        dietary_notes: showDietaryNotes ? form.dietary_notes || null : null,
        hotel_choice: showHotelChoice ? form.hotel_choice || null : null,
        message: showMessage ? form.message || null : null,
        sub_event_ids: form.sub_event_ids,
        custom_fields: {},
      })

      if (error) throw error
      setStatus("success")
    } catch {
      setStatus("error")
      setErrorMsg("Something went wrong. Please try again.")
    }
  }

  if (status === "success") {
    return (
      <div
        className="mx-auto max-w-md px-4 py-8 text-center"
        data-testid="rsvp-success"
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--portal-primary)" }}
        >
          <Check className="h-7 w-7 text-white" />
        </div>
        <p
          className="text-lg font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {confirmationMessage}
        </p>
      </div>
    )
  }

  if (isPastDeadline) {
    return (
      <div
        className="mx-auto max-w-md px-4 text-center"
        data-testid="rsvp-closed"
      >
        <p className="text-sm" style={{ color: "var(--portal-text-muted)" }}>
          RSVP deadline has passed
        </p>
      </div>
    )
  }

  const inputStyle = {
    borderColor: "var(--portal-border)",
    backgroundColor: "var(--portal-bg)",
    color: "var(--portal-text)",
    borderRadius: "var(--portal-radius)",
  }

  return (
    <div className="mx-auto max-w-md px-4" data-testid="rsvp-section">
      {heading && (
        <h2
          className="mb-2 text-center text-2xl font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {heading}
        </h2>
      )}
      {description && (
        <p className="mb-6 text-center text-sm" style={{ color: "var(--portal-text-muted)" }}>
          {description}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--portal-text)" }}>
            Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={inputStyle}
            required
            data-testid="rsvp-name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--portal-text)" }}>
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={inputStyle}
            data-testid="rsvp-email"
          />
        </div>

        {/* Attendance */}
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--portal-text)" }}>
            Will you attend? *
          </label>
          <div className="flex gap-2">
            {(["yes", "no", "maybe"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => update("attending", opt)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors"
                style={{
                  borderColor:
                    form.attending === opt
                      ? "var(--portal-primary)"
                      : "var(--portal-border)",
                  backgroundColor:
                    form.attending === opt
                      ? "var(--portal-primary)"
                      : "transparent",
                  color:
                    form.attending === opt ? "#fff" : "var(--portal-text)",
                  borderRadius: "var(--portal-radius)",
                }}
                data-testid={`rsvp-attending-${opt}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Plus Ones */}
        {showPlusOnes && (
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--portal-text)" }}>
              Plus Ones
            </label>
            <select
              value={form.plus_ones}
              onChange={(e) => update("plus_ones", Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={inputStyle}
              data-testid="rsvp-plus-ones"
            >
              {Array.from({ length: maxPlusOnes + 1 }, (_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Meal Preference */}
        {showMealPref && mealOptions.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--portal-text)" }}>
              Meal Preference
            </label>
            <select
              value={form.meal_preference}
              onChange={(e) => update("meal_preference", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={inputStyle}
              data-testid="rsvp-meal"
            >
              <option value="">Select...</option>
              {mealOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dietary Notes */}
        {showDietaryNotes && (
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--portal-text)" }}>
              Dietary Notes
            </label>
            <input
              type="text"
              value={form.dietary_notes}
              onChange={(e) => update("dietary_notes", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={inputStyle}
              placeholder="e.g. vegetarian, allergies"
              data-testid="rsvp-dietary"
            />
          </div>
        )}

        {/* Hotel Choice */}
        {showHotelChoice && hotelOptions.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--portal-text)" }}>
              Hotel Preference
            </label>
            <select
              value={form.hotel_choice}
              onChange={(e) => update("hotel_choice", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={inputStyle}
              data-testid="rsvp-hotel"
            >
              <option value="">Select...</option>
              {hotelOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Message */}
        {showMessage && (
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--portal-text)" }}>
              Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={inputStyle}
              rows={3}
              placeholder="Leave a message for the hosts..."
              data-testid="rsvp-message"
            />
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <p className="text-xs text-red-500" data-testid="rsvp-error">
            {errorMsg}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "submitting" || !form.name.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: "var(--portal-primary)",
            borderRadius: "var(--portal-radius)",
          }}
          data-testid="rsvp-submit"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit RSVP"
          )}
        </button>
      </form>
    </div>
  )
}
