"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { colors } from "@/lib/theme"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Sparkles, Plus, X } from "lucide-react"
import { EVENT_TYPES } from "@/lib/types/portal.types"
import type { EventType, PortalThemeConfig } from "@/lib/types/portal.types"
import { THEME_PRESETS, THEME_PRESET_META } from "@/lib/portal-themes"
import { PORTAL_TEMPLATES, getSuggestedTemplate } from "@/lib/portal-templates"
import type { PortalTemplate } from "@/lib/portal-templates"

// ── Wizard State ──

type WizardState = {
  eventType: EventType
  title: string
  eventDate: string
  locationName: string
  subEvents: { title: string; date: string; startTime: string }[]
  themePreset: string
  template: PortalTemplate | null
}

const INITIAL_STATE: WizardState = {
  eventType: "wedding",
  title: "",
  eventDate: "",
  locationName: "",
  subEvents: [],
  themePreset: "elegant_gold",
  template: null,
}

const STEPS = ["type", "details", "theme", "template", "review"] as const
type WizardStep = (typeof STEPS)[number]

const STEP_LABELS: Record<WizardStep, string> = {
  type: "Event Type",
  details: "Details",
  theme: "Theme",
  template: "Template",
  review: "Review",
}

const EVENT_TYPE_META: Record<EventType, { label: string; icon: string }> = {
  engagement: { label: "Engagement", icon: "💍" },
  wedding: { label: "Wedding", icon: "💒" },
  birthday: { label: "Birthday", icon: "🎂" },
  anniversary: { label: "Anniversary", icon: "❤️" },
  gathering: { label: "Gathering", icon: "🎉" },
  custom: { label: "Custom", icon: "✨" },
}

// ── Props ──

export type PortalCreationWizardProps = {
  onComplete: (data: {
    title: string
    event_type: EventType
    event_date: string | null
    location_name: string | null
    theme_config: PortalThemeConfig
    template: PortalTemplate | null
    subEvents: { title: string; date: string; startTime: string }[]
  }) => Promise<void>
  onCancel?: () => void
}

// ── Component ──

