import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import {
  EFFECT_TYPES,
  type MarketplaceItem,
  type MarketplaceItemInput,
  type EffectType,
  type EffectConfig,
} from "@/lib/types/marketplace.types"
import type { Json } from "@/lib/types/database.types"

type UseMarketplaceAdminReturn = {
  /** Every item including deactivated ones, sorted by sort_order. */
  items: MarketplaceItem[]
  isLoading: boolean
  error: string | null
  createItem: (input: MarketplaceItemInput) => Promise<MarketplaceItem>
  updateItem: (id: string, input: Partial<MarketplaceItemInput>) => Promise<MarketplaceItem>
  toggleActive: (id: string, isActive: boolean) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const VALID_EFFECT_TYPES = new Set<EffectType>(EFFECT_TYPES.map((e) => e.value))

/**
 * Validate the numeric effect_config field that matters for a given effect type.
 * The DB stores effect_config as free-form jsonb (no CHECK), so a 0/NaN from a
 * cleared form input would persist silently; the `min={1}` hints are otherwise
 * cosmetic. Returns a message or null. veto/wildcard carry only a text prompt.
 */
export function validateEffectConfig(
  effectType: EffectType,
  config: EffectConfig,
): string | null {
  const requirePositiveInt = (v: unknown, label: string): string | null =>
    Number.isInteger(v) && (v as number) >= 1 ? null : `${label} must be a whole number ≥ 1`

  switch (effectType) {
    case "extra_ping":
      return requirePositiveInt(config.extra_sends, "Extra sends")
    case "dnd_timer":
      return requirePositiveInt(config.duration_minutes, "Duration (minutes)")
    case "task_order":
      return requirePositiveInt(config.deadline_hours, "Deadline (hours)")
    case "veto":
    case "wildcard":
      return null
  }
}

/**
 * Validate an item payload against the DB constraints
 * (`marketplace_items_effect_type_check`, integer `price > 0`, integer
 * `sort_order`, non-empty name) so a bad value surfaces as a thrown Error
 * before the network round-trip rather than a raw Postgres CHECK violation /
 * silent integer truncation. Returns the message, or null when valid.
 */
export function validateItemInput(input: Partial<MarketplaceItemInput>): string | null {
  if (input.name !== undefined && input.name.trim() === "") return "Name is required"
  if (input.price !== undefined && (!Number.isInteger(input.price) || input.price <= 0))
    return "Price must be a whole number greater than 0"
  if (input.sort_order !== undefined && !Number.isInteger(input.sort_order))
    return "Sort order must be a whole number"
  if (input.effect_type !== undefined && !VALID_EFFECT_TYPES.has(input.effect_type))
    return "Invalid effect type"
  if (input.icon !== undefined && input.icon.trim() === "") return "Icon is required"
  if (input.effect_type !== undefined && input.effect_config !== undefined) {
    const cfgError = validateEffectConfig(input.effect_type, input.effect_config)
    if (cfgError) return cfgError
  }
  return null
}

export function useMarketplaceAdmin(): UseMarketplaceAdminReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("marketplace_items")
      .select("*")
      .order("sort_order", { ascending: true })

    if (fetchError) {
      setError("Failed to load marketplace items")
      return
    }
    setError(null)
    setItems((data ?? []) as MarketplaceItem[])
  }, [supabase])

  useEffect(() => {
    if (!user) {
      setItems([])
      setIsLoading(false)
      return
    }
    let mounted = true
    ;(async () => {
      await refresh()
      if (mounted) setIsLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [user, refresh])

  const createItem = useCallback(
    async (input: MarketplaceItemInput): Promise<MarketplaceItem> => {
      if (!user) throw new Error("Not authenticated")
      const invalid = validateItemInput(input)
      if (invalid) throw new Error(invalid)

      const { data, error: insertError } = await supabase
        .from("marketplace_items")
        .insert({
          name: input.name.trim(),
          description: input.description.trim(),
          price: input.price,
          icon: input.icon.trim(),
          effect_type: input.effect_type,
          effect_config: (input.effect_config ?? {}) as Json,
          is_active: input.is_active,
          sort_order: input.sort_order,
        })
        .select()
        .single()

      if (insertError || !data) {
        throw new Error(
          insertError?.message.includes("marketplace_items_name_unique")
            ? "An item with that name already exists"
            : "Failed to create item",
        )
      }
      const created = data as MarketplaceItem
      setItems((prev) =>
        [...prev, created].sort((a, b) => a.sort_order - b.sort_order),
      )
      return created
    },
    [user, supabase],
  )

  const updateItem = useCallback(
    async (id: string, input: Partial<MarketplaceItemInput>): Promise<MarketplaceItem> => {
      if (!user) throw new Error("Not authenticated")
      const invalid = validateItemInput(input)
      if (invalid) throw new Error(invalid)

      const patch: Record<string, unknown> = {}
      if (input.name !== undefined) patch.name = input.name.trim()
      if (input.description !== undefined) patch.description = input.description.trim()
      if (input.price !== undefined) patch.price = input.price
      if (input.icon !== undefined) patch.icon = input.icon.trim()
      if (input.effect_type !== undefined) patch.effect_type = input.effect_type
      if (input.effect_config !== undefined) patch.effect_config = input.effect_config as Json
      if (input.is_active !== undefined) patch.is_active = input.is_active
      if (input.sort_order !== undefined) patch.sort_order = input.sort_order

      const { data, error: updateError } = await supabase
        .from("marketplace_items")
        .update(patch)
        .eq("id", id)
        .select()
        .single()

      if (updateError || !data) {
        throw new Error(
          updateError?.message.includes("marketplace_items_name_unique")
            ? "An item with that name already exists"
            : "Failed to update item",
        )
      }
      const updated = data as MarketplaceItem
      setItems((prev) =>
        prev
          .map((it) => (it.id === id ? updated : it))
          .sort((a, b) => a.sort_order - b.sort_order),
      )
      return updated
    },
    [user, supabase],
  )

  const toggleActive = useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      if (!user) throw new Error("Not authenticated")
      const { error: updateError } = await supabase
        .from("marketplace_items")
        .update({ is_active: isActive })
        .eq("id", id)
      if (updateError) throw new Error("Failed to update item status")
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, is_active: isActive } : it)),
      )
    },
    [user, supabase],
  )

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      if (!user) throw new Error("Not authenticated")
      const { error: deleteError } = await supabase
        .from("marketplace_items")
        .delete()
        .eq("id", id)
      if (deleteError) {
        // FK from purchases blocks hard-delete of purchased items.
        throw new Error(
          deleteError.message.includes("foreign key") ||
            deleteError.code === "23503"
            ? "This item has been purchased — deactivate it instead"
            : "Failed to delete item",
        )
      }
      setItems((prev) => prev.filter((it) => it.id !== id))
    },
    [user, supabase],
  )

  if (!user) {
    return {
      items: [],
      isLoading: false,
      error: null,
      createItem: async () => {
        throw new Error("Not authenticated")
      },
      updateItem: async () => {
        throw new Error("Not authenticated")
      },
      toggleActive: async () => {
        throw new Error("Not authenticated")
      },
      deleteItem: async () => {
        throw new Error("Not authenticated")
      },
      refresh: async () => {},
    }
  }

  return {
    items,
    isLoading,
    error,
    createItem,
    updateItem,
    toggleActive,
    deleteItem,
    refresh,
  }
}
