export const WISHLIST_CATEGORIES = [
  "fashion",
  "tech",
  "home",
  "books",
  "beauty",
  "food",
  "experience",
  "travel",
  "other",
] as const
export type WishlistCategory = (typeof WISHLIST_CATEGORIES)[number]

export const WISHLIST_PRIORITIES = [
  "must_have",
  "want",
  "nice_to_have",
] as const
export type WishlistPriority = (typeof WISHLIST_PRIORITIES)[number]

export type Wishlist = {
  id: string
  owner_id: string
  name: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export type WishlistItem = {
  id: string
  wishlist_id: string
  title: string
  description: string | null
  url: string | null
  image_url: string | null
  image_media_id: string | null
  price: number | null
  currency: string
  category: WishlistCategory
  priority: WishlistPriority
  is_purchased: boolean
  purchased_at: string | null
  purchased_by: string | null
  claimed_by: string | null
  claimed_at: string | null
  sort_order: number
  added_by: string
  created_at: string
  updated_at: string
}

export type AddWishlistItemData = {
  title: string
  description?: string
  url?: string
  image_url?: string
  price?: number
  currency?: string
  category?: WishlistCategory
  priority?: WishlistPriority
}

export type UrlMetadata = {
  title: string | null
  description: string | null
  image: string | null
  price: number | null
  currency: string | null
}
