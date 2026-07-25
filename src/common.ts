
import { BuiltInTheme, CardSlot } from "./types/card";
import { WidgetTheme } from "./types/root";


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
export interface AnedyaWidgetBaseProps {
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

theme?: WidgetTheme<CardSlot> | BuiltInTheme;

  /** Applied to the widget's outermost element, on top of everything else. */
  className?: string;

  // Sizing — stay as direct props (shorthand for the container's
  // width/height), matching the existing ChartWidget convention.
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

export type FormatPreset =
  | "number"       // thousands separators, locale-aware
  | "bytes"        // auto-scales B/KB/MB/GB
  | "duration"     // seconds -> "2h 15m 30s"
  | "length"       // auto-scales mm/cm/m/km
  | "volume"       // auto-scales mL/L
  | "dataRate"      // auto-scales bps/Kbps/Mbps
  | "percent";

export interface FormatOptions {
  locale?: string;        // BCP 47 tag, e.g. "en-IN" — defaults to browser locale
  binary?: boolean;       // bytes only: 1024-based (KiB/MiB) vs 1000-based (KB/MB)
   /** Decimal places for the scaled number output by a `format` preset. */
  toDecimalPlaces?: number;

}
export type FormatResult = { value: string; unit?: string };

export type LabelFormatPreset = "time" | "date" | "datetime" | "relative" | "iso";