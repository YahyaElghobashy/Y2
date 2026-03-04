import type { LucideIcon } from "lucide-react"
import { Heart, Star, Bell, Calendar } from "lucide-react"
import type { EventCategory } from "@/lib/types/calendar.types"

export type EventCategoryConfig = {
  key: EventCategory
  label: string
  color: string
  icon: LucideIcon
}

export const EVENT_CATEGORY_CONFIG: Record<EventCategory, EventCategoryConfig> = {
  date_night: { key: "date_night", label: "Date Night", color: "#B87333", icon: Heart },
  milestone: { key: "milestone", label: "Milestone", color: "#DAA520", icon: Star },
  reminder: { key: "reminder", label: "Reminder", color: "#9CA3AF", icon: Bell },
  other: { key: "other", label: "Other", color: "#4A4543", icon: Calendar },
}

export function getCategoryColor(category: string): string {
  return (EVENT_CATEGORY_CONFIG as Record<string, EventCategoryConfig>)[category]?.color ?? EVENT_CATEGORY_CONFIG.other.color
}

export function getCategoryLabel(category: string): string {
  return (EVENT_CATEGORY_CONFIG as Record<string, EventCategoryConfig>)[category]?.label ?? "Other"
}
