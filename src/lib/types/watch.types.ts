// ── Watch Together Types ────────────────────────────────────

export type WatchItemType = "movie" | "series" | "anime" | "documentary" | "short" | "other"

export type WatchStatus = "watchlist" | "watching" | "watched"

export type WatchItem = {
  id: string
  added_by: string
  title: string
  item_type: WatchItemType
  poster_url: string | null
  poster_media_id: string | null
  year: number | null
  tmdb_id: number | null
  status: WatchStatus
  watched_date: string | null
  both_rated: boolean
  created_at: string
  updated_at: string
}

export type WatchRating = {
  id: string
  item_id: string
  user_id: string
  score: number
  reaction: string | null
  submitted_at: string
}

export type AddWatchItemInput = {
  title: string
  item_type?: WatchItemType
  poster_url?: string | null
  year?: number | null
  tmdb_id?: number | null
}

export type TMDBResult = {
  id: number
  title: string
  media_type: "movie" | "tv"
  poster_path: string | null
  release_date: string | null
  overview: string | null
  vote_average: number | null
}

export type WatchStats = {
  totalWatched: number
  avgScore: number
  byType: Record<WatchItemType, number>
  agreeRate: number
}
