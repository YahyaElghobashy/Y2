"use client"

import { motion } from "framer-motion"

const LETTERS = [
  { char: "H", isBrand: false },
  { char: "a", isBrand: false },
  { char: "Y", isBrand: true },
  { char: "Y", isBrand: true },
  { char: "a", isBrand: false },
  { char: "h", isBrand: false },
]

const letterVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.8 },
  visible: (isBrand: boolean) => ({
    opacity: 1,
    y: 0,
    scale: isBrand ? 1.15 : 1,
  }),
}

const letterTransition = (index: number) => ({
  type: "spring" as const,
  damping: 12,
  stiffness: 200,
  delay: index * 0.1,
})

export function HayahWordmark() {
  return (
    <div className="text-center mb-10">
      {/* English wordmark */}
      <h1
        className="font-[family-name:var(--font-display)] text-[40px] font-bold leading-tight"
        style={{ color: "var(--text-primary, #2C2825)" }}
        aria-label="HaYYah"
      >
        {LETTERS.map((letter, i) => (
          <motion.span
            key={i}
            custom={letter.isBrand}
            variants={letterVariants}
            initial="hidden"
            animate="visible"
            transition={letterTransition(i)}
            style={
              letter.isBrand
                ? { color: "var(--accent-copper, #B87333)", display: "inline-block" }
                : { display: "inline-block" }
            }
          >
            {letter.char}
          </motion.span>
        ))}
      </h1>

      {/* Arabic subtitle */}
      <motion.p
        className="font-[family-name:var(--font-arabic)] text-[18px] mt-1"
        style={{ color: "var(--text-secondary, #6B6560)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        حياة
      </motion.p>

      {/* Tagline */}
      <motion.p
        className="font-[family-name:var(--font-body)] text-[14px] italic mt-3"
        style={{ color: "var(--text-muted, #B5ADA4)" }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        A companion for the two of you.
      </motion.p>
    </div>
  )
}
