"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

interface WheelSegment {
  id: string
  label: string
  color: string
}

interface WheelSVGProps {
  segments: WheelSegment[]
  rotation?: number
  spinning?: boolean
  size?: number
  className?: string
}

export function WheelSVG({
  segments,
  rotation = 0,
  spinning = false,
  size = 280,
  className,
}: WheelSVGProps) {
  const center = size / 2
  const radius = size / 2 - 8
  const innerRadius = 30

  const arcs = useMemo(() => {
    const anglePerSegment = (2 * Math.PI) / segments.length
    return segments.map((seg, i) => {
      const startAngle = i * anglePerSegment - Math.PI / 2
      const endAngle = startAngle + anglePerSegment

      const x1 = center + radius * Math.cos(startAngle)
      const y1 = center + radius * Math.sin(startAngle)
      const x2 = center + radius * Math.cos(endAngle)
      const y2 = center + radius * Math.sin(endAngle)

      const largeArc = anglePerSegment > Math.PI ? 1 : 0

      const path = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        "Z",
      ].join(" ")

      // Label position at mid-angle, 60% of radius
      const midAngle = startAngle + anglePerSegment / 2
      const labelRadius = radius * 0.6
      const labelX = center + labelRadius * Math.cos(midAngle)
      const labelY = center + labelRadius * Math.sin(midAngle)
      const labelRotation = ((midAngle + Math.PI / 2) * 180) / Math.PI

      return { ...seg, path, labelX, labelY, labelRotation }
    })
  }, [segments, center, radius])

  return (
    <div
      className={cn("relative", className)}
      style={{ perspective: "800px" }}
    >
      {/* Pointer triangle */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0"
        style={{
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "16px solid var(--accent-copper, #B87333)",
        }}
      />

      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        animate={{ rotate: rotation }}
        transition={
          spinning
            ? { duration: 3, ease: [0.15, 0.6, 0.35, 1] }
            : { duration: 0 }
        }
        style={{ transformStyle: "preserve-3d", rotateX: "8deg" }}
      >
        {/* Segments */}
        {arcs.map((arc) => (
          <g key={arc.id}>
            <path d={arc.path} fill={arc.color} stroke="white" strokeWidth={2} />
            <text
              x={arc.labelX}
              y={arc.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${arc.labelRotation}, ${arc.labelX}, ${arc.labelY})`}
              className="text-[11px] font-semibold fill-white"
              style={{ fontFamily: "var(--font-nav, 'Plus Jakarta Sans', sans-serif)" }}
            >
              {arc.label.length > 12 ? arc.label.slice(0, 12) + "..." : arc.label}
            </text>
          </g>
        ))}

        {/* Center circle */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="var(--accent-copper, #B87333)"
          stroke="white"
          strokeWidth={3}
        />
      </motion.svg>
    </div>
  )
}
