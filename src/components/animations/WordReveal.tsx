"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type WordRevealProps = {
  text: string
  stagger?: number
  delay?: number
  className?: string
}

const wordVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
  },
}

export function WordReveal({
  text,
  stagger = 0.06,
  delay = 0,
  className,
}: WordRevealProps) {
  const words = text.split(" ")

  return (
    <motion.span
      className={cn("inline", className)}
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={wordVariants}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 150,
          }}
        >
          {word}
          {i < words.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </motion.span>
  )
}
