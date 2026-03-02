"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { motion, AnimatePresence } from "framer-motion"
import { UserCircle, Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const profileSchema = z.object({
  display_name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or fewer"),
})

type ProfileFormData = z.infer<typeof profileSchema>

type ProfileSetupOverlayProps = {
  userId: string
  initialName?: string
  onComplete: () => void
}

export function ProfileSetupOverlay({ userId, initialName, onComplete }: ProfileSetupOverlayProps) {
  const supabase = getSupabaseBrowserClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: initialName && initialName !== "User" ? initialName : "" },
  })

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      let avatar_url: string | undefined

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop()
        const path = `avatars/${userId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile)

        if (uploadError) {
          setError("root", { message: "Failed to upload avatar" })
          return
        }

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path)
        avatar_url = urlData.publicUrl
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: data.display_name,
          ...(avatar_url ? { avatar_url } : {}),
        })
        .eq("id", userId)

      if (updateError) {
        setError("root", { message: "Failed to save profile" })
        return
      }

      setIsVisible(false)
      // Wait for exit animation
      setTimeout(onComplete, 300)
    } catch {
      setError("root", { message: "Something went wrong" })
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/95 px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h2 className="font-display text-[24px] font-bold text-text-primary text-center mb-2">
              Set up your profile
            </h2>
            <p className="text-text-secondary text-[14px] text-center mb-8 font-body">
              Let your partner know it&#39;s you
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center gap-6">
              {/* Avatar picker */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center overflow-hidden border-2 border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                aria-label="Choose avatar"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle size={40} strokeWidth={1.5} className="text-text-muted" />
                )}
                <span className="absolute bottom-0 end-0 w-6 h-6 rounded-full bg-accent-primary flex items-center justify-center">
                  <Camera size={12} strokeWidth={2} className="text-white" />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                data-testid="avatar-input"
              />
              {fileError && (
                <p className="text-[var(--error)] text-[12px] -mt-4 font-body">{fileError}</p>
              )}

              {/* Name input */}
              <div className="w-full">
                <Input
                  placeholder="Your name"
                  className={cn(
                    "h-12 rounded-[10px] bg-bg-elevated border-border-subtle px-4 text-[15px] font-body text-center placeholder:text-text-muted",
                    errors.display_name && "border-[var(--error)]"
                  )}
                  {...register("display_name")}
                />
                {errors.display_name && (
                  <p className="text-[var(--error)] text-[12px] mt-1.5 text-center font-body">
                    {errors.display_name.message}
                  </p>
                )}
              </div>

              {errors.root && (
                <p className="text-[var(--error)] text-[13px] text-center font-body">
                  {errors.root.message}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-accent-primary text-white font-body font-medium text-[15px] hover:bg-[var(--accent-hover)] transition-colors"
              >
                {isSubmitting ? "Saving..." : "Continue"}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
