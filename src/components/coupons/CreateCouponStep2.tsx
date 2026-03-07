"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export type Step2Data = {
  hasExpiry: boolean
  expiryDate?: string
  isSurprise: boolean
}

type CreateCouponStep2Props = {
  data?: Partial<Step2Data>
  onNext: (data: Step2Data) => void
  onBack: () => void
}

export function CreateCouponStep2({ data, onNext, onBack }: CreateCouponStep2Props) {
  const [hasExpiry, setHasExpiry] = useState(data?.hasExpiry ?? false)
  const [expiryDate, setExpiryDate] = useState(data?.expiryDate ?? "")
  const [isSurprise, setIsSurprise] = useState(data?.isSurprise ?? false)

  const handleNext = () => {
    onNext({
      hasExpiry,
      expiryDate: hasExpiry ? expiryDate : undefined,
      isSurprise,
    })
  }

  // Min date = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  return (
    <div className="flex flex-col gap-6" data-testid="step2-form">
      <h2 className="text-[20px] font-bold font-display text-[var(--text-primary)]">
        Any rules?
      </h2>

      {/* Expiry toggle */}
      <div className="flex flex-col gap-3">
        <ToggleRow
          label="Set an expiry date"
          description="Coupon expires after this date"
          checked={hasExpiry}
          onChange={setHasExpiry}
          testId="expiry-toggle"
        />
        {hasExpiry && (
          <input
            type="date"
            min={minDate}
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[15px] font-body text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            data-testid="expiry-date"
          />
        )}
      </div>

      {/* Surprise toggle */}
      <ToggleRow
        label="Make it a surprise"
        description="Hidden until you reveal it"
        checked={isSurprise}
        onChange={setIsSurprise}
        testId="surprise-toggle"
      />

      {/* Buttons */}
      <div className="mt-2 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleNext}
          className="h-12 w-full rounded-xl bg-[var(--accent-primary)] text-[15px] font-medium font-body text-white"
          data-testid="next-button"
        >
          Next
        </button>
        <button
          type="button"
          onClick={onBack}
          className="h-10 w-full text-[14px] font-medium font-body text-[var(--text-secondary)]"
          data-testid="back-button"
        >
          Back
        </button>
      </div>
    </div>
  )
}

// Toggle row sub-component
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  testId,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  testId: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[var(--bg-secondary)] p-4">
      <div>
        <p className="text-[15px] font-medium font-body text-[var(--text-primary)]">
          {label}
        </p>
        <p className="text-[13px] font-body text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-[var(--accent-primary)]" : "bg-[var(--text-muted)]"
        )}
        data-testid={testId}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  )
}
