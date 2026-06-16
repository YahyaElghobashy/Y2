/**
 * Our Table — pass-through layout. Each route renders its own header:
 * the main page via TableView's editorial header, and /new + /[visitId]
 * via their own PageHeader (back → /our-table).
 */
export default function OurTableLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
