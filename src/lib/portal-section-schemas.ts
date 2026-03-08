import { z } from "zod"

// ── Group 1 (TE06): Hero, Welcome, Event Cards, Timeline, Countdown, Calendar, Dress Code ──

export const heroSchema = z.object({
  heading: z.string().min(1),
  subheading: z.string().optional(),
  background_image_url: z.string().url().optional().or(z.literal("")),
  background_overlay_opacity: z.number().min(0).max(1).optional(),
  date_display: z.string().optional(),
  layout: z.enum(["centered", "left", "split"]).default("centered"),
  show_countdown: z.boolean().optional(),
  cta_text: z.string().optional(),
  cta_link: z.string().optional(),
})

export const welcomeSchema = z.object({
  heading: z.string().optional(),
  body: z.string().min(1),
  image_url: z.string().url().optional().or(z.literal("")),
  image_position: z.enum(["left", "right", "top", "bottom"]).optional(),
  signatures: z.array(z.string()).optional(),
})

export const eventCardsSchema = z.object({
  heading: z.string().optional(),
  sub_event_ids: z.array(z.string()).default([]),
  layout: z.enum(["grid", "list", "timeline"]).default("grid"),
  show_map_link: z.boolean().optional(),
})

export const timelineSchema = z.object({
  heading: z.string().optional(),
  items: z.array(
    z.object({
      time: z.string().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
      image_url: z.string().optional(),
    })
  ).default([]),
  orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
})

export const countdownSchema = z.object({
  target_date: z.string().min(1),
  heading: z.string().optional(),
  show_days: z.boolean().default(true),
  show_hours: z.boolean().default(true),
  show_minutes: z.boolean().default(true),
  show_seconds: z.boolean().default(true),
  completed_text: z.string().optional(),
})

export const calendarSchema = z.object({
  heading: z.string().optional(),
  description: z.string().optional(),
  sub_event_ids: z.array(z.string()).default([]),
  show_add_to_calendar: z.boolean().default(true),
})

export const dressCodeSchema = z.object({
  heading: z.string().optional(),
  description: z.string().optional(),
  dress_codes: z.array(
    z.object({
      event_title: z.string().min(1),
      code: z.string().min(1),
      description: z.string().optional(),
      color_palette: z.array(z.string()).optional(),
      image_url: z.string().optional(),
    })
  ).default([]),
})

// ── Group 2 (TE07): Map, Transport, Hotels, Restaurants, Activities, Beauty, Travel Tips, Guides Hub ──

export const mapSchema = z.object({
  heading: z.string().optional(),
  center_lat: z.number().optional(),
  center_lng: z.number().optional(),
  zoom: z.number().min(1).max(20).optional(),
  pin_ids: z.array(z.string()).optional(),
  show_all_pins: z.boolean().default(true),
  map_style: z.enum(["default", "satellite", "warm"]).optional(),
})

export const transportSchema = z.object({
  heading: z.string().optional(),
  sections: z.array(
    z.object({
      mode: z.enum(["car", "flight", "train", "bus", "taxi", "other"]),
      title: z.string().min(1),
      description: z.string().min(1),
      tips: z.array(z.string()).optional(),
      links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
    })
  ).default([]),
})

export const hotelsSchema = z.object({
  heading: z.string().optional(),
  hotels: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      image_url: z.string().optional(),
      rating: z.number().min(0).max(5).optional(),
      price_range: z.string().optional(),
      booking_url: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      distance_from_venue: z.string().optional(),
      is_recommended: z.boolean().optional(),
    })
  ).default([]),
})

export const restaurantsSchema = z.object({
  heading: z.string().optional(),
  restaurants: z.array(
    z.object({
      name: z.string().min(1),
      cuisine: z.string().optional(),
      description: z.string().optional(),
      image_url: z.string().optional(),
      price_range: z.string().optional(),
      url: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      is_recommended: z.boolean().optional(),
    })
  ).default([]),
})

