-- ============================================================
-- Phase 18: Event Portal Migration
-- Creates 11 tables for the sharable event portal system
-- (event_portals, portal_pages, portal_sections, portal_sub_events,
--  portal_guests, portal_rsvps, portal_map_pins, portal_analytics,
--  portal_media, portal_registry, portal_form_fields)
--
-- First feature with anon (unauthenticated) access for public portals.
--
-- Depends on: 001_auth_profiles.sql (profiles, set_updated_at)
--             008_fix_partner_read_policy.sql (get_partner_id)
-- ============================================================


-- ── 1. EVENT_PORTALS ──────────────────────────────────────────

create table public.event_portals (
  id                uuid        primary key default gen_random_uuid(),
  creator_id        uuid        not null references public.profiles (id) on delete cascade,
  slug              text        not null,
  title             text        not null,
  subtitle          text,
  event_type        text        not null default 'custom'
    check (event_type in (
      'engagement', 'wedding', 'birthday', 'anniversary', 'gathering', 'custom'
    )),
  event_date        date,
  event_end_date    date,
  location_name     text,
  location_lat      numeric(10,7),
  location_lng      numeric(10,7),
  theme_config      jsonb       not null default '{}'::jsonb,
  cover_image_url   text,
  is_published      boolean     not null default false,
  password_hash     text,
  template_id       text,
  meta_title        text,
  meta_description  text,
  og_image_url      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index event_portals_slug_idx on public.event_portals (slug);
create index event_portals_creator_idx on public.event_portals (creator_id);

comment on table public.event_portals is
  'Sharable event portal pages (wedding sites, engagement invites, etc.). Supports public access for guests.';
comment on column public.event_portals.slug is
  'Unique URL slug for the public portal route /e/{slug}.';
comment on column public.event_portals.theme_config is
  'JSONB theme configuration: colors, fonts, borderRadius, spacing. Used by PortalThemeProvider.';
comment on column public.event_portals.password_hash is
  'Bcrypt hash for password-protected portals. Null means no password.';


-- ── 2. PORTAL_PAGES ──────────────────────────────────────────

create table public.portal_pages (
  id          uuid        primary key default gen_random_uuid(),
  portal_id   uuid        not null references public.event_portals (id) on delete cascade,
  slug        text        not null,
  title       text        not null,
  icon        text,
  position    integer     not null default 0,
  is_visible  boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint portal_pages_unique_slug unique (portal_id, slug)
);

create index portal_pages_portal_idx on public.portal_pages (portal_id, position);

comment on table public.portal_pages is
  'Pages within a portal (e.g., Home, Travel, RSVP). Ordered by position.';


-- ── 3. PORTAL_SECTIONS ───────────────────────────────────────

create table public.portal_sections (
  id            uuid        primary key default gen_random_uuid(),
  page_id       uuid        not null references public.portal_pages (id) on delete cascade,
  section_type  text        not null
    check (section_type in (
      'hero', 'welcome', 'event_cards', 'timeline', 'countdown',
      'calendar', 'dress_code', 'map', 'transport', 'hotels',
      'restaurants', 'activities', 'beauty', 'travel_tips',
      'guides_hub', 'rsvp_form', 'gift_registry', 'cta',
      'faq', 'text', 'quote', 'divider', 'custom_html', 'gallery'
    )),
  content       jsonb       not null default '{}'::jsonb,
  position      integer     not null default 0,
  is_visible    boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index portal_sections_page_idx on public.portal_sections (page_id, position);

comment on table public.portal_sections is
  'Sections within a portal page. Each section has a type and JSONB content.';
comment on column public.portal_sections.section_type is
  'One of 24 section types: hero, welcome, event_cards, timeline, countdown, calendar, dress_code, map, transport, hotels, restaurants, activities, beauty, travel_tips, guides_hub, rsvp_form, gift_registry, cta, faq, text, quote, divider, custom_html, gallery.';
comment on column public.portal_sections.content is
  'JSONB content shaped by the section_type. Each type has its own schema.';


-- ── 4. PORTAL_SUB_EVENTS ─────────────────────────────────────

create table public.portal_sub_events (
  id            uuid        primary key default gen_random_uuid(),
  portal_id     uuid        not null references public.event_portals (id) on delete cascade,
  title         text        not null,
  subtitle      text,
  event_date    date,
  start_time    time,
  end_time      time,
  location_name text,
  location_lat  numeric(10,7),
  location_lng  numeric(10,7),
  dress_code    text,
  icon          text,
  position      integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index portal_sub_events_portal_idx on public.portal_sub_events (portal_id, position);

comment on table public.portal_sub_events is
  'Sub-events within a portal (e.g., Ceremony, Reception, After-party). Ordered by position.';


-- ── 5. PORTAL_GUESTS ─────────────────────────────────────────
-- Defined before portal_rsvps because rsvps references guests.

create table public.portal_guests (
  id                uuid        primary key default gen_random_uuid(),
  portal_id         uuid        not null references public.event_portals (id) on delete cascade,
  name              text        not null,
  email             text,
  phone             text,
  guest_group       text        not null default 'other'
    check (guest_group in (
      'family', 'friends', 'work', 'vip', 'other'
    )),
  invite_sent       boolean     not null default false,
  invite_sent_at    timestamptz,
  invite_opened     boolean     not null default false,
  rsvp_linked       boolean     not null default false,
  notes             text,
  plus_ones_allowed integer     not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index portal_guests_portal_idx on public.portal_guests (portal_id);

comment on table public.portal_guests is
  'Invited guest list for a portal. Tracks invite status and links to RSVPs.';


-- ── 6. PORTAL_RSVPS ─────────────────────────────────────────

create table public.portal_rsvps (
  id              uuid        primary key default gen_random_uuid(),
  portal_id       uuid        not null references public.event_portals (id) on delete cascade,
  guest_id        uuid        references public.portal_guests (id) on delete set null,
  name            text        not null,
  email           text,
  phone           text,
  attending       text        not null default 'pending'
    check (attending in ('yes', 'no', 'maybe', 'pending')),
  plus_ones       integer     not null default 0 check (plus_ones >= 0),
  meal_preference text,
  dietary_notes   text,
  hotel_choice    text,
  message         text,
  custom_fields   jsonb       not null default '{}'::jsonb,
  sub_event_ids   uuid[]      default '{}',
  submitted_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index portal_rsvps_portal_idx on public.portal_rsvps (portal_id);
create index portal_rsvps_email_idx on public.portal_rsvps (portal_id, email)
  where email is not null;

comment on table public.portal_rsvps is
  'RSVP responses submitted by guests. Supports anonymous (unauthenticated) submissions.';
comment on column public.portal_rsvps.custom_fields is
  'JSONB map of custom form field answers keyed by field_id.';
comment on column public.portal_rsvps.sub_event_ids is
  'Array of portal_sub_events UUIDs the guest is RSVPing to.';


-- ── 7. PORTAL_MAP_PINS ──────────────────────────────────────

create table public.portal_map_pins (
  id          uuid        primary key default gen_random_uuid(),
  portal_id   uuid        not null references public.event_portals (id) on delete cascade,
  label       text        not null,
  lat         numeric(10,7) not null,
  lng         numeric(10,7) not null,
  category    text        not null default 'venue'
    check (category in (
      'venue', 'hotel', 'restaurant', 'activity', 'transport', 'other'
    )),
  description text,
  url         text,
  icon        text,
  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index portal_map_pins_portal_idx on public.portal_map_pins (portal_id);

comment on table public.portal_map_pins is
  'Map markers for venues, hotels, restaurants, etc. Displayed on the portal map section.';


-- ── 8. PORTAL_ANALYTICS ─────────────────────────────────────

create table public.portal_analytics (
  id              uuid        primary key default gen_random_uuid(),
  portal_id       uuid        not null references public.event_portals (id) on delete cascade,
  page_path       text,
  visitor_ip_hash text,
  user_agent      text,
  referrer        text,
  created_at      timestamptz not null default now()
);

create index portal_analytics_portal_idx on public.portal_analytics (portal_id, created_at);

comment on table public.portal_analytics is
  'Page view analytics for portals. Stores hashed IPs only, never raw IPs.';
comment on column public.portal_analytics.visitor_ip_hash is
  'SHA-256 hash of the visitor IP address. Raw IPs are never stored.';


-- ── 9. PORTAL_MEDIA ─────────────────────────────────────────

create table public.portal_media (
  id          uuid        primary key default gen_random_uuid(),
  portal_id   uuid        not null references public.event_portals (id) on delete cascade,
  file_url    text        not null,
  file_type   text        not null default 'image'
    check (file_type in ('image', 'video')),
  alt_text    text,
  caption     text,
  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index portal_media_portal_idx on public.portal_media (portal_id, position);

comment on table public.portal_media is
  'Media files (images, videos) uploaded to a portal.';


-- ── 10. PORTAL_REGISTRY ─────────────────────────────────────

create table public.portal_registry (
  id          uuid        primary key default gen_random_uuid(),
  portal_id   uuid        not null references public.event_portals (id) on delete cascade,
  name        text        not null,
  url         text,
  price       numeric(10,2),
  currency    text        not null default 'EGP',
  image_url   text,
  is_claimed  boolean     not null default false,
  claimed_by  text,
  claimed_at  timestamptz,
  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index portal_registry_portal_idx on public.portal_registry (portal_id);

comment on table public.portal_registry is
  'Gift registry items. Guests can mark items as claimed.';


-- ── 11. PORTAL_FORM_FIELDS ──────────────────────────────────

create table public.portal_form_fields (
  id          uuid        primary key default gen_random_uuid(),
  portal_id   uuid        not null references public.event_portals (id) on delete cascade,
  field_type  text        not null
    check (field_type in (
      'text', 'textarea', 'select', 'radio', 'checkbox', 'number', 'email', 'phone'
    )),
  label       text        not null,
  placeholder text,
  options     text[],
  is_required boolean     not null default false,
  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index portal_form_fields_portal_idx on public.portal_form_fields (portal_id, position);

comment on table public.portal_form_fields is
  'Custom form fields for the RSVP form. Responses stored in portal_rsvps.custom_fields.';


-- ── UPDATED_AT TRIGGERS ─────────────────────────────────────
-- Reuses set_updated_at() from 001_auth_profiles.sql

create trigger event_portals_set_updated_at
  before update on public.event_portals for each row
  execute function public.set_updated_at();

create trigger portal_pages_set_updated_at
  before update on public.portal_pages for each row
  execute function public.set_updated_at();

create trigger portal_sections_set_updated_at
  before update on public.portal_sections for each row
  execute function public.set_updated_at();

create trigger portal_sub_events_set_updated_at
  before update on public.portal_sub_events for each row
  execute function public.set_updated_at();

create trigger portal_guests_set_updated_at
  before update on public.portal_guests for each row
  execute function public.set_updated_at();

create trigger portal_rsvps_set_updated_at
  before update on public.portal_rsvps for each row
  execute function public.set_updated_at();

create trigger portal_map_pins_set_updated_at
  before update on public.portal_map_pins for each row
  execute function public.set_updated_at();

create trigger portal_media_set_updated_at
  before update on public.portal_media for each row
  execute function public.set_updated_at();

create trigger portal_registry_set_updated_at
  before update on public.portal_registry for each row
  execute function public.set_updated_at();

create trigger portal_form_fields_set_updated_at
  before update on public.portal_form_fields for each row
  execute function public.set_updated_at();


-- ── ROW LEVEL SECURITY ──────────────────────────────────────

-- EVENT_PORTALS: Creator full CRUD, partner read, anon read for published
alter table public.event_portals enable row level security;

create policy "event_portals: creator select"
  on public.event_portals for select to authenticated
  using (auth.uid() = creator_id);

create policy "event_portals: partner select"
  on public.event_portals for select to authenticated
  using (creator_id = public.get_partner_id());

create policy "event_portals: public select"
  on public.event_portals for select to anon
  using (is_published = true);

create policy "event_portals: creator insert"
  on public.event_portals for insert to authenticated
  with check (auth.uid() = creator_id);

create policy "event_portals: creator update"
  on public.event_portals for update to authenticated
  using (auth.uid() = creator_id);

create policy "event_portals: creator delete"
  on public.event_portals for delete to authenticated
  using (auth.uid() = creator_id);


-- PORTAL_PAGES: Owner CRUD via portal join, anon read for published
alter table public.portal_pages enable row level security;

create policy "portal_pages: owner select"
  on public.portal_pages for select to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_pages.portal_id
    and (ep.creator_id = auth.uid() or ep.creator_id = public.get_partner_id())
  ));

create policy "portal_pages: public select"
  on public.portal_pages for select to anon
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_pages.portal_id and ep.is_published = true
  ));

create policy "portal_pages: owner insert"
  on public.portal_pages for insert to authenticated
  with check (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_pages.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_pages: owner update"
  on public.portal_pages for update to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_pages.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_pages: owner delete"
  on public.portal_pages for delete to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_pages.portal_id and ep.creator_id = auth.uid()
  ));


-- PORTAL_SECTIONS: Owner CRUD via page→portal join, anon read for published
alter table public.portal_sections enable row level security;

create policy "portal_sections: owner select"
  on public.portal_sections for select to authenticated
  using (exists (
    select 1 from public.portal_pages pp
    join public.event_portals ep on ep.id = pp.portal_id
    where pp.id = portal_sections.page_id
    and (ep.creator_id = auth.uid() or ep.creator_id = public.get_partner_id())
  ));

create policy "portal_sections: public select"
  on public.portal_sections for select to anon
  using (exists (
    select 1 from public.portal_pages pp
    join public.event_portals ep on ep.id = pp.portal_id
    where pp.id = portal_sections.page_id and ep.is_published = true
  ));

create policy "portal_sections: owner insert"
  on public.portal_sections for insert to authenticated
  with check (exists (
    select 1 from public.portal_pages pp
    join public.event_portals ep on ep.id = pp.portal_id
    where pp.id = portal_sections.page_id and ep.creator_id = auth.uid()
  ));

create policy "portal_sections: owner update"
  on public.portal_sections for update to authenticated
  using (exists (
    select 1 from public.portal_pages pp
    join public.event_portals ep on ep.id = pp.portal_id
    where pp.id = portal_sections.page_id and ep.creator_id = auth.uid()
  ));

create policy "portal_sections: owner delete"
  on public.portal_sections for delete to authenticated
  using (exists (
    select 1 from public.portal_pages pp
    join public.event_portals ep on ep.id = pp.portal_id
    where pp.id = portal_sections.page_id and ep.creator_id = auth.uid()
  ));


-- PORTAL_SUB_EVENTS: Owner CRUD via portal, anon read for published
alter table public.portal_sub_events enable row level security;

create policy "portal_sub_events: owner select"
  on public.portal_sub_events for select to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_sub_events.portal_id
    and (ep.creator_id = auth.uid() or ep.creator_id = public.get_partner_id())
  ));

create policy "portal_sub_events: public select"
  on public.portal_sub_events for select to anon
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_sub_events.portal_id and ep.is_published = true
  ));

