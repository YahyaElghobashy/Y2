import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Fraunces, Space_Grotesk, JetBrains_Mono, Amiri, Caveat, Cormorant_Garamond } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/providers/AuthProvider"
import "./globals.css"

// ── Hayah Voice Map (see docs/DESIGN_BLUEPRINT.md §1.2) ──
// Display (bold-tender): hero greetings, world titles, celebration words
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
})

// Editorial (elegant): memories, letters, prompts, quotes
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
})

// Data (cold-confident): CoYYns, stats, dates, nav labels, system chrome, body
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space",
  display: "swap",
})

// Hand (intimate): pet-name notes, signatures, secret corners
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
  display: "swap",
})

// Arabic / editorial: bilingual headings, du'a, RTL
const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
})

// Mono: codes, times, raw data values
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

// Inscription serif for the pairing keepsake ("The Seal" world)
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Hayah",
  description: "Our shared life, in one place.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hayah",
  },
}

export const viewport: Viewport = {
  themeColor: "#F7EFE3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${fraunces.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${amiri.variable} ${caveat.variable} ${cormorant.variable}`}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="text-text-primary font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
