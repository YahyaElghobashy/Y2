"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import styles from "./PairingCelebration.module.css"

export type PairingVariant = "seal" | "girih" | "weave" | "ink"

type PairingCelebrationProps = {
  /** Which keepsake plays. Defaults to "seal". */
  variant?: PairingVariant
  /** The two paired names, shown rising beneath the seal. */
  nameA: string
  nameB: string
  /** Called when the user leaves the keepsake (tap after it settles, or "Enter Hayah"). */
  onDone: () => void
  /** Play the synthesized thunk + chime. Defaults to true. */
  sound?: boolean
}

const PAPER: Record<PairingVariant, string> = {
  seal: "#F6E0BF",
  girih: "#FCDDAA",
  weave: "#FCDEA7",
  ink: "#FCD69A",
}
const PAL = ["#DD7A57", "#B86A2C", "#E8B36B", "#F6E0BF", "#C9572F"]

const SCENE_CLASS: Record<PairingVariant, string> = {
  seal: styles.sceneSeal,
  girih: styles.sceneGirih,
  weave: styles.sceneWeave,
  ink: styles.sceneInk,
}

type DotStyle = Record<string, string>

export function PairingCelebration({
  variant = "seal",
  nameA,
  nameB,
  onDone,
  sound = true,
}: PairingCelebrationProps) {
  const [go, setGo] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const acRef = useRef<AudioContext | null>(null)

  // Scatter 30 riso dots once.
  const dots = useMemo<DotStyle[]>(() => {
    const N = 30
    return Array.from({ length: N }, (_, i) => {
      const ang = (i / N) * Math.PI * 2 + Math.random() * 0.4
      const dist = 120 + Math.random() * 240
      const s = 4 + Math.random() * 11
      return {
        "--tx": `${(Math.cos(ang) * dist).toFixed(1)}px`,
        "--ty": `${(Math.sin(ang) * dist * 0.92).toFixed(1)}px`,
        "--s": `${s.toFixed(1)}px`,
        "--c": PAL[i % PAL.length],
        "--d": `${(Math.random() * 0.12).toFixed(3)}s`,
        "--d2": `${(Math.random() * 0.5).toFixed(3)}s`,
      }
    })
  }, [])

  function playSound() {
    if (!sound) return
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      const ac = acRef.current ?? (acRef.current = new AC())
      if (ac.state === "suspended") void ac.resume()
      const base = ac.currentTime + 1.55
      // thunk
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = "sine"
      o.frequency.setValueAtTime(82, base)
      o.frequency.exponentialRampToValueAtTime(38, base + 0.18)
      g.gain.setValueAtTime(0.0001, base)
      g.gain.exponentialRampToValueAtTime(0.46, base + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, base + 0.34)
      o.connect(g).connect(ac.destination)
      o.start(base)
      o.stop(base + 0.4)
      // chime
      ;[523.25, 659.25, 783.99].forEach((f, i) => {
        const co = ac.createOscillator()
        const cg = ac.createGain()
        co.type = "sine"
        co.frequency.value = f
        const tt = base + 0.1 + i * 0.045
        cg.gain.setValueAtTime(0.0001, tt)
        cg.gain.exponentialRampToValueAtTime(0.11, tt + 0.04)
        cg.gain.exponentialRampToValueAtTime(0.0001, tt + 1.1)
        co.connect(cg).connect(ac.destination)
        co.start(tt)
        co.stop(tt + 1.2)
      })
    } catch {
      // audio blocked — silent is fine
    }
  }

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) {
      setRevealed(true)
      return
    }
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setGo(true)
        setPlaying(true)
        playSound()
      })
    })
    const t = window.setTimeout(() => setRevealed(true), 3300)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      window.clearTimeout(t)
      acRef.current?.close().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function skip() {
    setGo(false)
    setPlaying(false)
    setRevealed(true)
  }

  function handleStageClick() {
    if (!revealed) skip()
    else onDone()
  }

  const rootClass = [
    styles.stage,
    SCENE_CLASS[variant],
    go ? styles.go : "",
    playing ? styles.playing : "",
  ]
    .filter(Boolean)
    .join(" ")

  const content = (
    <div
      className={rootClass}
      style={{ ["--paper" as string]: PAPER[variant] } as React.CSSProperties}
      onClick={handleStageClick}
      role="dialog"
      aria-label="Pairing celebration"
    >
      <div className={styles.area}>
        <div className={styles.scene}>
          <div className={styles.artFx}>
            {variant === "seal" && (
              <>
                <div className={`${styles.half} ${styles.l}`} />
                <div className={`${styles.half} ${styles.r}`} />
              </>
            )}
            {variant === "girih" && <div className={styles.art} />}
            {variant === "weave" && <div className={styles.art} />}
            {variant === "ink" && (
              <>
                <div className={`${styles.art} ${styles.layer} ${styles.l}`} />
                <div className={`${styles.art} ${styles.layer} ${styles.r}`} />
              </>
            )}

            <div className={styles.fx}>
              {(variant === "seal" || variant === "girih") && <div className={styles.hglow} />}
              {variant === "weave" && (
                <div className={styles.star8} style={{ ["--ss" as string]: "14%", ["--sc" as string]: "#E8B36B" } as React.CSSProperties} />
              )}
              {variant === "ink" && (
                <div className={styles.star8} style={{ ["--ss" as string]: "9%", ["--sc" as string]: "#FFF1D6" } as React.CSSProperties} />
              )}
              <div className={styles.bloom} />
              <div className={styles.dots}>
                {dots.map((d, i) => (
                  <span key={i} className={styles.dot} style={d as React.CSSProperties} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.inscription}>
        <div className={styles.names}>
          <span>{nameA}</span>
          <span className={styles.amp}>&amp;</span>
          <span>{nameB}</span>
        </div>
        <div className={styles.hayah}>حياة</div>
        <div className={styles.stamp}>sealed · today</div>
      </div>

      <div className={`${styles.enter} ${revealed ? styles.enterOn : ""}`}>
        <button
          type="button"
          className={styles.enterBtn}
          onClick={(e) => {
            e.stopPropagation()
            onDone()
          }}
          data-testid="enter-hayah-btn"
        >
          Enter Hayah →
        </button>
      </div>

      <div className={styles.grain} />
    </div>
  )

  return mounted ? createPortal(content, document.body) : null
}
