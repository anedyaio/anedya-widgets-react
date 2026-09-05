import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { twMerge } from "tailwind-merge";
import {
  AnedyaWidgetBaseProps,
  FormatOptions,
  FormatPreset,
  LabelFormatPreset,
} from "../../common";
import { SlotClassNames, WidgetTheme } from "../../types/root";
import {
  LineChartAreaConfig,
  LineChartDataPoint,
  LineChartGridConfig,
  LineChartPointConfig,
  LineChartSlot,
  LineChartTooltipConfig,
} from "../../types/lineChart";
import {
  DEFAULT_LINECHART_THEME,
  LINECHART_DEFAULT_CLASSES,
  lineChartDarkTheme,
  lineChartLightTheme,
} from "../../themes/lineChartTheme";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { FORMATTERS, LABEL_FORMATTERS } from "../../helpers/formatters";

export interface LineChartDataMeta {
  kind: "success" | "error" | "empty";
  error?: string;
}

export type AnedyaLineChartUpdate = Partial<
  Omit<AnedyaLineChartProps, "node" | "variable" | "onDataChange">
>;

const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

export interface AnedyaLineChartProps extends AnedyaWidgetBaseProps {
  from?: number;
  to?: number;
  limit?: number;
  order?: "asc" | "desc";

  /**
   * Whether the built-in refresh button is shown, top-right of the
   * chart. Clicking it re-runs BOTH the range fetch (`getData`) and the
   * latest-value fetch (`getLatestData`). Default: `true`.
   */
  refresh?: boolean;

  /** Called after a manual refresh (button click) completes, success or not. */
  onRefresh?: () => void;

  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  unit?: string;
  decimalPlaces?: number;
  formatValue?: (value: number) => string;
  format?: FormatPreset;
  formatOptions?: FormatOptions;
  labelFormat?: LabelFormatPreset;
  timezone?: string;

  line?: (line: d3.Line<LineChartDataPoint>) => d3.Line<LineChartDataPoint>;
  xScale?: (
    scale: d3.ScaleTime<number, number>
  ) => d3.ScaleTime<number, number>;
  yScale?: (
    scale: d3.ScaleLinear<number, number>
  ) => d3.ScaleLinear<number, number>;
  xAxis?: (
    axis: d3.Axis<Date | d3.NumberValue>
  ) => d3.Axis<Date | d3.NumberValue>;
  yAxis?: (axis: d3.Axis<d3.NumberValue>) => d3.Axis<d3.NumberValue>;

  area?: LineChartAreaConfig;
  point?: LineChartPointConfig;
  grid?: LineChartGridConfig;
  tooltip?: LineChartTooltipConfig;

  title?: string;
  styles?: SlotClassNames<LineChartSlot>;
  className?: string;

  onDataChange?: (
    data: LineChartDataPoint[] | null,
    meta: LineChartDataMeta
  ) => AnedyaLineChartUpdate | void;

  renderError?: (error: string) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;


