import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Tooltip } from "@base-ui/react/tooltip";
import { validateRequiredProps } from "../helpers/validate";
import { defaultDateFormatter, formatDate, formatNumber } from "../helpers/formatDate";
import {
  ChartStyleSet,
  ThemeName,
  DEFAULT_THEME,
  themes,
  mergeStyleSets,
  ResponsiveStyleSet,
  resolveResponsiveStyle,
} from "./chartTheme";

// Re-exported so consumers only ever need to import from ChartWidget,
// e.g. `import { ChartWidget, defineStyleRules } from "your-sdk"`.
export type { ChartStyleSet, ThemeName, ResponsiveStyleSet, Breakpoint } from "./chartTheme";
export { defineStyleRules, lightTheme, darkTheme, themes, BREAKPOINTS } from "./chartTheme";

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
// widget's current state (data/loading/error) and returns a style set —
// useful if styling should depend on load state, not just the data values.
// NOTE: this is always UNCONDITIONAL fixed styling — same at every screen
// size. Use `responsiveStyles` (below) for per-breakpoint overrides.
type StylesInput = ChartStyleSet | ((state: WidgetState) => ChartStyleSet);

export interface ChartWidgetProps {
  client: any;
  nodeId: string;
  variable: string;
  from: number;
  to: number;
  limit?: number;
  title?: string;
  /** Base color theme. Defaults to "light". Overridden per-token by `styles`, `responsiveStyles`, and `onStyleChange`. */
  theme?: ThemeName;
  /** Fixed styling, unconditional across all screen/container sizes. */
  styles?: StylesInput;
  /**
   * Per-breakpoint styling, layered on top of `styles`. Mobile-first:
   * `base` always applies, then `sm`/`md`/`lg`/`xl` apply additionally
   * once the widget's own measured container width crosses that
   * breakpoint. This measures the widget's OWN box (container-query
   * style), not the browser window, so it behaves correctly no matter
   * where it's embedded.
   *
   *   responsiveStyles={{
   *     base: { chart: { dotRadius: 2, tickFontSize: 8 } },
   *     md:   { chart: { dotRadius: 3.5, tickFontSize: 10 } },
   *     lg:   { chart: { dotRadius: 4.5, tickFontSize: 12 } },
   *   }}
   */
  responsiveStyles?: ResponsiveStyleSet;
  tooltipFormat?: (d: ChartDataPoint) => string;
  tickCount?: number;
  xTickFormat?: string | ((d: Date) => string);
  yTickFormat?: string | ((v: number) => string);
  /**
   * Called with the fetched data whenever it changes. Return a ChartStyleSet
   * to override styling conditionally — e.g. recolor the line when the
   * latest value crosses a threshold. Pair with `defineStyleRules(...)` for
   * a declarative shorthand instead of writing this by hand:
   *
   *   onStyleChange={defineStyleRules([
   *     { when: (d) => d.value > 80, style: { chart: { strokeColor: "#dc2626" } } },
   *     { when: (d) => d.value < 20, style: { chart: { strokeColor: "#2563eb" } } },
   *   ])}
   */
  onStyleChange?: (data: ChartDataPoint[]) => ChartStyleSet | void;
  /**
   * Fixed pixel width. If omitted, the chart is fully RESPONSIVE — it
   * fills whatever width its parent container gives it, tracked live via
   * ResizeObserver. Set this only if you specifically want a non-fluid,
   * constant-size chart.
   */
  width?: number;
  /**
   * Fixed pixel height. If omitted while `width` is also omitted, height
   * is derived from `aspectRatio` relative to the measured container
   * width, so the chart keeps sensible proportions at any size.
   */
  height?: number;
  /** Width-to-height ratio used to derive height when the chart is responsive (no fixed height given). Defaults to 1.6 (800x500). */
  aspectRatio?: number;
  /**
   * Lower/upper bounds (px) on the RESPONSIVE size — ignored entirely if
   * `width`/`height` are set to a fixed value, since those already mean
   * "constant, don't resize at all." These only kick in for the fluid
   * (no fixed width/height) case, so the chart stops shrinking once the
   * container gets very small, and stops growing once it gets very large.
   * Defaults: minWidth 280, maxWidth 1200, minHeight 200, maxHeight 700.
   * Pass your own to override — your values always take precedence over
   * these defaults.
   */
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

// Fallback size used only for the very first render, before ResizeObserver
// has reported the real container width (e.g. during SSR or the first
// paint frame). Once measured, `measuredWidth` takes over.
const FALLBACK_WIDTH = 800;
const DEFAULT_ASPECT_RATIO = 800 / 500;
const MARGIN = { top: 16, right: 16, bottom: 36, left: 44 };

// Default responsive bounds — only used when the chart is fluid (no fixed
// width/height passed) and the caller hasn't supplied their own bounds.
// These exist so the chart can't shrink into an unreadable sliver on a
// tiny screen, or stretch absurdly wide/tall on a huge one.
const DEFAULT_MIN_WIDTH = 280;
const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_MIN_HEIGHT = 200;
const DEFAULT_MAX_HEIGHT = 700;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toDateSafe = (ts: number): Date => (ts < 1e12 ? new Date(ts * 1000) : new Date(ts));

/* ------------------------ ChartWidget ------------------------ */
export const ChartWidget: React.FC<ChartWidgetProps> = ({
  client,
  nodeId,
  variable,
  from,
  to,
  limit = 20,
  title = "Latest Data",
  theme = DEFAULT_THEME,
  styles = {},
  responsiveStyles,
  tooltipFormat,
  tickCount = 4,
  xTickFormat,
  yTickFormat,
  onStyleChange,
  width: fixedWidth,
  height: fixedHeight,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxHeight = DEFAULT_MAX_HEIGHT,
}) => {
  validateRequiredProps(
    "Chart Widget",
    { client, nodeId, variable, from, to },
    ["client", "nodeId", "variable", "from time", "to time"]
  );

  /* ------------------------------------------------------------
   * Responsive sizing
   * ------------------------------------------------------------
   * If `fixedWidth` is provided, the chart behaves exactly like
   * before (constant pixel size, same on every screen). Otherwise
   * we measure the wrapper div's real rendered width via
   * ResizeObserver and recompute on every resize — so the chart
   * genuinely fills whatever space it's given, live, without a
   * page reload.
   * ---------------------------------------------------------- */
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(FALLBACK_WIDTH);

  useLayoutEffect(() => {
    // Fixed width means we never need to observe — skip entirely.
    if (fixedWidth != null) return;
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.round(entry.contentRect.width);
      // Guard against 0-width flashes (e.g. element briefly display:none)
      // which would otherwise collapse the chart to nothing.
      if (w > 0) setMeasuredWidth(w);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [fixedWidth]);

  const effectiveWidth = fixedWidth ?? clamp(measuredWidth, minWidth, maxWidth);
  const effectiveHeight =
    fixedHeight ?? clamp(Math.round(effectiveWidth / aspectRatio), minHeight, maxHeight);

  const CHART_W = effectiveWidth - MARGIN.left - MARGIN.right;
  const CHART_H = effectiveHeight - MARGIN.top - MARGIN.bottom;

  // Fewer x-axis ticks on narrow containers so labels don't overlap.
  // Only kicks in below the widths where crowding actually becomes a
  // problem; larger containers use the caller's requested tickCount as-is.
  const effectiveTickCount =
    effectiveWidth < 380 ? Math.min(tickCount, 2) : effectiveWidth < 560 ? Math.min(tickCount, 3) : tickCount;

  const [node, setNode] = useState<any>(null);
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Holds only the *data-driven* layer of styling (from `styles` prop +
  // `onStyleChange`). Theme and responsiveStyles are applied separately
  // below so that resizing or switching `theme` never requires waiting
  // on the data-fetch effect.
  const [dynamicStyle, setDynamicStyle] = useState<ChartStyleSet>({});

  const mountedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Resolve the node through the client's (rate-limited) Anedya instance
  useEffect(() => {
    if (!client || !nodeId) return;
    const anedya = client._anedya;
    setNode(anedya?.newNode?.(client, nodeId) ?? null);
  }, [client, nodeId]);

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

  // Resolve the `styles` prop (static or function) and `onStyleChange`
  // result whenever the data changes, and merge them together. Order
  // matters: onStyleChange is applied last so conditional/threshold
  // styling always wins over the caller's static `styles` prop.
  useEffect(() => {
    const fromStylesProp =
      typeof styles === "function" ? styles({ data, loading, error }) : styles;
    const fromCallback = onStyleChange?.(data) ?? {};

    setDynamicStyle(mergeStyleSets(fromStylesProp, fromCallback));
    // Intentionally only re-resolves when the data itself changes, matching
    // the original widget's behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Final style resolution, applied in precedence order:
  //   1. theme preset (light/dark)               — base layer
  //   2. dynamicStyle (styles prop + onStyleChange) — data-driven layer
  //   3. responsiveStyles for the current breakpoint — highest priority,
  //      resolved fresh on every render against `effectiveWidth` so a
  //      live resize is reflected immediately.
  const resolvedStyle = useMemo(
    () =>
      mergeStyleSets(
        { chart: themes[theme] },
        dynamicStyle,
        resolveResponsiveStyle(responsiveStyles, effectiveWidth)
      ),
    [theme, dynamicStyle, responsiveStyles, effectiveWidth]
  );
  const chartStyle:any = resolvedStyle.chart!; // themes[theme] guarantees every ChartColors field is present

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

  return (
    // NOTE ON STYLING APPROACH: this component intentionally uses inline
    // styles / SVG presentation attributes instead of Tailwind classes.
    // Base UI (used below for the tooltip) is headless and doesn't need
    // Tailwind — but Tailwind utility classNames shipped from an SDK
    // package don't compile in a consuming app's build unless that app's
    // Tailwind `content` glob explicitly scans this package, which most
    // consumers won't have configured. Inline styles work everywhere with
    // zero consumer setup. If Tailwind classes are required, they should
    // be pre-compiled into a standalone stylesheet as part of *this SDK's*
    // build and shipped as e.g. `dist/style.css` for consumers to import.
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        borderRadius: 12,
        border: `1px solid ${chartStyle.borderColor}`,
        backgroundColor: chartStyle.backgroundColor,
        padding: 16,
        textAlign: "center",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        // Fixed width -> constant pixel size (still capped at 100% so it
        // never overflows a parent narrower than the fixed value).
        // Fluid -> fills parent, bounded between minWidth/maxWidth.
        width: fixedWidth ?? "100%",
        maxWidth: fixedWidth != null ? "100%" : `min(100%, ${maxWidth}px)`,
        minWidth: fixedWidth != null ? undefined : minWidth,
        minHeight: fixedHeight != null ? undefined : minHeight,
        maxHeight: fixedHeight != null ? undefined : maxHeight,
        boxSizing: "border-box",
        ...resolvedStyle.container,
      }}
    >
      {title && (
        <h2
          style={{
            fontSize: chartStyle.titleFontSize,
            fontWeight: 600,
            color: chartStyle.titleColor,
            margin: 0,
            ...resolvedStyle.title,
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
        // Base UI's Tooltip primitives handle positioning, portaling (so the
        // popup escapes SVG clipping), and accessibility (focus/hover/ARIA).
        // They apply zero visual styling themselves — all the look is defined
        // via the `style` props passed to Tooltip.Popup etc. below.
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
                  <stop offset="0%" stopColor={chartStyle.gradientColors[0]} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={chartStyle.gradientColors[1]} stopOpacity={0} />
                </linearGradient>
              </defs>

              <path d={areaPath} fill={`url(#${gradientId})`} />
              <path d={linePath} fill="none" stroke={chartStyle.strokeColor} strokeWidth={chartStyle.strokeWidth} />

              {/* X axis */}
              <line
                x1={0}
                y1={CHART_H}
                x2={CHART_W}
                y2={CHART_H}
                stroke={chartStyle.axisColor}
                strokeWidth={1}
              />
              {xTicks.map((t, i) => (
                <text
                  key={i}
                  x={t.x}
                  y={CHART_H + 20}
                  textAnchor="middle"
                  fill={chartStyle.tickColor}
                  fontSize={chartStyle.tickFontSize}
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
                  fill={chartStyle.tickColor}
                  fontSize={chartStyle.tickFontSize}
                >
                  {t.label}
                </text>
              ))}

              {points.map(({ cx, cy, point }, i) => (
                <Tooltip.Root key={i}>
                  <Tooltip.Trigger
                    render={
                      <circle
                        cx={cx}
                        cy={cy}
                        r={chartStyle.dotRadius}
                        fill={chartStyle.strokeColor}
                        tabIndex={0}
                        style={{ cursor: "default", outline: "none" }}
                      />
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
                        }}
                      >
                        {tooltipFormat
                          ? tooltipFormat(point)
                          : `${toDateSafe(point.timestamp).toLocaleString()}: ${point.value}`}
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ))}
            </g>
          </svg>
        </Tooltip.Provider>
      )}
    </div>
  );
};

// TODO: axis-specific style overrides, per-element font family cascade,
// dot-decimation on very narrow/dense containers.