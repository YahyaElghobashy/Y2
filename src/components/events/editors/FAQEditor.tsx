"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles, removeArrayItem, updateArrayItem } from "./editor-types"

type FAQItem = {
  question: string
  answer: string
}

const EMPTY_FAQ: FAQItem = { question: "", answer: "" }

export function FAQEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const items = (content.items as FAQItem[]) ?? []
  const layout = (content.layout as string) ?? "accordion"

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="faq-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Frequently Asked Questions"
          data-testid="faq-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Layout
        </label>
        <select
          value={layout}
          onChange={(e) => update("layout", e.target.value)}
          className={fieldStyles.select}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="faq-layout"
        >
          <option value="accordion">Accordion</option>
          <option value="list">List</option>
        </select>
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Questions
        </label>
        {items.map((item, i) => (
          <div
            key={i}
            className={fieldStyles.arrayItem}
            style={{ borderColor: colors.bg.parchment }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                Q{i + 1}
              </span>
              <button
                onClick={() => update("items", removeArrayItem(items, i))}
                className="p-1 rounded"
                data-testid={`faq-remove-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
              </button>
            </div>
            <input
              value={item.question}
              onChange={(e) =>
                update("items", updateArrayItem(items, i, "question", e.target.value))
              }
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Question *"
              data-testid={`faq-question-${i}`}
            />
            <textarea
              value={item.answer}
              onChange={(e) =>
                update("items", updateArrayItem(items, i, "answer", e.target.value))
              }
              className={fieldStyles.textarea}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="Answer *"
              rows={2}
              data-testid={`faq-answer-${i}`}
            />
          </div>
        ))}
        <button
          onClick={() => update("items", [...items, { ...EMPTY_FAQ }])}
          className={fieldStyles.addBtn}
          style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
          data-testid="faq-add"
        >
          <Plus className="w-3.5 h-3.5 inline me-1" />
          Add Question
        </button>
      </div>
    </div>
  )
}