create policy "portal_sub_events: owner insert"
  on public.portal_sub_events for insert to authenticated
  with check (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_sub_events.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_sub_events: owner update"
  on public.portal_sub_events for update to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_sub_events.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_sub_events: owner delete"
  on public.portal_sub_events for delete to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_sub_events.portal_id and ep.creator_id = auth.uid()
  ));


-- PORTAL_GUESTS: Owner CRUD via portal, no anon access
alter table public.portal_guests enable row level security;

create policy "portal_guests: owner select"
  on public.portal_guests for select to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_guests.portal_id
    and (ep.creator_id = auth.uid() or ep.creator_id = public.get_partner_id())
  ));

create policy "portal_guests: owner insert"
  on public.portal_guests for insert to authenticated
  with check (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_guests.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_guests: owner update"
  on public.portal_guests for update to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_guests.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_guests: owner delete"
  on public.portal_guests for delete to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_guests.portal_id and ep.creator_id = auth.uid()
  ));


-- PORTAL_RSVPS: Owner read/delete, anon insert on published portals
alter table public.portal_rsvps enable row level security;

create policy "portal_rsvps: owner select"
  on public.portal_rsvps for select to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_rsvps.portal_id
    and (ep.creator_id = auth.uid() or ep.creator_id = public.get_partner_id())
  ));

