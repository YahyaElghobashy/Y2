// ── Portal types (manual — not yet in generated database.types.ts) ──

// ── Event Types ──
export const EVENT_TYPES = [
  "engagement",
  "wedding",
  "birthday",
  "anniversary",
  "gathering",
  "custom",
] as const
export type EventType = (typeof EVENT_TYPES)[number]

// ── Portal Theme Config ──
export type PortalThemeColors = {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  textMuted: string
  border: string
}

export type PortalThemeConfig = {
  preset?: string
  colors: PortalThemeColors
  fonts: {
    heading: string
    body: string
  }
  borderRadius: "none" | "sm" | "md" | "lg" | "full"
  spacing: "compact" | "normal" | "spacious"
}

// ── Event Portal ──
export type EventPortal = {
  id: string
  creator_id: string
  slug: string
  title: string
  subtitle: string | null
  event_type: EventType
  event_date: string | null
  event_end_date: string | null
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  theme_config: PortalThemeConfig
  cover_image_url: string | null
  is_published: boolean
  password_hash: string | null
  template_id: string | null
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  created_at: string
  updated_at: string
}

export type EventPortalInsert = {
  creator_id: string
  slug: string
  title: string
  subtitle?: string | null
  event_type?: EventType
  event_date?: string | null
  event_end_date?: string | null
  location_name?: string | null
  location_lat?: number | null
  location_lng?: number | null
  theme_config?: PortalThemeConfig | Record<string, unknown>
  cover_image_url?: string | null
  is_published?: boolean
  password_hash?: string | null
  template_id?: string | null
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
}

export type EventPortalUpdate = Partial<Omit<EventPortalInsert, "creator_id">>

