import type { Database } from "./database.types"

export type Snap = Database["public"]["Tables"]["snaps"]["Row"]
export type SnapInsert = Database["public"]["Tables"]["snaps"]["Insert"]
export type SnapSchedule = Database["public"]["Tables"]["snap_schedule"]["Row"]

export const REACTION_EMOJIS = ["❤️", "😂", "😍", "🔥", "🥺"] as const
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

/** Snap window duration in seconds (5 minutes) */
export const SNAP_WINDOW_SECONDS = 300

/** Max caption length */
export const MAX_CAPTION_LENGTH = 100

/** Max image dimension for upload */
export const SNAP_MAX_DIMENSION = 1200
