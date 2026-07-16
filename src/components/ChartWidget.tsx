import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Tooltip } from "@base-ui/react/tooltip";
import { validateRequiredProps } from "../helpers/validate";
import { defaultDateFormatter, formatDate, formatNumber } from "../helpers/formatDate";
import {
  ChartElementStyles,
  ChartStyles,
  ThemeName,
  DEFAULT_THEME,
  themes,
  mergeElementStyles,
  extractFlatStyles,
  resolveResponsiveStyles,
  resolveStyleRules,
  StyleRule,
  Breakpoint,
} from "./chartTheme";

// Re-exported so consumers only ever need to import from ChartWidget,
// e.g. `import { ChartWidget } from "your-sdk"`.
export type { ChartElementStyles, ChartStyles, ThemeName, Breakpoint, StyleRule } from "./chartTheme";
export { lightTheme, darkTheme, themes, BREAKPOINTS, defineStyleRules } from "./chartTheme";

/* ------------------------ Types ------------------------ */
export interface ChartDataPoint {
  timestamp: number;
  value: number;
}

type WidgetState = {
  data: ChartDataPoint[];
  loading: boolean;
  error: string | null;
};

// `styles` accepts either a plain object, or a function that receives the
// widget's current state (data/loading/error) and returns a style set.
// The object itself can mix flat keys (unconditional), theme keys
// (light/dark — only the active one applies), and breakpoint keys
// (sm/md/lg/xl — see the SIZING MODEL note below for how these interact
// with width/height).
type StylesInput = ChartStyles | ((state: WidgetState) => ChartStyles);