export const activitiesSchema = z.object({
  heading: z.string().optional(),
  activities: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      image_url: z.string().optional(),
      duration: z.string().optional(),
      price: z.string().optional(),
      url: z.string().optional(),
      category: z.string().optional(),
    })
  ).default([]),
})

export const beautySchema = z.object({
  heading: z.string().optional(),
  services: z.array(
    z.object({
      name: z.string().min(1),
      type: z.enum(["salon", "spa", "barber", "makeup", "other"]),
      description: z.string().optional(),
      url: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      is_recommended: z.boolean().optional(),
    })
  ).default([]),
})

export const travelTipsSchema = z.object({
  heading: z.string().optional(),
  tips: z.array(
    z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      icon: z.string().optional(),
      category: z.enum(["visa", "weather", "currency", "safety", "culture", "general"]).optional(),
    })
  ).default([]),
})

export const guidesHubSchema = z.object({
  heading: z.string().optional(),
  description: z.string().optional(),
  guides: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      image_url: z.string().optional(),
      url: z.string().optional(),
      category: z.string().optional(),
    })
  ).default([]),
})

// ── Group 3 (TE08): RSVP Form, Gift Registry, CTA, FAQ, Text, Quote, Divider, Custom HTML, Gallery ──

export const rsvpFormSchema = z.object({
  heading: z.string().optional(),
  description: z.string().optional(),
  show_meal_preference: z.boolean().default(false),
  meal_options: z.array(z.string()).optional(),
  show_dietary_notes: z.boolean().default(false),
  show_hotel_choice: z.boolean().default(false),
  hotel_options: z.array(z.string()).optional(),
  show_plus_ones: z.boolean().default(false),
  max_plus_ones: z.number().min(0).optional(),
  show_message: z.boolean().default(true),
  show_sub_events: z.boolean().default(false),
  sub_event_ids: z.array(z.string()).optional(),
  custom_field_ids: z.array(z.string()).optional(),
  confirmation_message: z.string().optional(),
  deadline: z.string().optional(),
})

export const giftRegistrySchema = z.object({
  heading: z.string().optional(),
  description: z.string().optional(),
  registry_ids: z.array(z.string()).optional(),
  show_external_registries: z.boolean().default(false),
  external_registries: z.array(
    z.object({
      name: z.string().min(1),
      url: z.string().url(),
      image_url: z.string().optional(),
    })
  ).optional(),
})

export const ctaSchema = z.object({
  heading: z.string().min(1),
  description: z.string().optional(),
  button_text: z.string().min(1),
  button_url: z.string().min(1),
  button_style: z.enum(["primary", "outline", "ghost"]).default("primary"),
  background_color: z.string().optional(),
  image_url: z.string().optional(),
})

export const faqSchema = z.object({
  heading: z.string().optional(),
  items: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
    })
  ).default([]),
  layout: z.enum(["accordion", "list"]).default("accordion"),
})

export const textSchema = z.object({
  heading: z.string().optional(),
  body: z.string().min(1),
  alignment: z.enum(["left", "center", "right"]).default("left"),
})

export const quoteSchema = z.object({
  text: z.string().min(1),
  attribution: z.string().optional(),
  style: z.enum(["simple", "decorative", "large"]).default("simple"),
})

export const dividerSchema = z.object({
  style: z.enum(["line", "dots", "ornament", "space"]).default("line"),
  spacing: z.enum(["sm", "md", "lg"]).default("md"),
})

export const customHtmlSchema = z.object({
  html: z.string().min(1),
  css: z.string().optional(),
  sandbox: z.boolean().default(true),
})

export const gallerySchema = z.object({
  heading: z.string().optional(),
  media_ids: z.array(z.string()).optional(),
  layout: z.enum(["grid", "masonry", "carousel"]).default("grid"),
  columns: z.number().min(1).max(6).optional(),
})

// ── Section Type → Schema map ──

import type { SectionType } from "@/lib/types/portal.types"

