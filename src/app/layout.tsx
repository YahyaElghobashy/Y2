import type { Metadata, Viewport } from "next"
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google"
import { AppShell } from "@/components/shared/AppShell"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
  themeColor: "#FBF8F4",
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
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="text-text-primary font-body antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
