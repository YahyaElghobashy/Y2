import { PageHeader } from "@/components/shared/PageHeader"
import { HorizontalTabBar } from "@/components/shared/HorizontalTabBar"

const US_TABS = [
  { label: "CoYYns", href: "/us/coyyns" },
  { label: "Coupons", href: "/us/coupons" },
  { label: "Calendar", href: "/us/calendar" },
  { label: "Events", href: "/us/events" },
  { label: "Ping", href: "/us/ping" },
  { label: "List", href: "/us/list" },
  { label: "Watch", href: "/us/watch" },
  { label: "Prompts", href: "/us/prompts" },
  { label: "Wishlist", href: "/us/wishlist" },
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
