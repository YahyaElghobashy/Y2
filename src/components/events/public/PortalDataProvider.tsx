"use client"

import { createContext, useContext } from "react"
import type { EventPortal, PortalPage } from "@/lib/types/portal.types"

type PortalDataContextValue = {
  portal: EventPortal
  pages: PortalPage[]
}

const PortalDataContext = createContext<PortalDataContextValue | null>(null)

export function usePortalData(): PortalDataContextValue {
  const ctx = useContext(PortalDataContext)
  if (!ctx) {
    throw new Error("usePortalData must be used within PortalDataProvider")
  }
  return ctx
}

type PortalDataProviderProps = {
  portal: EventPortal
  pages: PortalPage[]
  children: React.ReactNode
}

export function PortalDataProvider({ portal, pages, children }: PortalDataProviderProps) {
  return (
    <PortalDataContext.Provider value={{ portal, pages }}>
      {children}
    </PortalDataContext.Provider>
  )
}