export interface ChartWidgetProps {
  /**
   * The Anedya top-level SDK instance, created by the consumer:
   *
   *   const anedya = new Anedya();
   *
   * Required (in addition to `client`) because node creation is a method
   * on `anedya` itself, not on the client:
   *   const node = anedya.newNode(client, nodeId);
   */
  anedya: any;
  /**
   * The Anedya client instance, created and configured by the consumer:
   *
   *   const config = anedya.newConfig(tokenId, token);
   *   const client = anedya.newClient(config);
   */
  client: any;
  nodeId: string;
  variable: string;
  from: number;
  to: number;
  limit?: number;
  title?: string;
  /** Base color theme. Defaults to "light". `styles.light`/`styles.dark` can override either theme's specific palette. */
  theme?: ThemeName;
  /**
   * All styling lives here — unconditional, per-theme, and per-breakpoint,
   * all in one place, all using real CSS property names:
   *
   *   styles={{
   *     line: { stroke: "#7c3aed" },                          // always
   *     dark: { container: { backgroundColor: "#111827" } },  // dark theme only
   *     lg:   { tick: { fontSize: 12 } },                      // container >= 1024px
   *   }}
   *
   * SIZING MODEL (mirrors how MUI's `sx` breakpoint values work):
   * `width`/`minWidth`/`maxWidth`/`height`/`minHeight`/`maxHeight` are
   * just ordinary CSS properties on `container` — so they follow the
   * exact same rules as every other style:
   *
   *   - Pass `width` (as a prop, or `styles.container.width`) and define
   *     NO breakpoint overrides for it → completely fixed, at every
   *     container size. No responsiveness, by design.
   *   - Pass `width` AND ALSO override it at a breakpoint
   *     (`styles.lg.container.width`) → fixed at the base value, then
   *     steps to the new value once the container reaches that
   *     breakpoint. Responsiveness only appears because you opted in.
   *   - Pass `minWidth`/`maxWidth` with no `width` → fluid, continuously
   *     following the container size, clamped between those bounds
   *     (this is the default out-of-the-box behavior if you pass no
   *     sizing at all — clamped between sensible built-in defaults).
   *   - Pass different `minWidth`/`maxWidth` at different breakpoints →
   *     the fluid envelope itself steps at those breakpoints (e.g. a
   *     tighter clamp range on mobile, a wider one on desktop).
   *
   * The `width`/`height`/etc. PROPS below are just shorthand for setting
   * `styles.container.width` etc. unconditionally — if you also set the
   * same property explicitly inside `styles`, the `styles` value wins.
   */
  styles?: StylesInput;
  /**
   * Declarative threshold styling — no callback to write. Pass an array
   * of rules; the widget checks each one against the latest data point
   * and merges the styles of every rule that matches (later rules win
   * on overlapping keys, so rules can stack):
   *
   *   styleRules={[
   *     { when: (d) => d.value > 80, style: { line: { stroke: "#dc2626" } } },
   *     { when: (d) => d.value < 20, style: { line: { stroke: "#2563eb" } } },
   *   ]}
   *
   * This is the recommended way to do "if value crosses X, change the
   * styling." Use `onStyleChange` instead only if you need logic beyond
   * simple threshold matching.
   */
  styleRules?: StyleRule[];
  tooltipFormat?: (d: ChartDataPoint) => React.ReactNode;
  tickCount?: number;
  xTickFormat?: string | ((d: Date) => string);
  yTickFormat?: string | ((v: number) => string);
  /**
   * Called with the fetched data whenever it changes. Return a
   * ChartElementStyles object (the same flat CSS-property shape as
   * `styles`) to override styling conditionally. For simple threshold
   * checks, prefer `styleRules` above — reach for this only when you
   * need arbitrary logic that rules alone can't express.
   */
  onStyleChange?: (data: ChartDataPoint[]) => ChartElementStyles | void;
  /** Shorthand for `styles.container.width` (unconditional, unless you also override it at a breakpoint — see the SIZING MODEL note on `styles`). */
  width?: number;
  /** Shorthand for `styles.container.height`. */
  height?: number;
  /** Width-to-height ratio used to derive height when no fixed/resolved height is set anywhere. Defaults to 1.6 (800x500). */
  aspectRatio?: number;
  /** Shorthand for `styles.container.minWidth`. Defaults to 280 if nothing else sets a width. */
  minWidth?: number;
  /** Shorthand for `styles.container.maxWidth`. Defaults to 1200 if nothing else sets a width. */
  maxWidth?: number;
  /** Shorthand for `styles.container.minHeight`. Defaults to 200 if nothing else sets a height. */
  minHeight?: number;
  /** Shorthand for `styles.container.maxHeight`. Defaults to 700 if nothing else sets a height. */
  maxHeight?: number;
}

// Fallback size used only for the very first render, before ResizeObserver
// has reported the real container width (e.g. during SSR or the first
// paint frame). Once measured, `availableWidth` takes over.
const FALLBACK_WIDTH = 800;
const DEFAULT_ASPECT_RATIO = 800 / 500;
const MARGIN = { top: 16, right: 16, bottom: 36, left: 44 };

// Fallback bounds used only when NOTHING anywhere (props or `styles`, at
// any breakpoint) has set minWidth/maxWidth/minHeight/maxHeight — i.e.
// true out-of-the-box behavior with zero configuration.
const DEFAULT_MIN_WIDTH = 280;
const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_MIN_HEIGHT = 200;
const DEFAULT_MAX_HEIGHT = 700;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Only trust numeric pixel values for our sizing math. A string CSS value
// (e.g. "50%") is left alone and passed through to the DOM as-is, but
// can't participate in the clamp calculations below.
const asPixelNumber = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

const toDateSafe = (ts: number): Date => (ts < 1e12 ? new Date(ts * 1000) : new Date(ts));

