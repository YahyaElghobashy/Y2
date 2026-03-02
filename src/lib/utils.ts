import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, format: "short" | "long" | "time" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date
  switch (format) {
    case "short":
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    case "long":
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    case "time":
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }
}
