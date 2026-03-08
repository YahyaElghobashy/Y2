import type { PortalThemeConfig, PortalThemeColors } from "@/lib/types/portal.types"

// ── 4 Theme Presets ──

const ELEGANT_GOLD_COLORS: PortalThemeColors = {
  primary: "#C4956A",
  secondary: "#D4A574",
  background: "#FBF8F4",
  surface: "#FFFFFF",
  text: "#2C2825",
  textMuted: "#8C8279",
  border: "#E5D9CB",
}

const GARDEN_ROMANCE_COLORS: PortalThemeColors = {
  primary: "#6B8F6B",
  secondary: "#A8C5A8",
  background: "#F5F8F2",
  surface: "#FFFFFF",
  text: "#2D3B2D",
  textMuted: "#7A8E7A",
  border: "#D5DDD1",
}

const MINIMALIST_COLORS: PortalThemeColors = {
  primary: "#2C2C2C",
  secondary: "#6B6B6B",
  background: "#FAFAFA",
  surface: "#FFFFFF",
  text: "#1A1A1A",
  textMuted: "#999999",
  border: "#E5E5E5",
}

const MIDNIGHT_BLUE_COLORS: PortalThemeColors = {
  primary: "#7EC8E3",
  secondary: "#5BA3C0",
  background: "#0F1923",
  surface: "#1A2A3A",
  text: "#E8EDF2",
  textMuted: "#8899AA",
  border: "#2A3A4A",
}

export const THEME_PRESETS: Record<string, PortalThemeConfig> = {
  elegant_gold: {
    preset: "elegant_gold",
    colors: ELEGANT_GOLD_COLORS,
    fonts: { heading: "Playfair Display", body: "DM Sans" },
    borderRadius: "lg",
    spacing: "spacious",
  },
  garden_romance: {
    preset: "garden_romance",
    colors: GARDEN_ROMANCE_COLORS,
    fonts: { heading: "Lora", body: "DM Sans" },
    borderRadius: "md",
    spacing: "spacious",
  },
  minimalist: {
    preset: "minimalist",
    colors: MINIMALIST_COLORS,
    fonts: { heading: "DM Sans", body: "DM Sans" },
    borderRadius: "sm",
    spacing: "normal",
  },
  midnight_blue: {
    preset: "midnight_blue",
    colors: MIDNIGHT_BLUE_COLORS,
    fonts: { heading: "Playfair Display", body: "DM Sans" },
    borderRadius: "md",
    spacing: "normal",
  },
}

export const THEME_PRESET_META: Record<
  string,
  { label: string; description: string }
> = {
  elegant_gold: {
    label: "Elegant Gold",
    description: "Warm mineral tones with gold accents",
  },
  garden_romance: {
    label: "Garden Romance",
    description: "Fresh greens with natural elegance",
  },
  minimalist: {
    label: "Minimalist",
    description: "Clean monochrome with sharp typography",
  },
  midnight_blue: {
    label: "Midnight Blue",
    description: "Dark sophistication with cool accents",
  },
}

// ── Border Radius Map ──

const BORDER_RADIUS_MAP: Record<PortalThemeConfig["borderRadius"], string> = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  full: "9999px",
}

// ── Spacing Map ──

const SPACING_MAP: Record<PortalThemeConfig["spacing"], string> = {
  compact: "1.5rem",
  normal: "2.5rem",
  spacious: "4rem",
}

// ── CSS Variables Generator ──

export function generatePortalCSSVariables(config: PortalThemeConfig): Record<string, string> {
  const { colors, fonts, borderRadius, spacing } = config

  return {
    "--portal-primary": colors.primary,
    "--portal-secondary": colors.secondary,
    "--portal-bg": colors.background,
    "--portal-surface": colors.surface,
    "--portal-text": colors.text,
    "--portal-text-muted": colors.textMuted,
    "--portal-border": colors.border,
    "--portal-font-heading": `"${fonts.heading}", serif`,
    "--portal-font-body": `"${fonts.body}", sans-serif`,
    "--portal-radius": BORDER_RADIUS_MAP[borderRadius],
    "--portal-section-gap": SPACING_MAP[spacing],
  }
}

// ── CSS Variables String (for style attribute) ──

export function portalCSSVariablesString(config: PortalThemeConfig): string {
  const vars = generatePortalCSSVariables(config)
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ")
}

// ── Google Fonts URL Generator ──

export function getGoogleFontsUrl(config: PortalThemeConfig): string | null {
  const { fonts } = config
  const fontFamilies = new Set<string>()

  if (fonts.heading) fontFamilies.add(fonts.heading)
  if (fonts.body) fontFamilies.add(fonts.body)

  // Only load if non-system fonts are specified
  if (fontFamilies.size === 0) return null

  const params = Array.from(fontFamilies)
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&")

  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

// ── Default Theme ──

export function getDefaultTheme(): PortalThemeConfig {
  return { ...THEME_PRESETS.elegant_gold }
}

// ── Resolve Theme (merge preset with overrides) ──

export function resolveTheme(config: Partial<PortalThemeConfig>): PortalThemeConfig {
  const preset = config.preset
    ? THEME_PRESETS[config.preset] ?? THEME_PRESETS.elegant_gold
    : THEME_PRESETS.elegant_gold

  return {
    ...preset,
    ...config,
    colors: { ...preset.colors, ...config.colors },
    fonts: { ...preset.fonts, ...config.fonts },
  }
}
