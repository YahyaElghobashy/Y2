import { PageHeader } from "@/components/shared/PageHeader"
import { HorizontalTabBar } from "@/components/shared/HorizontalTabBar"

const US_TABS = [
  { label: "CoYYns", href: "/us/coyyns" },
  { label: "Coupons", href: "/us/coupons" },
  { label: "Calendar", href: "/us/calendar" },
  { label: "Ping", href: "/us/ping" },
]

export default function UsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader title="Us" />
      <HorizontalTabBar tabs={US_TABS} layoutId="us-tab-indicator" />
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}
