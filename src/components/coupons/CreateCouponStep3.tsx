"use client"

import { useRef, useState } from "react"
import { Camera, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type Step3Data = {
  imageFile?: File
  imagePreview?: string
}

type CreateCouponStep3Props = {
  data?: Partial<Step3Data>
  onNext: (data: Step3Data) => void
  onBack: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function CreateCouponStep3({ data, onNext, onBack }: CreateCouponStep3Props) {
  const [imageFile, setImageFile] = useState<File | undefined>(data?.imageFile)
  const [imagePreview, setImagePreview] = useState<string | undefined>(data?.imagePreview)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be under 5MB")
      return
    }

    setError(null)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemove = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(undefined)
    setImagePreview(undefined)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleNext = () => {
    onNext({ imageFile, imagePreview })
  }

  const handleSkip = () => {
    onNext({})
  }

  return (
    <div className="flex flex-col gap-6" data-testid="step3-form">
      <h2 className="text-[20px] font-bold font-display text-[var(--text-primary)]">
        Add a photo?
      </h2>

      {/* Upload area */}
      {imagePreview ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl" data-testid="image-preview">
          <img src={imagePreview} alt="Coupon photo" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white"
            data-testid="remove-image"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors",
            error
              ? "border-[var(--error)]"
              : "border-[var(--border-subtle)] hover:border-[var(--accent-primary)]"
          )}
          data-testid="upload-area"
        >
          <Camera size={32} className="text-[var(--text-muted)]" />
          <span className="text-[14px] font-body text-[var(--text-secondary)]">
            Tap to add a photo
          </span>
        </button>
      )}

      {error && (
        <p className="text-[var(--error)] text-[12px] font-body" data-testid="file-error">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        data-testid="file-input"
      />

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={imageFile ? handleNext : handleSkip}
          className="h-12 w-full rounded-xl bg-[var(--accent-primary)] text-[15px] font-medium font-body text-white"
          data-testid="next-button"
        >
          {imageFile ? "Next" : "Skip"}
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
