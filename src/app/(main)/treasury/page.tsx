"use client"

import { useAuth } from "@/lib/providers/AuthProvider"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { TreasuryView, TREASURY_ROOMS, type TreasuryViewData } from "@/components/treasury/TreasuryView"

export default function TreasuryPage() {
  const { profile, partner } = useAuth()
  const { wallet, partnerWallet } = useCoyyns()
  const first = (n?: string | null) => n?.trim().split(/\s+/)[0]

  const data: TreasuryViewData = {
    wallet: {
      userName: first(profile?.display_name) || "You",
      partnerName: first(partner?.display_name) || "Partner",
      balance: wallet?.balance ?? 0,
      partnerBalance: partnerWallet?.balance ?? 0,
    },
    rooms: TREASURY_ROOMS,
  }

  return <TreasuryView data={data} />
}