create policy "portal_rsvps: public insert"
  on public.portal_rsvps for insert to anon
  with check (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_rsvps.portal_id and ep.is_published = true
  ));

create policy "portal_rsvps: authenticated insert"
  on public.portal_rsvps for insert to authenticated
  with check (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_rsvps.portal_id
  ));

create policy "portal_rsvps: owner delete"
  on public.portal_rsvps for delete to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_rsvps.portal_id and ep.creator_id = auth.uid()
  ));


-- PORTAL_MAP_PINS: Owner CRUD, anon read for published
alter table public.portal_map_pins enable row level security;

create policy "portal_map_pins: owner select"
  on public.portal_map_pins for select to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_map_pins.portal_id
    and (ep.creator_id = auth.uid() or ep.creator_id = public.get_partner_id())
  ));

create policy "portal_map_pins: public select"
  on public.portal_map_pins for select to anon
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_map_pins.portal_id and ep.is_published = true
  ));

create policy "portal_map_pins: owner insert"
  on public.portal_map_pins for insert to authenticated
  with check (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_map_pins.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_map_pins: owner update"
  on public.portal_map_pins for update to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_map_pins.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_map_pins: owner delete"
  on public.portal_map_pins for delete to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_map_pins.portal_id and ep.creator_id = auth.uid()
  ));


