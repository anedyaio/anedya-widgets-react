//#region src/types/card.d.ts
type CardSlot$1 = "container" | "title" | "value" | "unit" | "label";
type BuiltInTheme = "light" | "dark";
//#endregion
//#region src/types/root.d.ts
/**
 * Generic per-slot class overrides. Every widget defines its own slot
 * names (Card: container/title/value/unit/label, Chart: container/line/
 * axis/...) but they all share this same shape.
 */
type SlotClassNames<TSlots extends string> = Partial<Record<TSlots, string>>;
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
interface WidgetTheme<TSlots extends string = string> {
  styles: SlotClassNames<TSlots>;
}
//#endregion
//#region src/common.d.ts
/**
 * Every widget takes this shape as its base. Widget-specific props
 * (e.g. Card's `unit`/`decimalPlaces`, Chart's `tickCount`) extend this
 * rather than repeating client/node/sizing/theme plumbing per widget.
 *
 * `node` is required directly (built by the consumer via
 * `anedya.newNode(client, nodeId)`) rather than derived internally —
 * keeps node/rate-limiting construction fully in the consumer's control,
 * outside the widget.
 */
interface AnedyaWidgetBaseProps {
  node: any;
  variable: string;
  /** Not every widget needs a range (e.g. Card shows only the latest value) — optional here, required by widgets that do. */
  from?: number;
  to?: number;
  limit?: number;
  title?: string;
  /**
   * Optional theme for the widget.
   *
   * A theme is a reusable collection of classes for the widget's slots.
   * It is merged with the widget's built-in defaults, while the
   * `styles` prop is applied afterwards for per-instance overrides.
   */
  theme?: WidgetTheme<CardSlot$1> | BuiltInTheme;
  /** Applied to the widget's outermost element, on top of everything else. */
  className?: string;
  width?: number;
  /**
   * Card height in pixels.
   * - If provided: treated as a fixed size. Content that doesn't fit will be clipped.
   * - If omitted: the card grows to fit its content naturally.
   */
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
}
//#endregion
//#region src/components/CardWidget.d.ts
type CardSlot = "container" | "title" | "value" | "unit" | "label";
/** The raw data this widget fetched — exactly what comes back from the request, not yet formatted. */
interface CardData {
  value: number;
  timestamp: number;
}
type CardWidgetUpdate = Partial<Omit<CardWidgetProps, "node" | "variable" | "onDataChange">>;
interface CardWidgetProps extends AnedyaWidgetBaseProps {
  unit?: string;
  /** Decimal places for the displayed value. Omit to show the raw value as-is. */
  decimalPlaces?: number;
  formatValue?: (value: number) => string;
  /** Text shown under the value, e.g. a last-updated label — pass a function to compute it from the latest timestamp. */
  labelText?: (timestamp: number) => string;
  /**
   * Per-slot CSS class overrides — Tailwind, a shadcn-generated class,
   * CSS Modules, plain hand-written CSS, or any other CSS classes.
   *
   * Layers on top of the widget's active theme and built-in defaults.
   * Tailwind conflicts are resolved via `twMerge`, so later overrides
   * replace earlier utilities within the same Tailwind class group.
   */
  styles?: SlotClassNames<CardSlot>;
  /**
   * Called whenever the latest fetched data changes.
   *
   * Return a partial set of this widget's optional props to
   * temporarily override how it is rendered.
   *
   * Any returned props are applied until this callback is
   * called again.
   *
   * Returning `undefined` (or nothing) clears any previous
   * overrides and restores the widget's original props.
   *
   * Example:
   *
   * onDataChange={(data) => {
   *   if (!data) return;
   *
   *   if (data.value > 80) {
   *     return {
   *       title: "High Humidity",
   *       theme: "dark",
   *       styles: {
   *         value: "text-red-500",
   *       },
   *     };
   *   }
   * }}
   */
  onDataChange?: (data: CardData | null) => CardWidgetUpdate | void;
}
declare function CardWidget({ node, variable, title, unit, decimalPlaces, formatValue, labelText, styles, onDataChange, theme, className, width, height, minWidth, maxWidth }: CardWidgetProps): React.JSX.Element;
//#endregion
export { CardWidget };