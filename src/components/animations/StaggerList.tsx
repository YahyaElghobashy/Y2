"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type StaggerListProps = {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const containerVariants = (staggerDelay: number, reducedMotion: boolean) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: reducedMotion ? 0 : staggerDelay,
    },
  },
})

const itemVariants = (reducedMotion: boolean) => ({
  hidden: { opacity: 0, y: reducedMotion ? 0 : 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: reducedMotion ? 0 : 0.25,
      ease: EASE_OUT,
    },
  },
})

export function StaggerList({
  children,
  staggerDelay = 0.05,
  className,
}: StaggerListProps) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const childArray = React.Children.toArray(children)

  if (childArray.length === 0) {
    return null
  }

  return (
    <motion.div
      variants={containerVariants(staggerDelay, prefersReducedMotion)}
      initial="hidden"
      animate="visible"
      className={cn(className)}
    >
      {childArray.map((child, index) => (
        <motion.div key={index} variants={itemVariants(prefersReducedMotion)}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