-- PORTAL_ANALYTICS: Owner read, anon insert on published (view tracking)
alter table public.portal_analytics enable row level security;

create policy "portal_analytics: owner select"
  on public.portal_analytics for select to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_analytics.portal_id
    and (ep.creator_id = auth.uid() or ep.creator_id = public.get_partner_id())
  ));

create policy "portal_analytics: public insert"
  on public.portal_analytics for insert to anon
  with check (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_analytics.portal_id and ep.is_published = true
  ));

create policy "portal_analytics: authenticated insert"
  on public.portal_analytics for insert to authenticated
  with check (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_analytics.portal_id
  ));


-- PORTAL_MEDIA: Owner CRUD, anon read for published
alter table public.portal_media enable row level security;

create policy "portal_media: owner select"
  on public.portal_media for select to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_media.portal_id
    and (ep.creator_id = auth.uid() or ep.creator_id = public.get_partner_id())
  ));

create policy "portal_media: public select"
  on public.portal_media for select to anon
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_media.portal_id and ep.is_published = true
  ));

create policy "portal_media: owner insert"
  on public.portal_media for insert to authenticated
  with check (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_media.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_media: owner update"
  on public.portal_media for update to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_media.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_media: owner delete"
  on public.portal_media for delete to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_media.portal_id and ep.creator_id = auth.uid()
  ));


