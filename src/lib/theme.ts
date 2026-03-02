export const colors = {
  bg: {
    primary: "#FBF8F4",
    secondary: "#F5F0E8",
    elevated: "#FFFFFF",
  },
  text: {
    primary: "#2C2825",
    secondary: "#8C8279",
    muted: "#B5ADA4",
  },
  accent: {
    primary: "#C4956A",
    soft: "#E8D5C0",
    glow: "rgba(196, 149, 106, 0.15)",
  },
  border: {
    subtle: "rgba(44, 40, 37, 0.08)",
  },
} as const

export const gradients = {
  warm: "linear-gradient(135deg, #F5F0E8, #FBF8F4)",
  accent: "linear-gradient(135deg, #C4956A, #D4A574)",
} as const

export const shadows = {
  soft: "0 2px 12px rgba(44, 40, 37, 0.06)",
  medium: "0 4px 20px rgba(44, 40, 37, 0.1)",
} as const

export const radii = {
  card: "12px",
  button: "8px",
  input: "6px",
} as const

export const fonts = {
  display: "'Playfair Display', serif",
  body: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const

export const animation = {
  duration: {
    fast: "100ms",
    normal: "200ms",
    slow: "300ms",
  },
  easing: {
    default: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    decelerate: "cubic-bezier(0, 0, 0.25, 1)",
    accelerate: "cubic-bezier(0.5, 0, 1, 1)",
  },
} as const