export function PortalCreationWizard({ onComplete, onCancel }: PortalCreationWizardProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentStep = STEPS[stepIndex]
  const progress = STEPS.length > 1 ? (stepIndex / (STEPS.length - 1)) * 100 : 0

  const goNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setDirection("forward")
      setStepIndex((i) => i + 1)
    }
  }, [stepIndex])

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setDirection("backward")
      setStepIndex((i) => i - 1)
    }
  }, [stepIndex])

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case "type":
        return !!state.eventType
      case "details":
        return state.title.trim().length > 0
      case "theme":
        return !!state.themePreset
      case "template":
        return true // optional
      case "review":
        return true
      default:
        return true
    }
  }, [currentStep, state])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const themeConfig = THEME_PRESETS[state.themePreset] ?? THEME_PRESETS.elegant_gold
      await onComplete({
        title: state.title,
        event_type: state.eventType,
        event_date: state.eventDate || null,
        location_name: state.locationName || null,
        theme_config: themeConfig,
        template: state.template,
        subEvents: state.subEvents,
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [state, onComplete])

  const updateState = useCallback(
    (partial: Partial<WizardState>) => setState((prev) => ({ ...prev, ...partial })),
    []
  )

  // Auto-select template when event type changes
  const handleEventTypeChange = useCallback(
    (eventType: EventType) => {
      const suggested = getSuggestedTemplate(eventType)
      updateState({
        eventType,
        template: suggested,
        themePreset: suggested.theme_preset,
      })
    },
    [updateState]
  )

  const addSubEvent = useCallback(() => {
    updateState({
      subEvents: [...state.subEvents, { title: "", date: "", startTime: "" }],
    })
  }, [state.subEvents, updateState])

  const removeSubEvent = useCallback(
    (index: number) => {
      updateState({
        subEvents: state.subEvents.filter((_, i) => i !== index),
      })
    },
    [state.subEvents, updateState]
  )

  const updateSubEvent = useCallback(
    (index: number, field: string, value: string) => {
      const updated = [...state.subEvents]
      updated[index] = { ...updated[index], [field]: value }
      updateState({ subEvents: updated })
    },
    [state.subEvents, updateState]
  )

  return (
    <div className="flex flex-col min-h-[60vh]">
      {/* Progress Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: colors.text.secondary }}>
            {STEP_LABELS[currentStep]}
          </span>
          <span className="text-xs" style={{ color: colors.text.muted }}>
            {stepIndex + 1} / {STEPS.length}
          </span>
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.bg.secondary }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: colors.accent.primary }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-4 py-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: direction === "forward" ? 24 : -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === "forward" ? -24 : 24 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {currentStep === "type" && (
              <StepEventType
                selected={state.eventType}
                onChange={handleEventTypeChange}
              />
            )}
            {currentStep === "details" && (
              <StepDetails
                title={state.title}
                eventDate={state.eventDate}
                locationName={state.locationName}
                subEvents={state.subEvents}
                onTitleChange={(v) => updateState({ title: v })}
                onDateChange={(v) => updateState({ eventDate: v })}
                onLocationChange={(v) => updateState({ locationName: v })}
                onAddSubEvent={addSubEvent}
                onRemoveSubEvent={removeSubEvent}
                onUpdateSubEvent={updateSubEvent}
              />
            )}
            {currentStep === "theme" && (
              <StepTheme
                selected={state.themePreset}
                onChange={(v) => updateState({ themePreset: v })}
              />
            )}
            {currentStep === "template" && (
              <StepTemplate
                eventType={state.eventType}
                selected={state.template}
                onChange={(v) => updateState({ template: v })}
              />
            )}
            {currentStep === "review" && (
              <StepReview state={state} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 pb-4 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={stepIndex === 0 ? onCancel : goBack}
          disabled={isSubmitting}
        >
          {stepIndex === 0 ? (
            "Cancel"
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 me-1" />
              Back
            </>
          )}
        </Button>

        {currentStep === "review" ? (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              "Creating..."
            ) : (
              <>
                <Sparkles className="w-4 h-4 me-1" />
                Create Portal
              </>
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={goNext}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="w-4 h-4 ms-1" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Step 1: Event Type ──

function StepEventType({
  selected,
  onChange,
}: {
  selected: EventType
  onChange: (type: EventType) => void
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: colors.text.primary }}>
        What are you celebrating?
      </h2>
      <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
        Choose the type of event for your portal
      </p>
      <div className="grid grid-cols-2 gap-3">
        {EVENT_TYPES.map((type) => {
          const meta = EVENT_TYPE_META[type]
          const isSelected = selected === type
          return (
            <button
              key={type}
              onClick={() => onChange(type)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                isSelected ? "border-current shadow-sm" : "border-transparent"
              )}
              style={{
                backgroundColor: isSelected
                  ? colors.accent.glow
                  : colors.bg.secondary,
                color: isSelected
                  ? colors.accent.primary
                  : colors.text.primary,
              }}
              data-testid={`event-type-${type}`}
            >
              <span className="text-2xl">{meta.icon}</span>
              <span className="text-sm font-medium">{meta.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 2: Details ──

function StepDetails({
  title,
  eventDate,
  locationName,
  subEvents,
  onTitleChange,
  onDateChange,
  onLocationChange,
  onAddSubEvent,
  onRemoveSubEvent,
  onUpdateSubEvent,
}: {
  title: string
  eventDate: string
  locationName: string
  subEvents: { title: string; date: string; startTime: string }[]
  onTitleChange: (v: string) => void
  onDateChange: (v: string) => void
  onLocationChange: (v: string) => void
  onAddSubEvent: () => void
  onRemoveSubEvent: (i: number) => void
  onUpdateSubEvent: (i: number, field: string, value: string) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
        Event Details
      </h2>

      <div className="space-y-2">
        <Label htmlFor="portal-title">Event Title *</Label>
        <Input
          id="portal-title"
          placeholder="e.g. Our Wedding"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          data-testid="portal-title-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="portal-date">Event Date</Label>
        <Input
          id="portal-date"
          type="date"
          value={eventDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="portal-location">Location</Label>
        <Input
          id="portal-location"
          placeholder="e.g. Cairo, Egypt"
          value={locationName}
          onChange={(e) => onLocationChange(e.target.value)}
        />
      </div>

      {/* Sub-events */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Sub-Events</Label>
          <Button variant="ghost" size="sm" onClick={onAddSubEvent} data-testid="add-sub-event">
            <Plus className="w-3 h-3 me-1" />
            Add
          </Button>
        </div>
        {subEvents.map((sub, i) => (
          <div
            key={i}
            className="flex items-start gap-2 p-3 rounded-lg"
            style={{ backgroundColor: colors.bg.secondary }}
          >
            <div className="flex-1 space-y-2">
              <Input
                placeholder="e.g. Ceremony"
                value={sub.title}
                onChange={(e) => onUpdateSubEvent(i, "title", e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={sub.date}
                  onChange={(e) => onUpdateSubEvent(i, "date", e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  type="time"
                  value={sub.startTime}
                  onChange={(e) => onUpdateSubEvent(i, "startTime", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => onRemoveSubEvent(i)}
              className="p-1 rounded hover:opacity-70"
              data-testid={`remove-sub-event-${i}`}
            >
              <X className="w-4 h-4" style={{ color: colors.text.muted }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step 3: Theme ──

function StepTheme({
  selected,
  onChange,
}: {
  selected: string
  onChange: (preset: string) => void
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: colors.text.primary }}>
        Choose a Theme
      </h2>
      <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
        You can customize colors later
      </p>
      <div className="space-y-3">
        {Object.entries(THEME_PRESETS).map(([key, preset]) => {
          const meta = THEME_PRESET_META[key]
          const isSelected = selected === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-start",
                isSelected ? "border-current" : "border-transparent"
              )}
              style={{
                backgroundColor: isSelected
                  ? colors.accent.glow
                  : colors.bg.secondary,
                color: isSelected
                  ? colors.accent.primary
                  : colors.text.primary,
              }}
              data-testid={`theme-${key}`}
            >
              {/* Color preview dots */}
              <div className="flex gap-1">
                <div
                  className="w-5 h-5 rounded-full border"
                  style={{ backgroundColor: preset.colors.primary, borderColor: preset.colors.border }}
                />
                <div
                  className="w-5 h-5 rounded-full border"
                  style={{ backgroundColor: preset.colors.background, borderColor: preset.colors.border }}
                />
                <div
                  className="w-5 h-5 rounded-full border"
                  style={{ backgroundColor: preset.colors.text, borderColor: preset.colors.border }}
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{meta.label}</div>
                <div className="text-xs" style={{ color: colors.text.muted }}>
                  {meta.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 4: Template ──

function StepTemplate({
  eventType,
  selected,
  onChange,
}: {
  eventType: EventType
  selected: PortalTemplate | null
  onChange: (template: PortalTemplate | null) => void
}) {
  const templates = PORTAL_TEMPLATES.filter(
    (t) => t.event_type === eventType || t.id === "blank"
  )

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: colors.text.primary }}>
        Start with a Template
      </h2>
      <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
        Pre-built pages and sections you can customize
      </p>
      <div className="space-y-3">
        {templates.map((template) => {
          const isSelected = selected?.id === template.id
          return (
            <button
              key={template.id}
              onClick={() => onChange(template)}
              className={cn(
                "w-full text-start p-3 rounded-xl border-2 transition-all",
                isSelected ? "border-current" : "border-transparent"
              )}
              style={{
                backgroundColor: isSelected
                  ? colors.accent.glow
                  : colors.bg.secondary,
                color: isSelected
                  ? colors.accent.primary
                  : colors.text.primary,
              }}
              data-testid={`template-${template.id}`}
            >
              <div className="text-sm font-medium">{template.name}</div>
              <div className="text-xs mt-0.5" style={{ color: colors.text.muted }}>
                {template.description}
              </div>
              <div className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                {template.pages.length} page{template.pages.length !== 1 ? "s" : ""}
                {" · "}
                {template.pages.reduce((n, p) => n + p.sections.length, 0)} sections
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 5: Review ──

function StepReview({ state }: { state: WizardState }) {
  const meta = EVENT_TYPE_META[state.eventType]
  const themeMeta = THEME_PRESET_META[state.themePreset]

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
        Review Your Portal
      </h2>
      <div className="space-y-3">
        <ReviewRow label="Event Type" value={`${meta.icon} ${meta.label}`} />
        <ReviewRow label="Title" value={state.title} />
        {state.eventDate && <ReviewRow label="Date" value={state.eventDate} />}
        {state.locationName && <ReviewRow label="Location" value={state.locationName} />}
        <ReviewRow label="Theme" value={themeMeta?.label ?? state.themePreset} />
        {state.template && (
          <ReviewRow
            label="Template"
            value={`${state.template.name} (${state.template.pages.length} pages)`}
          />
        )}
        {state.subEvents.length > 0 && (
          <ReviewRow
            label="Sub-Events"
            value={state.subEvents.map((s) => s.title || "Untitled").join(", ")}
          />
        )}
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex justify-between items-start p-3 rounded-lg"
      style={{ backgroundColor: colors.bg.secondary }}
    >
      <span className="text-sm" style={{ color: colors.text.secondary }}>
        {label}
      </span>
      <span className="text-sm font-medium text-end" style={{ color: colors.text.primary }}>
        {value}
      </span>
    </div>
  )
}
