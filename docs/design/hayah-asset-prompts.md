# Hayah — Asset Prompt Library v1

Text-to-image + image-to-video prompts to build every illustration, pattern, icon, stamp and background in the Hayah world. You generate outside Claude; bring results back; I polish, finalize, or reject.

**Identity:** *"Cairo meets Los Santos, run through a risograph press."* Warm editorial pop, handmade soul, golden-hour, anti-SaaS.

---

## 0. How to use this

1. Pick an asset below. Copy its prompt.
2. **Append the GLOBAL STYLE TOKEN** (§0.1) to every prompt — that's what keeps 50 assets feeling like one world.
3. Paste the **NEGATIVE PROMPT** (§0.2) where the tool supports it.
4. Use the **recommended tool** + **aspect ratio** noted on each.
5. Bring 2–4 variations back per asset. We keep the one that feels right.

### 0.1 — GLOBAL STYLE TOKEN (paste at end of every image prompt)
```
::style:: risograph screenprint aesthetic, 2–3 spot inks overprinted with visible halftone grain, slight misregistration and ink texture, printed on warm uncoated cream paper (#F7EFE3), flat bold shapes, confident poster composition, golden-hour warmth, handmade and tactile. Palette: terracotta #C8552B, sun amber #F2A93B, sunset coral #E5663C, oasis teal #1F8A8A, dusk indigo #2B2F5E, dusty rose #E0857A, espresso #2A2018 on cream. In the spirit of Lorna Robey, Emmanuelle Orr, Atelier Hourra. Limited palette, no smooth digital gradients, no 3D, no photoreal.
```

### 0.2 — NEGATIVE PROMPT (paste in negative field)
```
corporate, SaaS dashboard, flat vector clipart, generic stock illustration, Inter/Helvetica, neon, glossy, 3D render, photorealistic, harsh contrast, cluttered, busy, gray, drop shadow, bevel, watermark, signature, garbled text, extra fingers, hearts everywhere, cutesy kawaii
```

### 0.3 — TOOL CHEAT-SHEET
| Need | Best tool |
|---|---|
| Richest texture / illustration | **Midjourney v7** (add `--style raw --stylize 250`) |
| Reliable + good prompt-following | **Imagen 3 (Gemini)** / **GPT-Image (ChatGPT)** |
| **Lettering inside the image** (riso type posters) | **Ideogram 2.0** (best text) |
| Icons / vectors / repeatable brand style | **Recraft v3** (has riso styles + "style sets") |
| Upscale + add grain | **Magnific / Krea** |
| **Image → video** (animate a still) | **Runway Gen-3**, **Kling 1.6**, **Luma Dream Machine**, **Hailuo/MiniMax**, **Sora**, **Pika** |
| Transparent PNG (icons/spots) | Recraft, Ideogram (remove bg), or GPT-Image |

> **Aspect ratios:** Hero screens `9:16`. Cards `4:5`. Spots/icons/stamps `1:1`. Pattern tiles `1:1` (say "seamless tileable"). Wordmark `3:1`.

---

## A. HERO SCENE ILLUSTRATIONS (9:16 or 4:5)

These anchor whole screens. Bold, warm, one focal idea, lots of sky/space for text overlay.

**A1 · Home / Living Room (the daily open)** — *Imagen 3 / Midjourney · 9:16*
```
A cozy Cairo rooftop at golden hour, seen from a low intimate angle: two specialty-coffee cups steaming on a small wooden table, a string of warm fairy lights, potted plants, a distant minaret and palm silhouette against a hazy amber sky, long soft shadows, a cat dozing nearby. Two-color duotone (terracotta + dusk indigo) with warm amber light. Empty sky at top for text. Inviting, calm, lived-in.
```
→ **video (A1-v):** `Subtle ambient loop: steam rising gently from the coffee cups, fairy lights twinkling slowly, a faint warm haze drift in the sky, leaves barely swaying. No camera cuts, very slow, seamless 4s loop.` (Runway/Kling)

**A2 · The Keepsake Box (brand metaphor / empty states)** — *Midjourney · 1:1*
```
An open vintage keepsake box overflowing with small mementos — a folded handwritten letter, a torn ticket stub, a pressed flower, a polaroid, a tiny gold coin, a seashell. Warm overhead light, flat poster illustration, halftone shading. A faint 8-point Islamic star embossed into the box lining. Duotone amber + teal on cream. Nostalgic, treasured.
```
→ **video (A2-v):** `Slow push-in toward the open box, the polaroid and letter edges lift slightly as if a breeze, dust motes float in warm light. Gentle, 5s loop.`

