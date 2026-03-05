"use client"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin,
  Car,
  HeartHandshake,
  ChefHat,
  Scale,
  Banknote,
  UtensilsCrossed,
  Bath,
  Sparkles,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { GradientSlider } from "./GradientSlider"
import { VibeCard } from "./VibeCard"
import { RATING_DIMENSIONS, type RatingDimensionKey } from "@/lib/types/food-journal.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const DIMENSION_ICONS: Record<string, typeof MapPin> = {
  MapPin,
  Car,
  HandHeart: HeartHandshake,
  ChefHat,
  Scale,
  Banknote,
  UtensilsCrossed,
  Bath,
  Sparkles,
}

type RatingValues = Record<RatingDimensionKey, number>

type RatingCarouselProps = {
  onSubmit: (ratings: RatingValues) => void
  onBack: () => void
}

const initialRatings: RatingValues = {
  location_score: 5,
  parking_score: 5,
  service_score: 5,
  food_quality: 5,
  quantity_score: 5,
  price_score: 5,
  cuisine_score: 5,
  bathroom_score: 5,
  vibe_score: 5,
}

export function RatingCarousel({ onSubmit, onBack }: RatingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ratings, setRatings] = useState<RatingValues>({ ...initialRatings })
  const [showSummary, setShowSummary] = useState(false)
  const [direction, setDirection] = useState(0)

  const currentDim = RATING_DIMENSIONS[currentIndex]
  const isLastCard = currentIndex === RATING_DIMENSIONS.length - 1
  const isVibeCard = currentDim.key === "vibe_score"

  const overallAverage = useMemo(() => {
    const values = Object.values(ratings)
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
  }, [ratings])

  const handleRatingChange = useCallback(
    (value: number) => {
      setRatings((prev) => ({ ...prev, [currentDim.key]: value }))
    },
    [currentDim.key]
  )

  const goNext = () => {
    if (isLastCard) {
      setShowSummary(true)
      return
    }
    setDirection(1)
    setCurrentIndex((i) => Math.min(i + 1, RATING_DIMENSIONS.length - 1))
  }

  const goPrev = () => {
    if (currentIndex === 0) {
      onBack()
      return
    }
    setDirection(-1)
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }

  const handleSubmit = () => {
    onSubmit(ratings)
  }

  // Summary grid view
  if (showSummary) {
    return (
      <motion.div
        data-testid="rating-summary"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="flex flex-col gap-6"
      >
        <h3 className="text-center text-[18px] font-bold font-[family-name:var(--font-display)] text-[var(--text-primary)]">
          Your Ratings
        </h3>

        {/* 3x3 grid */}
        <div data-testid="score-grid" className="grid grid-cols-3 gap-3">
          {RATING_DIMENSIONS.map((dim) => {
            const Icon = DIMENSION_ICONS[dim.icon] || Sparkles
            return (
              <div
                key={dim.key}
                data-testid={`grid-${dim.key}`}
                className="flex flex-col items-center gap-1 rounded-xl bg-[var(--bg-secondary)] p-3"
              >
                <Icon size={16} className="text-[var(--accent-primary,#C4956A)]" />
                <span className="text-[11px] text-[var(--text-muted)]">{dim.label}</span>
                <span className="text-[18px] font-bold font-[family-name:var(--font-display)] text-[var(--text-primary)]">
                  {ratings[dim.key]}
                </span>
              </div>
            )
          })}
        </div>

        {/* Overall */}
        <div data-testid="overall-score" className="flex flex-col items-center gap-1">
          <span className="text-[13px] text-[var(--text-secondary)]">Overall</span>
          <span className="text-[32px] font-bold font-[family-name:var(--font-display)] text-[var(--accent-primary,#C4956A)]">
            {overallAverage}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            data-testid="edit-ratings-btn"
            onClick={() => {
              setShowSummary(false)
              setCurrentIndex(0)
            }}
            className="flex-1 rounded-xl border border-[var(--border-subtle)] py-3 text-[13px] font-medium text-[var(--text-secondary)]"
          >
            Edit
          </button>
          <motion.button
            data-testid="submit-ratings-btn"
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-[var(--accent-primary,#C4956A)] py-3 text-[14px] font-medium text-white"
          >
            Submit
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <div data-testid="rating-carousel" className="flex flex-col gap-4">
      {/* Card */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          data-testid={`card-${currentDim.key}`}
          custom={direction}
          initial={{ opacity: 0, x: direction > 0 ? 80 : -80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -80 : 80 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
        >
          {isVibeCard ? (
            <VibeCard
              value={ratings.vibe_score}
              onChange={(v) => setRatings((prev) => ({ ...prev, vibe_score: v }))}
            />
          ) : (
            <div className="flex flex-col items-center gap-5 rounded-2xl bg-[var(--bg-secondary)] p-6">
              {(() => {
                const Icon = DIMENSION_ICONS[currentDim.icon] || Sparkles
                return (
                  <Icon
                    size={32}
                    strokeWidth={1.5}
                    className="text-[var(--accent-primary,#C4956A)]"
                  />
                )
              })()}

              <h3 className="text-[18px] font-bold font-[family-name:var(--font-display)] text-[var(--text-primary)]">
                {currentDim.label}
              </h3>

              <div className="w-full">
                <GradientSlider
                  value={ratings[currentDim.key]}
                  onChange={handleRatingChange}
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      <div data-testid="dot-indicators" className="flex items-center justify-center gap-1.5">
        {RATING_DIMENSIONS.map((dim, i) => (
          <button
            key={dim.key}
            data-testid={`dot-${i}`}
            onClick={() => {
              setDirection(i > currentIndex ? 1 : -1)
              setCurrentIndex(i)
            }}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === currentIndex
                ? "w-4 bg-[var(--accent-primary,#C4956A)]"
                : "w-1.5 bg-[var(--border-subtle)]"
            )}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <button
          data-testid="prev-btn"
          onClick={goPrev}
          className="flex items-center justify-center gap-1 rounded-xl border border-[var(--border-subtle)] px-4 py-3 text-[13px] font-medium text-[var(--text-secondary)]"
        >
          <ChevronLeft size={14} />
          {currentIndex === 0 ? "Back" : "Prev"}
        </button>
        <motion.button
          data-testid="next-btn"
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          onClick={goNext}
          className="flex-1 rounded-xl bg-[var(--accent-primary,#C4956A)] py-3 text-[14px] font-medium text-white"
        >
          {isLastCard ? "Review" : "Next"}
        </motion.button>
      </div>
    </div>
  )
}
