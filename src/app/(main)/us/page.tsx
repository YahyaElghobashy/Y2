import { PageHeader } from "@/components/shared/PageHeader"
import { PageTransition } from "@/components/animations"
import { RelationshipTabs } from "@/components/relationship/RelationshipTabs"

export default function UsPage() {
  return (
    <PageTransition>
      <PageHeader title="Us" backHref="/" />
      <RelationshipTabs />
    </PageTransition>
  )
}