**A3 · Date Night** — *Imagen 3 · 4:5*
```
Two silhouetted figures sharing a tiny table on a Cairo balcony at dusk, a single candle between them, the city glowing amber-and-indigo below, crescent moon, soft bokeh of distant windows. Romantic but unsentimental. Duotone indigo + coral, halftone grain. Bold simple shapes.
```
→ **video (A3-v):** `Candle flame flickers warmly, distant window lights twinkle, a very slow parallax as the city softly breathes. 5s seamless.`

**A4 · Soul / Quiet Prayer Corner (spiritual module)** — *Midjourney · 9:16*
```
A serene prayer corner bathed in mashrabiya light: warm geometric shadows falling across a simple prayer rug, an open Qur'an on a low stand, a hanging brass lantern, a single window casting golden 8-point-star light patterns on the floor. Calm, sacred, minimal. Duotone amber + deep teal on cream, soft halftone. Generous empty space, reverent stillness.
```
→ **video (A4-v):** `The geometric light patterns shift almost imperceptibly across the floor as if the sun moves, dust motes drift in the light beam, lantern glow pulses faintly. Extremely slow, meditative, 6s loop.`

**A5 · The Garden (garden module — things you grow together)** — *Imagen 3 · 4:5*
```
A small flourishing rooftop garden in warm clay pots — herbs, a young lemon tree, climbing jasmine, a tiny watering can — golden afternoon light, a bee, butterflies. Optimistic and tender, growth as metaphor. Duotone sage-teal + amber, halftone, flat bold forms on cream paper.
```
→ **video (A5-v):** `Leaves and jasmine sway gently, a butterfly drifts across frame and out, soft light flicker through leaves. 4s seamless loop.`

**A6 · Game Night (the games module)** — *Midjourney · 4:5*
```
A playful flat-lay from above: two hands reaching toward a scatter of game cards, a glowing D20 die, two coffee cups, a phone showing a question, warm lamplight, confetti mid-air. Fun, energetic, intimate. Duotone coral + indigo with amber pops, bold halftone, riso poster energy.
```
→ **video (A6-v):** `Confetti pieces drift down slowly, the D20 glints, a card flips over revealing nothing yet. Light, bouncy, 4s loop.`

**A7 · Night-Drive Skyline (dark-theme hero)** — *Midjourney · 9:16*
```
A warm Cairo night skyline from a moving rooftop view — minarets, neon-warm signage, the Nile reflecting amber lights, deep indigo sky with stars and a crescent moon, a lit lantern in the foreground. Cinematic, GTA-loading-screen energy but warm and tender, not gritty. Duotone indigo + lantern amber, ember coral accents, halftone grain.
```
→ **video (A7-v):** `Slow cinematic pan across the skyline, signage glows flicker, river reflections shimmer, stars twinkle. Smooth, filmic, 6s.`

**A8 · Specialty Coffee Ritual (his world)** — *Imagen 3 · 1:1*
```
A loving close-up of a pour-over coffee ritual at golden hour: gooseneck kettle pouring a spiral into a dripper, steam, beans scattered, a vinyl record nearby, warm window light. Cozy, ritualistic, handmade. Duotone espresso + amber on cream, halftone, bold flat shapes.
```
→ **video (A8-v):** `The pour stream falls and steam curls upward, the vinyl spins slowly in the background. Warm, hypnotic, 4s loop.`

---

## B. SPOT ILLUSTRATIONS (1:1, transparent PNG)

Small objects for cards, list items, rewards. Same riso style, isolated on transparent/cream, consistent line weight.

> **Batch tip:** generate as a **set in one prompt** for consistency. Recraft "style set" or Midjourney `--tile` off.

**B1 · The icon-object set** — *Recraft / Imagen · 1:1 transparent*
```
A cohesive set of 12 small riso-style spot illustrations on transparent background, identical bold flat style and line weight: (1) a gold coin stamped with "YY", (2) a perforated love-coupon ticket, (3) a folded handwritten letter, (4) a brass lantern, (5) a crescent moon + star, (6) a specialty coffee cup, (7) a vinyl record, (8) a D20 die, (9) a potted jasmine, (10) a calendar page, (11) a keepsake box, (12) a heart made of stitched ribbon (not a cute heart). Duotone terracotta + amber with cream highlights, halftone texture. Matching family, poster-quality.
```

