# T306 Build Plan — SpendCoyynsForm

## Files to Create
1. `src/components/relationship/SpendCoyynsForm.tsx` — Bottom sheet form component
2. `src/__tests__/components/relationship/SpendCoyynsForm.test.tsx` — Test suite

## Files to Modify
1. `docs/COMPONENT_REGISTRY.md` — Register SpendCoyynsForm

## Dependencies (existing)
- `useCoyyns` from `@/lib/hooks/use-coyyns` → `wallet.balance`, `spendCoyyns(amount, description, category?)`
- `cn` from `@/lib/utils`
- `react-hook-form` + `@hookform/resolvers/zod` + `zod/v4`
- `framer-motion` — AnimatePresence, motion.div for sheet + backdrop
- `sonner` — toast for success notification
- `lucide-react` — X icon, Loader2 spinner
- `react-dom` — createPortal

## Design Tokens
- `bg-bg-elevated` (#FFFFFF) — sheet background
- `bg-black/40` — backdrop overlay
- `text-text-primary` (#2C2825) — title, amount text
- `text-text-secondary` (#8C8279) — balance label
- `text-accent-primary` / `bg-accent-primary` (#C4956A) — balance value, spend button
- `text-[var(--error)]` (#C27070) — insufficient warning
- `border-[var(--error)]` — input error border
- `border-border-subtle` — input borders, drag handle
- `bg-bg-primary` (#FBF8F4) — textarea background
- `font-display` (Playfair) — title
- `font-body` (DM Sans) — labels, description
- `font-[var(--font-mono)]` (JetBrains Mono) — amount input
- `rounded-t-2xl` — sheet top corners
- `rounded-xl` — spend button
- `rounded-[10px]` — inputs (matching login page pattern)
- `rounded-lg` — textarea

## Architecture

### Sheet as Portal with Framer Motion
- Render via `createPortal` to `document.body` (SSR-safe with mounted state)
- `AnimatePresence` wraps both backdrop and sheet
- Backdrop: `motion.div` fades opacity 0→0.4
- Sheet: `motion.div` slides from `y: "100%"` to `y: 0` with spring (stiffness: 300, damping: 30)
- Lock body scroll on mount (`overflow-hidden` on body), restore on unmount

### Form Logic
- Dynamic Zod schema factory `spendSchema(balance)` — recreated when balance changes
- RHF `useForm` with `zodResolver`, `mode: "onChange"` for realtime validation
- `watch("amount")` drives `isInsufficient` for instant UI feedback (not relying solely on Zod)
- `valueAsNumber` on amount register for proper number coercion
- `useEffect` resets form with prefilled values when `open` becomes `true`

### Error Handling
- `spendCoyyns()` from useCoyyns hook doesn't throw — it sets hook-level `error` state
- We wrap the call in try/catch for network errors
- After await, check hook `error` — null means success, non-null means failure
- On success: `onClose()` then `onSuccess?.()`
- On failure: show inline error below button, re-enable form

## Test Cases (14 tests)
1. Renders without crashing when `open: true`
2. Does not render content when `open: false`
3. Displays current balance in header
4. Amount input is autofocused when open
5. Valid amount: no warning, button enabled
6. Amount exceeding balance: "Insufficient CoYYns" visible, button disabled
7. Clearing amount: warning gone, button disabled
8. Empty description: button disabled even with valid amount
9. Submit calls `spendCoyyns` with correct args
10. `onSuccess` called after successful submit
11. `onClose` called after successful submit
12. Inline error shown if spendCoyyns fails
13. Prefilled values populate on open
14. X button calls `onClose`

### Test Mocks
- `useCoyyns` → mock return with configurable balance + `spendCoyyns` mock
- `framer-motion` → strip animation props, render plain divs (CoyynsWallet test pattern)
- `AnimatePresence` → passthrough children
- `sonner` → mock `toast` function
- `react-dom` `createPortal` → render inline (no portal in tests)

## Edge Cases
- Balance is 0 → any amount ≥1 triggers insufficient warning
- Prefilled amount > balance → opens with warning already shown
- Empty amount field → treated as empty, no warning, button disabled
- Rapid open/close → form resets on each open via useEffect
- Network error → inline error below button, sheet stays open
- Character count → live 0/200 counter on description
- Number input spin buttons → hidden via CSS
