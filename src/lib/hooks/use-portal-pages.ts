import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import { SECTION_DEFAULTS } from "@/lib/portal-section-schemas"
import type {
  PortalPage,
  PortalPageInsert,
  PortalPageUpdate,
  PortalSection,
  SectionType,
  UsePortalPagesReturn,
} from "@/lib/types/portal.types"

const AUTO_SAVE_DELAY = 500 // ms debounce for section content updates

export function usePortalPages(portalId: string): UsePortalPagesReturn {
  const { user } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any

  const [pages, setPages] = useState<PortalPage[]>([])
  const [sections, setSections] = useState<Record<string, PortalSection[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auto-save debounce ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch pages for this portal ──
  const fetchPages = useCallback(async () => {
    if (!portalId) return

    const { data, error: fetchError } = await supabase
      .from("portal_pages")
      .select("*")
      .eq("portal_id", portalId)
      .order("position", { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setPages((data as PortalPage[]) ?? [])
    setError(null)
  }, [portalId, supabase])

  // ── Fetch all sections for all pages of this portal ──
  const fetchSections = useCallback(async () => {
    if (!portalId) return

    // Get all page IDs first, then fetch sections
    const { data: pageData } = await supabase
      .from("portal_pages")
      .select("id")
      .eq("portal_id", portalId)

    if (!pageData || pageData.length === 0) {
      setSections({})
      return
    }

    const pageIds = pageData.map((p: { id: string }) => p.id)

    const { data, error: fetchError } = await supabase
      .from("portal_sections")
      .select("*")
      .in("page_id", pageIds)
      .order("position", { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    // Group sections by page_id
    const grouped: Record<string, PortalSection[]> = {}
    for (const section of (data as PortalSection[]) ?? []) {
      if (!grouped[section.page_id]) {
        grouped[section.page_id] = []
      }
      grouped[section.page_id].push(section)
    }

    setSections(grouped)
  }, [portalId, supabase])

  // ── Initial data load ──
  useEffect(() => {
    if (!user || !portalId) {
      setPages([])
      setSections({})
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      await Promise.all([fetchPages(), fetchSections()])
      if (mounted) setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, portalId, fetchPages, fetchSections])

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  // ── Page CRUD: Create ──
  const createPage = useCallback(
    async (data: Omit<PortalPageInsert, "portal_id">): Promise<PortalPage | null> => {
      setError(null)
      if (!portalId) return null

      // Auto-set position to end
      const position = pages.length

      const { data: created, error: insertError } = await supabase
        .from("portal_pages")
        .insert({ ...data, portal_id: portalId, position })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return null
      }

      await fetchPages()
      return created as PortalPage
    },
    [portalId, pages.length, supabase, fetchPages]
  )

  // ── Page CRUD: Update ──
  const updatePage = useCallback(
    async (id: string, data: PortalPageUpdate) => {
      setError(null)

      const { error: updateError } = await supabase
        .from("portal_pages")
        .update(data)
        .eq("id", id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      await fetchPages()
    },
    [supabase, fetchPages]
  )

  // ── Page CRUD: Delete ──
  const deletePage = useCallback(
    async (id: string) => {
      setError(null)

      const { error: deleteError } = await supabase
        .from("portal_pages")
        .delete()
        .eq("id", id)

      if (deleteError) {
        setError(deleteError.message)
        return
      }

      await fetchPages()
      await fetchSections()
    },
    [supabase, fetchPages, fetchSections]
  )

  // ── Page CRUD: Reorder ──
  const reorderPages = useCallback(
    async (orderedIds: string[]) => {
      setError(null)

      // Optimistic update
      const reordered = orderedIds
        .map((id, index) => {
          const page = pages.find((p) => p.id === id)
          return page ? { ...page, position: index } : null
        })
        .filter(Boolean) as PortalPage[]

      setPages(reordered)

      // Persist each position update
      const updates = orderedIds.map((id, index) =>
        supabase.from("portal_pages").update({ position: index }).eq("id", id)
      )

      const results = await Promise.all(updates)
      const failed = results.find((r) => r.error)
      if (failed?.error) {
        setError(failed.error.message)
        await fetchPages() // rollback on error
      }
    },
    [pages, supabase, fetchPages]
  )

  // ── Section CRUD: Add ──
  const addSection = useCallback(
    async (pageId: string, sectionType: SectionType): Promise<PortalSection | null> => {
      setError(null)

      // Default content from schema defaults
      const defaultContent = SECTION_DEFAULTS[sectionType] ?? {}

      // Position at end of page sections
      const pageSections = sections[pageId] ?? []
      const position = pageSections.length

      const { data: created, error: insertError } = await supabase
        .from("portal_sections")
        .insert({
          page_id: pageId,
          section_type: sectionType,
          content: defaultContent,
          position,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return null
      }

      await fetchSections()
      return created as PortalSection
    },
    [sections, supabase, fetchSections]
  )

  // ── Section CRUD: Update content (debounced auto-save) ──
  const updateSectionContent = useCallback(
    (sectionId: string, content: Record<string, unknown>) => {
      // Optimistic update in local state
      setSections((prev) => {
        const next = { ...prev }
        for (const pageId of Object.keys(next)) {
          next[pageId] = next[pageId].map((s) =>
            s.id === sectionId ? { ...s, content } : s
          )
        }
        return next
      })

      // Debounced persist
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = setTimeout(async () => {
        const { error: updateError } = await supabase
          .from("portal_sections")
          .update({ content })
          .eq("id", sectionId)

        if (updateError) {
          setError(updateError.message)
        }
      }, AUTO_SAVE_DELAY)
    },
    [supabase]
  )

  // ── Section CRUD: Delete ──
  const deleteSectionImmediate = useCallback(
    async (sectionId: string) => {
      setError(null)

      const { error: deleteError } = await supabase
        .from("portal_sections")
        .delete()
        .eq("id", sectionId)

      if (deleteError) {
        setError(deleteError.message)
        return
      }

      await fetchSections()
    },
    [supabase, fetchSections]
  )

  // ── Section CRUD: Reorder ──
  const reorderSections = useCallback(
    async (pageId: string, orderedIds: string[]) => {
      setError(null)

      // Optimistic update
      const pageSections = sections[pageId] ?? []
      const reordered = orderedIds
        .map((id, index) => {
          const section = pageSections.find((s) => s.id === id)
          return section ? { ...section, position: index } : null
        })
        .filter(Boolean) as PortalSection[]

      setSections((prev) => ({ ...prev, [pageId]: reordered }))

      // Persist
      const updates = orderedIds.map((id, index) =>
        supabase.from("portal_sections").update({ position: index }).eq("id", id)
      )

      const results = await Promise.all(updates)
      const failed = results.find((r) => r.error)
      if (failed?.error) {
        setError(failed.error.message)
        await fetchSections() // rollback on error
      }
    },
    [sections, supabase, fetchSections]
  )

  // ── Refresh ──
  const refreshPages = useCallback(async () => {
    await Promise.all([fetchPages(), fetchSections()])
  }, [fetchPages, fetchSections])

  // ── Inert return when user is null ──
  if (!user) {
    return {
      pages: [],
      sections: {},
      isLoading: false,
      error: null,
      createPage: async () => null,
      updatePage: async () => {},
      deletePage: async () => {},
      reorderPages: async () => {},
      addSection: async () => null,
      updateSectionContent: () => {},
      deleteSectionImmediate: async () => {},
      reorderSections: async () => {},
      refreshPages: async () => {},
    }
  }

  return {
    pages,
    sections,
    isLoading,
    error,
    createPage,
    updatePage,
    deletePage,
    reorderPages,
    addSection,
    updateSectionContent,
    deleteSectionImmediate,
    reorderSections,
    refreshPages,
  }
}
