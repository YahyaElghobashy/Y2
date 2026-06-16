"use client"

import { TableView, TABLE_MOCK } from "@/components/food/TableView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewTablePage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <TableView visits={TABLE_MOCK} />
      <BottomNav />
    </div>
  )
}
