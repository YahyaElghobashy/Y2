import type { Database } from "./database.types"

export type SharedList = Database["public"]["Tables"]["shared_lists"]["Row"]
export type SharedListInsert = Database["public"]["Tables"]["shared_lists"]["Insert"]
export type ListItem = Database["public"]["Tables"]["list_items"]["Row"]
export type ListItemInsert = Database["public"]["Tables"]["list_items"]["Insert"]

export const LIST_TYPES = ["general", "grocery", "wishlist", "todo"] as const
export type ListType = (typeof LIST_TYPES)[number]
