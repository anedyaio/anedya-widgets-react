import type { ChartDataPoint } from "./ChartWidget";

/* ============================================================
 * ChartColors
 * ------------------------------------------------------------
 * Every color/visual token the chart actually renders with.
 * This is intentionally a flat object of *required* fields so
 * that `themes.light` / `themes.dark` are guaranteed complete —
 * no risk of an undefined color slipping through at render time.
 * ============================================================ */
export interface ChartColors {
  strokeColor: string;
  strokeWidth: number;
  gradientColors: [string, string];
  dotRadius: number;
  axisColor: string;
  tickColor: string;
  backgroundColor: string;
  borderColor: string;
  titleColor: string;
  /** Font size (px) for axis tick labels. Exposed so responsiveStyles can shrink it on small screens. */
  tickFontSize: number;
  /** Font size (px) for the chart title. Exposed so responsiveStyles can shrink it on small screens. */
  titleFontSize: number;

  barColor?: string;
  barHoverColor?: string;
  barRadius?: number; 
  tooltipBg?: string;
  tooltipColor?: string;
}

/* ============================================================
 * ChartStyleSet
 * ------------------------------------------------------------
 * This is the shape every styling entry point accepts:
 *   - the `styles` prop (static or a function of widget state)
 *   - the return value of `onStyleChange`
 *   - each `style` inside a `defineStyleRules` rule
 *
 * `chart` is `Partial<ChartColors>` because callers should be
 * able to override just one or two tokens (e.g. only strokeColor
 * when a threshold is crossed) without having to restate every
 * other color.
 * ============================================================ */
export interface ChartStyleSet {
  container?: React.CSSProperties;
  title?: React.CSSProperties;
  chart?: Partial<ChartColors>;
}

/* ============================================================
 * Theme presets
 * ------------------------------------------------------------
 * These are the *base layer* of styling — applied before the
 * user's `styles` prop and before any `onStyleChange` result.
 * Add more presets here (e.g. "minimal") as needed; just make
 * sure they satisfy ChartColors fully.
 * ============================================================ */
export const lightTheme: ChartColors = {
  strokeColor: "#1e88e5",
  strokeWidth: 2,
  gradientColors: ["#1e88e5", "#90caf9"],
  dotRadius: 3.5,
  axisColor: "#cbd5e1",
  tickColor: "#64748b",
  backgroundColor: "#f8fafc",
  borderColor: "#e2e8f0",
  titleColor: "#0f172a",
  tickFontSize: 10,
  titleFontSize: 16,

  barColor: "#1e88e5",       
  barHoverColor: "#1565c0", 
  barRadius: 3,
  tooltipBg: "#0f172a",
  tooltipColor: "#ffffff",
};

