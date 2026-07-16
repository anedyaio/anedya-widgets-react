import type { ChartDataPoint } from "./ChartWidget";

/* ============================================================
 * ChartElementStyles
 * ------------------------------------------------------------
 * Every stylable part of the chart, each taking REAL CSS
 * properties (the same ones you'd use in any inline `style`
 * object) instead of invented names. This is the "just like
 * inline styling" shape your boss asked for — no new vocabulary
 * to learn: `stroke`, `fill`, `strokeWidth`, `fontSize`, `color`,
 * `border`, `backgroundColor`, etc. all work exactly as they do
 * anywhere else in React.
 *
 * All standard SVG presentation properties (fill, stroke,
 * strokeWidth, fontSize, opacity, ...) are valid inside a plain
 * `style` object on an SVG element in every modern browser — so
 * these get spread directly onto the corresponding <path>/<line>/
 * <text> elements with no translation layer.
 *
 * The one exception is `dot.r` (circle radius): SVG geometry
 * properties like radius aren't stylable via CSS, only settable
 * as an element attribute — so it's a plain number, not part of
 * CSSProperties.
 * ============================================================ */
export interface ChartElementStyles {
  /** The outer card wrapper. */
  container?: React.CSSProperties;
  /** The chart title text. */
  title?: React.CSSProperties;
  /** The line stroke itself. Use `stroke` and `strokeWidth`. */
  line?: React.CSSProperties;
  /** The filled area under the line. Use `fill` for the gradient's base color. */
  area?: React.CSSProperties;
  /** Data point markers. Use `fill` for color; `r` for radius (plain number, not stylable via CSS). */
  dot?: React.CSSProperties & { r?: number };
  /** The x-axis baseline. Use `stroke`. */
  axis?: React.CSSProperties;
  /** Axis tick labels. Use `fill` for color, `fontSize` for size. */
  tick?: React.CSSProperties;
}

const ELEMENT_KEYS = [
  "container",
  "title",
  "line",
  "area",
  "dot",
  "axis",
  "tick",
] as const;

/* ============================================================
 * Breakpoints & themes
 * ------------------------------------------------------------
 * Container-width breakpoints (measured via ResizeObserver on
 * the widget's own box — container-query semantics, not
 * viewport/media-query semantics), matching Tailwind's default
 * thresholds so the mental model transfers directly.
 * ============================================================ */
export type Breakpoint = "sm" | "md" | "lg" | "xl";

export const BREAKPOINTS: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export type ThemeName = "light" | "dark";
export const DEFAULT_THEME: ThemeName = "light";

/* ============================================================
 * ChartStyles — the full shape of the `styles` prop
 * ------------------------------------------------------------
 * ONE prop carries everything: unconditional styling (the flat
 * keys), per-theme overrides (`light`/`dark`), and per-breakpoint
 * overrides (`sm`/`md`/`lg`/`xl`) — all optional, all composable.
 * There's no separate "responsiveStyles" prop; responsiveness is
 * just additional keys on this same object.
 *
 *   styles={{
 *     // flat keys: apply unconditionally, at every theme/size
 *     line: { stroke: "#7c3aed" },
 *
 *     // theme-specific: only applies when that theme is active
 *     dark: { container: { backgroundColor: "#111827" } },
 *
 *     // breakpoint-specific: only applies once the widget's
 *     // measured width crosses that threshold (mobile-first —
 *     // each larger breakpoint layers on top of smaller ones)
 *     sm: { tick: { fontSize: 8 } },
 *     lg: { tick: { fontSize: 12 } },
 *   }}
 * ============================================================ */
export type ChartStyles = ChartElementStyles &
  Partial<Record<ThemeName, ChartElementStyles>> &
  Partial<Record<Breakpoint, ChartElementStyles>>;

/* ============================================================
 * Theme presets
 * ------------------------------------------------------------
 * The base layer, selected via the `theme` prop. Every value is
 * plain CSS, so overriding any single token from `styles` is a
 * one-line change — no custom shape to match.
 * ============================================================ */
