// ── Section Editor Registry ──
// Maps section types to their editor components

export type { SectionEditorProps } from "./editor-types"

// Group 1 (TE06): Content
export { HeroEditor } from "./HeroEditor"
export { WelcomeEditor } from "./WelcomeEditor"
export { EventCardsEditor } from "./EventCardsEditor"
export { TimelineEditor } from "./TimelineEditor"
export { CountdownEditor } from "./CountdownEditor"
export { CalendarEditor } from "./CalendarEditor"
export { DressCodeEditor } from "./DressCodeEditor"

// Group 2 (TE07): Travel
export { MapEditor } from "./MapEditor"
export { TransportEditor } from "./TransportEditor"
export { HotelsEditor } from "./HotelsEditor"
export { RestaurantsEditor } from "./RestaurantsEditor"
export { ActivitiesEditor } from "./ActivitiesEditor"
export { BeautyEditor } from "./BeautyEditor"
export { TravelTipsEditor } from "./TravelTipsEditor"
export { GuidesHubEditor } from "./GuidesHubEditor"

// Group 3 (TE08): Interactive & Utility
export { RSVPFormEditor } from "./RSVPFormEditor"
export { GiftRegistryEditor } from "./GiftRegistryEditor"
export { CTAEditor } from "./CTAEditor"
export { FAQEditor } from "./FAQEditor"
export { TextEditor } from "./TextEditor"
export { QuoteEditor } from "./QuoteEditor"
export { DividerEditor } from "./DividerEditor"
export { CustomHTMLEditor } from "./CustomHTMLEditor"
export { GalleryEditor } from "./GalleryEditor"

// ── Registry: Section Type → Editor Component ──

import type { SectionType } from "@/lib/types/portal.types"
import { HeroEditor } from "./HeroEditor"
import { WelcomeEditor } from "./WelcomeEditor"
import { EventCardsEditor } from "./EventCardsEditor"
import { TimelineEditor } from "./TimelineEditor"
import { CountdownEditor } from "./CountdownEditor"
import { CalendarEditor } from "./CalendarEditor"
import { DressCodeEditor } from "./DressCodeEditor"
import { MapEditor } from "./MapEditor"
import { TransportEditor } from "./TransportEditor"
import { HotelsEditor } from "./HotelsEditor"
import { RestaurantsEditor } from "./RestaurantsEditor"
import { ActivitiesEditor } from "./ActivitiesEditor"
import { BeautyEditor } from "./BeautyEditor"
import { TravelTipsEditor } from "./TravelTipsEditor"
import { GuidesHubEditor } from "./GuidesHubEditor"
import { RSVPFormEditor } from "./RSVPFormEditor"
import { GiftRegistryEditor } from "./GiftRegistryEditor"
import { CTAEditor } from "./CTAEditor"
import { FAQEditor } from "./FAQEditor"
import { TextEditor } from "./TextEditor"
import { QuoteEditor } from "./QuoteEditor"
import { DividerEditor } from "./DividerEditor"
import { CustomHTMLEditor } from "./CustomHTMLEditor"
import { GalleryEditor } from "./GalleryEditor"

import type { SectionEditorProps } from "./editor-types"

type EditorComponent = React.ComponentType<SectionEditorProps>

export const SECTION_EDITOR_REGISTRY: Record<SectionType, EditorComponent> = {
  hero: HeroEditor,
  welcome: WelcomeEditor,
  event_cards: EventCardsEditor,
  timeline: TimelineEditor,
  countdown: CountdownEditor,
  calendar: CalendarEditor,
  dress_code: DressCodeEditor,
  map: MapEditor,
  transport: TransportEditor,
  hotels: HotelsEditor,
  restaurants: RestaurantsEditor,
  activities: ActivitiesEditor,
  beauty: BeautyEditor,
  travel_tips: TravelTipsEditor,
  guides_hub: GuidesHubEditor,
  rsvp_form: RSVPFormEditor,
  gift_registry: GiftRegistryEditor,
  cta: CTAEditor,
  faq: FAQEditor,
  text: TextEditor,
  quote: QuoteEditor,
  divider: DividerEditor,
  custom_html: CustomHTMLEditor,
  gallery: GalleryEditor,
}

/**
 * Get the editor component for a given section type.
 * Returns the appropriate editor or null if not found.
 */
export function getSectionEditor(sectionType: SectionType): EditorComponent | null {
  return SECTION_EDITOR_REGISTRY[sectionType] ?? null
}