-- PORTAL_REGISTRY: Owner CRUD, anon read + update (claim) for published
alter table public.portal_registry enable row level security;

create policy "portal_registry: owner select"
  on public.portal_registry for select to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_registry.portal_id
    and (ep.creator_id = auth.uid() or ep.creator_id = public.get_partner_id())
  ));

create policy "portal_registry: public select"
  on public.portal_registry for select to anon
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_registry.portal_id and ep.is_published = true
  ));

create policy "portal_registry: owner insert"
  on public.portal_registry for insert to authenticated
  with check (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_registry.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_registry: owner update"
  on public.portal_registry for update to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_registry.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_registry: public update"
  on public.portal_registry for update to anon
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_registry.portal_id and ep.is_published = true
  ));

create policy "portal_registry: owner delete"
  on public.portal_registry for delete to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_registry.portal_id and ep.creator_id = auth.uid()
  ));


-- PORTAL_FORM_FIELDS: Owner CRUD, anon read for published
alter table public.portal_form_fields enable row level security;

create policy "portal_form_fields: owner select"
  on public.portal_form_fields for select to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_form_fields.portal_id
    and (ep.creator_id = auth.uid() or ep.creator_id = public.get_partner_id())
  ));

create policy "portal_form_fields: public select"
  on public.portal_form_fields for select to anon
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_form_fields.portal_id and ep.is_published = true
  ));

create policy "portal_form_fields: owner insert"
  on public.portal_form_fields for insert to authenticated
  with check (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_form_fields.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_form_fields: owner update"
  on public.portal_form_fields for update to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_form_fields.portal_id and ep.creator_id = auth.uid()
  ));

create policy "portal_form_fields: owner delete"
  on public.portal_form_fields for delete to authenticated
  using (exists (
    select 1 from public.event_portals ep
    where ep.id = portal_form_fields.portal_id and ep.creator_id = auth.uid()
  ));


-- ── REALTIME ────────────────────────────────────────────────

alter publication supabase_realtime add table public.portal_rsvps;


-- ── STORAGE BUCKET ──────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portal-media',
  'portal-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']
) on conflict (id) do nothing;

-- Storage policies: authenticated users can upload to their own portal folder
create policy "portal-media: authenticated upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portal-media');

create policy "portal-media: public read"
  on storage.objects for select to anon
  using (bucket_id = 'portal-media');

create policy "portal-media: authenticated read"
  on storage.objects for select to authenticated
  using (bucket_id = 'portal-media');

create policy "portal-media: owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portal-media');
