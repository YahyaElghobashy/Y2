import { describe, it, expect } from "vitest"
import {
  THEME_PRESETS,
  THEME_PRESET_META,
  generatePortalCSSVariables,
  portalCSSVariablesString,
  getGoogleFontsUrl,
  getDefaultTheme,
  resolveTheme,
} from "@/lib/portal-themes"
import type { PortalThemeConfig } from "@/lib/types/portal.types"

describe("Portal Theme Engine", () => {
  // ── Unit: Theme presets ──

  it("has 4 theme presets", () => {
    expect(Object.keys(THEME_PRESETS)).toHaveLength(4)
    expect(THEME_PRESETS).toHaveProperty("elegant_gold")
    expect(THEME_PRESETS).toHaveProperty("garden_romance")
    expect(THEME_PRESETS).toHaveProperty("minimalist")
    expect(THEME_PRESETS).toHaveProperty("midnight_blue")
  })

  it("each preset has all required fields", () => {
    for (const [key, preset] of Object.entries(THEME_PRESETS)) {
      expect(preset.preset).toBe(key)
      expect(preset.colors).toBeDefined()
      expect(preset.colors.primary).toBeDefined()
      expect(preset.colors.secondary).toBeDefined()
      expect(preset.colors.background).toBeDefined()
      expect(preset.colors.surface).toBeDefined()
      expect(preset.colors.text).toBeDefined()
      expect(preset.colors.textMuted).toBeDefined()
      expect(preset.colors.border).toBeDefined()
      expect(preset.fonts.heading).toBeDefined()
      expect(preset.fonts.body).toBeDefined()
      expect(preset.borderRadius).toBeDefined()
      expect(preset.spacing).toBeDefined()
    }
  })

  it("each preset has metadata", () => {
    for (const key of Object.keys(THEME_PRESETS)) {
      expect(THEME_PRESET_META[key]).toBeDefined()
      expect(THEME_PRESET_META[key].label).toBeTruthy()
      expect(THEME_PRESET_META[key].description).toBeTruthy()
    }
  })

  // ── Unit: CSS variable generation ──

  it("generatePortalCSSVariables returns all 11 variables", () => {
    const vars = generatePortalCSSVariables(THEME_PRESETS.elegant_gold)
    expect(Object.keys(vars)).toHaveLength(11)
    expect(vars["--portal-primary"]).toBe("#C4956A")
    expect(vars["--portal-bg"]).toBe("#FBF8F4")
    expect(vars["--portal-text"]).toBe("#2C2825")
    expect(vars["--portal-font-heading"]).toContain("Playfair Display")
    expect(vars["--portal-font-body"]).toContain("DM Sans")
    expect(vars["--portal-radius"]).toBe("12px")
    expect(vars["--portal-section-gap"]).toBe("4rem")
  })

  it("generatePortalCSSVariables maps border radius correctly", () => {
    const configs: Record<PortalThemeConfig["borderRadius"], string> = {
      none: "0px",
      sm: "4px",
      md: "8px",
      lg: "12px",
      full: "9999px",
    }

    for (const [radius, expected] of Object.entries(configs)) {
      const config = {
        ...THEME_PRESETS.elegant_gold,
        borderRadius: radius as PortalThemeConfig["borderRadius"],
      }
      const vars = generatePortalCSSVariables(config)
      expect(vars["--portal-radius"]).toBe(expected)
    }
  })

  it("generatePortalCSSVariables maps spacing correctly", () => {
    const configs: Record<PortalThemeConfig["spacing"], string> = {
      compact: "1.5rem",
      normal: "2.5rem",
      spacious: "4rem",
    }

    for (const [spacing, expected] of Object.entries(configs)) {
      const config = {
        ...THEME_PRESETS.elegant_gold,
        spacing: spacing as PortalThemeConfig["spacing"],
      }
      const vars = generatePortalCSSVariables(config)
      expect(vars["--portal-section-gap"]).toBe(expected)
    }
  })

  // ── Unit: CSS variables string ──

  it("portalCSSVariablesString returns semicolon-separated string", () => {
    const str = portalCSSVariablesString(THEME_PRESETS.minimalist)
    expect(str).toContain("--portal-primary: #2C2C2C")
    expect(str).toContain("--portal-bg: #FAFAFA")
    expect(str).toContain("; ")
  })

  // ── Unit: Google Fonts URL ──

  it("getGoogleFontsUrl returns URL with font families", () => {
    const url = getGoogleFontsUrl(THEME_PRESETS.elegant_gold)
    expect(url).not.toBeNull()
    expect(url).toContain("fonts.googleapis.com")
    expect(url).toContain("Playfair%20Display")
    expect(url).toContain("DM%20Sans")
  })

  it("getGoogleFontsUrl deduplicates identical heading and body fonts", () => {
    const url = getGoogleFontsUrl(THEME_PRESETS.minimalist)
    expect(url).not.toBeNull()
    // Minimalist uses DM Sans for both — should only appear once
    const matches = url!.match(/DM%20Sans/g)
    expect(matches).toHaveLength(1)
  })

  it("getGoogleFontsUrl includes wght parameter", () => {
    const url = getGoogleFontsUrl(THEME_PRESETS.elegant_gold)
    expect(url).toContain("wght@400;500;600;700")
  })

  // ── Unit: Default theme ──

  it("getDefaultTheme returns elegant_gold", () => {
    const defaultTheme = getDefaultTheme()
    expect(defaultTheme.preset).toBe("elegant_gold")
    expect(defaultTheme.colors.primary).toBe("#C4956A")
  })

  // ── Unit: resolveTheme ──

  it("resolveTheme with preset name returns full config", () => {
    const resolved = resolveTheme({ preset: "midnight_blue" })
    expect(resolved.colors.primary).toBe("#7EC8E3")
    expect(resolved.colors.background).toBe("#0F1923")
    expect(resolved.fonts.heading).toBe("Playfair Display")
  })

  it("resolveTheme merges color overrides onto preset", () => {
    const resolved = resolveTheme({
      preset: "elegant_gold",
      colors: { primary: "#FF0000" } as never,
    })
    // Primary overridden
    expect(resolved.colors.primary).toBe("#FF0000")
    // Other colors from preset
    expect(resolved.colors.background).toBe("#FBF8F4")
    expect(resolved.colors.text).toBe("#2C2825")
  })

  it("resolveTheme merges font overrides onto preset", () => {
    const resolved = resolveTheme({
      preset: "elegant_gold",
      fonts: { heading: "Inter" } as never,
    })
    expect(resolved.fonts.heading).toBe("Inter")
    expect(resolved.fonts.body).toBe("DM Sans") // from preset
  })

  it("resolveTheme defaults to elegant_gold for unknown preset", () => {
    const resolved = resolveTheme({ preset: "nonexistent" })
    expect(resolved.colors.primary).toBe("#C4956A")
  })

  it("resolveTheme defaults to elegant_gold when no preset specified", () => {
    const resolved = resolveTheme({})
    expect(resolved.colors.primary).toBe("#C4956A")
    expect(resolved.fonts.heading).toBe("Playfair Display")
  })

  // ── Unit: Midnight blue is dark theme ──

  it("midnight_blue has dark background for dark mode", () => {
    const vars = generatePortalCSSVariables(THEME_PRESETS.midnight_blue)
    expect(vars["--portal-bg"]).toBe("#0F1923")
    expect(vars["--portal-text"]).toBe("#E8EDF2")
  })

  // ── Edge: All presets generate valid CSS ──

  it("all presets generate valid CSS variable strings", () => {
    for (const preset of Object.values(THEME_PRESETS)) {
      const str = portalCSSVariablesString(preset)
      expect(str).toBeTruthy()
      // Should have all 11 variables
      expect(str.split(";").length).toBe(11)
    }
  })
})
