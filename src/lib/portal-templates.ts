import type { SectionType, EventType } from "@/lib/types/portal.types"

// ── Template Types ──

export type PortalTemplateSection = {
  section_type: SectionType
  content: Record<string, unknown>
}

export type PortalTemplatePage = {
  slug: string
  title: string
  icon: string
  sections: PortalTemplateSection[]
}

export type PortalTemplate = {
  id: string
  name: string
  description: string
  event_type: EventType
  theme_preset: string
  pages: PortalTemplatePage[]
}

// ── 6 Templates ──

const ENGAGEMENT_TEMPLATE: PortalTemplate = {
  id: "engagement",
  name: "Engagement",
  description: "Celebrate your engagement with a beautiful portal",
  event_type: "engagement",
  theme_preset: "elegant_gold",
  pages: [
    {
      slug: "main",
      title: "Home",
      icon: "💍",
      sections: [
        { section_type: "hero", content: { heading: "We're Engaged!", layout: "centered", show_countdown: true } },
        { section_type: "welcome", content: { heading: "Our Story", body: "Share your engagement story here..." } },
        { section_type: "countdown", content: { target_date: "", heading: "Days Until We Say I Do", show_days: true, show_hours: true, show_minutes: true, show_seconds: true } },
        { section_type: "gallery", content: { heading: "Our Moments", layout: "masonry" } },
      ],
    },
    {
      slug: "details",
      title: "Event Details",
      icon: "📋",
      sections: [
        { section_type: "event_cards", content: { heading: "Event Schedule", layout: "grid" } },
        { section_type: "timeline", content: { heading: "The Day's Timeline", items: [], orientation: "vertical" } },
        { section_type: "dress_code", content: { heading: "What to Wear", dress_codes: [] } },
      ],
    },
    {
      slug: "rsvp",
      title: "RSVP",
      icon: "✉️",
      sections: [
        { section_type: "rsvp_form", content: { heading: "Will You Join Us?", show_message: true, show_plus_ones: true } },
      ],
    },
  ],
}

const WEDDING_TEMPLATE: PortalTemplate = {
  id: "wedding",
  name: "Wedding",
  description: "Everything your guests need for your big day",
  event_type: "wedding",
  theme_preset: "elegant_gold",
  pages: [
    {
      slug: "main",
      title: "Home",
      icon: "💒",
      sections: [
        { section_type: "hero", content: { heading: "Together Forever", layout: "centered", show_countdown: true } },
        { section_type: "welcome", content: { heading: "Welcome", body: "We joyfully invite you to celebrate our wedding..." } },
        { section_type: "countdown", content: { target_date: "", heading: "Counting Down", show_days: true, show_hours: true, show_minutes: true, show_seconds: true } },
        { section_type: "event_cards", content: { heading: "Wedding Events", layout: "grid" } },
      ],
    },
    {
      slug: "details",
      title: "Details",
      icon: "📋",
      sections: [
        { section_type: "timeline", content: { heading: "Wedding Day Timeline", items: [], orientation: "vertical" } },
        { section_type: "dress_code", content: { heading: "Dress Code", dress_codes: [] } },
        { section_type: "calendar", content: { heading: "Save the Date", show_add_to_calendar: true } },
      ],
    },
    {
      slug: "travel",
      title: "Travel & Stay",
      icon: "✈️",
      sections: [
        { section_type: "map", content: { heading: "Venue & Surroundings", show_all_pins: true } },
        { section_type: "hotels", content: { heading: "Where to Stay", hotels: [] } },
        { section_type: "transport", content: { heading: "Getting There", sections: [] } },
        { section_type: "restaurants", content: { heading: "Dining", restaurants: [] } },
      ],
    },
    {
      slug: "rsvp",
      title: "RSVP",
      icon: "✉️",
      sections: [
        { section_type: "rsvp_form", content: { heading: "RSVP", show_message: true, show_meal_preference: true, show_plus_ones: true, show_sub_events: true } },
        { section_type: "gift_registry", content: { heading: "Gift Registry", description: "Your presence is our greatest gift" } },
      ],
    },
    {
      slug: "faq",
      title: "FAQ",
      icon: "❓",
      sections: [
        { section_type: "faq", content: { heading: "Frequently Asked Questions", items: [], layout: "accordion" } },
      ],
    },
  ],
}

