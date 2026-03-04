"use client"

import { CoyynsWallet } from "@/components/relationship/CoyynsWallet"
import { CoyynsHistory } from "@/components/relationship/CoyynsHistory"

export default function CoyynsTabPage() {
  return (
    <div className="flex flex-col gap-6">
      <CoyynsWallet />
      <CoyynsHistory />
    </div>
  )
}
