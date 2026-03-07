# Y2 Design System

Aesthetic: **Warm Mineral** — sophisticated warmth. Think high-end stationery meets a calm evening. Not clinical, not cute. Every pixel should feel intentional, like it was placed by hand.

---

## Color Tokens

All colors are CSS custom properties defined in `app/globals.css` and mirrored as TS constants in `lib/theme.ts`.

### Core Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#FBF8F4` | Page background, main canvas |
| `--bg-secondary` | `#F5F0E8` | Section backgrounds, alternating areas |
| `--bg-elevated` | `#FFFFFF` | Cards, modals, elevated surfaces |
| `--text-primary` | `#2C2825` | Headings, primary body text |
| `--text-secondary` | `#8C8279` | Descriptions, secondary info |
| `--text-muted` | `#B5ADA4` | Placeholders, disabled states, timestamps |
| `--accent-primary` | `#C4956A` | Primary actions, active states, links |
| `--accent-hover` | `#B8865C` | Hover state for primary accent |
| `--accent-soft` | `#E8D5C0` | Soft highlights, selected backgrounds |
| `--accent-glow` | `rgba(196, 149, 106, 0.15)` | Focus rings, subtle glow effects |
| `--border-subtle` | `rgba(44, 40, 37, 0.08)` | Card borders, dividers |
| `--border-medium` | `rgba(44, 40, 37, 0.15)` | Input borders, stronger dividers |
| `--shadow-soft` | `0 2px 12px rgba(44, 40, 37, 0.06)` | Cards, elevated elements |
| `--shadow-medium` | `0 4px 24px rgba(44, 40, 37, 0.10)` | Modals, popovers |

### Semantic Colors

| Token | Value | Usage |
|---|---|---|
| `--success` | `#7CB67C` | Completed states, positive feedback |
| `--success-soft` | `#E8F5E8` | Success backgrounds |
| `--warning` | `#D4A04A` | Caution states, pending items |
| `--warning-soft` | `#FFF8E8` | Warning backgrounds |
| `--error` | `#C27070` | Error states, destructive actions |
| `--error-soft` | `#FDE8E8` | Error backgrounds |
| `--info` | `#6B9EC4` | Informational states |
| `--info-soft` | `#E8F0F8` | Info backgrounds |

### Gradients

```css
--gradient-warm: linear-gradient(135deg, #F5F0E8, #FBF8F4);
--gradient-accent: linear-gradient(135deg, #C4956A, #D4A574);
--gradient-card: linear-gradient(180deg, #FFFFFF, #FBF8F4);
--gradient-hero: linear-gradient(180deg, #F5F0E8 0%, #FBF8F4 40%, #FFFFFF 100%);
```

### V2 Copper Accent Tokens

Added during the UI redesign to reinforce the warm mineral identity with a distinct copper accent system.

| Token | Value | Usage |
|---|---|---|
| `--accent-copper` | `#B87333` | Primary copper accent — active indicators, selected states, brand emphasis. Deeper and warmer than `--accent-primary`. |
| `--accent-soft` | `#E8D5C0` | Soft copper highlight — pill backgrounds, hover fills, muted accent areas. (Shared with core palette.) |
| `--bg-parchment` | `#E5D9CB` | Warm parchment background — onboarding screens, auth pages, special surface treatment. Slightly darker/warmer than `--bg-secondary`. |

