"use client"

import { CameraCapture } from "@/components/snap/CameraCapture"
import { PageTransition } from "@/components/animations"

export default function SnapCapturePage() {
  return (
    <PageTransition>
      <CameraCapture />
    </PageTransition>
  )
}
