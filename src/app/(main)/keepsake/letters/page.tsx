"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { LettersView, type Letter } from "@/components/keepsake/LettersView"
import { MonthlyLetterComposer } from "@/components/rituals/MonthlyLetterComposer"
import { useRituals } from "@/lib/hooks/use-rituals"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const LETTER_RITUAL_TITLE = "Monthly Letter"

type LetterLog = { id: string; note: string | null; photo_url: string | null; logged_at: string; user_id: string }

export default function LettersPage() {
  const supabase = getSupabaseBrowserClient()
  const { user, profile, partner } = useAuth()
  const { rituals, isLoading: ritualsLoading, logRitual, uploadRitualPhoto, createRitual } = useRituals()

  const myName = profile?.display_name ?? "You"
  const partnerName = partner?.display_name ?? "your love"

  const letterRitual = useMemo(
    () => rituals.find((r) => r.title === LETTER_RITUAL_TITLE),
    [rituals],
  )

  const [logs, setLogs] = useState<LetterLog[] | null>(null)
  const [showComposer, setShowComposer] = useState(false)

  const fetchLogs = useCallback(async () => {
    if (!letterRitual?.id) {
      setLogs([])
      return
    }
    const { data } = await supabase
      .from("ritual_logs")
      .select("id, note, photo_url, logged_at, user_id")
      .eq("ritual_id", letterRitual.id)
      .order("logged_at", { ascending: false })
    setLogs((data as LetterLog[]) ?? [])
  }, [supabase, letterRitual?.id])

  useEffect(() => {
    if (!ritualsLoading) void fetchLogs()
  }, [ritualsLoading, fetchLogs])

  const letters: Letter[] = useMemo(
    () =>
      (logs ?? []).map((l) => {
        const mine = l.user_id === user?.id
        return {
          id: l.id,
          from: mine ? myName : partnerName,
          date: new Date(l.logged_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }),
          body: l.note ?? "",
          signature: mine ? `— ${myName.toLowerCase()}` : `— yours, ${partnerName.toLowerCase()}`,
        }
      }),
    [logs, user?.id, myName, partnerName],
  )

  const handleSend = async (content: string, photoUrl?: string) => {
    let ritualId: string | null | undefined = letterRitual?.id
    if (!ritualId) {
      ritualId = await createRitual({
        title: LETTER_RITUAL_TITLE,
        description: "A monthly letter to your partner",
        cadence: "monthly",
        icon: "💌",
        is_shared: true,
      })
    }
    if (ritualId) await logRitual(ritualId, content, photoUrl)
    setShowComposer(false)
    await fetchLogs()
  }

  if (ritualsLoading || logs === null) {
    return (
      <PageTransition>
        <PageHeader title="Letters" backHref="/keepsake" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={2} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <LettersView letters={letters} partnerName={partnerName} onWrite={() => setShowComposer(true)} />

      <MonthlyLetterComposer
        open={showComposer}
        partnerName={partnerName}
        onClose={() => setShowComposer(false)}
        onSend={handleSend}
        onUploadPhoto={uploadRitualPhoto}
      />
    </PageTransition>
  )
}