export const darkTheme: ChartColors = {
  strokeColor: "#60a5fa",
  strokeWidth: 2,
  gradientColors: ["#60a5fa", "#1e3a8a"],
  dotRadius: 3.5,
  axisColor: "#334155",
  tickColor: "#94a3b8",
  backgroundColor: "#0f172a",
  borderColor: "#1e293b",
  titleColor: "#f1f5f9",
  tickFontSize: 10,
  titleFontSize: 16,

  barColor: "#60a5fa", 
  barHoverColor: "#3b82f6",
  barRadius: 3,
  tooltipBg: "#1e293b",
  tooltipColor: "#f1f5f9",
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type ThemeName = keyof typeof themes;

/** Default theme for every ChartWidget instance unless overridden via the `theme` prop. */
export const DEFAULT_THEME: ThemeName = "light";

/* ============================================================
 * mergeStyleSets
 * ------------------------------------------------------------
 * Combines any number of ChartStyleSet objects, left to right,
 * where later sets win. Each of container/title/chart is merged
 * independently (shallow per-key), so passing only
 * `{ chart: { strokeColor: "red" } }` never wipes out the other
 * chart tokens that came from an earlier layer (e.g. the theme).
 *
 * Overall precedence used by ChartWidget (lowest to highest):
 *   1. theme preset (light/dark)
 *   2. `styles` prop (static object or function of widget state)
 *   3. `onStyleChange` result (re-evaluated whenever data changes)
 * ============================================================ */
export function mergeStyleSets(
  ...sets: (ChartStyleSet | undefined | null)[]
): ChartStyleSet {
  const result: ChartStyleSet = {};
  for (const set of sets) {
    if (!set) continue;
    result.container = { ...result.container, ...set.container };
    result.title = { ...result.title, ...set.title };
    result.chart = { ...result.chart, ...set.chart };
  }
  return result;
}

/* ============================================================
 * Responsive breakpoints
 * ------------------------------------------------------------
 * These are CONTAINER-width breakpoints (measured via
 * ResizeObserver on the widget's own wrapper), not viewport/
 * window breakpoints — matching CSS container-query semantics
 * rather than media-query semantics. That's the right behavior
 * for an embeddable widget: it should adapt to the box it's
 * placed in (a sidebar, a dashboard tile, a modal), not to the
 * size of the browser window, which may be much larger than the
 * space actually given to the widget.
 *
 * Thresholds mirror Tailwind's default breakpoints so the mental
 * model transfers directly for anyone used to Tailwind's
 * sm:/md:/lg:/xl: prefixes.
 * ============================================================ */
export type Breakpoint = "sm" | "md" | "lg" | "xl";

export const BREAKPOINTS: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

/**
 * Responsive style map. `base` always applies; each named
 * breakpoint applies *in addition*, once the container's
 * measured width is >= that breakpoint's threshold — mobile
 * first, same cascade model as Tailwind's responsive prefixes.
 *
 * This is a SEPARATE prop from `styles` on purpose: `styles`
 * (or a static object) is unconditional fixed styling that
 * applies identically at every screen size, while
 * `responsiveStyles` is only ever consulted per-breakpoint.
 * Passing one doesn't affect how the other behaves.
 */
export type ResponsiveStyleSet = Partial<Record<"base" | Breakpoint, ChartStyleSet>>;

/**
 * Resolves a ResponsiveStyleSet down to a single flat
 * ChartStyleSet for the widget's current measured container
 * width. Layers are merged in ascending breakpoint order so
 * larger breakpoints override smaller ones on overlapping keys,
 * exactly like cascading CSS media queries.
 */
export function resolveResponsiveStyle(
  responsiveStyles: ResponsiveStyleSet | undefined,
  containerWidth: number
): ChartStyleSet {
  if (!responsiveStyles) return {};

  const layers: ChartStyleSet[] = [];
  if (responsiveStyles.base) layers.push(responsiveStyles.base);

  (Object.keys(BREAKPOINTS) as Breakpoint[])
    .sort((a, b) => BREAKPOINTS[a] - BREAKPOINTS[b])
    .forEach((bp) => {
      if (containerWidth >= BREAKPOINTS[bp] && responsiveStyles[bp]) {
        layers.push(responsiveStyles[bp]!);
      }
    });

  return mergeStyleSets(...layers);
}

/* ============================================================
 * StyleRule / defineStyleRules
 * ------------------------------------------------------------
 * Sugar for the common "if value crosses some threshold, change
 * the styling" pattern, without writing a raw onStyleChange
 * callback by hand every time.
 *
 * `when` is evaluated against the *latest* data point (most
 * recent value) plus the full data array, in case a rule needs
 * more context (e.g. comparing against an average).
 *
 * If multiple rules match, their styles are merged in array
 * order (later matching rules win on overlapping keys) — this
 * lets you stack rules like "base warning color" + "critical
 * override" instead of only ever applying one.
 *
 * Usage:
 *   onStyleChange={defineStyleRules([
 *     { when: (d) => d.value > 80, style: { chart: { strokeColor: "#dc2626" } } },
 *     { when: (d) => d.value < 20, style: { chart: { strokeColor: "#2563eb" } } },
 *   ])}
 * ============================================================ */
export interface StyleRule {
  when: (latest: ChartDataPoint, allData: ChartDataPoint[]) => boolean;
  style: ChartStyleSet;
}

export function defineStyleRules(
  rules: StyleRule[]
): (data: ChartDataPoint[]) => ChartStyleSet {
  return (data: ChartDataPoint[]) => {
    const latest = data[data.length - 1];
    if (!latest) return {};

    const matched = rules.filter((rule) => rule.when(latest, data));
    return mergeStyleSets(...matched.map((rule) => rule.style));
  };
}
