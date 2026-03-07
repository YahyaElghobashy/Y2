"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

type LetterCardProps = {
  content: string
  date: string
  authorName: string
  photoUrl?: string | null
  className?: string
}

export function LetterCard({
  content,
  date,
  authorName,
  photoUrl,
  className,
}: LetterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formattedDate = (() => {
    try {
      return format(new Date(date), "MMMM yyyy")
    } catch {
      return date
    }
  })()

  const firstLine = content.split("\n")[0] ?? ""
  const preview = firstLine.length > 60 ? firstLine.slice(0, 60) + "..." : firstLine

  return (
    <>
      <motion.button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "w-full text-start rounded-2xl px-5 py-4",
          "bg-[#FBF8F4] border-2 border-[var(--accent-primary,#C4956A)]/20",
          "shadow-soft",
          className
        )}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
        data-testid="letter-card"
        aria-label={`Letter from ${authorName}, ${formattedDate}`}
      >
        <div className="flex items-start gap-3">
          <span className="text-[28px] leading-none mt-0.5">💌</span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[13px] italic text-[var(--color-text-muted,#B5AFA7)] font-display"
              data-testid="letter-date"
            >
              {formattedDate}
            </p>
            <p
              className="text-[14px] text-[var(--color-text-primary,#2C2825)] font-display mt-1 truncate"
              data-testid="letter-preview"
            >
              {preview}
            </p>
            <p className="text-[12px] text-[var(--color-text-muted,#B5AFA7)] mt-1" data-testid="letter-author">
              — {authorName}
            </p>
          </div>
        </div>
      </motion.button>

      {/* Expanded overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-label="Letter detail"
            aria-modal="true"
            data-testid="letter-expanded"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/30"
              onClick={() => setIsExpanded(false)}
              data-testid="letter-backdrop"
            />

            {/* Letter content */}
            <motion.div
              className="relative z-10 w-full max-w-[340px] max-h-[80vh] overflow-y-auto rounded-2xl bg-[#FBF8F4] px-6 py-6 border-2 border-[var(--accent-primary,#C4956A)]/20"
              initial={{ y: -100, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ boxShadow: "0 8px 40px rgba(44, 40, 37, 0.15)" }}
            >
              <p
                className="text-[13px] italic text-[var(--color-text-muted,#B5AFA7)] font-display mb-4"
                data-testid="expanded-date"
              >
                {formattedDate}
              </p>

              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="Letter photo"
                  className="w-full max-h-[200px] object-cover rounded-xl mb-4"
                  data-testid="expanded-photo"
                />
              )}

              <div
                className="text-[15px] leading-relaxed text-[var(--color-text-primary,#2C2825)] font-display whitespace-pre-wrap"
                data-testid="expanded-content"
              >
                {content}
              </div>

              <p className="text-[13px] italic text-[var(--color-text-muted,#B5AFA7)] font-display mt-4 text-end">
                — {authorName}
              </p>

              <button
                onClick={() => setIsExpanded(false)}
                className="mt-4 w-full rounded-lg border border-[var(--color-border-subtle,rgba(44,40,37,0.08))] py-2.5 text-[14px] text-[var(--color-text-secondary,#8C8279)]"
                data-testid="close-expanded"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
