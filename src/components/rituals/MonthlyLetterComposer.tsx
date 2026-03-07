"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type MonthlyLetterComposerProps = {
  open: boolean
  partnerName: string
  onClose: () => void
  onSend: (content: string, photoUrl?: string) => Promise<void>
  onUploadPhoto?: (file: File) => Promise<string | null>
  className?: string
}

export function MonthlyLetterComposer({
  open,
  partnerName,
  onClose,
  onSend,
  onUploadPhoto,
  className,
}: MonthlyLetterComposerProps) {
  const [content, setContent] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Focus textarea when opened
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }, [open])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setContent("")
      setPhotoUrl(null)
      setIsSending(false)
      setIsUploading(false)
    }
  }, [open])

  const handleSend = async () => {
    if (!content.trim() || isSending) return
    setIsSending(true)
    try {
      await onSend(content.trim(), photoUrl ?? undefined)
      onClose()
    } catch {
      setIsSending(false)
    }
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUploadPhoto) return

    setIsUploading(true)
    const url = await onUploadPhoto(file)
    if (url) setPhotoUrl(url)
    setIsUploading(false)
  }

  const canSend = content.trim().length > 0 && !isSending

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            "fixed inset-0 z-50 flex flex-col",
            "bg-[#FBF8F4]",
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-label="Write monthly letter"
          aria-modal="true"
          data-testid="letter-composer"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4">
            <button
              onClick={onClose}
              className="text-[var(--color-text-secondary,#8C8279)]"
              aria-label="Close"
              data-testid="close-button"
            >
              <X size={24} />
            </button>

            <h2
              className="text-[16px] font-semibold font-display text-[var(--color-text-primary,#2C2825)]"
              data-testid="composer-title"
            >
              Monthly Letter
            </h2>

            <button
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold transition-opacity",
                canSend
                  ? "bg-[var(--accent-primary,#C4956A)] text-white"
                  : "bg-[var(--color-bg-secondary,#F5F0E8)] text-[var(--color-text-muted,#B5AFA7)]"
              )}
              aria-label="Send letter"
              data-testid="send-button"
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>

          {/* Letter body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <p
              className="mb-3 text-[16px] italic text-[var(--color-text-muted,#B5AFA7)] font-display"
              data-testid="letter-greeting"
            >
              Dear {partnerName},
            </p>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write from the heart..."
              className={cn(
                "w-full min-h-[300px] resize-none border-none bg-transparent outline-none",
                "text-[16px] leading-relaxed text-[var(--color-text-primary,#2C2825)]",
                "font-display",
                "placeholder:text-[var(--color-text-muted,#B5AFA7)] placeholder:italic"
              )}
              data-testid="letter-textarea"
            />

            {/* Photo preview */}
            {photoUrl && (
              <div className="mt-4 relative" data-testid="photo-preview">
                <img
                  src={photoUrl}
                  alt="Attached photo"
                  className="w-full max-h-[200px] object-cover rounded-xl"
                />
                <button
                  onClick={() => setPhotoUrl(null)}
                  className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white"
                  aria-label="Remove photo"
                  data-testid="remove-photo"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center gap-3 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
              data-testid="photo-input"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 text-[14px] text-[var(--color-text-secondary,#8C8279)]"
              data-testid="add-photo-button"
            >
              <ImageIcon size={20} />
              <span>{isUploading ? "Uploading..." : "Add photo"}</span>
            </button>

            <div className="flex-1" />

            <span
              className="text-[12px] text-[var(--color-text-muted,#B5AFA7)] font-mono"
              data-testid="char-count"
            >
              {content.length}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