export const SECTION_SCHEMAS: Record<SectionType, z.ZodSchema> = {
  hero: heroSchema,
  welcome: welcomeSchema,
  event_cards: eventCardsSchema,
  timeline: timelineSchema,
  countdown: countdownSchema,
  calendar: calendarSchema,
  dress_code: dressCodeSchema,
  map: mapSchema,
  transport: transportSchema,
  hotels: hotelsSchema,
  restaurants: restaurantsSchema,
  activities: activitiesSchema,
  beauty: beautySchema,
  travel_tips: travelTipsSchema,
  guides_hub: guidesHubSchema,
  rsvp_form: rsvpFormSchema,
  gift_registry: giftRegistrySchema,
  cta: ctaSchema,
  faq: faqSchema,
  text: textSchema,
  quote: quoteSchema,
  divider: dividerSchema,
  custom_html: customHtmlSchema,
  gallery: gallerySchema,
}

// ── Default content for each section type ──

export const SECTION_DEFAULTS: Record<SectionType, Record<string, unknown>> = {
  hero: { heading: "", layout: "centered" },
  welcome: { body: "" },
  event_cards: { sub_event_ids: [], layout: "grid" },
  timeline: { items: [], orientation: "vertical" },
  countdown: { target_date: "", show_days: true, show_hours: true, show_minutes: true, show_seconds: true },
  calendar: { sub_event_ids: [], show_add_to_calendar: true },
  dress_code: { dress_codes: [] },
  map: { show_all_pins: true },
  transport: { sections: [] },
  hotels: { hotels: [] },
  restaurants: { restaurants: [] },
  activities: { activities: [] },
  beauty: { services: [] },
  travel_tips: { tips: [] },
  guides_hub: { guides: [] },
  rsvp_form: { show_message: true },
  gift_registry: {},
  cta: { heading: "", button_text: "", button_url: "", button_style: "primary" },
  faq: { items: [], layout: "accordion" },
  text: { body: "", alignment: "left" },
  quote: { text: "", style: "simple" },
  divider: { style: "line", spacing: "md" },
  custom_html: { html: "", sandbox: true },
  gallery: { layout: "grid" },
}

// ── Section type display metadata ──

export const SECTION_TYPE_META: Record<SectionType, { label: string; icon: string; group: string }> = {
  hero: { label: "Hero Banner", icon: "🖼️", group: "Content" },
  welcome: { label: "Welcome Message", icon: "👋", group: "Content" },
  event_cards: { label: "Event Cards", icon: "🎴", group: "Content" },
  timeline: { label: "Timeline", icon: "⏱️", group: "Content" },
  countdown: { label: "Countdown", icon: "⏳", group: "Content" },
  calendar: { label: "Calendar", icon: "📅", group: "Content" },
  dress_code: { label: "Dress Code", icon: "👔", group: "Content" },
  map: { label: "Map", icon: "🗺️", group: "Travel" },
  transport: { label: "Transport", icon: "✈️", group: "Travel" },
  hotels: { label: "Hotels", icon: "🏨", group: "Travel" },
  restaurants: { label: "Restaurants", icon: "🍽️", group: "Travel" },
  activities: { label: "Activities", icon: "🎯", group: "Travel" },
  beauty: { label: "Beauty Services", icon: "💅", group: "Travel" },
  travel_tips: { label: "Travel Tips", icon: "💡", group: "Travel" },
  guides_hub: { label: "Guides Hub", icon: "📖", group: "Travel" },
  rsvp_form: { label: "RSVP Form", icon: "📋", group: "Interactive" },
  gift_registry: { label: "Gift Registry", icon: "🎁", group: "Interactive" },
  cta: { label: "Call to Action", icon: "🔗", group: "Interactive" },
  faq: { label: "FAQ", icon: "❓", group: "Utility" },
  text: { label: "Text Block", icon: "📝", group: "Utility" },
  quote: { label: "Quote", icon: "💬", group: "Utility" },
  divider: { label: "Divider", icon: "➖", group: "Utility" },
  custom_html: { label: "Custom HTML", icon: "🧩", group: "Utility" },
  gallery: { label: "Gallery", icon: "🖼️", group: "Content" },
}
