"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Users, Plus, X, ImagePlus, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { PHOTO_TYPES, PHOTO_TYPE_LABELS, type PhotoType } from "@/lib/types/food-journal.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export type CapturedPhoto = {
  file: File
  preview: string
  photoType: PhotoType
}

type FoodPhotoCaptureProps = {
  photos: CapturedPhoto[]
  onPhotosChange: (photos: CapturedPhoto[]) => void
  onNext: () => void
  onBack: () => void
}

const REQUIRED_SLOTS: { type: PhotoType; label: string; icon: typeof Camera }[] = [
  { type: "food_plate", label: "Food Plate", icon: Camera },
  { type: "partner_eating", label: "Partner Eating", icon: Users },
]

const EXTRA_TYPES = PHOTO_TYPES.filter(
  (t) => t !== "food_plate" && t !== "partner_eating"
) as PhotoType[]

export function FoodPhotoCapture({
  photos,
  onPhotosChange,
  onNext,
  onBack,
}: FoodPhotoCaptureProps) {
  const [extraType, setExtraType] = useState<PhotoType>("ambiance")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSlotRef = useRef<PhotoType | null>(null)

  const getPhotoForType = useCallback(
    (type: PhotoType) => photos.find((p) => p.photoType === type),
    [photos]
  )

  const hasRequiredPhotos =
    !!getPhotoForType("food_plate") && !!getPhotoForType("partner_eating")

  const handleSlotClick = (photoType: PhotoType) => {
    activeSlotRef.current = photoType
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeSlotRef.current) return

    const preview = URL.createObjectURL(file)
    const photoType = activeSlotRef.current

    // Replace if same type already exists
    const filtered = photos.filter((p) => p.photoType !== photoType)
    onPhotosChange([...filtered, { file, preview, photoType }])

    // Reset input so same file can be re-selected
    e.target.value = ""
    activeSlotRef.current = null
  }

  const handleRemove = (photoType: PhotoType) => {
    const photo = getPhotoForType(photoType)
    if (photo) URL.revokeObjectURL(photo.preview)
    onPhotosChange(photos.filter((p) => p.photoType !== photoType))
  }

  const handleAddExtra = () => {
    activeSlotRef.current = extraType
    fileInputRef.current?.click()
  }

  return (
    <div data-testid="food-photo-capture" className="flex flex-col gap-5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        data-testid="photo-file-input"
      />

      {/* Required slots */}
      <div>
        <p className="mb-2 text-[13px] font-medium text-[var(--text-secondary)]">
          Required photos
        </p>
        <div className="grid grid-cols-2 gap-3">
          {REQUIRED_SLOTS.map((slot) => {
            const existing = getPhotoForType(slot.type)
            const Icon = slot.icon

            return (
              <div
                key={slot.type}
                data-testid={`slot-${slot.type}`}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl"
              >
                {existing ? (
                  <>
                    <img
                      src={existing.preview}
                      alt={slot.label}
                      className="h-full w-full object-cover"
                      data-testid={`preview-${slot.type}`}
                    />
                    <button
                      data-testid={`remove-${slot.type}`}
                      onClick={() => handleRemove(slot.type)}
                      className="absolute top-2 end-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                      aria-label={`Remove ${slot.label}`}
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/40 px-2 py-1">
                      <p className="text-[10px] text-white text-center">
                        {slot.label}
                      </p>
                    </div>
                  </>
                ) : (
                  <button
                    data-testid={`add-${slot.type}`}
                    onClick={() => handleSlotClick(slot.type)}
                    className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                  >
                    <Icon size={24} strokeWidth={1.5} />
                    <span className="text-[11px] font-medium">{slot.label}</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Extra photos */}
      <div>
        <p className="mb-2 text-[13px] font-medium text-[var(--text-secondary)]">
          Add more (optional)
        </p>

        {/* Existing extras */}
        <div className="flex flex-wrap gap-2 mb-3">
          {photos
            .filter(
              (p) =>
                p.photoType !== "food_plate" &&
                p.photoType !== "partner_eating"
            )
            .map((photo) => (
              <div
                key={photo.photoType}
                data-testid={`extra-${photo.photoType}`}
                className="relative h-16 w-16 overflow-hidden rounded-xl"
              >
                <img
                  src={photo.preview}
                  alt={PHOTO_TYPE_LABELS[photo.photoType]}
                  className="h-full w-full object-cover"
                />
                <button
                  data-testid={`remove-extra-${photo.photoType}`}
                  onClick={() => handleRemove(photo.photoType)}
                  className="absolute top-1 end-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/50 text-white"
                  aria-label={`Remove ${PHOTO_TYPE_LABELS[photo.photoType]}`}
                >
                  <X size={8} />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/40 px-1 py-0.5">
                  <p className="text-[8px] text-white text-center truncate">
                    {PHOTO_TYPE_LABELS[photo.photoType]}
                  </p>
                </div>
              </div>
            ))}
        </div>

        {/* Add extra row */}
        <div data-testid="extra-add-section" className="flex gap-2">
          <select
            data-testid="extra-type-select"
            value={extraType}
            onChange={(e) => setExtraType(e.target.value as PhotoType)}
            className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-[13px] outline-none"
          >
            {EXTRA_TYPES.map((t) => (
              <option key={t} value={t}>
                {PHOTO_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            data-testid="add-extra-btn"
            onClick={handleAddExtra}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--bg-secondary)] px-3 py-2 text-[13px] font-medium text-[var(--text-secondary)]"
          >
            <ImagePlus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-2">
        <button
          data-testid="back-btn"
          onClick={onBack}
          className="flex items-center justify-center gap-1 rounded-xl border border-[var(--border-subtle)] px-4 py-3 text-[13px] font-medium text-[var(--text-secondary)]"
        >
          <ChevronLeft size={14} />
          Back
        </button>
        <motion.button
          data-testid="next-btn"
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          onClick={onNext}
          disabled={!hasRequiredPhotos}
          className="flex-1 rounded-xl bg-[var(--accent-primary,#C4956A)] py-3 text-[14px] font-medium text-white disabled:opacity-50"
        >
          Next — Rate
        </motion.button>
      </div>
    </div>
  )
}
