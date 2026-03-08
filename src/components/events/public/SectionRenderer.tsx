"use client"

import { motion } from "framer-motion"
import type { PortalSection, SectionType } from "@/lib/types/portal.types"
import {
  HeroSection,
  WelcomeSection,
  EventCardsSection,
  TimelineSection,
  CountdownSection,
  CalendarSection,
  DressCodeSection,
  MapSection,
  TransportSection,
  HotelsSection,
  RestaurantsSection,
  ActivitiesSection,
  BeautySection,
  TravelTipsSection,
  GuidesHubSection,
  RSVPFormSection,
  GiftRegistrySection,
  CTASection,
  FAQSection,
  TextSection,
  QuoteSection,
  DividerSection,
  CustomHTMLSection,
  GallerySection,
} from "./sections"

// ── Section Type → Component Registry ──

type SectionComponent = React.ComponentType<{ section: PortalSection }>

const SECTION_RENDERERS: Record<SectionType, SectionComponent> = {
  hero: HeroSection,
  welcome: WelcomeSection,
  event_cards: EventCardsSection,
  timeline: TimelineSection,
  countdown: CountdownSection,
  calendar: CalendarSection,
  dress_code: DressCodeSection,
  map: MapSection,
  transport: TransportSection,
  hotels: HotelsSection,
  restaurants: RestaurantsSection,
  activities: ActivitiesSection,
  beauty: BeautySection,
  travel_tips: TravelTipsSection,
  guides_hub: GuidesHubSection,
  rsvp_form: RSVPFormSection,
  gift_registry: GiftRegistrySection,
  cta: CTASection,
  faq: FAQSection,
  text: TextSection,
  quote: QuoteSection,
  divider: DividerSection,
  custom_html: CustomHTMLSection,
  gallery: GallerySection,
}

// ── Single Section ──
function RenderSection({ section }: { section: PortalSection }) {
  const Renderer = SECTION_RENDERERS[section.section_type]
  if (!Renderer) return null
  return <Renderer section={section} />
}

// ── Section Stack ──
type SectionRendererProps = {
  sections: PortalSection[]
}

export function SectionRenderer({ sections }: SectionRendererProps) {
  const visibleSections = sections.filter((s) => s.is_visible)

  if (visibleSections.length === 0) {
    return (
      <div
        className="py-20 text-center"
        style={{ color: "var(--portal-text-muted)" }}
        data-testid="empty-sections"
      >
        <p className="text-sm">No content yet</p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col"
      style={{ gap: "var(--portal-section-gap)" }}
      data-testid="section-stack"
    >
      {visibleSections.map((section, index) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
        >
          <RenderSection section={section} />
        </motion.div>
      ))}
    </div>
  )
}
