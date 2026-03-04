"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/shared/Avatar"
import { uploadAvatar } from "@/lib/avatar-upload"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const MAX_FILE_SIZE = 5 * 1024 * 1024

const profileSchema = z.object({
  display_name: z.string().min(1, "Name is required").max(40, "Name must be 40 characters or fewer"),
})

type ProfileFormData = z.infer<typeof profileSchema>

type ProfileEditFormProps = {
  profile: {
    id: string
    display_name: string
    email: string
    avatar_url: string | null
  }
  onSave: () => void
  onCancel: () => void
}

export function ProfileEditForm({ profile, onSave, onCancel }: ProfileEditFormProps) {
  const supabase = getSupabaseBrowserClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: profile.display_name },
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
        const result = await uploadAvatar(avatarFile, profile.id)
        if ("error" in result) {
          setError("root", { message: result.error })
          return
        }
        avatar_url = result.url
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: data.display_name,
          ...(avatar_url ? { avatar_url } : {}),
        })
        .eq("id", profile.id)

      if (updateError) {
        console.error("Profile update failed:", updateError)
        setError("root", { message: "Failed to save profile" })
        return
      }

      onSave()
    } catch {
      setError("root", { message: "Something went wrong" })
    }
  }

  const currentAvatar = avatarPreview ?? profile.avatar_url

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="overflow-hidden"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 flex flex-col gap-4">
        {/* Avatar */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative focus:outline-none focus:ring-2 focus:ring-accent-primary/30 rounded-full"
            aria-label="Change avatar"
          >
            <Avatar
              src={currentAvatar}
              name={profile.display_name}
              size="xl"
            />
            <span className="absolute bottom-0 end-0 w-6 h-6 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center">
              <Camera size={12} strokeWidth={2} className="text-white" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            data-testid="edit-avatar-input"
          />
        </div>
        {fileError && (
          <p className="text-[var(--error)] text-[12px] text-center font-body">{fileError}</p>
        )}

        {/* Name input */}
        <div>
          <Input
            placeholder="Display name"
            className={cn(
              "h-11 rounded-[10px] bg-bg-elevated border-border-subtle px-4 text-[15px] font-body placeholder:text-text-muted",
              errors.display_name && "border-[var(--error)]"
            )}
            {...register("display_name")}
          />
          {errors.display_name && (
            <p className="text-[var(--error)] text-[12px] mt-1.5 ps-1 font-body">
              {errors.display_name.message}
            </p>
          )}
        </div>

        {errors.root && (
          <p className="text-[var(--error)] text-[13px] text-center font-body">
            {errors.root.message}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl font-body text-[14px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-10 rounded-xl bg-accent-primary text-white font-body text-[14px] hover:bg-[var(--accent-hover)]"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
