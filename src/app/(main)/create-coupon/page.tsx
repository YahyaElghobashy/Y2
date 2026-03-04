"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { CreateCouponStep1 } from "@/components/coupons/CreateCouponStep1"
import { CreateCouponStep2 } from "@/components/coupons/CreateCouponStep2"
import { CreateCouponStep3 } from "@/components/coupons/CreateCouponStep3"
import { CreateCouponStep4 } from "@/components/coupons/CreateCouponStep4"
import { useCoupons } from "@/lib/hooks/use-coupons"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { CouponFormData } from "@/components/coupons/CreateCouponStep4"
import type { Step1Data } from "@/components/coupons/CreateCouponStep1"
import type { Step2Data } from "@/components/coupons/CreateCouponStep2"
import type { Step3Data } from "@/components/coupons/CreateCouponStep3"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

async function resizeImage(file: File, maxWidth = 800): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(bitmap, 0, 0, width, height)
    return canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 })
  }

  // Fallback for older browsers
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(bitmap, 0, 0, width, height)
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8)
  )
}

export default function CreateCouponPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { createCoupon } = useCoupons()
  const supabase = getSupabaseBrowserClient()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<CouponFormData>>({
    category: "general",
    emoji: "",
    isSurprise: false,
    hasExpiry: false,
  })

  const handleStep1Next = useCallback((data: Step1Data) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(2)
  }, [])

  const handleStep2Next = useCallback((data: Step2Data) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(3)
  }, [])

  const handleStep3Next = useCallback((data: Step3Data) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep(4)
  }, [])

  const handleSend = useCallback(async () => {
    if (!user) return

    try {
      let imageUrl: string | undefined

      // Upload image if exists
      if (formData.imageFile) {
        const resized = await resizeImage(formData.imageFile)
        const path = `${user.id}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from("coupon-images")
          .upload(path, resized, { contentType: "image/jpeg" })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from("coupon-images")
          .getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }

      await createCoupon({
        title: formData.title!,
        description: formData.description || undefined,
        emoji: formData.emoji || undefined,
        category: formData.category,
        image_url: imageUrl,
        is_surprise: formData.isSurprise,
        expires_at: formData.hasExpiry && formData.expiryDate
          ? new Date(formData.expiryDate + "T23:59:59Z").toISOString()
          : undefined,
      })

      toast.success("Coupon sent!")

      // Navigate after animation finishes
      setTimeout(() => {
        router.push("/us/coupons")
      }, 800)
    } catch {
      toast.error("Failed to create coupon")
      throw new Error("Send failed")
    }
  }, [user, formData, supabase, createCoupon, router])

  return (
    <PageTransition>
      <PageHeader title="New Coupon" backHref="/us/coupons" />

      {/* Step indicator */}
      <div className="flex justify-center gap-2 px-5 pb-4" data-testid="step-indicator">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              s === step
                ? "bg-[var(--accent-primary)]"
                : s < step
                  ? "bg-[var(--accent-soft)]"
                  : "bg-[var(--bg-secondary)]"
            )}
            data-testid={`step-dot-${s}`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="px-5 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            {step === 1 && (
              <CreateCouponStep1
                data={formData}
                onNext={handleStep1Next}
              />
            )}
            {step === 2 && (
              <CreateCouponStep2
                data={formData}
                onNext={handleStep2Next}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <CreateCouponStep3
                data={formData}
                onNext={handleStep3Next}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <CreateCouponStep4
                data={formData as CouponFormData}
                onSend={handleSend}
                onBack={() => setStep(3)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
