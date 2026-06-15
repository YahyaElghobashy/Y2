# Hayah — Master Design Prompt (v0)

> Paste this into **Google Stitch** or **Claude Designer** to set the tone. Attach screenshots from `hayah-moodboard.html` + the Reference Gallery links. Start with the **Home** screen brief at the bottom.

---

## 0. The one-liner (read this first)

**Hayah** (حياة, "life") is a private, bilingual (English + Egyptian Arabic) mobile PWA for one couple — Yahya & Yara. Its visual identity:

> **"Cairo meets Los Santos, run through a risograph press."**

Warm editorial **pop** with a **handmade soul**. The confidence and color of a GTA-V loading-screen poster — but printed by hand on warm paper, with sacred Islamic geometry in the margins. It is a **keepsake box inside a living room that grows with the couple**: a collection that *accrues*, never a dashboard that resets.

**The north star:** she closes the app feeling **closer, and a little lighter** — a deep connection that is subtle and fun.

**The #1 enemy: corporate SaaS.** If a screen could belong to any other app, it has failed.

---

## 1. Feeling targets (design every screen against these)

- **Core, always-on:** safe · warm · serene — *but never sleepy*. Calm with a pulse.
- **Surface:** playful · summery · exciting · refreshing.
- **Forbidden:** cold, clinical, gray, generic, Inter-blue, hearts-everywhere kitsch.
- **Metaphor:** poster-cards you collect into a keepsake box; a home that fills up over years.

---

## 2. Color system — "Golden Hour, Comfortable"

Warm sunlit **grounds** carry every screen. Saturated **Los-Santos pops** appear only as small, confident accents and duotone illustration — never walls of color. Tuned for 10–15 calm minutes of daily use (no eye strain, no pure white, no pure black).

**Day (default):**
| Role | Name | Hex |
|---|---|---|
| Page ground | Sunlit Paper | `#F7EFE3` |
| Surface / cards | Sand | `#EBDDC7` |
| Deep ground | Warm Clay | `#E4CDAE` |
| Text / ink | Espresso | `#2A2018` |
| Secondary ink | Soft Bark | `#6B5D4F` |
| Accent (brand) | Terracotta | `#C8552B` |
| Accent (sun) | Sun Amber | `#F2A93B` |
| Warm CTA | Sunset Coral | `#E5663C` |
| Cool counterpoint | Oasis Teal | `#1F8A8A` |
| Soft accent | Dusty Rose | `#E0857A` |
| Depth / night seed | Dusk Indigo | `#2B2F5E` |

