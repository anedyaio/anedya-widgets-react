import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { validateRequiredProps } from "../../helpers/validate";
import {
  defaultDateFormatter,
  formatDate,
  formatNumber,
} from "../../helpers/formatDate";
import {
  ChartStyleSet,
  ThemeName,
  DEFAULT_THEME,
  themes,
  mergeStyleSets,
  ResponsiveStyleSet,
  resolveResponsiveStyle,
} from "../chartTheme";

export type {
  ChartStyleSet,
  ThemeName,
  ResponsiveStyleSet,
  Breakpoint,
} from "../chartTheme";
export {
  defineStyleRules,
  lightTheme,
  darkTheme,
  themes,
  BREAKPOINTS,
} from "../chartTheme";

/* ------------------------ Types ------------------------ */

export interface BarDataPoint {
  name: string;
  value: number;
}

type WidgetState = {
  data: BarDataPoint[];
  loading: boolean;
  error: string | null;
};

type StylesInput = ChartStyleSet | ((state: WidgetState) => ChartStyleSet);

export interface BarChartWidgetProps {
  client?: any;
  nodeId?: string;
  variable?: string;
  from?: number;
  to?: number;
  limit?: number;
  title?: string;
  theme?: ThemeName;
  styles?: StylesInput;
  responsiveStyles?: ResponsiveStyleSet;
  tooltipFormat?: (d: BarDataPoint) => string;
  //   tickCount?: number;
  xTickCount?: number | "max";
  yTickCount?: number;
  //   xTickFormat?: string | ((d: Date) => string);
  xTickFormat?: (d: BarDataPoint) => string;
  yTickFormat?: string | ((v: number) => string);
  onStyleChange?: (data: BarDataPoint[]) => ChartStyleSet | void;
  width?: number;
  height?: number;
  aspectRatio?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  /**
   * Minimum width (px) reserved per bar (bar + its gap). If
   * `data.length * minBarWidth` would exceed the space actually
   * available (container width, or `width` if fixed), the chart
   * renders at its natural, larger width and the wrapper becomes
   * horizontally scrollable instead of squeezing bars into
   * unreadable slivers. Defaults to 32.
   */
  minBarWidth?: number;
  /**
   * TEMP: dummy data source until the real API/client is wired up.
   * If omitted and no `client` is provided, `generateDummyData(limit)`
   * is used automatically so the widget renders out of the box.
   */
  data?: BarDataPoint[];
}

const FALLBACK_WIDTH = 800;
const DEFAULT_ASPECT_RATIO = 800 / 500;
const MARGIN = { top: 16, right: 16, bottom: 36, left: 44 };

const DEFAULT_MIN_WIDTH = 280;
const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_MIN_HEIGHT = 200;
const DEFAULT_MAX_HEIGHT = 700;
const DEFAULT_MIN_BAR_WIDTH = 32;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const toDateSafe = (ts: number): Date =>
  ts < 1e12 ? new Date(ts * 1000) : new Date(ts);

