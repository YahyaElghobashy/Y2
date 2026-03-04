import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"

export default function AboutPage() {
  return (
    <PageTransition>
      <PageHeader title="About Hayah" backHref="/more" />
      <div className="flex flex-col gap-6 px-5 py-6">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-[var(--color-text-primary)]">
            Why Hayah?
          </h2>
          <p className="mt-2 font-[family-name:var(--font-body)] text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
            Hayah was born from a simple idea: the most important relationship in your
            life deserves its own space — a place to grow, track, and celebrate
            together.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-[var(--color-text-primary)]">
            Built with intention
          </h2>
          <p className="mt-2 font-[family-name:var(--font-body)] text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
            Every feature is designed with care — from the warm copper accents to the
            playful CoYYns system. This is not just an app. It is our shared life,
            digitized with love.
          </p>
        </section>

        <p className="mt-4 text-center font-[family-name:var(--font-body)] text-[13px] text-[var(--color-text-muted)]">
          Made with love by Yahya, for Yara
        </p>
      </div>
    </PageTransition>
  )
}