**Night (adaptive — the app's skin shifts golden→dusk→night with time of day / prayer rhythm):**
`#191A2C` ground · `#23263F` card · `#F2A93B` lantern · `#3FB0A8` teal glow · `#F07B54` ember coral · `#F2E9DB` moon ink.

**Rules:** warm–cool tension is the engine (terracotta/amber vs teal/indigo). All illustration & photography rendered in **duotone** pairs: *Indigo×Coral, Teal×Amber, Terracotta×Rose, Espresso×Amber*. Color is a **pop**, never a flood.

---

## 3. Typography — the Voice Map

Type is a **cast of registers**, each with a job. Use the variety deliberately; that's the soul.

| Register | Font (candidate) | Where it speaks |
|---|---|---|
| **Bold & tender** | Bricolage Grotesque (700–800) | Hero headers, greetings, celebrations |
| **Editorial & elegant** | Fraunces (high-contrast, soft optical) | Memories, letters, prompts, quotes |
| **Cold & confident** | Space Grotesk (500–700) | CoYYns, stats, nav, system chrome, data |
| **Intimate / handmade** | Caveat (handwritten) | Pet-name notes, signatures, secret corners |
| **Arabic / editorial** | Amiri (candidate) | Bilingual headings, du'a, RTL text |

**Rules:** big confident headlines, generous line spacing, **left-aligned** by default (center sparingly). Numbers (CoYYns, dates) are bold and proud in Space Grotesk. Never Inter / Roboto / system sans. Max 2 type registers visible per screen unless a moment earns more.

---

## 4. Layout & composition

- **Mobile-first, 375px up.** Thumb-reachable. PWA, installable.
- **Cards are posters, not boxes:** one confident focal point, bold type, warm grain, real negative space. Soft shadows over hard borders.
- **Rhythm:** generous padding (20–24px), cards float on the warm ground. Let it breathe — when in doubt, add space.
- **Collections** (memories, coupons, wishlist) use a **bento / scrapbook** grid — varied tile sizes, like pinned keepsakes, not uniform rows.
- **RTL-ready:** logical layout (start/end, not left/right) for Arabic.
- **Radius:** cards 20–22px, buttons/pills 999px (fully round) or 12px, inputs 10–12px.

---

## 5. Texture, pattern & illustration

- **Risograph grain** on warm surfaces (subtle, 5–10% — felt, not seen).
- **Halftone dots** for shadows/depth in illustration.
- **Islamic geometry as structure** — 6/8-point star lattices as dividers, margins, spiritual-corner backdrops. Never busy full-bleed wallpaper.
- **Illustration style:** bold riso/poster — flat color, halftone shading, thick-but-warm forms, sun-soaked. Think Stephen Bliss warmth meets vintage Cairo travel poster. Duotone always.
- **Photography:** golden-hour, warm, long soft shadows; treat in duotone to match palette.

---

## 6. Motion (for tools that animate / for the handoff note)

- **~⅔ cinematic-smooth** (confident glides, film-cut transitions — GTA-menu energy) **+ ~⅓ alive-responsive** (playful micro-reactions), dialed per page.
- **Calibrated celebration:** confetti-grade for milestones (coupon redeemed, ritual streak, game won); a quiet warm glow for everyday acts.
- Ease-out, decelerate, never harsh. Loading = gentle warm pulse, not spinners.

---

## 7. Component language

- **Buttons:** filled coral/terracotta pills for primary; ghost/outline for secondary. Bold label, confident.
- **CoYYns:** big Space-Grotesk numerals, amber/indigo, coin-stamp feel.
- **Coupons:** perforated poster-tickets (torn edge), coral/duotone, redeemable stamp.
- **Memories/keepsakes:** Fraunces body, handwritten signature, date stamp, polaroid/pinned feel.
- **Nav:** bottom bar, 4–5 items, icon + active label, terracotta active state, warm ground.
- **Icons:** Lucide line icons, ~1.75 stroke, slightly hand-feel; never multicolor icon sets.

---

## 8. Hard NOs

Inter / Roboto / system fonts · generic SaaS blue · cold gray (no neutral grayscale anywhere) · pure `#000` / pure `#fff` · hearts-everywhere couple kitsch · bubblegum pink · stocky gradients & heavy drop-shadows · centered everything · busy clutter · uniform boring grids.

---

## 9. FIRST SCREEN BRIEF → **Home / The Living Room**

> Generate this screen first. It is the daily open and the hero — sets the whole tone.

Design the **Home screen** of Hayah for mobile (375–430px). It's the first thing the couple sees each day — a warm "living room" that greets them and shows the life accruing between them.

**Must include:**
1. **A warm greeting** at golden-hour: bold Bricolage headline (e.g. "Welcome home, you two." / a time-aware salaam), with a soft handwritten sub-note.
2. **A "today" strip** — Space Grotesk: CoYYns balance, coupons live, next date/ritual — confident, small, data-cool.
3. **The keepsake feed** — a bento/scrapbook of recent shared moments (a memory note in Fraunces, a redeemed coupon poster-ticket, a game result), varied tile sizes, pinned-not-listed.
4. **One gentle prompt** to add to the box today (a question, a coupon, a note) — inviting, never nagging.
5. **Bottom nav** — warm, 4–5 items.

**Tone:** golden-hour light, warm paper ground, terracotta/amber/teal accents as pops, riso grain, one Islamic-geometry divider. It should feel like opening a beautiful keepsake box, not an app dashboard. Calm, but with a smile.

Deliver **light (golden day)** and **dark (lantern night)** variants.

---

## 10. Stitch — condensed prompt (paste if Stitch wants it short)

```
Design "Hayah" — a private couple's PWA, mobile-first. Identity: "Cairo meets Los Santos, run through a risograph press" — warm editorial pop + handmade soul, anti-SaaS. Ground: warm sunlit paper #F7EFE3 / sand #EBDDC7 / clay #E4CDAE, espresso ink #2A2018. Accents as small pops: terracotta #C8552B, sun amber #F2A93B, sunset coral #E5663C, oasis teal #1F8A8A, dusk indigo #2B2F5E. Duotone illustration only. Fonts: Bricolage Grotesque (bold headers), Fraunces (editorial serif for memories/letters), Space Grotesk (data/CoYYns/nav), Caveat (handwritten notes). Cards = warm poster-tiles with riso grain, soft shadow, big type, left-aligned, generous space, bento/scrapbook collections, Islamic-geometry dividers. Bottom nav, pill buttons, perforated coupon tickets. NO gray, NO Inter, NO SaaS, NO pure white/black, NO hearts kitsch. Screen: Home / "living room" — golden-hour greeting + today strip (CoYYns, coupons, next date) + keepsake bento feed + one gentle add-prompt + bottom nav. Light (golden day) + dark (lantern night #191A2C). Feeling: calm with a pulse; she closes it feeling closer and lighter.
```

---

## 11. Image-gen prompts (hero art via Imagen / Sora / GPT-Image)

**A — Home hero illustration:**
```
Risograph-style poster illustration, two-color duotone (terracotta #C8552B + dusk indigo #2B2F5E) on warm cream paper #F7EFE3, visible halftone grain and slight misregister. A cozy Cairo rooftop at golden hour: two coffee cups on a low table, string lights, a distant minaret and palm silhouette, soft long shadows. Flat shapes, bold confident composition, 1970s travel-poster + GTA-loading-screen energy, warm and intimate. No text. No people's faces. Handmade print feel.
```

**B — Empty-state / keepsake motif:**
```
Risograph duotone (oasis teal #1F8A8A + sun amber #F2A93B) on warm paper, halftone grain. An open keepsake box overflowing with small mementos — a folded letter, a ticket stub, a pressed flower, a tiny coin. Flat poster illustration, Islamic 8-point star subtly embossed in background, warm and nostalgic, bold simple forms. No text.
```

**C — Texture tile:**
```
Seamless risograph paper texture, warm clay #E4CDAE base, fine grain, faint 8-point Islamic star lattice in terracotta at 6% opacity, subtle halftone. Tileable, flat, print-press feel.
```

---

*Pair with `hayah-moodboard.html`. After Stitch/Designer returns Home, we vet → iterate → then the Love Economy screens.*
