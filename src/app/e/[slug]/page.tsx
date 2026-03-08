import { redirect, notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { PortalPage } from "@/lib/types/portal.types"

async function getFirstPage(slug: string): Promise<{ portalSlug: string; pageSlug: string } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await getSupabaseServerClient()) as any

  // Get portal by slug
  const { data: portal } = await supabase
    .from("event_portals")
    .select("id")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!portal) return null

  // Get first visible page
  const { data: pages } = await supabase
    .from("portal_pages")
    .select("slug")
    .eq("portal_id", portal.id)
    .eq("is_visible", true)
    .order("position")
    .limit(1)

  const firstPage = (pages as PortalPage[] | null)?.[0]
  if (!firstPage) return null

  return { portalSlug: slug, pageSlug: firstPage.slug }
}

export default async function PortalRootPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const result = await getFirstPage(slug)

  if (!result) {
    notFound()
  }

  redirect(`/e/${result.portalSlug}/${result.pageSlug}`)
}
