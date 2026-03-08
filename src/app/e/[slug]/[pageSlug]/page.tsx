import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { SectionRenderer } from "@/components/events/public/SectionRenderer"
import type { PortalSection } from "@/lib/types/portal.types"

async function getPageSections(
  portalSlug: string,
  pageSlug: string
): Promise<PortalSection[] | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await getSupabaseServerClient()) as any

  // Get portal
  const { data: portal } = await supabase
    .from("event_portals")
    .select("id")
    .eq("slug", portalSlug)
    .eq("is_published", true)
    .single()

  if (!portal) return null

  // Get page
  const { data: page } = await supabase
    .from("portal_pages")
    .select("id")
    .eq("portal_id", portal.id)
    .eq("slug", pageSlug)
    .eq("is_visible", true)
    .single()

  if (!page) return null

  // Get sections ordered by position
  const { data: sections } = await supabase
    .from("portal_sections")
    .select("*")
    .eq("page_id", page.id)
    .order("position")

  return (sections as PortalSection[]) ?? []
}

export default async function PortalPageRoute({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>
}) {
  const { slug, pageSlug } = await params
  const sections = await getPageSections(slug, pageSlug)

  if (sections === null) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8" data-testid="portal-page">
      <SectionRenderer sections={sections} />
    </div>
  )
}