export const lightTheme: ChartElementStyles = {
  container: { border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" },
  title: { color: "#0f172a", fontSize: 16, fontWeight: 600 },
  line: { stroke: "#1e88e5", strokeWidth: 2 },
  area: { fill: "#1e88e5" },
  dot: { fill: "#1e88e5", r: 3.5 },
  axis: { stroke: "#cbd5e1" },
  tick: { fill: "#64748b", fontSize: 10 },
};

export const darkTheme: ChartElementStyles = {
  container: { border: "1px solid #1e293b", backgroundColor: "#0f172a" },
  title: { color: "#f1f5f9", fontSize: 16, fontWeight: 600 },
  line: { stroke: "#60a5fa", strokeWidth: 2 },
  area: { fill: "#60a5fa" },
  dot: { fill: "#60a5fa", r: 3.5 },
  axis: { stroke: "#334155" },
  tick: { fill: "#94a3b8", fontSize: 10 },
};

export const themes: Record<ThemeName, ChartElementStyles> = {
  light: lightTheme,
  dark: darkTheme,
};

/* ============================================================
 * mergeElementStyles
 * ------------------------------------------------------------
 * Combines any number of ChartElementStyles, left to right,
 * later sets winning per-key within each part. Because every
 * part is now just a plain CSSProperties object, merging is a
 * simple per-part spread — no custom-shape bookkeeping needed.
 * ============================================================ */
export function mergeElementStyles(
  ...sets: (ChartElementStyles | undefined | null)[]
): ChartElementStyles {
  const result: ChartElementStyles = {};
  for (const set of sets) {
    if (!set) continue;
    for (const key of ELEMENT_KEYS) {
      if (set[key]) {
        result[key] = { ...result[key], ...set[key] } as any;
      }
    }
  }
  return result;
}

/**
 * Pulls out just the unconditional/flat part of a ChartStyles
 * object — i.e. everything EXCEPT the theme-name and breakpoint
 * keys. This is what applies regardless of active theme or size.
 */
export function extractFlatStyles(styles: ChartStyles): ChartElementStyles {
  const result: ChartElementStyles = {};
  for (const key of ELEMENT_KEYS) {
    if (styles[key]) (result as any)[key] = styles[key];
  }
  return result;
}

/**
 * Resolves the breakpoint-specific layers of a ChartStyles object
 * for the widget's current measured width. Mobile-first cascade:
 * each breakpoint the container has reached applies on top of
 * smaller ones, same model as Tailwind's sm:/md:/lg:/xl: prefixes.
 */
export function resolveResponsiveStyles(
  styles: ChartStyles,
  containerWidth: number
): ChartElementStyles {
  const layers: ChartElementStyles[] = [];
  (Object.keys(BREAKPOINTS) as Breakpoint[])
    .sort((a, b) => BREAKPOINTS[a] - BREAKPOINTS[b])
    .forEach((bp) => {
      if (containerWidth >= BREAKPOINTS[bp] && styles[bp]) {
        layers.push(styles[bp]!);
      }
    });
  return mergeElementStyles(...layers);
}

/* ============================================================
 * StyleRule / resolveStyleRules
 * ------------------------------------------------------------
 * Declarative "if the latest value crosses a threshold, change
 * the styling" rules. Pass these straight to the widget's
 * `styleRules` prop — no wrapping needed, the widget evaluates
 * them internally against the latest data point:
 *
 *   styleRules={[
 *     { when: (d) => d.value > 80, style: { line: { stroke: "#dc2626" } } },
 *     { when: (d) => d.value < 20, style: { line: { stroke: "#2563eb" } } },
 *   ]}
 *
 * If multiple rules match, their styles are merged in array order
 * (later matching rules win on overlapping keys), so rules can be
 * stacked (e.g. a broad "warning" rule plus a narrower "critical"
 * rule) instead of only ever applying a single match.
 * ============================================================ */
export interface StyleRule {
  when: (latest: ChartDataPoint, allData: ChartDataPoint[]) => boolean;
  style: ChartElementStyles;
}

/**
 * Evaluates a set of StyleRules against the latest data point and
 * returns the merged style of every rule that matched. This is what
 * the widget's `styleRules` prop calls directly — no import needed
 * on the consumer's side beyond the `StyleRule` type itself.
 */
export function resolveStyleRules(
  rules: StyleRule[] | undefined,
  data: ChartDataPoint[]
): ChartElementStyles {
  if (!rules || !rules.length) return {};
  const latest = data[data.length - 1];
  if (!latest) return {};

  const matched = rules.filter((rule) => rule.when(latest, data));
  return mergeElementStyles(...matched.map((rule) => rule.style));
}

/**
 * @deprecated Prefer passing rules directly to the widget's
 * `styleRules` prop — no wrapping required. This still works and is
 * kept for anyone composing rule-based logic into their own custom
 * `onStyleChange` callback by hand.
 */
export function defineStyleRules(
  rules: StyleRule[]
): (data: ChartDataPoint[]) => ChartElementStyles {
  return (data: ChartDataPoint[]) => resolveStyleRules(rules, data);
}