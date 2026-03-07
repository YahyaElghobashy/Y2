"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, UserCircle, ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

type ProfileStepProps = {
  onContinue: () => Promise<void>
  onBack: () => Promise<void>
}

export function ProfileStep({ onContinue, onBack }: ProfileStepProps) {
  const { user, refreshProfile } = useAuth()
  const supabase = getSupabaseBrowserClient()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isNameValid = name.trim().length >= 2
  const showAvatar = isNameValid

  // Auto-focus name input
  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  // Cleanup avatar preview URL
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError(null)
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setFileError("Image must be under 5MB")
      return
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }, [avatarPreview])

  const handleSubmit = async () => {
    if (!user || !isNameValid || isSubmitting) return

    setIsSubmitting(true)
    setSaveError(null)

    try {
      let avatar_url: string | undefined

      // Upload avatar if selected
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop()
        const path = `avatars/${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile)

        if (uploadError) {
          setSaveError("Failed to upload avatar")
          setIsSubmitting(false)
          return
        }

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)
        avatar_url = urlData.publicUrl
      }

      // Update profile
      const profileData: Record<string, string> = {
        display_name: name.trim(),
      }
      if (avatar_url) {
        profileData.avatar_url = avatar_url
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", user.id)

      if (updateError) {
        setSaveError("Failed to save profile")
        setIsSubmitting(false)
        return
      }

      await refreshProfile()
      await onContinue()
    } catch {
      setSaveError("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-6" data-testid="profile-step">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute start-5 top-6 z-10 flex items-center gap-1 text-[var(--color-text-secondary)]"
        data-testid="profile-back-btn"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Greeting */}
      <motion.p
        className="font-display text-[22px] font-bold text-[var(--color-text-primary)]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        data-testid="profile-greeting"
      >
        What should we call you?
      </motion.p>

      {/* Name input */}
      <motion.div
        className="w-full max-w-xs"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3, ease: EASE_OUT }}
      >
        <input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 50))}
          placeholder="Your name"
          className={cn(
            "h-12 w-full rounded-none border-0 border-b-2 bg-transparent px-2 text-center",
            "font-body text-[18px] text-[var(--color-text-primary)]",
            "placeholder:text-[var(--color-text-muted)]",
            "outline-none transition-colors duration-200",
            "border-[var(--color-border-subtle)]",
            "focus:border-[var(--color-accent-primary)] focus:shadow-[0_2px_8px_rgba(196,149,106,0.2)]"
          )}
          autoComplete="off"
          data-testid="profile-name-input"
        />
      </motion.div>

      {/* Avatar section — reveals when name >= 2 chars */}
      <AnimatePresence>
        {showAvatar && (
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            data-testid="profile-avatar-section"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/30"
              aria-label="Choose avatar"
              data-testid="profile-avatar-btn"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle size={36} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
              )}
              <span className="absolute bottom-0 end-0 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-primary)]">
                <Camera size={12} strokeWidth={2} className="text-white" />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              data-testid="profile-avatar-input"
            />
            <p className="font-body text-[12px] text-[var(--color-text-muted)]">
              Optional
            </p>
            {fileError && (
              <p className="text-[12px] text-[var(--error)]" data-testid="profile-file-error">
                {fileError}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save error */}
      {saveError && (
        <p className="text-[13px] text-[var(--error)]" data-testid="profile-save-error">
          {saveError}
        </p>
      )}

      {/* Continue button */}
      <motion.button
        className={cn(
          "mt-2 w-full max-w-xs rounded-xl px-8 py-3.5 font-body text-[15px] font-medium transition-all duration-200",
          isNameValid
            ? "bg-[var(--color-accent-primary)] text-white"
            : "bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] opacity-40"
        )}
        disabled={!isNameValid || isSubmitting}
        onClick={handleSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3, ease: EASE_OUT }}
        data-testid="profile-continue-btn"
      >
        {isSubmitting ? (
          <Loader2 size={18} className="mx-auto animate-spin" />
        ) : (
          "Continue \u2192"
        )}
      </motion.button>
    </div>
  )
}
