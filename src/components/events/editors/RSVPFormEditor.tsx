"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function RSVPFormEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const showMealPreference = (content.show_meal_preference as boolean) ?? false
  const mealOptions = (content.meal_options as string[]) ?? []
  const showDietaryNotes = (content.show_dietary_notes as boolean) ?? false
  const showHotelChoice = (content.show_hotel_choice as boolean) ?? false
  const hotelOptions = (content.hotel_options as string[]) ?? []
  const showPlusOnes = (content.show_plus_ones as boolean) ?? false
  const maxPlusOnes = (content.max_plus_ones as number) ?? 2
  const showMessage = (content.show_message as boolean) ?? true
  const showSubEvents = (content.show_sub_events as boolean) ?? false
  const confirmationMessage = (content.confirmation_message as string) ?? ""
  const deadline = (content.deadline as string) ?? ""

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="rsvp-form-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. RSVP"
          data-testid="rsvp-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => update("description", e.target.value)}
          className={fieldStyles.textarea}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Please let us know if you can make it..."
          rows={2}
          data-testid="rsvp-description"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          RSVP Deadline
        </label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => update("deadline", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="rsvp-deadline"
        />
      </div>

      <div className="space-y-2 pt-2 border-t" style={{ borderColor: colors.bg.parchment }}>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Form Options
        </label>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Show Message Field</span>
          <Switch checked={showMessage} onCheckedChange={(v) => update("show_message", v)} data-testid="rsvp-show-message" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Allow Plus Ones</span>
          <Switch checked={showPlusOnes} onCheckedChange={(v) => update("show_plus_ones", v)} data-testid="rsvp-show-plus-ones" />
        </div>

        {showPlusOnes && (
          <div>
            <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
              Max Plus Ones
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={maxPlusOnes}
              onChange={(e) => update("max_plus_ones", parseInt(e.target.value) || 0)}
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              data-testid="rsvp-max-plus-ones"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Meal Preference</span>
          <Switch checked={showMealPreference} onCheckedChange={(v) => update("show_meal_preference", v)} data-testid="rsvp-show-meal" />
        </div>

        {showMealPreference && (
          <div>
            <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
              Meal Options
            </label>
            {mealOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <input
                  value={opt}
                  onChange={(e) => {
                    const updated = [...mealOptions]
                    updated[i] = e.target.value
                    update("meal_options", updated)
                  }}
                  className={fieldStyles.input}
                  style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
                  placeholder="e.g. Vegetarian"
                  data-testid={`rsvp-meal-option-${i}`}
                />
                <button
                  onClick={() => update("meal_options", mealOptions.filter((_, idx) => idx !== i))}
                  className="p-1 rounded"
                  data-testid={`rsvp-remove-meal-${i}`}
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
                </button>
              </div>
            ))}
            <button
              onClick={() => update("meal_options", [...mealOptions, ""])}
              className={fieldStyles.addBtn}
              style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
              data-testid="rsvp-add-meal-option"
            >
              <Plus className="w-3.5 h-3.5 inline me-1" />
              Add Meal Option
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Dietary Notes</span>
          <Switch checked={showDietaryNotes} onCheckedChange={(v) => update("show_dietary_notes", v)} data-testid="rsvp-show-dietary" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Hotel Choice</span>
          <Switch checked={showHotelChoice} onCheckedChange={(v) => update("show_hotel_choice", v)} data-testid="rsvp-show-hotel" />
        </div>

        {showHotelChoice && (
          <div>
            <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
              Hotel Options
            </label>
            {hotelOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <input
                  value={opt}
                  onChange={(e) => {
                    const updated = [...hotelOptions]
                    updated[i] = e.target.value
                    update("hotel_options", updated)
                  }}
                  className={fieldStyles.input}
                  style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
                  placeholder="e.g. Grand Hotel"
                  data-testid={`rsvp-hotel-option-${i}`}
                />
                <button
                  onClick={() => update("hotel_options", hotelOptions.filter((_, idx) => idx !== i))}
                  className="p-1 rounded"
                  data-testid={`rsvp-remove-hotel-${i}`}
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
                </button>
              </div>
            ))}
            <button
              onClick={() => update("hotel_options", [...hotelOptions, ""])}
              className={fieldStyles.addBtn}
              style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
              data-testid="rsvp-add-hotel-option"
            >
              <Plus className="w-3.5 h-3.5 inline me-1" />
              Add Hotel Option
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: colors.text.secondary }}>Per-Event RSVP</span>
          <Switch checked={showSubEvents} onCheckedChange={(v) => update("show_sub_events", v)} data-testid="rsvp-show-sub-events" />
        </div>
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Confirmation Message
        </label>
        <textarea
          value={confirmationMessage}
          onChange={(e) => update("confirmation_message", e.target.value)}
          className={fieldStyles.textarea}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Thank you for your response!"
          rows={2}
          data-testid="rsvp-confirmation-message"
        />
      </div>
    </div>
  )
}
