"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  backHref?: string
  rightAction?: React.ReactNode
  className?: string
}

export function PageHeader({ title, backHref, rightAction, className }: PageHeaderProps) {
  const hasSlots = backHref || rightAction

  return (
    <header className={cn("flex items-center px-6 py-3", className)}>
      {hasSlots ? (
        <>
          <div className="min-w-[40px] flex items-center">
            {backHref && (
              <Link href={backHref} aria-label="Go back">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChevronLeft
                    size={24}
                    strokeWidth={1.75}
                    className="text-text-secondary"
                  />
                </motion.div>
              </Link>
            )}
          </div>

          <h1 className="flex-1 text-center text-xl font-bold font-display text-text-primary truncate">
            {title}
          </h1>

          <div className="min-w-[40px] flex items-center justify-end">
            {rightAction}
          </div>
        </>
      ) : (
        <h1 className="text-xl font-bold font-display text-text-primary truncate">
          {title}
        </h1>
      )}
    </header>
  )
}
