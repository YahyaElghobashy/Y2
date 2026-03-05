import { PageHeader } from "@/components/shared/PageHeader"

export default function OurTableLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PageHeader title="Our Table" backHref="/" />
      {children}
    </>
  )
}
