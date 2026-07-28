/**
 * Generic per-slot class overrides. Every widget defines its own slot
 * names (Card: container/title/value/unit/label, Chart: container/line/
 * axis/...) but they all share this same shape.
 */
export type SlotClassNames<TSlots extends string> =
  Partial<Record<TSlots, string>>;

/**
 * A widget theme is simply a reusable collection of Tailwind (or plain
 * CSS) classes for a widget's slots.
 *
 * Themes are merged in three layers:
 *
 *   built-in theme
 *      ↓
 *   user theme
 *      ↓
 *   widget styles prop
 *
 * Later layers win via `twMerge`.
 */
export interface WidgetTheme<TSlots extends string = string> {
  styles: SlotClassNames<TSlots>;
}