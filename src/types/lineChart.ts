import * as d3 from "d3";

export interface LineChartDataPoint {
  timestamp: number;
  value: number;
}

export type LineChartSlot =
  | "container"
  | "title"
  | "label"
  | "line"
  | "area"
  | "point"
  | "grid"
  | "xAxis"
  | "yAxis"
  | "tooltip"
  | "latestBadge"   // NEW — the floating "current value" pill
  | "refreshButton" // NEW — the refresh icon button
  | "error"
  |"summary"
  |"empty";

export interface LineChartTooltipConfig {
  /** Whether hovering the chart shows a tooltip. Default: `true`. */
  show?: boolean;

  /**
   * Custom tooltip CONTENT — keeps the widget's built-in tooltip
   * positioning/follow-the-pointer behavior, but lets you control what's
   * shown inside it. Receives the hovered data point.
   */
  content?: (d: LineChartDataPoint) => React.ReactNode;

  /**
   * Full D3-idiomatic raw event hooks — the SAME handler signatures
   * you'd pass to `.on("mouseover", ...)` on a real D3 selection.
   * Providing ANY of these opts you out of the widget's built-in
   * tooltip entirely; you're responsible for building/positioning your
   * own tooltip DOM, exactly as you would in hand-written D3.
   */
  onMouseOver?: (event: MouseEvent, d: LineChartDataPoint) => void;
  onMouseMove?: (event: MouseEvent, d: LineChartDataPoint) => void;
  onMouseOut?: (event: MouseEvent) => void;
}

export interface LineChartGridConfig {
  show?: boolean;
  /** Number of horizontal gridlines (approx — d3 ticks() is a suggestion, not a guarantee). Default: 5. */
  ticksY?: number;
  /** Number of vertical gridlines. Default: 5. */
  ticksX?: number;
}

export interface LineChartAreaConfig {
  /** Fill the area under the line. Default: `false`. */
  show?: boolean;
  /** Opacity of the area fill. Default: `0.15`. */
  opacity?: number;
}

export interface LineChartPointConfig {
  /** Draw a dot at each data point. Default: `false`. */
  show?: boolean;
  /** Dot radius in px. Default: `3`. */
  radius?: number;
}