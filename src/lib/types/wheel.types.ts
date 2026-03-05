// ── Wheel Types ────────────────────────────────────────────────
// T1406: Spin the Wheel — types for presets, sessions, and spins

export type WheelMode = "selection" | "elimination" | "best_of"
export type WheelSessionStatus = "active" | "completed" | "abandoned"

export type WheelItem = {
  id: string
  label: string
  color?: string
  weight?: number
}

export type WheelPreset = {
  id: string
  user_id: string
  name: string
  icon: string
  items: WheelItem[]
  is_shared: boolean
  created_at: string
  updated_at: string
}

export type WheelSession = {
  id: string
  preset_id: string
  started_by: string
  mode: WheelMode
  best_of_target: number | null
  best_of_rounds: number
  status: WheelSessionStatus
  winner_label: string | null
  created_at: string
  updated_at: string
}

export type WheelSpin = {
  id: string
  session_id: string
  spin_number: number
  spun_by: string
  result_label: string
  result_index: number
  remaining_items: WheelItem[] | null
  eliminated_item: string | null
  spin_duration_ms: number | null
  created_at: string
}

export type CreatePresetInput = {
  name: string
  icon?: string
  items: Omit<WheelItem, "id">[]
  is_shared?: boolean
}

export type SpinResult = {
  resultIndex: number
  angle: number
  label: string
  eliminatedItem?: string
  remainingItems?: WheelItem[]
  spinDurationMs?: number
}