    /** Show the "Live" toggle button in the toolbar. Default: `true`. Not yet wired to live-streaming — UI only for now. */
  live?: boolean;
  /** Show the "Export" button in the toolbar. Default: `true`. Not yet wired to an export action — UI only for now. */
  export?: boolean;
  /** Show the date-range picker in the toolbar. Default: `true`. Not yet wired to actually change `from`/`to` — UI only for now. */
  dateRangePicker?: boolean;
/** Show a Min / Avg / Max summary row below the chart, computed from the fetched range data. Default: `false`. */
summary?: boolean;

}

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT_RATIO = 0.5;
const DEFAULT_HEIGHT = 240;

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={twMerge("w-4 h-4", spinning && "animate-spin")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function AnedyaLineChart({
  node,
  variable,
  from,
  to,
  limit = 1000,
  order = "asc",
  onRefresh,
  title,
  theme,
  className,
  width,
  height,
  minWidth = 240,
  maxWidth,
  minHeight = 160,
  maxHeight,
  unit,
  decimalPlaces,
  formatValue,
  format,
  formatOptions,
  labelFormat,
  timezone,
  line,
  xScale,
  yScale,
  xAxis,
  yAxis,
  area,
  point,
  grid,
  tooltip,
  styles = {},
  onDataChange,
  renderError,
  renderEmpty,
  refresh = true,
  live = true,
  summary=true,

  export: showExport = true, // `export` is a reserved word, alias the destructure
  dateRangePicker = true,
}: AnedyaLineChartProps): React.JSX.Element {
  if (!node) throw new Error("[AnedyaLineChart] `node` is required.");
  if (!variable) throw new Error("[AnedyaLineChart] `variable` is required.");

  const svgRef = useRef<SVGSVGElement>(null);

  // dataPoints: null = not-yet-fetched/error, [] = fetched successfully but
  // genuinely no points in the range, [...] = real range data.
  const [dataPoints, setDataPoints] = useState<LineChartDataPoint[] | null>(
    null
  );
  // The single most recent point, from getLatestData — used both as the
  // floating badge value AND as a fallback single-point chart when the
  // range fetch comes back empty.
  const [latestPoint, setLatestPoint] = useState<LineChartDataPoint | null>(
    null
  );

  const summaryStats = useMemo(() => {
  if (!dataPoints || dataPoints.length === 0) return null;
  let min = dataPoints[0];
  let max = dataPoints[0];
  let sum = 0;
  for (const d of dataPoints) {
    if (d.value < min.value) min = d;
    if (d.value > max.value) max = d;
    sum += d.value;
  }
  return { min, max, avg: sum / dataPoints.length };
}, [dataPoints]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [dynamicProps, setDynamicProps] = useState<AnedyaLineChartUpdate>({});
  const [tooltipState, setTooltipState] = useState<{
    x: number;
    y: number;
    visible: boolean;
    flipX: boolean;
    point: LineChartDataPoint | null;
  }>({ x: 0, y: 0, visible: false, flipX: false, point: null });
  const [latestBadgePos, setLatestBadgePos] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({ x: 0, y: 0, visible: false });

  const mountedRef = useRef(false);
  const { ref: chartWrapperRef, size: dims } =
    useResizeObserver<HTMLDivElement>(width == null);

  // Stable — recomputed only when the actual `to`/`from` PROPS change, not
  // on every render. See earlier fix: computing Date.now() unmemoized here
  // caused an infinite fetch loop, since it fed a useEffect dependency
  // array with a "new" value on every render.
  const resolvedTo = useMemo(() => to ?? Date.now(), [to]);
  const resolvedFrom = useMemo(
    () => from ?? resolvedTo - MS_PER_YEAR,
    [from, resolvedTo]
  );

  // Whichever of the two calls has anything at all — used to decide
  // whether a fetch failure/refresh-in-flight should blank the chart or
  // just keep showing the last-known data underneath.
  const hasAnyData = (dataPoints && dataPoints.length > 0) || latestPoint != null;

  // ---- Combined fetch: range data + latest value, in parallel ----
  useEffect(() => {
    mountedRef.current = true;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const [rangeRes, latestRes] = await Promise.all([
          node.getData({
            variable,
            from: resolvedFrom,
            to: resolvedTo,
            limit,
            order,
          }),
          node.getLatestData(variable),
        ]);

        if (!mountedRef.current) return;

        const latest: LineChartDataPoint | null =
          latestRes.isSuccess && latestRes.isDataAvailable
            ? {
                timestamp: latestRes.data.timestamp,
                value: latestRes.data.value,
              }
            : null;
        setLatestPoint(latest);

        if (rangeRes.isSuccess && rangeRes.isDataAvailable) {
          const points: LineChartDataPoint[] = rangeRes.data.map(
            (d: any) => ({ timestamp: d.timestamp, value: d.value })
          );
          setDataPoints(points);
          setError(null);
        } else if (rangeRes.isSuccess && !rangeRes.isDataAvailable) {
          // No points in range — fine, `effectiveDataPoints` below falls
          // back to the single latest point if one exists.
          setDataPoints([]);
          setError(null);
        } else {
          setDataPoints(null);
          setError(rangeRes.error?.errorMessage ?? "Failed to fetch data");
        }
      } catch (err: any) {
        if (!mountedRef.current) return;
        setDataPoints(null);
        setError(err?.message ?? "Failed to fetch data");
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          onRefresh?.();
        }
      }
    };

    fetchAll();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, variable, resolvedFrom, resolvedTo, limit, order, refreshTick]);

  // What actually gets drawn: real range data if present, else the single
  // latest point as a one-point fallback chart, else nothing.
  const effectiveDataPoints = useMemo(() => {
    if (dataPoints && dataPoints.length > 0) return dataPoints;
    if (latestPoint) return [latestPoint];
    return [];
  }, [dataPoints, latestPoint]);

  const isEmpty = !loading && !error && effectiveDataPoints.length === 0;

  // ---- onDataChange ----
  useEffect(() => {
    if (!onDataChange) {
      setDynamicProps({});
      return;
    }
    const meta: LineChartDataMeta = error
      ? { kind: "error", error }
      : isEmpty
      ? { kind: "empty" }
      : { kind: "success" };
    setDynamicProps(onDataChange(dataPoints, meta) ?? {});
  }, [dataPoints, error, isEmpty, onDataChange]);

  const mergedStyles = useMemo(
    () => ({ ...(styles ?? {}), ...(dynamicProps.styles ?? {}) }),
    [styles, dynamicProps.styles]
  );

  const resolvedProps = {
    title,
    theme,
    width,
    height,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    unit,
    decimalPlaces,
    formatValue,
    format,
    formatOptions,
    labelFormat,
    timezone,
    line,
    xScale,
    yScale,
    xAxis,
    yAxis,
    refresh,
  live,
  export: showExport,
  dateRangePicker,
    className,
    summary,
    ...dynamicProps,
    styles: mergedStyles,
  };

  const resolvedArea: Required<LineChartAreaConfig> = {
    show: resolvedProps.area?.show ?? area?.show ?? false,
    opacity: resolvedProps.area?.opacity ?? area?.opacity ?? 0.15,
  };
  const resolvedPoint: Required<LineChartPointConfig> = {
    show: resolvedProps.point?.show ?? point?.show ?? false,
    radius: resolvedProps.point?.radius ?? point?.radius ?? 3,
  };
  const resolvedGrid: Required<LineChartGridConfig> = {
    show: resolvedProps.grid?.show ?? grid?.show ?? true,
    ticksY: resolvedProps.grid?.ticksY ?? grid?.ticksY ?? 5,
    ticksX: resolvedProps.grid?.ticksX ?? grid?.ticksX ?? 5,
  };
  const resolvedTooltip: LineChartTooltipConfig = {
    show: resolvedProps.tooltip?.show ?? tooltip?.show ?? true,
    content: resolvedProps.tooltip?.content ?? tooltip?.content,
    onMouseOver: resolvedProps.tooltip?.onMouseOver ?? tooltip?.onMouseOver,
    onMouseMove: resolvedProps.tooltip?.onMouseMove ?? tooltip?.onMouseMove,
    onMouseOut: resolvedProps.tooltip?.onMouseOut ?? tooltip?.onMouseOut,
  };
  const hasRawTooltipHandlers =
    !!resolvedTooltip.onMouseOver ||
    !!resolvedTooltip.onMouseMove ||
    !!resolvedTooltip.onMouseOut;

  const resolvedTheme: WidgetTheme<LineChartSlot> =
    resolvedProps.theme === "dark"
      ? lineChartDarkTheme
      : resolvedProps.theme === "light"
      ? lineChartLightTheme
      : (resolvedProps.theme as WidgetTheme<LineChartSlot>) ??
        DEFAULT_LINECHART_THEME;

  const resolveSlot = useCallback(
    (slot: LineChartSlot) =>
      twMerge(
        LINECHART_DEFAULT_CLASSES[slot],
        resolvedTheme?.styles?.[slot],
        resolvedProps.styles[slot]
      ),
    [resolvedTheme, resolvedProps.styles]
  );

  const displayFor = useCallback(
    (raw: number): string => {
      if (resolvedProps.formatValue) return resolvedProps.formatValue(raw);
      if (resolvedProps.format) {
        return FORMATTERS[resolvedProps.format](raw, resolvedProps.formatOptions)
          .value;
      }
      if (resolvedProps.decimalPlaces != null)
        return raw.toFixed(resolvedProps.decimalPlaces);
      return String(raw);
    },
    [
      resolvedProps.formatValue,
      resolvedProps.format,
      resolvedProps.formatOptions,
      resolvedProps.decimalPlaces,
    ]
  );

  const resolvedTimezone =
    resolvedProps.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatTimestamp = useCallback(
    (ts: number): string => {
const formatter = LABEL_FORMATTERS[resolvedProps.labelFormat ?? "datetime"];
      return formatter(ts, {
        locale: resolvedProps.formatOptions?.locale,
        timezone: resolvedTimezone,
      } as any).replace(/^Updated /, "");
    },
    [resolvedProps.labelFormat, resolvedProps.formatOptions?.locale, resolvedTimezone]
  );

  const defaultTooltipContent = useCallback(
    (d: LineChartDataPoint): React.ReactNode => {
      const unitStr = resolvedProps.unit ? ` ${resolvedProps.unit}` : "";
      return (
        <div className="flex flex-col items-start">
          <span className="font-semibold">
            {displayFor(d.value)}
            {unitStr}
          </span>
          <span className="opacity-70 text-[0.85em]">
            {formatTimestamp(d.timestamp)}
          </span>
        </div>
      );
    },
    [displayFor, formatTimestamp, resolvedProps.unit]
  );

  const boxWidth = resolvedProps.width ?? (dims.width || DEFAULT_WIDTH);
  const boxHeight =
    resolvedProps.height ?? (dims.height || boxWidth * DEFAULT_HEIGHT_RATIO) ?? DEFAULT_HEIGHT;

  const margin = { top: 12, right: 16, bottom: 28, left: 44 };
  const innerWidth = Math.max(0, boxWidth - margin.left - margin.right);
  const innerHeight = Math.max(0, boxHeight - margin.top - margin.bottom);

  const isSinglePoint = effectiveDataPoints.length === 1;

  // ---- D3 draw ----
  useEffect(() => {
    if (!svgRef.current || innerWidth <= 0 || innerHeight <= 0) return;
    if (effectiveDataPoints.length === 0) return;

    const svg = d3.select(svgRef.current);
    const root = svg.select<SVGGElement>("g.anedya-linechart-root");
    root.attr("transform", `translate(${margin.left},${margin.top})`);

    const xExtentRaw = d3.extent(
      effectiveDataPoints,
      (d) => d.timestamp
    ) as [number, number];
    const yExtentRaw = d3.extent(
      effectiveDataPoints,
      (d) => d.value
    ) as [number, number];

    // Degenerate domains (single point → identical min/max) need padding,
    // or the scale collapses to zero range and nothing draws correctly.
    const xPad = xExtentRaw[0] === xExtentRaw[1] ? 60 * 60 * 1000 : 0; // ±1h
    const yRange = yExtentRaw[1] - yExtentRaw[0];
    const yPad = yRange > 0 ? yRange * 0.1 : Math.abs(yExtentRaw[0]) * 0.1 || 1;

    let x = d3
      .scaleTime()
      .domain([
        new Date(xExtentRaw[0] - xPad),
        new Date(xExtentRaw[1] + xPad),
      ])
      .range([0, innerWidth]);
    if (resolvedProps.xScale) x = resolvedProps.xScale(x) as any;

    let y = d3
      .scaleLinear()
      .domain([yExtentRaw[0] - yPad, yExtentRaw[1] + yPad])
      .range([innerHeight, 0]);
    if (resolvedProps.yScale) y = resolvedProps.yScale(y) as any;

    // ---- Grid ----
    const gridGroup = root.select<SVGGElement>("g.anedya-linechart-grid");
    gridGroup.selectAll("*").remove();
    if (resolvedGrid.show) {
      gridGroup
        .append("g")
        .attr("class", twMerge("anedya-linechart-grid-y", resolveSlot("grid")))
        .call(
          d3
            .axisLeft(y)
            .ticks(resolvedGrid.ticksY)
            .tickSize(-innerWidth)
            .tickFormat(() => "")
        )
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g.selectAll("line").attr("stroke", "currentColor").attr("opacity", 0.5)
        );
    }

    // ---- Axes ----
    let xAxisGen = d3.axisBottom(x).ticks(5);
    if (resolvedProps.xAxis) xAxisGen = resolvedProps.xAxis(xAxisGen as any) as any;
    root
      .select<SVGGElement>("g.anedya-linechart-xaxis")
      .attr("class", twMerge("anedya-linechart-xaxis", resolveSlot("xAxis")))
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxisGen as any)
      .call((g) => g.select(".domain").attr("stroke", "currentColor").attr("opacity", 0.3))
      .call((g) => g.selectAll("text").attr("fill", "currentColor"))
      .call((g) => g.selectAll("line").attr("stroke", "currentColor").attr("opacity", 0.3));

    let yAxisGen = d3.axisLeft(y).ticks(5);
    if (resolvedProps.yAxis) yAxisGen = resolvedProps.yAxis(yAxisGen as any) as any;
    root
      .select<SVGGElement>("g.anedya-linechart-yaxis")
      .attr("class", twMerge("anedya-linechart-yaxis", resolveSlot("yAxis")))
      .call(yAxisGen as any)
      .call((g) => g.select(".domain").attr("stroke", "currentColor").attr("opacity", 0.3))
      .call((g) => g.selectAll("text").attr("fill", "currentColor"))
      .call((g) => g.selectAll("line").attr("stroke", "currentColor").attr("opacity", 0.3));

    // ---- Area ----
    const areaGroup = root.select<SVGGElement>("g.anedya-linechart-area");
    areaGroup.selectAll("*").remove();
    if (resolvedArea.show && !isSinglePoint) {
      const areaGen = d3
        .area<LineChartDataPoint>()
        .x((d) => x(new Date(d.timestamp)))
        .y0(innerHeight)
        .y1((d) => y(d.value));
      areaGroup
        .append("path")
        .attr("class", twMerge("anedya-linechart-area-path", resolveSlot("area")))
        .attr("d", areaGen(effectiveDataPoints)!)
        .attr("fill", "currentColor")
        .attr("stroke", "none")
        .attr("opacity", resolvedArea.opacity);
    }

    // ---- Line ----
    let lineGen = d3
      .line<LineChartDataPoint>()
      .x((d) => x(new Date(d.timestamp)))
      .y((d) => y(d.value));
    if (resolvedProps.line) lineGen = resolvedProps.line(lineGen);

    const lineGroup = root.select<SVGGElement>("g.anedya-linechart-line");
    lineGroup.selectAll("*").remove();
    if (!isSinglePoint) {
      lineGroup
        .append("path")
        .attr("class", twMerge("anedya-linechart-line-path", resolveSlot("line")))
        .attr("d", lineGen(effectiveDataPoints)!)
        .attr("fill", "none")
        .attr("stroke", "currentColor")
        .attr("stroke-width", 2);
    }

    // ---- Points — forced on for the single-point fallback case, since
    // otherwise a one-point "chart" would render as empty axes with
    // nothing visible on them at all. ----
    const pointGroup = root.select<SVGGElement>("g.anedya-linechart-points");
    pointGroup.selectAll("*").remove();
    if (resolvedPoint.show || isSinglePoint) {
      pointGroup
        .selectAll("circle")
        .data(effectiveDataPoints)
        .join("circle")
        .attr("class", resolveSlot("point"))
        .attr("cx", (d) => x(new Date(d.timestamp)))
        .attr("cy", (d) => y(d.value))
        .attr("r", isSinglePoint ? Math.max(resolvedPoint.radius, 4) : resolvedPoint.radius)
        .attr("fill", "currentColor");
    }



 

    // ---- Tooltip hit area + handlers ----
    const handleMove = (event: MouseEvent) => {
      const wrapperEl = chartWrapperRef.current as HTMLDivElement | null;
      if (!wrapperEl) return;
      const rect = wrapperEl.getBoundingClientRect();
      const relX = event.clientX - rect.left - margin.left;

      const bisect = d3.bisector((d: LineChartDataPoint) => d.timestamp).left;
      const targetTs = x.invert(relX).getTime();
      const idx = bisect(effectiveDataPoints, targetTs);
      const closest =
        effectiveDataPoints[
          Math.min(effectiveDataPoints.length - 1, Math.max(0, idx))
        ];

      if (hasRawTooltipHandlers) {
        resolvedTooltip.onMouseMove?.(event, closest);
        return;
      }
      const flipX = event.clientX - rect.left > rect.width * 0.5;
      setTooltipState({
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        flipX,
        point: closest,
      });
    };

    const handleOver = (event: MouseEvent) => {
      if (hasRawTooltipHandlers && effectiveDataPoints.length > 0) {
        resolvedTooltip.onMouseOver?.(event, effectiveDataPoints[0]);
      }
    };

    const handleLeave = (event: MouseEvent) => {
      if (hasRawTooltipHandlers) {
        resolvedTooltip.onMouseOut?.(event);
        return;
      }
      setTooltipState((s) => (s.visible ? { ...s, visible: false } : s));
    };

    let hitRect = root.select<SVGRectElement>("rect.anedya-linechart-hitarea");
    if (hitRect.empty()) {
      hitRect = root
        .append("rect")
        .attr("class", "anedya-linechart-hitarea")
        .attr("fill", "transparent");
    }
    hitRect.attr("width", innerWidth).attr("height", innerHeight);

    if (resolvedTooltip.show) {
      hitRect
        .style("cursor", "crosshair")
        .on("mouseover", handleOver)
        .on("mousemove", handleMove)
        .on("mouseleave", handleLeave);
    } else {
      hitRect
        .style("cursor", null)
        .on("mouseover", null)
        .on("mousemove", null)
        .on("mouseleave", null);
    }
  }, [
    effectiveDataPoints,
    isSinglePoint,
    innerWidth,
    innerHeight,
    margin.left,
    margin.top,
    resolvedProps.xScale,
    resolvedProps.yScale,
    resolvedProps.xAxis,
    resolvedProps.yAxis,
    resolvedProps.line,
    resolvedArea.show,
    resolvedArea.opacity,
    resolvedPoint.show,
    resolvedPoint.radius,
    resolvedGrid.show,
    resolvedGrid.ticksX,
    resolvedGrid.ticksY,
    resolvedTooltip.show,
    hasRawTooltipHandlers,
    resolveSlot,
    chartWrapperRef,
  ]);

  const hasExplicitHeight = height != null || dynamicProps.height != null;

  return (
    <div
      className="anedya-linechart-container"
      style={{
        width: resolvedProps.width ?? "100%",
        minWidth: resolvedProps.minWidth,
        maxWidth: resolvedProps.maxWidth,
        ...(hasExplicitHeight
          ? { height: resolvedProps.height }
          : { minHeight: DEFAULT_HEIGHT }),
        minHeight: resolvedProps.minHeight,
        maxHeight: resolvedProps.maxHeight,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className={twMerge(
          "anedya-linechart",
          resolveSlot("container"),
          resolvedProps.className
        )}
        style={{
          flex: "1 0 auto",
          ...(hasExplicitHeight ? { overflow: "hidden" } : {}),
        }}
      >
    {(resolvedProps.title ||
  resolvedProps.refresh !== false ||
  resolvedProps.live !== false ||
  resolvedProps.export !== false ||
  resolvedProps.dateRangePicker !== false) && (
  <div className="flex items-center justify-between w-full gap-2 flex-wrap">
    {resolvedProps.title ? (
      <span className={resolveSlot("title")}>{resolvedProps.title}</span>
    ) : (
      <span />
    )}

    <div className="flex items-center gap-2 ml-auto">
      {/* {resolvedProps.live !== false && (
        <button
          type="button"
          disabled
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-blue-500 text-white opacity-50 cursor-not-allowed"
          title="Live streaming — coming soon"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          Live
        </button>
      )} */}

      {resolvedProps.dateRangePicker !== false && (
        <button
          type="button"
          disabled
          className={twMerge(
            "rounded-md px-2 py-1 text-xs opacity-50 cursor-not-allowed border",
            resolveSlot("refreshButton")
          )}
          title="Date range picker — coming soon"
        >
          {formatTimestamp(resolvedFrom)} – {formatTimestamp(resolvedTo)}
        </button>
      )}

      {/* {resolvedProps.export !== false && (
        <button
          type="button"
          disabled
          className={twMerge(
            "rounded-md p-1 opacity-50 cursor-not-allowed",
            resolveSlot("refreshButton")
          )}
          title="Export — coming soon"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      )} */}

      {resolvedProps.refresh !== false && (
        <button
          type="button"
          aria-label="Refresh chart data"
          onClick={() => setRefreshTick((t) => t + 1)}
          className={twMerge("cursor-pointer", resolveSlot("refreshButton"))}
        >
          <RefreshIcon spinning={loading} />
        </button>
      )}
    </div>
  </div>
)}

        {loading && !hasAnyData ? (
          <div className="flex flex-col gap-2 w-full items-center justify-center flex-1">
            <div
              className="w-full bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"
              style={{ height: "60%" }}
            />
          </div>
        ) : error && !hasAnyData ? (
          renderError ? (
            renderError(error)
          ) : (
            <span className={resolveSlot("error")}>{error}</span>
          )
        ) : isEmpty ? (
          renderEmpty ? (
            renderEmpty()
          ) : (
            <span className={resolveSlot("empty")}>
              No data available in the requested time range
            </span>
          )
        ) : (
          <div ref={chartWrapperRef} className="relative w-full flex-1 min-h-0">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${boxWidth || 200} ${boxHeight || 100}`}
              width={boxWidth || undefined}
              height={boxHeight || undefined}
              className="block w-full h-full"
            >
              <g className="anedya-linechart-root">
                <g className="anedya-linechart-grid" />
                <g className="anedya-linechart-area" />
                <g className="anedya-linechart-line" />
                <g className="anedya-linechart-points" />
                <g className="anedya-linechart-xaxis" />
                <g className="anedya-linechart-yaxis" />
              </g>
            </svg>
{latestPoint && !loading && !error && !isEmpty && (
  <div
    className={twMerge(
      "absolute top-2 right-2 flex flex-col items-end",
      resolveSlot("latestBadge")
    )}
  >
    <span className="font-bold leading-tight">
      {displayFor(latestPoint.value)}
      {resolvedProps.unit ? ` ${resolvedProps.unit}` : ""}
    </span>
    <span className="font-normal text-[0.75em] opacity-80 leading-tight">
      {formatTimestamp(latestPoint.timestamp)}
    </span>
  </div>
)} 

            {!hasRawTooltipHandlers &&
              resolvedTooltip.show &&
              tooltipState.visible &&
              tooltipState.point && (
                <div
                  className={twMerge(
                    "absolute -translate-y-full",
                    tooltipState.flipX
                      ? "-translate-x-full"
                      : "-translate-x-1/2",
                    resolveSlot("tooltip")
                  )}
                  style={{
                    left: tooltipState.x + (tooltipState.flipX ? -12 : 12),
                    top: tooltipState.y - 12,
                  }}
                >
                  {(resolvedTooltip.content ?? defaultTooltipContent)(
                    tooltipState.point
                  )}
                </div>
              )}
{/* 
{resolvedProps.summary && summaryStats && (
  <div
    className={twMerge(
      "flex items-center justify-between w-full px-1 shrink-0 pt-2",
      resolveSlot("summary")
    )}
  >
    <div className="flex flex-col items-start">
      <span className="opacity-60 text-[0.85em]">MIN</span>
      <span className="font-medium">
        {displayFor(summaryStats.min.value)} | {formatTimestamp(summaryStats.min.timestamp)}
      </span>
    </div>
    <div className="flex flex-col items-center">
      <span className="opacity-60 text-[0.85em]">AVG</span>
      <span className="font-medium">{displayFor(summaryStats.avg)}</span>
    </div>
    <div className="flex flex-col items-end">
      <span className="opacity-60 text-[0.85em]">MAX</span>
      <span className="font-medium">
        {displayFor(summaryStats.max.value)} | {formatTimestamp(summaryStats.max.timestamp)}
      </span>
    </div>
  </div>
)} */}
          </div>
        )}
      </div>
    </div>
  );
}