/** TEMP helper — swap out once the real API is connected. */
export function generateDummyData(count = 12): BarDataPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Item ${i + 1}`,
    value: Math.round(20 + Math.random() * 80),
  }));
}

/* ------------------------ BarChartWidget ------------------------ */
export const BarChartWidget: React.FC<BarChartWidgetProps> = ({
  client,
  nodeId,
  variable,
  from,
  to,
  limit = 12,
  title = "Latest Data",
  theme = DEFAULT_THEME,
  styles = {},
  responsiveStyles,
  tooltipFormat,
  xTickCount = "max",
  yTickCount = 4,
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
  minBarWidth = DEFAULT_MIN_BAR_WIDTH,
  data: dataProp,
}) => {
  // client/nodeId/variable/from/to are only required once this widget is
  // actually wired to the API. While using dummy/passed-in data, skip the
  // validation entirely.
  const usingRealClient = !dataProp && !!client;
  if (usingRealClient) {
    validateRequiredProps(
      "Bar Chart Widget",
      { client, nodeId, variable, from, to },
      ["client", "nodeId", "variable", "from time", "to time"]
    );
  }

  /* ---------------- Responsive sizing (same approach as ChartWidget) ---------------- */
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(FALLBACK_WIDTH);

  useLayoutEffect(() => {
    if (fixedWidth != null) return;
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setMeasuredWidth(w);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [fixedWidth]);

  const availableWidth = fixedWidth ?? clamp(measuredWidth, minWidth, maxWidth);
  const effectiveHeight =
    fixedHeight ??
    clamp(Math.round(availableWidth / aspectRatio), minHeight, maxHeight);

  /* ---------------- Data (client fetch OR dummy/passed-in) ---------------- */
  const [node, setNode] = useState<any>(null);
  const [data, setData] = useState<BarDataPoint[]>(
    dataProp ?? (usingRealClient ? [] : generateDummyData(limit))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!usingRealClient) return;
    const anedya = client._anedya;
    setNode(anedya?.newNode?.(client, nodeId) ?? null);
  }, [usingRealClient, client, nodeId]);

  useEffect(() => {
    if (dataProp) {
      setData(dataProp);
      return;
    }
    if (!usingRealClient || !node) return;
    mountedRef.current = true;

    const fetchData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await node.getData({
          variable,
          from,
          to,
          limit,
          order: "asc",
        });
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
  }, [dataProp, usingRealClient, node, variable, from, to, limit]);

  /* ---------------- Styling (identical precedence to ChartWidget) ---------------- */
  const [dynamicStyle, setDynamicStyle] = useState<ChartStyleSet>({});

  useEffect(() => {
    const fromStylesProp =
      typeof styles === "function" ? styles({ data, loading, error }) : styles;
    const fromCallback = onStyleChange?.(data) ?? {};

    setDynamicStyle(mergeStyleSets(fromStylesProp, fromCallback));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const resolvedStyle = useMemo(
    () =>
      mergeStyleSets(
        { chart: themes[theme] },
        dynamicStyle,
        resolveResponsiveStyle(responsiveStyles, availableWidth)
      ),
    [theme, dynamicStyle, responsiveStyles, availableWidth]
  );
  // `barColor`, `barHoverColor`, `barRadius`, `tooltipBg`, `tooltipColor` are
  // the new optional tokens added to chartTheme.ts — see instructions.
  const chartStyle: any = resolvedStyle.chart!;

  /* ---------------- Overflow / scroll logic ---------------- */
  const idealContentWidth =
    MARGIN.left + MARGIN.right + Math.max(data.length, 1) * minBarWidth;
  const needsScroll = idealContentWidth > availableWidth;
  const effectiveWidth = needsScroll ? idealContentWidth : availableWidth;

  const CHART_W = effectiveWidth - MARGIN.left - MARGIN.right;
  const CHART_H = effectiveHeight - MARGIN.top - MARGIN.bottom;

  const effectiveXTickCount =
    xTickCount === "max"
      ? data.length
      : effectiveWidth < 380
      ? Math.min(xTickCount, 2)
      : effectiveWidth < 560
      ? Math.min(xTickCount, 3)
      : xTickCount;

  const { bars, xTicks, yTicks } = useMemo(() => {
    if (!data.length) {
      return {
        bars: [] as {
          x: number;
          y: number;
          w: number;
          h: number;
          point: BarDataPoint;
        }[],
        xTicks: [],
        yTicks: [],
      };
    }

    const x = d3
      .scaleBand<number>()
      .domain(data.map((_, i) => i))
      .range([0, CHART_W])
      .padding(0.35);

    const maxY = Math.max(10, d3.max(data, (d) => d.value) ?? 10);
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([CHART_H, 0]);

    const bars = data.map((d, i) => ({
      x: x(i) ?? 0,
      y: y(d.value),
      w: x.bandwidth(),
      h: CHART_H - y(d.value),
      point: d,
    }));

    // Thin out x labels the same way ChartWidget thins ticks, but on
    // categorical indices instead of a continuous time scale.
    const labelStep = Math.max(1, Math.ceil(data.length / effectiveXTickCount));

    const xTicks = data
      .map((d, i) => ({ i, d }))
      .filter(({ i }) => i % labelStep === 0)
      .map(({ i, d }) => ({
        x: (x(i) ?? 0) + x.bandwidth() / 2,
        label: xTickFormat ? xTickFormat(d) : d.name,
      }));

    const yTicks = y.ticks(yTickCount).map((v) => ({
      y: y(v),
      label:
        typeof yTickFormat === "function"
          ? yTickFormat(v)
          : typeof yTickFormat === "string"
          ? formatNumber(v, yTickFormat)
          : String(v),
    }));

    return { bars, xTicks, yTicks };
  }, [
    data,
    effectiveXTickCount,
    yTickCount,
    xTickFormat,
    yTickFormat,
    CHART_W,
    CHART_H,
  ]);

  /* ---------------- Custom D3-driven tooltip (no Base UI) ---------------- */
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    point: BarDataPoint;
  } | null>(null);

  return (
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
              animation: "bar-widget-spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes bar-widget-spin { to { transform: rotate(360deg); } }`}</style>
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
        // `overflowX: auto` only kicks in once bars would otherwise be
        // squeezed below `minBarWidth` — otherwise this behaves exactly
        // like ChartWidget's fluid 100%-width svg.
        <div
          style={{
            position: "relative",
            width: "100%",
            overflowX: needsScroll ? "auto" : "hidden",
          }}
        >
          <svg
            width={needsScroll ? effectiveWidth : undefined}
            viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
            style={{
              width: needsScroll ? effectiveWidth : "100%",
              maxWidth: needsScroll ? "none" : "100%",
              display: "block",
            }}
            role="img"
            aria-label={title}
          >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
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

              {/* X axis */}
              <line
                x1={0}
                y1={CHART_H}
                x2={CHART_W}
                y2={CHART_H}
                stroke={chartStyle.axisColor}
                strokeWidth={1}
              />

              {/* Y axis */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={CHART_H}
                stroke={chartStyle.axisColor}
                strokeWidth={1}
              />

              {bars.map(({ x, y, w, h, point }, i) => {
                const isHovered = hover?.point === point;
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={Math.max(h, 0)}
                      rx={chartStyle.barRadius ?? 3}
                      fill={
                        isHovered
                          ? chartStyle.barHoverColor ?? chartStyle.barColor
                          : chartStyle.barColor
                      }
                      style={{
                        cursor: "default",
                        transition: "fill 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        const rect = (
                          e.currentTarget.ownerSVGElement as SVGSVGElement
                        ).getBoundingClientRect();
                        setHover({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                          point,
                        });
                      }}
                      onMouseMove={(e) => {
                        const rect = (
                          e.currentTarget.ownerSVGElement as SVGSVGElement
                        ).getBoundingClientRect();
                        setHover({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                          point,
                        });
                      }}
                      onMouseLeave={() => setHover(null)}
                    />
                    <text
                      x={x + w / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fill={chartStyle.tickColor}
                      fontSize={chartStyle.tickFontSize}
                    >
                      {point.value}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Plain-div tooltip, positioned via the mouse coords captured
              above — replaces Base UI's Tooltip.* primitives entirely. */}
          {hover && (
            <div
              style={{
                position: "absolute",
                left: hover.x,
                top: hover.y,
                transform: "translate(-50%, -130%)",
                pointerEvents: "none",
                borderRadius: 6,
                backgroundColor: chartStyle.tooltipBg ?? "#0f172a",
                padding: "4px 8px",
                fontSize: 12,
                color: chartStyle.tooltipColor ?? "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                whiteSpace: "nowrap",
              }}
            >
              {tooltipFormat
                ? tooltipFormat(hover.point)
                : `${hover.point.name}: ${hover.point.value}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// TODO: swap generateDummyData() usage for real API data once client wiring
// is ready — just start passing `client`/`nodeId`/`variable`/`from`/`to`
// (or your own `data` prop) and the dummy fallback stops being used.
