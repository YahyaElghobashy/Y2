# T305: AddCoyynsForm — Build Plan

## Files to Create

1. **`src/components/relationship/AddCoyynsForm.tsx`** — The main bottom sheet form component
2. **`src/__tests__/components/relationship/AddCoyynsForm.test.tsx`** — Full test suite

## Files to Modify

1. **`src/app/layout.tsx`** — Add `<Toaster />` from `sonner` so `toast()` calls render
2. **`docs/COMPONENT_REGISTRY.md`** — Register the new component
3. **`docs/TASK_LOG.md`** — Log task completion

## Dependencies (Imports)

| Import | From | Purpose |
|--------|------|---------|
| `motion, AnimatePresence` | `framer-motion` | Sheet slide animation, backdrop fade, exit handling |
| `useForm` | `react-hook-form` | Form state management |
| `zodResolver` | `@hookform/resolvers/zod` | Zod schema integration with RHF |
| `z` | `zod` | Validation schema |
| `X, Loader2` | `lucide-react` | Close button icon, loading spinner |
| `useCoyyns` | `@/lib/hooks/use-coyyns` | `addCoyyns()` mutation function |
| `cn` | `@/lib/utils` | Conditional class names |
| `toast` | `sonner` | Success toast notification |
| `createPortal` | `react-dom` | Portal to document.body for z-index stacking |

## Design Tokens Referenced

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `--color-bg-elevated` | `bg-bg-elevated` | Sheet background (#FFFFFF) |
| `--color-text-primary` | `text-text-primary` | Title, input text (#2C2825) |
| `--color-text-secondary` | `text-text-secondary` | Close button, labels (#8C8279) |
| `--color-text-muted` | `text-text-muted` | Placeholder text (#B5ADA4) |
| `--color-accent-primary` | `bg-accent-primary` | Add button bg, amount underline focus (#C4956A) |
| `--color-bg-primary` | `bg-bg-primary` | Textarea background (#FBF8F4) |
| `--color-border-subtle` | `border-border-subtle` | Textarea border, drag handle |
| `--font-display` | `font-display` | Title font (Playfair Display) |
| `--font-mono` | `font-mono` | Amount input font (JetBrains Mono) |
| `--font-body` | `font-body` | Description, labels (DM Sans) |
| `rounded-t-2xl` | Sheet top corners | 16px top radius |
| `rounded-xl` | Add button | 12px radius |
| `shadow-xl` | Sheet shadow | Elevated shadow |
| `destructive` | `text-destructive` | Error messages (shadcn token) |

## Animation Spec

| Element | Initial | Animate | Exit | Transition |
|---------|---------|---------|------|------------|
| Backdrop | `opacity: 0` | `opacity: 1` | `opacity: 0` | 300ms ease-out |
| Sheet panel | `y: "100%"` | `y: 0` | `y: "100%"` | 300ms `[0.25, 0.46, 0.45, 0.94]` |
| Drag dismiss | `drag="y"` `dragConstraints={{ top: 0 }}` | — | Close on `dragEnd` if `offset.y > 100` | — |

## Component Architecture

```
AddCoyynsForm (portal to document.body)
├── Backdrop (motion.div, bg-black/30, onClick → onClose)
└── Sheet Panel (motion.div, drag="y")
    ├── Drag Handle (centered 40px bar)
    ├── Header (Title + X button)
    ├── Amount Input (number, font-mono, large, centered)
    ├── Amount Error (conditional)
    ├── Description Textarea (3 rows, with char count)
    ├── Description Error (conditional)
    ├── Submit Error (conditional, below button)
    └── Add Button (full width, copper, with loading state)
```

## Key Implementation Details

1. **Portal**: `createPortal(jsx, document.body)` — overlaps BottomNav correctly
2. **Form reset on close**: `reset()` called in close handler and after successful submit
3. **Amount input**: `inputMode="numeric"` + `valueAsNumber: true` in register
4. **Character count**: `{length}/200` below textarea when user starts typing
5. **Loading state**: `<Loader2>` spinner + "Adding..." text, button disabled
6. **Submit error**: Inline text below button when `addCoyyns` throws
7. **Swipe dismiss**: Framer Motion `drag="y"`, `dragConstraints={{ top: 0 }}`, `onDragEnd` checks offset
8. **Safe area**: `pb-[env(safe-area-inset-bottom)]` on sheet panel
9. **Toaster**: Add `<Toaster />` to root layout (currently missing)
10. **Responsive**: `text-4xl sm:text-5xl` for amount input to fit iPhone SE

## Test Cases

| # | Test | Assertion |
|---|------|-----------|
| 1 | Renders nothing when `open={false}` | Container is empty |
| 2 | Renders "Add CoYYns" title when `open={true}` | `getByText("Add CoYYns")` |
| 3 | Renders amount input and description textarea | Both inputs present |
| 4 | Shows validation error on empty amount submit | Error text visible |
| 5 | Shows validation error on empty description submit | Error text visible |
| 6 | Shows error when amount exceeds 10000 | "Maximum 10,000" visible |
| 7 | Calls `addCoyyns` with correct values on valid submit | Mock called with args |
| 8 | Calls `onClose` after successful submission | Mock called |
| 9 | Calls `onSuccess` after successful submission | Mock called |
| 10 | Shows error when `addCoyyns` rejects, sheet stays open | Error visible, onClose not called |
| 11 | Calls `onClose` when backdrop clicked | Mock called |
| 12 | Calls `onClose` when X button clicked | Mock called |

## Mock Strategy (Tests)

- Mock `framer-motion` with passthrough divs + AnimatePresence that renders/hides children
- Mock `@/lib/hooks/use-coyyns` with controlled `addCoyyns` mock
- Mock `react-dom` `createPortal` to render children inline
- Mock `sonner` toast function
- Use `@testing-library/user-event` for typing and submitting
- Use `waitFor` for async submit assertions

## Potential Issues

1. **Zod v4**: Project uses `zod@^4.3.6`. The `z.number().int().min().max()` chain works in v4. `@hookform/resolvers@^5.2.2` supports Zod v4.
2. **`createPortal` in tests**: jsdom doesn't fully support portals — mock to render inline
3. **Sonner toast**: Component exists at `src/components/ui/sonner.tsx` but `<Toaster />` isn't in any layout. Adding to root layout.
4. **iPhone SE (320px)**: Responsive font size on amount input