> **Usage note:** `--accent-copper` is the V2 brand copper used in the bottom nav indicator, pill tab bars, and interactive highlights. `--accent-primary` (#C4956A) remains the default for buttons and links. Use copper for UI chrome (nav, tabs, badges) and primary for semantic actions (CTAs, links, form accents).

---

## Typography

### Font Stack

```css
--font-display: 'Playfair Display', Georgia, serif;
--font-body: 'DM Sans', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
--font-serif: 'Lora', Georgia, serif;
--font-nav: 'Plus Jakarta Sans', system-ui, sans-serif;
```

Load via `next/font/google` in `app/layout.tsx`. Never use `@import` or `<link>`.

### V2 Accent Fonts

| Font | Tailwind Class | Usage |
|---|---|---|
| Lora | `font-serif` | Italic serif accents — pull quotes, letter headings, decorative emphasis. Use sparingly for warmth. |
| Plus Jakarta Sans | `font-nav` | Navigation labels, tab bars, bottom nav text, small caps UI labels. Geometric and clean. |

### Type Scale

| Name | Size | Weight | Line Height | Font | Usage |
|---|---|---|---|---|---|
| `display-lg` | 32px | 700 | 1.2 | Display | Hero headings, splash screens |
| `display-md` | 24px | 700 | 1.25 | Display | Page titles |
| `display-sm` | 20px | 600 | 1.3 | Display | Section headings |
| `heading` | 18px | 600 | 1.35 | Body | Card titles, sub-sections |
| `body-lg` | 16px | 400 | 1.6 | Body | Primary body text |
| `body` | 14px | 400 | 1.6 | Body | Default body text |
| `body-sm` | 13px | 400 | 1.5 | Body | Secondary text, descriptions |
| `caption` | 12px | 500 | 1.4 | Body | Labels, timestamps, badges |
| `mono` | 13px | 400 | 1.5 | Mono | Data values, times, codes |

### Rules
- Headings always use `--font-display`
- Body text always uses `--font-body`
- Never use font weights below 400 or above 700
- Arabic text: `--font-body` handles it well. Do NOT load a separate Arabic font.

---

## Spacing

Use Tailwind's default scale. Preferred spacings:

| Context | Value | Tailwind |
|---|---|---|
| Component internal padding | 16px | `p-4` |
| Card padding | 20px | `p-5` |
| Section gap | 24px | `gap-6` |
| Page horizontal padding | 20px | `px-5` |
| Page top padding | 16px | `pt-4` |
| Between cards | 12px | `gap-3` |
| Between form fields | 16px | `gap-4` |
| Icon to text | 8px | `gap-2` |
| Button internal padding | `12px 20px` | `px-5 py-3` |

---

## Border Radius

| Element | Value | Tailwind |
|---|---|---|
| Buttons | 12px | `rounded-xl` |
| Cards | 16px | `rounded-2xl` |
| Modals | 20px | `rounded-[20px]` |
| Inputs | 10px | `rounded-[10px]` |
| Avatars | Full | `rounded-full` |
| Tags/Badges | 8px | `rounded-lg` |

---

## Animation

Library: **Framer Motion** (import from `framer-motion`)
Helper components: `components/animations/` wrappers

### Core Principles
- Everything decelerates. Nothing bounces. Nothing overshoots.
- Think: turning a heavy page in a leather-bound book.
- Default duration: **200-300ms**
- Default easing: `[0.25, 0.1, 0.25, 1]` (ease-out cubic)
- Never animate layout properties (width, height) — use `scale` and `opacity`

### Standard Transitions

```typescript
// Use these everywhere. Import from lib/motion.ts
export const EASE_OUT = [0.25, 0.1, 0.25, 1];
export const EASE_IN_OUT = [0.42, 0, 0.58, 1];

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: EASE_OUT },
};

export const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: EASE_OUT },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: 0.2, ease: EASE_OUT },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
```

### Interaction Patterns

| Interaction | Animation |
|---|---|
| Button press | `scale: 0.98` on tap, `0.2s` |
| Button hover | Slight color shift to `--accent-hover`, `0.15s` |
| Card hover | `scale: 1.02`, shadow expands to `--shadow-medium`, `0.2s` |
| Tab switch | Underline slides with `layoutId`, content crossfades |
| Page transition | `slideUp` variant, `0.3s` |
| List items | Stagger in with `0.06s` delay between items |
| Toggle | Smooth slide with spring `{ damping: 20, stiffness: 300 }` |
| Pull to refresh | Custom — gentle pull with opacity fade |
| Loading states | Gentle pulse (`opacity: 0.4 → 1`), NOT spinners |
| Number changes | Count animation using `motion.span` with `animate` |
| Modal open | `scaleIn` variant |
| Notification | Slide in from top, `0.3s`, auto-dismiss with fade |

### Relaxed Animation Rules
- **Bounce/spring effects**: Allowed for micro-interactions and entrance animations. Use `type: "spring"` with `damping: 12-15`, `stiffness: 150-200`.
- **Rotation animations**: Allowed for decorative elements, ambient effects, and mascot interactions.
- **Infinite looping**: Allowed for ambient backgrounds (gradient blobs), glow pulses, shimmer effects. Keep subtle (low opacity, long duration 15-25s).
- **Long durations**: Allowed for ambient/atmospheric animations (>500ms ok for non-interactive elements like background blobs, wordmark reveals).
- **Scale limit**: Relaxed to **1.15** for brand emphasis elements (e.g., wordmark "YY" letters). General UI stays at 1.05 max.
- No parallax scrolling
- Default easing remains `[0.25, 0.1, 0.25, 1]` for general UI transitions
- Spring presets for bouncy interactions: `{ damping: 12-15, stiffness: 150-200 }`

---

## Component Patterns

### Card Pattern
```tsx
<motion.div
  className="rounded-2xl bg-bg-elevated p-5 border border-border-subtle shadow-soft"
  whileHover={{ scale: 1.02 }}
  transition={{ duration: 0.2, ease: EASE_OUT }}
>
  {children}
</motion.div>
```

### Button Pattern
Always use shadcn `<Button>` with custom variant styling. Never build buttons from scratch.

### Input Pattern
Always use shadcn `<Input>` with custom border radius and colors via CSS variables.

### Page Layout Pattern
```tsx
<main className="min-h-screen bg-[var(--bg-primary)] px-5 pt-4 pb-24">
  <PageTransition>
    {/* pb-24 accounts for bottom nav */}
    {content}
  </PageTransition>
</main>
```

### Bottom Navigation
Fixed at bottom. 4 items max. Active state uses `--accent-primary`. Inactive uses `--text-muted`. No labels on inactive items — icon only. Active item shows label with `layoutId` animated indicator.

---

## Iconography

Use **Lucide React** exclusively. Never mix icon sets. Preferred icon size: `20px` for navigation, `18px` for inline, `24px` for empty states.

Preferred stroke width: `1.75` (slightly thinner than default for elegance).

---

## Dark Mode

Not for V1. The warm palette is designed for light mode. Dark mode is a Phase 8+ consideration.

---

## Do NOT

- Use Inter, Roboto, Arial, or system fonts
- Use purple as an accent color
- Use generic blue (#007bff) or generic green (#28a745)
- Create cards with no border AND no shadow (they'll float meaninglessly)
- Use `text-black` or `text-white` — use the token equivalents
- Use `bg-white` or `bg-gray-*` — use the warm palette tokens
- Center everything — use left-alignment as default, center sparingly
- Add decorative elements that serve no purpose
- Use gradients on text (readability issue)
- Use more than 2 font weights on any single screen
