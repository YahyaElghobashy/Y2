import type { Database } from "./database.types"

// ── Row types from database ──────────────────────────────────
export type FoodVisit = Database["public"]["Tables"]["food_visits"]["Row"]
export type FoodVisitInsert = Database["public"]["Tables"]["food_visits"]["Insert"]
export type FoodRating = Database["public"]["Tables"]["food_ratings"]["Row"]
export type FoodRatingInsert = Database["public"]["Tables"]["food_ratings"]["Insert"]
export type FoodPhoto = Database["public"]["Tables"]["food_photos"]["Row"]
export type FoodPhotoInsert = Database["public"]["Tables"]["food_photos"]["Insert"]

// ── Cuisine types ────────────────────────────────────────────
export const CUISINE_TYPES = [
  "arabic",
  "asian",
  "burger",
  "cafe",
  "dessert",
  "egyptian",
  "fast_food",
  "french",
  "grilled",
  "indian",
  "italian",
  "japanese",
  "korean",
  "lebanese",
  "mexican",
  "seafood",
  "turkish",
] as const

export type CuisineType = (typeof CUISINE_TYPES)[number]

export const CUISINE_LABELS: Record<CuisineType, string> = {
  arabic: "Arabic",
  asian: "Asian",
  burger: "Burger",
  cafe: "Cafe",
  dessert: "Dessert",
  egyptian: "Egyptian",
  fast_food: "Fast Food",
  french: "French",
  grilled: "Grilled",
  indian: "Indian",
  italian: "Italian",
  japanese: "Japanese",
  korean: "Korean",
  lebanese: "Lebanese",
  mexican: "Mexican",
  seafood: "Seafood",
  turkish: "Turkish",
}

// ── Rating dimensions ────────────────────────────────────────
export const RATING_DIMENSIONS = [
  { key: "location_score", label: "Location", icon: "MapPin" },
  { key: "parking_score", label: "Parking", icon: "Car" },
  { key: "service_score", label: "Service", icon: "HandHeart" },
  { key: "food_quality", label: "Food Quality", icon: "ChefHat" },
  { key: "quantity_score", label: "Quantity", icon: "Scale" },
  { key: "price_score", label: "Price", icon: "Banknote" },
  { key: "cuisine_score", label: "Cuisine", icon: "UtensilsCrossed" },
  { key: "bathroom_score", label: "Bathroom", icon: "Bath" },
  { key: "vibe_score", label: "Vibe", icon: "Sparkles" },
] as const

export type RatingDimensionKey = (typeof RATING_DIMENSIONS)[number]["key"]

// ── Photo types ──────────────────────────────────────────────
export const PHOTO_TYPES = [
  "food_plate",
  "partner_eating",
  "ambiance",
  "dessert",
  "extra",
] as const

export type PhotoType = (typeof PHOTO_TYPES)[number]

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  food_plate: "Food",
  partner_eating: "Partner",
  ambiance: "Ambiance",
  dessert: "Dessert",
  extra: "Extra",
}

// ── Preference dot ───────────────────────────────────────────
export type PreferenceDotColor = "me" | "partner" | "similar"

// ── Stats ────────────────────────────────────────────────────
export type FoodStats = {
  totalVisits: number
  uniquePlaces: number
  avgOverall: number
  topCuisine: CuisineType | null
  returnSpots: number
  bookmarkedCount: number
}

// ── Visit with relations ─────────────────────────────────────
export type VisitWithRatings = FoodVisit & {
  myRating: FoodRating | null
  partnerRating: FoodRating | null
  photos: FoodPhoto[]
}
