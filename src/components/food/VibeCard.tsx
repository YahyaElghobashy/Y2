"use client"

import { motion } from "framer-motion"
import { Lock, Heart, Sparkles } from "lucide-react"
import { GradientSlider } from "./GradientSlider"
import { cn } from "@/lib/utils"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type VibeCardProps = {
  value: number
  onChange: (value: number) => void
  isSubmitted?: boolean
  className?: string
}

export function VibeCard({
  value,
  onChange,
  isSubmitted = false,
  className,
}: VibeCardProps) {
  return (
    <div
      data-testid="vibe-card"
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        className
      )}
    >
      {/* Animated gradient background */}
      <div className="vibe-gradient absolute inset-0" />

      {/* Frosted overlay when submitted */}
      {isSubmitted && (
        <motion.div
          data-testid="vibe-frosted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="absolute inset-0 bg-white/30 backdrop-blur-lg"
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-4">
        <Sparkles size={28} strokeWidth={1.5} className="text-white/80" />

        <h3 className="text-[20px] font-bold font-display text-white">
          Vibe
        </h3>

        <p className="text-[12px] text-white/70 text-center">
          How did this place make you feel?
        </p>

        {/* Lock/heart icon transition */}
        <div className="relative h-8 w-8">
          <motion.div
            data-testid="vibe-lock-icon"
            animate={{ opacity: isSubmitted ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Lock size={20} className="text-white/60" />
          </motion.div>
          <motion.div
            data-testid="vibe-heart-icon"
            animate={{ opacity: isSubmitted ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Heart size={20} className="text-white" fill="white" />
          </motion.div>
        </div>

        <div className="w-full">
          <GradientSlider
            value={value}
            onChange={onChange}
            variant="vibe"
            className="[&_span]:text-white [&_.gradient-slider]:bg-transparent"
          />
        </div>
      </div>

      <style jsx>{`
        .vibe-gradient {
          background: linear-gradient(135deg, #E85D75 0%, #C4956A 50%, #F5F0E8 100%);
          background-size: 200% 200%;
          animation: vibeShift 6s ease-in-out infinite;
        }
        @keyframes vibeShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vibe-gradient {
            animation: none;
            background-position: 50% 50%;
          }
        }
      `}</style>
    </div>
  )
}
