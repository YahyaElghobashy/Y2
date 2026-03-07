"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, Camera, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const SUGGESTED_CATEGORIES = [
  { name: "Faith", icon: "🤲" },
  { name: "Health", icon: "💪" },
  { name: "Relationship", icon: "💕" },
  { name: "Career", icon: "💼" },
  { name: "Creative", icon: "🎨" },
  { name: "Financial", icon: "💰" },
  { name: "Travel", icon: "✈️" },
  { name: "Learning", icon: "📚" },
]

type WizardData = {
  title: string
  theme?: string
  categories: { name: string; icon: string }[]
  heroFile?: File
}

type VisionBoardWizardProps = {
  onComplete: (data: WizardData) => Promise<void>
}

export function VisionBoardWizard({ onComplete }: VisionBoardWizardProps) {
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState("")
  const [theme, setTheme] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<{ name: string; icon: string }[]>([])
  const [customCategory, setCustomCategory] = useState("")
  const [heroPreview, setHeroPreview] = useState<string | null>(null)
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 4

  const toggleCategory = (cat: { name: string; icon: string }) => {
    setSelectedCategories((prev) => {
      const exists = prev.some((c) => c.name === cat.name)
      if (exists) return prev.filter((c) => c.name !== cat.name)
      return [...prev, cat]
    })
  }

  const addCustomCategory = () => {
    const trimmed = customCategory.trim()
    if (!trimmed) return
    if (selectedCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return
    setSelectedCategories((prev) => [...prev, { name: trimmed, icon: "✨" }])
    setCustomCategory("")
  }

  const handleHeroSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setHeroFile(file)
    const reader = new FileReader()
    reader.onload = () => setHeroPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleComplete = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    await onComplete({
      title,
      theme: theme || undefined,
      categories: selectedCategories,
      heroFile: heroFile ?? undefined,
    })
    setIsSubmitting(false)
  }

  const canProceed = () => {
    switch (step) {
      case 0: return title.trim().length > 0
      case 1: return selectedCategories.length > 0
      case 2: return true // hero is optional
      case 3: return true
      default: return false
    }
  }

  return (
    <div className="px-5 py-6" data-testid="vision-board-wizard">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              i <= step
                ? "bg-[var(--accent-primary,#C4956A)]"
                : "bg-[var(--color-border-subtle,#E8E2DA)]"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: Title + Theme */}
        {step === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <h2 className="text-[24px] font-bold font-display text-[var(--color-text-primary,#2C2825)] mb-2">
              What&apos;s your year about?
            </h2>
            <p className="text-[14px] text-[var(--color-text-secondary,#8C8279)] mb-6">
              Give your 2026 vision a title and theme.
            </p>

            <div className="mb-4">
              <label className="text-[12px] font-medium text-[var(--color-text-secondary,#8C8279)] mb-1 block">
                Board Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My 2026 Vision"
                maxLength={100}
                className={cn(
                  "w-full px-4 py-3 rounded-[10px] text-[14px]",
                  "bg-[var(--color-bg-secondary,#F5F0E8)]",
                  "text-[var(--color-text-primary,#2C2825)]",
                  "placeholder:text-[var(--color-text-muted,#B5ADA4)]",
                  "outline-none focus:ring-2 focus:ring-[var(--accent-primary,#C4956A)]/30"
                )}
                data-testid="wizard-title-input"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[var(--color-text-secondary,#8C8279)] mb-1 block">
                Theme (optional)
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Growth, Balance, Adventure"
                maxLength={60}
                className={cn(
                  "w-full px-4 py-3 rounded-[10px] text-[14px]",
                  "bg-[var(--color-bg-secondary,#F5F0E8)]",
                  "text-[var(--color-text-primary,#2C2825)]",
                  "placeholder:text-[var(--color-text-muted,#B5ADA4)]",
                  "outline-none focus:ring-2 focus:ring-[var(--accent-primary,#C4956A)]/30"
                )}
                data-testid="wizard-theme-input"
              />
            </div>
          </motion.div>
        )}

        {/* Step 1: Categories */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <h2 className="text-[24px] font-bold font-display text-[var(--color-text-primary,#2C2825)] mb-2">
              Pick your focus areas
            </h2>
            <p className="text-[14px] text-[var(--color-text-secondary,#8C8279)] mb-6">
              Select at least one category for your board.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {SUGGESTED_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.some((c) => c.name === cat.name)
                return (
                  <motion.button
                    key={cat.name}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[13px] font-medium border transition-colors",
                      isSelected
                        ? "bg-[var(--accent-primary,#C4956A)] text-white border-[var(--accent-primary,#C4956A)]"
                        : "bg-[var(--color-bg-elevated,#FFFFFF)] text-[var(--color-text-primary,#2C2825)] border-[var(--color-border-subtle,#E8E2DA)]"
                    )}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleCategory(cat)}
                    data-testid={`category-chip-${cat.name}`}
                  >
                    {cat.icon} {cat.name}
                  </motion.button>
                )
              })}
            </div>

            {/* Custom category */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Add custom category"
                maxLength={30}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-[10px] text-[13px]",
                  "bg-[var(--color-bg-secondary,#F5F0E8)]",
                  "text-[var(--color-text-primary,#2C2825)]",
                  "placeholder:text-[var(--color-text-muted,#B5ADA4)]",
                  "outline-none"
                )}
                onKeyDown={(e) => e.key === "Enter" && addCustomCategory()}
                data-testid="custom-category-input"
              />
              <button
                className="px-4 py-2.5 rounded-[10px] text-[13px] font-medium bg-[var(--accent-primary,#C4956A)] text-white"
                onClick={addCustomCategory}
                data-testid="add-custom-category-btn"
              >
                Add
              </button>
            </div>

            {selectedCategories.length > 0 && (
              <p className="text-[12px] text-[var(--color-text-muted,#B5ADA4)] mt-3">
                {selectedCategories.length} selected: {selectedCategories.map((c) => c.name).join(", ")}
              </p>
            )}
          </motion.div>
        )}

        {/* Step 2: Hero Banner */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <h2 className="text-[24px] font-bold font-display text-[var(--color-text-primary,#2C2825)] mb-2">
              Add a banner image?
            </h2>
            <p className="text-[14px] text-[var(--color-text-secondary,#8C8279)] mb-6">
              Optional — you can always add one later.
            </p>

            <label className="block cursor-pointer" data-testid="hero-upload">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHeroSelect}
              />
              {heroPreview ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                  <img src={heroPreview} alt="Hero preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={cn(
                  "flex flex-col items-center justify-center gap-3 py-16 rounded-2xl",
                  "border-2 border-dashed border-[var(--color-border-subtle,#E8E2DA)]",
                  "text-[var(--color-text-muted,#B5ADA4)]"
                )}>
                  <Camera size={32} />
                  <span className="text-[14px]">Tap to upload banner</span>
                </div>
              )}
            </label>
          </motion.div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <div className="flex flex-col items-center text-center">
              <Sparkles size={48} strokeWidth={1.25} className="text-[var(--accent-primary,#C4956A)] mb-4" />
              <h2 className="text-[24px] font-bold font-display text-[var(--color-text-primary,#2C2825)] mb-2">
                You&apos;re set!
              </h2>
              <p className="text-[14px] text-[var(--color-text-secondary,#8C8279)] mb-6">
                Your board &quot;{title}&quot; is ready with {selectedCategories.length} categories.
              </p>

              <div className="w-full rounded-2xl bg-[var(--color-bg-secondary,#F5F0E8)] p-4 mb-6">
                <p className="text-[16px] font-semibold text-[var(--color-text-primary,#2C2825)] mb-1">{title}</p>
                {theme && <p className="text-[13px] italic text-[var(--color-text-secondary,#8C8279)] mb-3">{theme}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {selectedCategories.map((cat) => (
                    <span
                      key={cat.name}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--accent-soft,#E8D5C0)] text-[var(--color-text-primary,#2C2825)]"
                    >
                      {cat.icon} {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8">
        {step > 0 ? (
          <motion.button
            className="flex items-center gap-1 text-[14px] text-[var(--color-text-secondary,#8C8279)]"
            whileTap={{ scale: 0.97 }}
            onClick={() => setStep((s) => s - 1)}
            data-testid="wizard-back"
          >
            <ChevronLeft size={18} /> Back
          </motion.button>
        ) : (
          <div />
        )}

        {step < totalSteps - 1 ? (
          <motion.button
            className={cn(
              "flex items-center gap-1 px-5 py-2.5 rounded-xl text-[14px] font-medium",
              canProceed()
                ? "bg-[var(--accent-primary,#C4956A)] text-white"
                : "bg-[var(--color-bg-secondary,#F5F0E8)] text-[var(--color-text-muted,#B5ADA4)]"
            )}
            whileTap={canProceed() ? { scale: 0.98 } : undefined}
            onClick={() => canProceed() && setStep((s) => s + 1)}
            disabled={!canProceed()}
            data-testid="wizard-next"
          >
            Next <ChevronRight size={18} />
          </motion.button>
        ) : (
          <motion.button
            className="px-6 py-2.5 rounded-xl text-[14px] font-semibold bg-[var(--accent-primary,#C4956A)] text-white"
            whileTap={{ scale: 0.98 }}
            onClick={handleComplete}
            disabled={isSubmitting}
            data-testid="wizard-complete"
          >
            {isSubmitting ? "Creating..." : "Start Adding Items"}
          </motion.button>
        )}
      </div>
    </div>
  )
}
