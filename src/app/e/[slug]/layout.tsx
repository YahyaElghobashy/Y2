import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PortalThemeProvider } from "@/components/events/public/PortalThemeProvider"
import { PortalDataProvider } from "@/components/events/public/PortalDataProvider"
import { PortalNavigation } from "@/components/events/public/PortalNavigation"
import { PasswordGate } from "@/components/events/public/PasswordGate"
import type { EventPortal, PortalPage, PortalThemeConfig } from "@/lib/types/portal.types"

// ── Data fetchers ──

async function getPortal(slug: string): Promise<EventPortal | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await getSupabaseServerClient()) as any
  const { data } = await supabase
    .from("event_portals")
    .select("*")
    .eq("slug", slug)
    .single()
  return data as EventPortal | null
}

async function getVisiblePages(portalId: string): Promise<PortalPage[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await getSupabaseServerClient()) as any
  const { data } = await supabase
    .from("portal_pages")
    .select("*")
    .eq("portal_id", portalId)
    .eq("is_visible", true)
    .order("position")
  return (data as PortalPage[]) ?? []
}

async function trackPageView(portalId: string, pagePath: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await getSupabaseServerClient()) as any
    await supabase.from("portal_analytics").insert({
      portal_id: portalId,
      page_path: pagePath,
      // IP hashing and user-agent captured server-side only
      visitor_ip_hash: null,
      user_agent: null,
      referrer: null,
    })
  } catch {
    // Analytics should never block rendering
  }
}

// ── SEO Metadata ──

type LayoutProps = {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const portal = await getPortal(slug)

  if (!portal) {
    return { title: "Not Found" }
  }

  const title = portal.meta_title || portal.title
  const description =
    portal.meta_description || portal.subtitle || `Event portal for ${portal.title}`
  const images = portal.og_image_url
    ? [portal.og_image_url]
    : portal.cover_image_url
      ? [portal.cover_image_url]
      : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images?.[0] ? [images[0]] : undefined,
    },
  }
}

// ── Layout Component ──

export default async function PortalLayout({ params, children }: LayoutProps) {
  const { slug } = await params
  const portal = await getPortal(slug)

  if (!portal || !portal.is_published) {
    notFound()
  }

  const pages = await getVisiblePages(portal.id)

  // Track page view (fire-and-forget)
  trackPageView(portal.id, `/e/${slug}`)

  // Check password authentication
  if (portal.password_hash) {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get(`portal_auth_${portal.id}`)

    if (!authCookie?.value) {
      return (
        <PortalThemeProvider themeConfig={portal.theme_config as Partial<PortalThemeConfig>}>
          <PasswordGate portalId={portal.id} portalTitle={portal.title} />
        </PortalThemeProvider>
      )
    }
  }

  return (
    <PortalThemeProvider themeConfig={portal.theme_config as Partial<PortalThemeConfig>}>
      <PortalDataProvider portal={portal} pages={pages}>
        <div
          className="min-h-screen"
          style={{
            backgroundColor: "var(--portal-bg)",
            color: "var(--portal-text)",
            fontFamily: "var(--portal-font-body)",
          }}
        >
          <PortalNavigation
            portalSlug={slug}
            portalTitle={portal.title}
            pages={pages}
          />
          <main>{children}</main>
        </div>
      </PortalDataProvider>
    </PortalThemeProvider>
  )
}