const BIRTHDAY_TEMPLATE: PortalTemplate = {
  id: "birthday",
  name: "Birthday",
  description: "Throw an unforgettable birthday celebration",
  event_type: "birthday",
  theme_preset: "garden_romance",
  pages: [
    {
      slug: "main",
      title: "Party!",
      icon: "🎂",
      sections: [
        { section_type: "hero", content: { heading: "It's a Birthday Party!", layout: "centered", show_countdown: true } },
        { section_type: "welcome", content: { heading: "You're Invited!", body: "Join us for a birthday celebration..." } },
        { section_type: "countdown", content: { target_date: "", heading: "The Big Day", show_days: true, show_hours: true, show_minutes: false, show_seconds: false } },
        { section_type: "event_cards", content: { heading: "Party Schedule", layout: "list" } },
      ],
    },
    {
      slug: "rsvp",
      title: "RSVP",
      icon: "✉️",
      sections: [
        { section_type: "rsvp_form", content: { heading: "Can You Make It?", show_message: true, show_plus_ones: true } },
        { section_type: "gift_registry", content: { heading: "Wishlist" } },
      ],
    },
  ],
}

const ANNIVERSARY_TEMPLATE: PortalTemplate = {
  id: "anniversary",
  name: "Anniversary",
  description: "Celebrate years of love and togetherness",
  event_type: "anniversary",
  theme_preset: "elegant_gold",
  pages: [
    {
      slug: "main",
      title: "Home",
      icon: "❤️",
      sections: [
        { section_type: "hero", content: { heading: "Celebrating Our Love", layout: "centered" } },
        { section_type: "welcome", content: { heading: "Our Journey", body: "Join us as we celebrate another year of love..." } },
        { section_type: "timeline", content: { heading: "Through the Years", items: [], orientation: "horizontal" } },
        { section_type: "gallery", content: { heading: "Memories", layout: "carousel" } },
      ],
    },
    {
      slug: "celebration",
      title: "Celebration",
      icon: "🥂",
      sections: [
        { section_type: "event_cards", content: { heading: "Celebration Details", layout: "grid" } },
        { section_type: "map", content: { heading: "Venue", show_all_pins: true } },
        { section_type: "rsvp_form", content: { heading: "RSVP", show_message: true } },
      ],
    },
  ],
}

const GATHERING_TEMPLATE: PortalTemplate = {
  id: "gathering",
  name: "Gathering",
  description: "A simple, flexible template for any event",
  event_type: "gathering",
  theme_preset: "minimalist",
  pages: [
    {
      slug: "main",
      title: "Event",
      icon: "🎉",
      sections: [
        { section_type: "hero", content: { heading: "You're Invited", layout: "centered" } },
        { section_type: "text", content: { heading: "About This Event", body: "Tell your guests about the event...", alignment: "center" } },
        { section_type: "event_cards", content: { heading: "Schedule", layout: "list" } },
        { section_type: "map", content: { heading: "Location", show_all_pins: true } },
        { section_type: "rsvp_form", content: { heading: "RSVP", show_message: true } },
      ],
    },
  ],
}

const BLANK_TEMPLATE: PortalTemplate = {
  id: "blank",
  name: "Blank",
  description: "Start from scratch with a clean slate",
  event_type: "custom",
  theme_preset: "elegant_gold",
  pages: [
    {
      slug: "main",
      title: "Home",
      icon: "🏠",
      sections: [
        { section_type: "hero", content: { heading: "", layout: "centered" } },
      ],
    },
  ],
}

// ── All Templates ──

export const PORTAL_TEMPLATES: PortalTemplate[] = [
  ENGAGEMENT_TEMPLATE,
  WEDDING_TEMPLATE,
  BIRTHDAY_TEMPLATE,
  ANNIVERSARY_TEMPLATE,
  GATHERING_TEMPLATE,
  BLANK_TEMPLATE,
]

// ── Lookup by ID ──

export function getTemplateById(id: string): PortalTemplate | null {
  return PORTAL_TEMPLATES.find((t) => t.id === id) ?? null
}

// ── Lookup by event type ──

export function getTemplatesForEventType(eventType: EventType): PortalTemplate[] {
  return PORTAL_TEMPLATES.filter(
    (t) => t.event_type === eventType || t.id === "blank"
  )
}

// ── Suggested template for an event type ──

export function getSuggestedTemplate(eventType: EventType): PortalTemplate {
  const match = PORTAL_TEMPLATES.find((t) => t.event_type === eventType)
  return match ?? BLANK_TEMPLATE
}
