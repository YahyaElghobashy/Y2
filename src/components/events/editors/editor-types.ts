/** Shared props interface for all section editors */
export type SectionEditorProps = {
  content: Record<string, unknown>
  onContentChange: (content: Record<string, unknown>) => void
}

/** Helper: update a single field in the content object */
export function updateField(
  content: Record<string, unknown>,
  field: string,
  value: unknown,
  onContentChange: (c: Record<string, unknown>) => void
) {
  onContentChange({ ...content, [field]: value })
}

/** Helper: update a field inside an array item */
export function updateArrayItem<T>(
  items: T[],
  index: number,
  field: keyof T,
  value: unknown
): T[] {
  return items.map((item, i) =>
    i === index ? { ...item, [field]: value } : item
  )
}

/** Helper: remove item from array by index */
export function removeArrayItem<T>(items: T[], index: number): T[] {
  return items.filter((_, i) => i !== index)
}

/** Shared Tailwind classes for editor fields */
export const fieldStyles = {
  label: "block text-xs font-medium mb-1",
  input:
    "w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)]",
  textarea:
    "w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)] resize-none",
  select:
    "w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)]",
  arrayItem: "p-3 rounded-lg border space-y-2",
  addBtn:
    "w-full py-2 text-sm rounded-lg border border-dashed transition-colors",
} as const