**B2 · CoYYn coin (the currency — hero spot)** — *Ideogram (for the YY) · 1:1*
```
A warm gold coin, slightly worn and hand-pressed, embossed with a stylized "YY" monogram and a tiny 8-point Islamic star border, halftone shading giving it depth, riso print texture, sitting at a slight 3/4 angle. Amber + espresso duotone on transparent. Tactile, collectible, like a treasured token — NOT a flat app icon.
```
→ **video (B2-v):** `The coin slowly spins / flips 360°, catching warm light, faint sparkle on the YY. Seamless loop, 3s.` (for the "earned CoYYns" celebration)

---

## C. PATTERNS & TEXTURES (seamless, 1:1 tileable)

Structure, not decoration. Used for dividers, margins, spiritual backdrops, card textures.

**C1 · Zellij 8-point lattice** — *Recraft / Imagen · 1:1 seamless*
```
A seamless tileable Islamic zellij geometric pattern, interlocking 8-point stars and crosses, hand-glazed terracotta + teal + amber tiles with grout lines, subtle halftone and riso grain, warm and slightly imperfect. Flat top-down, low contrast so text can sit over it. Repeats perfectly.
```

**C2 · Sunburst rays (celebration backdrop)** — *Midjourney · 1:1*
```
A retro risograph sunburst: radiating amber and coral rays emanating from a central warm sun, halftone gradient, slight misregistration, on cream paper. 1970s travel-poster optimism, bold and warm. Symmetrical, joyful.
```

**C3 · Mashrabiya screen (light + shadow divider)** — *Imagen · 1:1 seamless*
```
A seamless mashrabiya wooden lattice screen casting warm geometric shadows, intricate turned-wood star geometry, golden light filtering through, espresso + amber duotone, halftone, tileable. Calm, architectural, Cairo.
```

**C4 · Halftone gradient field (card texture)** — *any · 1:1 seamless*
```
A seamless risograph halftone dot gradient, terracotta dots fading into warm cream, slight grain and ink texture, very subtle, low contrast — a background texture for cards. Tileable.
```

**C5 · Arabesque divider strip** — *Recraft · 3:1 transparent*
```
A horizontal arabesque divider ornament, symmetrical interlacing vine-and-star motif, single-ink terracotta with halftone, hand-printed feel, on transparent. Elegant, thin, for separating sections.
```

---

## D. ICONOGRAPHY (UI line icons — cohesive set)

For nav + buttons. Must feel hand-drawn-warm, not generic Lucide-perfect.

**D1 · Nav + action icon set** — *Recraft v3 (icon mode) · 1:1*
```
A cohesive set of 16 line icons, ~1.75px warm stroke with a slight hand-drawn wobble, rounded terminals, riso-ink texture on the strokes, espresso color on transparent: home, heart-token, coin, coupon-ticket, calendar, camera, prayer-beads, garden-leaf, game-dice, gift, bell, settings-gear, map-pin, book, music-note, user-pair. Consistent grid, consistent weight, printed feel — warm and characterful, not sterile.
```

---

## E. AVATARS / THE COUPLE (duotone portrait style)

Turn your real photos into the Hayah world.

**E1 · Avatar treatment (feed a photo)** — *Midjourney (`/describe` then style) or GPT-Image with image input · 1:1*
```
Convert this portrait into a risograph poster illustration: bold flat shapes, 2-color duotone (terracotta + indigo) with halftone shading, slight misregistration, warm cream paper, confident editorial style in the spirit of GTA loading-screen art but warm and tender. Keep the likeness, simplify into print. No background clutter — soft warm halo.
```
→ **video (E1-v):** `Very subtle living-portrait: a slow blink, faint smile, hair moves slightly, grain shimmer. 3s loop.` (for profile / pairing moments)

---

## F. STAMPS, BADGES & SEALS (rewards / milestones)

The "calibrated celebration" system — physical-feeling marks.

**F1 · "Redeemed" / status stamps** — *Ideogram · 1:1 transparent*
```
A vintage rubber ink stamp impression reading "REDEEMED" in bold condensed letters inside a double-ring border with two small 8-point stars, terracotta ink, imperfect smudged edges, slightly rotated, transparent background. Authentic hand-stamped feel. (Variations: "MABROUK", "SEALED WITH LOVE", "DONE", "OUR SECRET".)
```

