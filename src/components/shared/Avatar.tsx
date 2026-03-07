"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const SIZES = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 80,
} as const

type AvatarSize = keyof typeof SIZES

type AvatarProps = {
  src?: string | null
  name?: string | null
  size?: AvatarSize
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const px = SIZES[size]

  const initials = name ? getInitials(name) : "?"
  const showImage = src && !imgError

  const textSizeClass =
    size === "sm"
      ? "text-[10px]"
      : size === "md"
        ? "text-[12px]"
        : size === "lg"
          ? "text-[16px]"
          : "text-[24px]"

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-[var(--color-accent-soft)]",
        className,
      )}
      style={{ width: px, height: px }}
      data-testid="avatar"
    >
      {showImage ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center font-display font-semibold text-[var(--color-accent-primary)]",
            textSizeClass,
          )}
        >
          {initials}
        </div>
      )}
    </div>
  )
}
