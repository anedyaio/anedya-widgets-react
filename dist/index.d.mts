import { a as LabelFormatPreset, n as FormatOptions, o as SlotClassNames, r as FormatPreset, t as AnedyaWidgetBaseProps } from "./common-DoLkuLwh.mjs";
//#region src/components/CardWidget.d.ts
type CardSlot = "container" | "title" | "value" | "unit" | "label" | "error" | "empty";
/** The raw data this widget fetched — exactly what comes back from the request, not yet formatted. */
interface CardData {
  value: number;
  timestamp: number;
}
/** Describes which state the widget just landed in, passed alongside `data` to `onDataChange`. */
interface CardDataMeta {
  kind: "success" | "error" | "empty";
  /** Present only when kind === "error". */
  error?: string;
}
type CardWidgetUpdate = Partial<Omit<CardWidgetProps, "node" | "variable" | "onDataChange">>;
interface CardWidgetProps extends AnedyaWidgetBaseProps {
  unit?: string;
  /** Decimal places for the displayed value. Omit to show the raw value as-is. */
  decimalPlaces?: number;
  /**
   * Full custom formatting function — receives the raw fetched value,
   * returns the exact string to display.
   *
   * Takes precedence over both `format` and `decimalPlaces`.
   */
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
  onDataChange?: (data: CardData | null, meta: CardDataMeta) => CardWidgetUpdate | void;
  /**
   * Named formatting preset for common unit types — auto-scales both
   * the displayed number and its unit (e.g. `"bytes"` turns `500000`
   * into `"500"` + `"KB"`).
   *
   * When set, this overrides the `unit` prop — the preset determines
   * its own unit per value.
   *
   * Ignored if `formatValue` is also provided.
   */
  format?: FormatPreset;
  /** Options for the active `format` preset — e.g. `{ formatOptions: 2, locale: "en-IN" }`. */
  formatOptions?: FormatOptions;
  /**
   * Named preset for the last-updated label's format. Ignored if
   * `labelText` is also provided (which always takes precedence).
   * Defaults to `"time"`, matching the widget's previous fixed behavior.
   */
  labelFormat?: LabelFormatPreset;
  /** Custom render for the error state. Return JSX to fully replace the default error text. */
  renderError?: (error: string) => React.ReactNode;
  /** Custom render when the fetch succeeds but no data is available. Defaults to a greyed-out "N/A". */
  renderEmpty?: () => React.ReactNode;
  /**
   * IANA timezone name (e.g. "Asia/Kolkata", "America/New_York") used when
   * formatting the last-updated label. Defaults to the browser's
   * auto-detected timezone if omitted.
   */
  timezone?: string;
}
declare function CardWidget({ node, variable, title, unit, decimalPlaces, formatValue, labelText, styles, onDataChange, theme, className, width, height, minWidth, maxWidth, format, formatOptions, labelFormat, timezone, renderError, renderEmpty }: CardWidgetProps): React.JSX.Element;
//#endregion
export { CardWidget };