/* ------------------------ ChartWidget ------------------------ */
export const ChartWidget: React.FC<ChartWidgetProps> = ({
  anedya,
  client,
  nodeId,
  variable,
  from,
  to,
  limit = 20,
  title = "Latest Data",
  theme = DEFAULT_THEME,
  styles = {},
  styleRules,
  tooltipFormat,
  tickCount = 4,
  xTickFormat,
  yTickFormat,
  onStyleChange,
  width: fixedWidth,
  height: fixedHeight,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  minWidth: propMinWidth,
  maxWidth: propMaxWidth,
  minHeight: propMinHeight,
  maxHeight: propMaxHeight,
}) => {
  validateRequiredProps(
    "Chart Widget",
    { anedya, client, nodeId, variable, from, to },
    ["anedya", "client", "nodeId", "variable", "from", "to"]
  );

  /* ------------------------------------------------------------
   * Measure the TRUE available space (container-query style — the
   * widget's own box, not the browser window). This always runs,
   * regardless of whether sizing looks "fixed": even a fixed width
   * might have breakpoint overrides in `styles`, and cosmetic
   * (non-sizing) breakpoint styles need to know the current
   * breakpoint too. This measurement is intentionally independent
   * of whatever we later decide the chart's own rendered size
   * should be — it's purely "how much room does our parent give us."
   * ---------------------------------------------------------- */
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number>(FALLBACK_WIDTH);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.round(entry.contentRect.width);
      // Guard against 0-width flashes (e.g. element briefly display:none)
      // which would otherwise collapse the chart to nothing.
      if (w > 0) setAvailableWidth(w);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [node, setNode] = useState<any>(null);
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Holds only the *data-driven* layer (styleRules + onStyleChange,
  // merged). Everything else (theme, shorthand-prop sizing,
  // flat/theme-specific/breakpoint `styles`) is resolved separately
  // below so resizing/theme-switching never waits on a data-fetch
  // round trip.
  const [callbackStyle, setCallbackStyle] = useState<ChartElementStyles>({});

  const mountedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Node creation is a method on the `anedya` instance itself (per the
  // SDK docs: `anedya.newNode(client, nodeId)`), not on `client`.
  useEffect(() => {
    if (!anedya || !client || !nodeId) return;
    setNode(anedya.newNode?.(client, nodeId) ?? null);
  }, [anedya, client, nodeId]);

  // Fetch data
  useEffect(() => {
    if (!node) return;
    mountedRef.current = true;

    const fetchData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await node.getData({ variable, from, to, limit, order: "asc" });
        if (!mountedRef.current) return;

        if (res.isSuccess && res.isDataAvailable) {
          setData(res.data);
        } else {
          setData([]);
          setError(res.error?.errorMessage ?? "No data available");
        }
      } catch (err: any) {
        if (!mountedRef.current) return;
        setData([]);
        setError(err?.message ?? "Failed to fetch data");
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [node, variable, from, to, limit]);

  // Resolve the data-driven layer whenever data changes: styleRules
  // first (declarative threshold matching), then onStyleChange on top
  // (so arbitrary custom logic can still override a rule if both are
  // used together).
  useEffect(() => {
    const fromRules = resolveStyleRules(styleRules, data);
    const fromCallback = onStyleChange?.(data) ?? {};
    setCallbackStyle(mergeElementStyles(fromRules, fromCallback));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, styleRules]);

  // Resolve the static/functional `styles` prop (may depend on
  // loading/error/data if passed as a function).
  const resolvedStylesInput: ChartStyles = useMemo(
    () => (typeof styles === "function" ? styles({ data, loading, error }) : styles),
    [styles, data, loading, error]
  );

  // The width/height/min/max PROPS are just shorthand for setting these
  // same properties unconditionally on `styles.container` — folded in as
  // their own layer so `styles.container.xyz`, if also explicitly set,
  // still wins (styles is the more explicit API, shorthand props are the
  // convenience default).
  const propsSizingLayer: ChartElementStyles = useMemo(
    () => ({
      container: {
        ...(fixedWidth != null && { width: fixedWidth }),
        ...(fixedHeight != null && { height: fixedHeight }),
        ...(propMinWidth != null && { minWidth: propMinWidth }),
        ...(propMaxWidth != null && { maxWidth: propMaxWidth }),
        ...(propMinHeight != null && { minHeight: propMinHeight }),
        ...(propMaxHeight != null && { maxHeight: propMaxHeight }),
      },
    }),
    [fixedWidth, fixedHeight, propMinWidth, propMaxWidth, propMinHeight, propMaxHeight]
  );

  // Final style resolution, in precedence order (low -> high):
  //   1. theme preset (light/dark)
  //   2. shorthand sizing props, folded in as container CSS
  //   3. flat/unconditional keys from `styles`
  //   4. theme-specific keys from `styles` (styles.light or styles.dark)
  //   5. breakpoint keys from `styles` (sm/md/lg/xl), resolved against
  //      `availableWidth` — the RAW measured space, not any already-
  //      clamped/fixed size, so breakpoint selection is never circular
  //   6. onStyleChange result — always wins, live data-driven
  //
  // Note this single `resolved` object carries BOTH the cosmetic styling
  // (line/dot/axis/tick colors etc.) AND the sizing (container width/
  // min/max) — they go through the exact same merge, which is what makes
  // "opt into responsiveness by overriding width at a breakpoint" work
  // for free, with no separate sizing system.
  const resolved = useMemo(() => {
    const flat = extractFlatStyles(resolvedStylesInput);
    const themeSpecific = resolvedStylesInput[theme] ?? {};
    const responsive = resolveResponsiveStyles(resolvedStylesInput, availableWidth);

    return mergeElementStyles(
      themes[theme],
      propsSizingLayer,
      flat,
      themeSpecific,
      responsive,
      callbackStyle
    );
  }, [resolvedStylesInput, theme, propsSizingLayer, availableWidth, callbackStyle]);

  /* ------------------------------------------------------------
   * Derive the chart's actual pixel size from the fully-resolved
   * container style. If a numeric width ended up set (from a prop,
   * flat styles, or the currently-active breakpoint), that's fixed —
   * full stop. Otherwise fall back to fluid: clamp the raw available
   * width between whatever min/max resolved (falling back to the
   * built-in defaults if nothing set them anywhere).
   * ---------------------------------------------------------- */
  const resolvedWidth = asPixelNumber(resolved.container?.width);
  const resolvedMinWidth = asPixelNumber(resolved.container?.minWidth) ?? DEFAULT_MIN_WIDTH;
  const resolvedMaxWidth = asPixelNumber(resolved.container?.maxWidth) ?? DEFAULT_MAX_WIDTH;
  const effectiveWidth = resolvedWidth ?? clamp(availableWidth, resolvedMinWidth, resolvedMaxWidth);

  const resolvedHeight = asPixelNumber(resolved.container?.height);
  const resolvedMinHeight = asPixelNumber(resolved.container?.minHeight) ?? DEFAULT_MIN_HEIGHT;
  const resolvedMaxHeight = asPixelNumber(resolved.container?.maxHeight) ?? DEFAULT_MAX_HEIGHT;
  const effectiveHeight =
    resolvedHeight ?? clamp(Math.round(effectiveWidth / aspectRatio), resolvedMinHeight, resolvedMaxHeight);

  const CHART_W = effectiveWidth - MARGIN.left - MARGIN.right;
  const CHART_H = effectiveHeight - MARGIN.top - MARGIN.bottom;

  // Fewer x-axis ticks on narrow containers so labels don't overlap.
  const effectiveTickCount =
    effectiveWidth < 380 ? Math.min(tickCount, 2) : effectiveWidth < 560 ? Math.min(tickCount, 3) : tickCount;

  const { linePath, areaPath, points, xTicks, yTicks } = useMemo(() => {
    if (!data.length) {
      return { linePath: "", areaPath: "", points: [] as { cx: number; cy: number; point: ChartDataPoint }[], xTicks: [], yTicks: [] };
    }

    const dates = data.map((d) => toDateSafe(d.timestamp));
    const x = d3.scaleTime().domain(d3.extent(dates) as [Date, Date]).range([0, CHART_W]);
    const maxY = Math.max(10, d3.max(data, (d) => d.value) ?? 10);
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([CHART_H, 0]);

    const line = d3
      .line<ChartDataPoint>()
      .x((d) => x(toDateSafe(d.timestamp)))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const area = d3
      .area<ChartDataPoint>()
      .x((d) => x(toDateSafe(d.timestamp)))
      .y0(CHART_H)
      .y1((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const points = data.map((d) => ({
      cx: x(toDateSafe(d.timestamp)),
      cy: y(d.value),
      point: d,
    }));

    const xTicks = x.ticks(effectiveTickCount).map((d) => ({
      x: x(d),
      label:
        typeof xTickFormat === "function"
          ? xTickFormat(d)
          : typeof xTickFormat === "string"
          ? formatDate(d, xTickFormat)
          : defaultDateFormatter(d),
    }));

    const yTicks = y.ticks(4).map((v) => ({
      y: y(v),
      label:
        typeof yTickFormat === "function"
          ? yTickFormat(v)
          : typeof yTickFormat === "string"
          ? formatNumber(v, yTickFormat)
          : String(v),
    }));

    return { linePath: line(data) ?? "", areaPath: area(data) ?? "", points, xTicks, yTicks };
  }, [data, effectiveTickCount, xTickFormat, yTickFormat, CHART_W, CHART_H]);

  const gradientId = useMemo(() => `chart-gradient-${Math.random().toString(36).slice(2, 9)}`, []);
  const dotRadius = resolved.dot?.r ?? 3.5;
  const dotFill = (resolved.dot?.fill as string) ?? "#1e88e5";
  const areaFill = (resolved.area?.fill as string) ?? dotFill;

  // Sizing properties are already accounted for in effectiveWidth/
  // effectiveHeight above — strip them out of the container style before
  // spreading it onto the div, so we don't set `width` in two places
  // (once explicitly as the computed pixel value, once implicitly via
  // spread) with potentially different string/number representations.
  const {
    width: _w,
    minWidth: _mnw,
    maxWidth: _mxw,
    height: _h,
    minHeight: _mnh,
    maxHeight: _mxh,
    ...containerVisualStyle
  } = resolved.container ?? {};

  return (
    // NOTE ON STYLING APPROACH: this component uses inline styles / SVG
    // presentation CSS instead of Tailwind classes. Base UI (used below
    // for the tooltip) is headless and doesn't need Tailwind — but
    // Tailwind utility classNames shipped from an SDK package don't
    // compile in a consuming app's build unless that app's Tailwind
    // `content` glob explicitly scans this package, which most consumers
    // won't have configured. Inline styles work everywhere with zero
    // consumer setup.
    //
    // TWO-LAYER STRUCTURE for scroll-on-overflow:
    //   outer (ref'd, measured by ResizeObserver) — fills 100% of
    //     whatever the true parent gives us, scrolls horizontally if
    //     content inside is wider than itself.
    //   inner (the "card") — always rendered at its full resolved
    //     effectiveWidth. If that's wider than the outer wrapper's real
    //     space, it overflows the outer's box, which (with
    //     overflowX: auto) becomes a scrollbar instead of squished or
    //     broken content.
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflowX: "auto",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          borderRadius: 12,
          padding: 16,
          textAlign: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          width: effectiveWidth,
          boxSizing: "border-box",
          // Cosmetic container overrides (border, backgroundColor, etc.)
          // spread last so theme/user styling cleanly overrides the
          // layout defaults above. Sizing keys were already stripped out
          // (handled via effectiveWidth/effectiveHeight instead).
          ...containerVisualStyle,
        }}
      >
        {title && (
          <h2
            style={{
              margin: 0,
              ...resolved.title,
            }}
          >
            {title}
          </h2>
        )}

        {loading ? (
          <div
            style={{
              display: "flex",
              height: effectiveHeight,
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                height: 32,
                width: 32,
                borderRadius: "50%",
                border: "2px solid #cbd5e1",
                borderTopColor: "#475569",
                animation: "chart-widget-spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes chart-widget-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div
            style={{
              display: "flex",
              height: effectiveHeight,
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 8px",
            }}
          >
            <div
              style={{
                borderRadius: 6,
                border: "1px solid #fca5a5",
                backgroundColor: "#fef2f2",
                padding: "8px 12px",
                fontSize: 14,
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          </div>
        ) : data.length === 0 ? (
          <div
            style={{
              display: "flex",
              height: effectiveHeight,
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 8px",
              fontSize: 14,
              color: "#94a3b8",
            }}
          >
            No data available
          </div>
        ) : (
          // Base UI's Tooltip primitives handle positioning, portaling,
          // and accessibility only — no visual styling of their own.
          // (Flagged for a d3-based tooltip swap later, per your note —
          // left as-is for this pass since it's a separate concern from
          // the architectural changes here.)
          <Tooltip.Provider>
            <svg
              viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
              style={{ width: "100%", maxWidth: "100%", display: "block" }}
              role="img"
              aria-label={title}
            >
              <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                <defs>
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={areaFill} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={areaFill} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path d={linePath} style={{ fill: "none", ...resolved.line }} />

                {/* X axis */}
                <line
                  x1={0}
                  y1={CHART_H}
                  x2={CHART_W}
                  y2={CHART_H}
                  style={resolved.axis}
                />
                {xTicks.map((t, i) => (
                  <text
                    key={i}
                    x={t.x}
                    y={CHART_H + 20}
                    textAnchor="middle"
                    style={resolved.tick}
                  >
                    {t.label}
                  </text>
                ))}

                {/* Y axis */}
                {yTicks.map((t, i) => (
                  <text
                    key={i}
                    x={-10}
                    y={t.y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    style={resolved.tick}
                  >
                    {t.label}
                  </text>
                ))}

                {points.map(({ cx, cy, point }, i) => {
                  const tooltipContent = tooltipFormat
                    ? tooltipFormat(point)
                    : `${toDateSafe(point.timestamp).toLocaleString()}: ${point.value}`;

                  return (
                    <Tooltip.Root key={i}>
                      <Tooltip.Trigger
                        render={
                          <g style={{ cursor: "default" }} tabIndex={0}>
                            {/* Native fallback tooltip, works even if the
                                Base UI popup fails to render for any reason. */}
                            <title>
                              {typeof tooltipContent === "string"
                                ? tooltipContent
                                : `${toDateSafe(point.timestamp).toLocaleString()}: ${point.value}`}
                            </title>
                            {/* Invisible, larger hit target — the visible
                                dot alone is too small to reliably hover. */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={Math.max(dotRadius + 6, 10)}
                              fill="transparent"
                            />
                            {/* The visible dot — purely decorative. */}
                            <circle
                              cx={cx}
                              cy={cy}
                              r={dotRadius}
                              style={{ pointerEvents: "none", ...resolved.dot }}
                            />
                          </g>
                        }
                      />
                      <Tooltip.Portal>
                        <Tooltip.Positioner sideOffset={8}>
                          <Tooltip.Popup
                            style={{
                              borderRadius: 6,
                              backgroundColor: "#0f172a",
                              padding: "4px 8px",
                              fontSize: 12,
                              color: "#fff",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                              zIndex: 9999,
                            }}
                          >
                            {tooltipContent}
                          </Tooltip.Popup>
                        </Tooltip.Positioner>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  );
                })}
              </g>
            </svg>
          </Tooltip.Provider>
        )}
      </div>
    </div>
  );
};

// TODO: swap Base UI tooltip for a d3-based one (per plan). Also:
// axis-specific style overrides beyond a single stroke, dot-decimation
// on very narrow/dense containers.