// ── Portal Page ──
export type PortalPage = {
  id: string
  portal_id: string
  slug: string
  title: string
  icon: string | null
  position: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export type PortalPageInsert = {
  portal_id: string
  slug: string
  title: string
  icon?: string | null
  position?: number
  is_visible?: boolean
}

export type PortalPageUpdate = Partial<Omit<PortalPageInsert, "portal_id">>

// ── Portal Section ──
export const SECTION_TYPES = [
  "hero",
  "welcome",
  "event_cards",
  "timeline",
  "countdown",
  "calendar",
  "dress_code",
  "map",
  "transport",
  "hotels",
  "restaurants",
  "activities",
  "beauty",
  "travel_tips",
  "guides_hub",
  "rsvp_form",
  "gift_registry",
  "cta",
  "faq",
  "text",
  "quote",
  "divider",
  "custom_html",
  "gallery",
] as const
export type SectionType = (typeof SECTION_TYPES)[number]

export type PortalSection = {
  id: string
  page_id: string
  section_type: SectionType
  content: Record<string, unknown>
  position: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export type PortalSectionInsert = {
  page_id: string
  section_type: SectionType
  content?: Record<string, unknown>
  position?: number
  is_visible?: boolean
}

// ── Portal Sub-Event ──
export type PortalSubEvent = {
  id: string
  portal_id: string
  title: string
  subtitle: string | null
  event_date: string | null
  start_time: string | null
  end_time: string | null
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  dress_code: string | null
  icon: string | null
  position: number
  created_at: string
  updated_at: string
}

export type PortalSubEventInsert = {
  portal_id: string
  title: string
  subtitle?: string | null
  event_date?: string | null
  start_time?: string | null
  end_time?: string | null
  location_name?: string | null
  location_lat?: number | null
  location_lng?: number | null
  dress_code?: string | null
  icon?: string | null
  position?: number
}

export type PortalSubEventUpdate = Partial<Omit<PortalSubEventInsert, "portal_id">>

// ── Portal RSVP ──
export const ATTENDING_OPTIONS = ["yes", "no", "maybe", "pending"] as const
export type AttendingStatus = (typeof ATTENDING_OPTIONS)[number]

export type PortalRSVP = {
  id: string
  portal_id: string
  guest_id: string | null
  name: string
  email: string | null
  phone: string | null
  attending: AttendingStatus
  plus_ones: number
  meal_preference: string | null
  dietary_notes: string | null
  hotel_choice: string | null
  message: string | null
  custom_fields: Record<string, unknown>
  sub_event_ids: string[]
  submitted_at: string
  updated_at: string
}

export type PortalRSVPInsert = {
  portal_id: string
  name: string
  guest_id?: string | null
  email?: string | null
  phone?: string | null
  attending?: AttendingStatus
  plus_ones?: number
  meal_preference?: string | null
  dietary_notes?: string | null
  hotel_choice?: string | null
  message?: string | null
  custom_fields?: Record<string, unknown>
  sub_event_ids?: string[]
}

// ── Portal Guest ──
export const GUEST_GROUPS = ["family", "friends", "work", "vip", "other"] as const
export type GuestGroup = (typeof GUEST_GROUPS)[number]

export type PortalGuest = {
  id: string
  portal_id: string
  name: string
  email: string | null
  phone: string | null
  guest_group: GuestGroup
  invite_sent: boolean
  invite_sent_at: string | null
  invite_opened: boolean
  rsvp_linked: boolean
  notes: string | null
  plus_ones_allowed: number
  created_at: string
  updated_at: string
}

export type PortalGuestInsert = {
  portal_id: string
  name: string
  email?: string | null
  phone?: string | null
  guest_group?: GuestGroup
  notes?: string | null
  plus_ones_allowed?: number
}

export type PortalGuestUpdate = Partial<Omit<PortalGuestInsert, "portal_id">>

// ── Portal Map Pin ──
export const PIN_CATEGORIES = [
  "venue",
  "hotel",
  "restaurant",
  "activity",
  "transport",
  "other",
] as const
export type PinCategory = (typeof PIN_CATEGORIES)[number]

export type PortalMapPin = {
  id: string
  portal_id: string
  label: string
  lat: number
  lng: number
  category: PinCategory
  description: string | null
  url: string | null
  icon: string | null
  position: number
  created_at: string
  updated_at: string
}

export type PortalMapPinInsert = {
  portal_id: string
  label: string
  lat: number
  lng: number
  category?: PinCategory
  description?: string | null
  url?: string | null
  icon?: string | null
  position?: number
}

// ── Portal Analytics ──
export type PortalAnalytics = {
  id: string
  portal_id: string
  page_path: string | null
  visitor_ip_hash: string | null
  user_agent: string | null
  referrer: string | null
  created_at: string
}

// ── Portal Media ──
export type PortalMedia = {
  id: string
  portal_id: string
  file_url: string
  file_type: "image" | "video"
  alt_text: string | null
  caption: string | null
  position: number
  created_at: string
  updated_at: string
}

export type PortalMediaInsert = {
  portal_id: string
  file_url: string
  file_type?: "image" | "video"
  alt_text?: string | null
  caption?: string | null
  position?: number
}

// ── Portal Registry (Gift) ──
export type PortalRegistryItem = {
  id: string
  portal_id: string
  name: string
  url: string | null
  price: number | null
  currency: string
  image_url: string | null
  is_claimed: boolean
  claimed_by: string | null
  claimed_at: string | null
  position: number
  created_at: string
  updated_at: string
}

export type PortalRegistryInsert = {
  portal_id: string
  name: string
  url?: string | null
  price?: number | null
  currency?: string
  image_url?: string | null
  position?: number
}

// ── Portal Form Field ──
export const FIELD_TYPES = [
  "text",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "number",
  "email",
  "phone",
] as const
export type FieldType = (typeof FIELD_TYPES)[number]

export type PortalFormField = {
  id: string
  portal_id: string
  field_type: FieldType
  label: string
  placeholder: string | null
  options: string[] | null
  is_required: boolean
  position: number
  created_at: string
  updated_at: string
}

export type PortalFormFieldInsert = {
  portal_id: string
  field_type: FieldType
  label: string
  placeholder?: string | null
  options?: string[] | null
  is_required?: boolean
  position?: number
}

// ── Portal Stats ──
export type PortalStats = {
  rsvpCount: number
  attendingCount: number
  declinedCount: number
  pendingCount: number
  totalGuests: number
  viewCount: number
}

// ── Portal Pages Hook Return Type ──
export type UsePortalPagesReturn = {
  pages: PortalPage[]
  sections: Record<string, PortalSection[]>
  isLoading: boolean
  error: string | null
  // Page CRUD
  createPage: (data: Omit<PortalPageInsert, "portal_id">) => Promise<PortalPage | null>
  updatePage: (id: string, data: PortalPageUpdate) => Promise<void>
  deletePage: (id: string) => Promise<void>
  reorderPages: (orderedIds: string[]) => Promise<void>
  // Section CRUD
  addSection: (pageId: string, sectionType: SectionType) => Promise<PortalSection | null>
  updateSectionContent: (sectionId: string, content: Record<string, unknown>) => void
  deleteSectionImmediate: (sectionId: string) => Promise<void>
  reorderSections: (pageId: string, orderedIds: string[]) => Promise<void>
  // Refresh
  refreshPages: () => Promise<void>
}

// ── Hook Return Type ──
export type UseEventPortalReturn = {
  portals: EventPortal[]
  portal: EventPortal | null
  subEvents: PortalSubEvent[]
  isLoading: boolean
  error: string | null
  createPortal: (data: Omit<EventPortalInsert, "creator_id" | "slug">) => Promise<EventPortal | null>
  updatePortal: (id: string, data: EventPortalUpdate) => Promise<void>
  deletePortal: (id: string) => Promise<void>
  addSubEvent: (data: Omit<PortalSubEventInsert, "portal_id">) => Promise<PortalSubEvent | null>
  updateSubEvent: (id: string, data: PortalSubEventUpdate) => Promise<void>
  deleteSubEvent: (id: string) => Promise<void>
  togglePublish: (id: string) => Promise<void>
  updateTheme: (id: string, config: PortalThemeConfig) => Promise<void>
  getShareUrl: (slug: string) => string
  getStats: (portalId: string) => Promise<PortalStats>
  refreshPortals: () => Promise<void>
}
