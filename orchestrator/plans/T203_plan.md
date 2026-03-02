# T203: Login Page — Build Plan

## Overview
Create the authentication login page at `/(auth)/login`. A minimal, warm login form with email/password fields, Supabase `signInWithPassword`, inline validation via React Hook Form + Zod, and Framer Motion entrance animation. No nav chrome.

---

## Files to Create

### 1. `src/app/(auth)/layout.tsx`
- Simple server component layout for the auth route group
- Renders `{children}` only — no AppShell, no BottomNav, no nav wrappers
- Provides a clean full-screen canvas for auth pages

### 2. `src/app/(auth)/login/page.tsx`
- `"use client"` page component (uses RHF, Supabase client-side auth)
- Zod schema: `email` (valid email), `password` (min 1 char)
- RHF `useForm` with `zodResolver`, `mode: "onBlur"` for blur validation
- `signInWithPassword` from `getSupabaseBrowserClient()` (T202)
- `router.push("/")` on success
- `setError("root", ...)` on Supabase auth failure
- Network error catch: "Something went wrong. Check your connection."
- Framer Motion `motion.div` entrance: `opacity: 0→1, y: 8→0, 350ms easeOut`
- Button loading state: `isSubmitting` disables button, shows "Signing in..." + Loader2 spinner
- Inputs: `autocomplete="email"` / `autocomplete="current-password"`, correct `name` attrs

### 3. `src/__tests__/app/auth/login.test.tsx`
- 13 test cases as specified in task requirements
- Mocks: `@/lib/supabase/client`, `next/navigation` (useRouter), `framer-motion`

---

## Files to Modify

### 4. `src/components/shared/AppShell.tsx`
- **Problem**: Root layout wraps ALL pages in AppShell (which renders BottomNav). The `(auth)` route group nests inside root layout, so login page would show BottomNav.
- **Fix**: Use `usePathname()` from `next/navigation` to detect auth routes and conditionally hide BottomNav + remove `pb-24` padding.
- Auth routes check: `pathname.startsWith("/login")` or `pathname.startsWith("/register")`

### 5. `docs/COMPONENT_REGISTRY.md`
- Add login page entry under an "Auth Module" section

### 6. `docs/TASK_LOG.md`
- Add T203 completion entry

---

## Dependencies (imports from existing code)

| Import | Source | Task |
|---|---|---|
| `getSupabaseBrowserClient` | `@/lib/supabase/client` | T202 |
| `cn` | `@/lib/utils` | Exists |
| `Input` | `@/components/ui/input` | shadcn (exists) |
| `Button` | `@/components/ui/button` | shadcn (exists) |
| `useForm` | `react-hook-form` | In deps |
| `zodResolver` | `@hookform/resolvers/zod` | In deps |
| `z` | `zod` | In deps |
| `motion` | `framer-motion` | In deps |
| `Loader2` | `lucide-react` | In deps |
| `useRouter` | `next/navigation` | Next.js |

---

## Design Tokens Referenced

| Token | Tailwind Class | Usage |
|---|---|---|
| `--color-bg-primary` (#FBF8F4) | `bg-bg-primary` | Page background |
| `--color-bg-elevated` (#FFFFFF) | `bg-bg-elevated` | Input background |
| `--color-text-primary` (#2C2825) | `text-text-primary` | "Hayah" heading |
| `--color-text-secondary` (#8C8279) | `text-text-secondary` | "حياة" subtitle |
| `--color-text-muted` (#B5ADA4) | `text-text-muted` | Input placeholders |
| `--color-accent-primary` (#C4956A) | `bg-accent-primary` | Sign In button bg |
| `--color-border-subtle` | `border-border-subtle` | Input borders |
| `--font-display` | `font-display` | "Hayah" heading (Playfair Display) |
| `--font-body` | `font-body` | Body text, inputs (DM Sans) |
| `--destructive` | `text-destructive` | Error messages |
| Inputs | `rounded-[10px]` | 10px border radius |
| Button | `rounded-[10px]` | 10px border radius (matching inputs) |

---

## Test Cases (13 total)

1. Page renders without crashing
2. "Hayah" heading is present in the DOM
3. "حياة" subtitle is present in the DOM
4. Email input present with `name="email"` and `type="email"`
5. Password input present with `name="password"` and `type="password"`
6. "Sign In" button present and enabled on initial render
7. Invalid email submission shows "Enter a valid email"
8. Empty password submission shows "Password is required"
9. Valid credentials calls `signInWithPassword` with correct args
10. Successful sign-in calls `router.push("/")`
11. Failed sign-in shows "Invalid email or password"
12. Button is disabled while submitting
13. Button label changes to "Signing in..." during submission

---

## Edge Cases Handled

- Both fields empty on submit → Zod fires both errors simultaneously
- Network error → catch block shows "Something went wrong. Check your connection."
- Double-tap → `isSubmitting` disables button
- Password manager → correct `name` and `autocomplete` attributes
- Arabic text → "حياة" renders via system font fallback (DM Sans doesn't cover Arabic)
- Middleware redirect for authenticated users → NOT in scope for this task (page doesn't handle it)

---

## Potential Issues

1. **AppShell wrapping auth pages**: Root layout includes AppShell with BottomNav. Solved by adding pathname check in AppShell.
2. **No root middleware.ts**: The `updateSession` helper exists in `src/lib/supabase/middleware.ts` but no root `src/middleware.ts` calls it. Auth redirect logic is a future task concern — login page functions without it.
3. **Zod v4 import**: Package has `zod@^4.3.6` — need to verify import syntax works the same as v3 (it does, `z.object/z.string` API is the same).
