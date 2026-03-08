"use client"

import { createContext, useContext, useMemo } from "react"
import type { PortalThemeConfig } from "@/lib/types/portal.types"
import {
  generatePortalCSSVariables,
  getGoogleFontsUrl,
  resolveTheme,
} from "@/lib/portal-themes"

type PortalThemeContextValue = {
  theme: PortalThemeConfig
  cssVariables: Record<string, string>
}

const PortalThemeContext = createContext<PortalThemeContextValue | null>(null)

export function usePortalTheme(): PortalThemeContextValue {
  const ctx = useContext(PortalThemeContext)
  if (!ctx) {
    throw new Error("usePortalTheme must be used within PortalThemeProvider")
  }
  return ctx
}

type PortalThemeProviderProps = {
  themeConfig: Partial<PortalThemeConfig>
  children: React.ReactNode
}

export function PortalThemeProvider({
  themeConfig,
  children,
}: PortalThemeProviderProps) {
  const theme = useMemo(() => resolveTheme(themeConfig), [themeConfig])
  const cssVariables = useMemo(() => generatePortalCSSVariables(theme), [theme])
  const fontsUrl = useMemo(() => getGoogleFontsUrl(theme), [theme])

  const contextValue = useMemo(
    () => ({ theme, cssVariables }),
    [theme, cssVariables]
  )

  return (
    <PortalThemeContext.Provider value={contextValue}>
      {fontsUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontsUrl} />
      )}
      <div style={cssVariables as React.CSSProperties}>{children}</div>
    </PortalThemeContext.Provider>
  )
}
