export const colors = {
  bg: {
    primary: "#FBF8F4",
    secondary: "#F5F0E8",
    elevated: "#FFFFFF",
    warmWhite: "#FFFDF9",
    softCream: "#F5EDE3",
    deepCream: "#EDE0D0",
    parchment: "#E5D9CB",
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
    copper: "#B87333",
    copperLight: "#D4A574",
    copperDark: "#8B5E2B",
  },
  emotional: {
    rose: "#F4A8B8",
    roseLight: "#FADCE3",
    gold: "#DAA520",
    goldLight: "#F0E0A0",
    sage: "#A8B5A0",
    sageLight: "#D5DDD1",
    duskBlue: "#7EC8E3",
  },
  preference: {
    me: "#E85D75",
    partner: "#7EC8E3",
  },
  functional: {
    success: "#6B9B6B",
    error: "#C75050",
    warning: "#D4A040",
  },
  pink: {
    primary: "#ec1349",
    soft: "rgba(236, 19, 73, 0.08)",
    hover: "#d41042",
  },
  border: {
    subtle: "rgba(44, 40, 37, 0.08)",
  },
} as const

export const gradients = {
  warm: "linear-gradient(135deg, #F5F0E8, #FBF8F4)",
  accent: "linear-gradient(135deg, #C4956A, #D4A574)",
  copper: "linear-gradient(135deg, #B87333, #D4A574)",

  // Time-aware backgrounds
  heroLight: "linear-gradient(180deg, #FBF7F4 0%, #F5EDE3 100%)",
  heroDawn: "linear-gradient(135deg, #FBF7F4 0%, rgba(218,165,32,0.04) 50%, #F5EDE3 100%)",
  heroDusk: "linear-gradient(135deg, #FBF7F4 0%, rgba(244,168,184,0.04) 50%, #F5EDE3 100%)",
  heroNight: "linear-gradient(180deg, #F5EDE3 0%, #EDE0D0 100%)",

  // Card interaction gradients
  cardHover: "linear-gradient(135deg, transparent 0%, rgba(184,115,51,0.04) 100%)",
  cardActive: "linear-gradient(135deg, transparent 0%, rgba(184,115,51,0.08) 100%)",

  // Rating slider gradients
  ratingTrack: "linear-gradient(90deg, #D1D5DB 0%, rgba(218,165,32,0.3) 50%, #B87333 100%)",
  vibeTrack: "linear-gradient(90deg, #F4A8B8 0%, rgba(218,165,32,0.3) 50%, #B87333 100%)",

  // Copper glow
  copperGlow: "radial-gradient(circle, rgba(184,115,51,0.12) 0%, transparent 70%)",
} as const

export const shadows = {
  soft: "0 2px 12px rgba(44, 40, 37, 0.06)",
  medium: "0 4px 20px rgba(44, 40, 37, 0.1)",

  // Extended warm shadow scale
  warmSm: "0 1px 3px rgba(44,40,37,0.06)",
  warmMd: "0 4px 12px rgba(44,40,37,0.08)",
  warmLg: "0 8px 24px rgba(44,40,37,0.10)",
  warmXl: "0 12px 36px rgba(44,40,37,0.12)",
  warmInner: "inset 0 1px 3px rgba(44,40,37,0.06)",
  glowCopper: "0 0 20px rgba(184,115,51,0.15)",
  glowCopperStrong: "0 0 30px rgba(184,115,51,0.25)",
} as const

export const radii = {
  card: "12px",
  cardLg: "16px",
  button: "8px",
  input: "6px",
  pill: "9999px",
} as const

export const fonts = {
  display: "'Playfair Display', serif",
  body: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
  arabic: "'Amiri', serif",
  handwritten: "'Caveat', cursive",
  serif: "'Lora', serif",
  nav: "'Plus Jakarta Sans', sans-serif",
} as const

export const animation = {
  duration: {
    micro: "100ms",
    fast: "100ms",
    normal: "200ms",
    slow: "300ms",
    dramatic: "800ms",
  },
  easing: {
    default: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    decelerate: "cubic-bezier(0, 0, 0.25, 1)",
    accelerate: "cubic-bezier(0.5, 0, 1, 1)",
    easeOut: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },
  // Framer Motion spring presets
  spring: { type: "spring" as const, stiffness: 400, damping: 25 },
  springGentle: { type: "spring" as const, stiffness: 200, damping: 20 },

  // Framer Motion variants
  fadeSlideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  scalePress: {
    whileTap: { scale: 0.97 },
    transition: { duration: 0.1 },
  },
  cardLift: {
    whileHover: { y: -2, boxShadow: "0 8px 24px rgba(44,40,37,0.10)" },
    whileTap: { y: 0, boxShadow: "0 1px 3px rgba(44,40,37,0.06)" },
    transition: { duration: 0.2 },
  },
} as const
