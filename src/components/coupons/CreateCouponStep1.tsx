"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import type { CouponCategory } from "@/lib/types/relationship.types"

const EMOJI_OPTIONS = ["❤️", "⭐", "🍪", "🎬", "💆", "🚗", "☕", "🎁"]

const PLACEHOLDER_SUGGESTIONS = [
  "A massage",
  "Movie night pick",
  "Breakfast in bed",
  "One wish granted",
  "A day off chores",
]

const CATEGORIES: { id: CouponCategory; label: string }[] = [
  { id: "romantic", label: "Romantic" },
  { id: "practical", label: "Practical" },
  { id: "fun", label: "Fun" },
  { id: "food", label: "Food" },
  { id: "general", label: "General" },
]

const step1Schema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
  description: z.string().max(500, "Max 500 characters").optional(),
})

type Step1FormData = z.infer<typeof step1Schema>

export type Step1Data = Step1FormData & {
  emoji: string
  category: CouponCategory
}

type CreateCouponStep1Props = {
  data?: Partial<Step1Data>
  onNext: (data: Step1Data) => void
}

export function CreateCouponStep1({ data, onNext }: CreateCouponStep1Props) {
  const [selectedEmoji, setSelectedEmoji] = useState(data?.emoji ?? "")
  const [selectedCategory, setSelectedCategory] = useState<CouponCategory>(data?.category ?? "general")
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    mode: "onChange",
    defaultValues: {
      title: data?.title ?? "",
      description: data?.description ?? "",
    },
  })

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_SUGGESTIONS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const onSubmit = (formData: Step1FormData) => {
    onNext({
      ...formData,
      emoji: selectedEmoji,
      category: selectedCategory,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" data-testid="step1-form">
      <h2 className="text-[20px] font-bold font-[family-name:var(--font-display)] text-[var(--text-primary)]">
        What&apos;s the gift?
      </h2>

      {/* Emoji picker */}
      <div>
        <p className="mb-2 text-[13px] font-[family-name:var(--font-body)] text-[var(--text-secondary)]">
          Pick an emoji
        </p>
        <div className="flex flex-wrap gap-2" data-testid="emoji-picker">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setSelectedEmoji(emoji === selectedEmoji ? "" : emoji)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full text-[24px] transition-all",
                selectedEmoji === emoji
                  ? "ring-2 ring-[var(--accent-primary)] bg-[var(--accent-glow)]"
                  : "bg-[var(--bg-secondary)]"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <input
          type="text"
          placeholder={PLACEHOLDER_SUGGESTIONS[placeholderIndex]}
          className={cn(
            "w-full rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[15px] font-[family-name:var(--font-body)] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-primary)] placeholder:text-[var(--text-muted)]",
            errors.title && "border-[var(--error)]"
          )}
          {...register("title")}
          data-testid="title-input"
        />
        {errors.title && (
          <p className="text-[var(--error)] text-[12px] font-[family-name:var(--font-body)]">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <textarea
          rows={3}
          placeholder="Add details or conditions (optional)"
          className="w-full resize-none rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[15px] font-[family-name:var(--font-body)] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-primary)] placeholder:text-[var(--text-muted)]"
          {...register("description")}
          data-testid="description-input"
        />
        {errors.description && (
          <p className="text-[var(--error)] text-[12px] font-[family-name:var(--font-body)]">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Category pills */}
      <div>
        <p className="mb-2 text-[13px] font-[family-name:var(--font-body)] text-[var(--text-secondary)]">
          Category
        </p>
        <div className="flex flex-wrap gap-2" data-testid="category-picker">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "rounded-full px-4 py-2 text-[13px] font-medium font-[family-name:var(--font-body)] transition-colors",
                selectedCategory === cat.id
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Next button */}
      <button
        type="submit"
        disabled={!isValid}
        className="h-12 w-full rounded-xl bg-[var(--accent-primary)] text-[15px] font-medium font-[family-name:var(--font-body)] text-white transition-colors disabled:opacity-50"
        data-testid="next-button"
      >
        Next
      </button>
    </form>
  )
}