**F2 · Milestone seal / wax-stamp** — *Midjourney · 1:1 transparent*
```
A warm wax seal embossed with a "YY" monogram and 8-point star ring, terracotta-and-amber, soft shadow, halftone, transparent background. For anniversaries and big milestones. Precious, ceremonial.
```

**F3 · Streak / achievement badge** — *Recraft · 1:1*
```
A circular riso achievement badge: amber sunburst center, ribbon banner below reading a number, 8-point star border, espresso + amber duotone, halftone, hand-printed. Collectible enamel-pin feel without the gloss.
```

---

## G. DISPLAY TYPE POSTERS (celebration / hero lettering)

Big bold riso lettering moments — like the "ZONE / NAH / YUP" posters you pinned. For full-screen celebration takeovers.

**G1 · Bold riso word poster** — *Ideogram 2.0 (text!) · 9:16*
```
A bold risograph type poster, one word filling the frame in heavy custom display letters (Bricolage-Grotesque-like), letters overprinted in coral + indigo with halftone and slight misregistration on warm cream paper, tiny 8-point stars in negative space. The word: "MABROUK". Confident, joyful, screenprinted. (Swap word: "YALLA", "100 DAYS", "HABIBI", "REDEEMED", "DATE NIGHT".)
```
→ **video (G1-v):** `The letters settle in with a subtle print-registration shift, grain shimmers, a couple of stars twinkle. Punchy, 2s, then holds.`

---

## H. BACKGROUNDS & THE LIVING SKIN

Full-screen grounds for day and night themes.

**H1 · Golden-hour day skin** — *any · 9:16*
```
A warm abstract golden-hour background: soft radial glows of amber, terracotta and a touch of teal blooming on warm cream paper, very subtle risograph grain, no hard shapes, gentle and calm. Lots of breathing room. Background only.
```
→ **video (H1-v):** `The warm glows drift and breathe extremely slowly, like light moving through a room over an hour. 8s seamless loop.`

**H2 · Lantern-night skin** — *any · 9:16*
```
A deep indigo night background (#191A2C) with warm lantern-amber and teal glows blooming softly, faint stars, a sliver of crescent, subtle riso grain. Calm, cinematic, intimate. Background only.
```
→ **video (H2-v):** `Stars twinkle slowly, the amber glow pulses faintly like a distant lantern, a slow drift. 8s loop.`

---

## I. LOGO / WORDMARK

**I1 · Hayah wordmark exploration** — *Ideogram · 3:1 transparent*
```
A warm editorial wordmark lockup for "Hayah" — bold Bricolage-Grotesque-style lowercase Latin paired with elegant Arabic "حياة" calligraphy beside or below it, terracotta + espresso, a tiny 8-point star as a dot/accent, riso print texture, on transparent. Premium, handmade, bilingual harmony. 6 variations.
```

---

## J. IMAGE → VIDEO — global guidance

For the "cinematic + alive" feel without heaviness. **Keep motion < 5–10%** — Hayah breathes, it doesn't perform.

- **Best tools:** Runway Gen-3 (control), Kling 1.6 (smooth realism), Luma (easy loops), Hailuo (cheap/fast).
- **Always say:** *"subtle, slow, seamless loop, no camera cuts, no morphing, preserve the illustration style."*
- **Good ambient verbs:** steam rising, lights twinkling, haze drifting, leaves swaying, candle flicker, slow parallax, dust motes, glow pulsing, gentle push-in, grain shimmer, coin spin, confetti fall.
- **Avoid:** fast pans, zooms that reveal AI warping, anything that makes flat illustration look 3D, faces talking.
- **Use for:** home hero ambient, celebration takeovers (G1-v, B2-v), empty states (A2-v), loading screens (H1-v/H2-v), profile avatars (E1-v).

---

## Generation order (what to make first)

1. **A1 Home hero** + **H1 day skin** → so we can mock the hero screen.
2. **B2 CoYYn coin** + **B1 object set** → powers the Love Economy.
3. **C1 zellij** + **C2 sunburst** + **C3 mashrabiya** → the texture system.
4. **I1 wordmark** → brand lockup.
5. Everything else as screens need them.

Bring back 2–4 variants each. I'll judge against the Constitution + moodboard, keep what sings, and tell you exactly what to re-roll.
