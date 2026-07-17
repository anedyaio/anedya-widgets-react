
import { BuiltInTheme, CardSlot } from "./types/card";
import { WidgetTheme } from "./types/root";


/**
 * Every widget takes this shape as its base. Widget-specific props
 * (e.g. Card's `unit`/`precision`, Chart's `tickCount`) extend this
 * rather than repeating client/node/sizing/theme plumbing per widget.
 *
 * `node` is required directly (built by the consumer via
 * `anedya.newNode(client, nodeId)`) rather than derived internally —
 * keeps node/rate-limiting construction fully in the consumer's control,
 * outside the widget.
 */
export interface AnedyaWidgetBaseProps {
  node: any;
  client: any;
  nodeId: string;
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
 * `classNames` prop is applied afterwards for per-instance overrides.
 */

theme?: WidgetTheme<CardSlot> | BuiltInTheme;

  /** Applied to the widget's outermost element, on top of everything else. */
  className?: string;
  style?: React.CSSProperties;

  // Sizing — stay as direct props (shorthand for the container's
  // width/height), matching the existing ChartWidget convention.
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
}