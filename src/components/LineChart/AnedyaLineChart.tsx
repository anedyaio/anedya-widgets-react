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

// The SDK returns timestamps in SECONDS. Every place a Date is built
// from a raw timestamp must go through this helper.
const toMs = (ts: number) => (ts < 1e12 ? ts * 1000 : ts);

export interface AnedyaLineChartProps extends AnedyaWidgetBaseProps {
  from?: number;
  to?: number;
  limit?: number;
  order?: "asc" | "desc";

  /** Show the built-in refresh button, top-right of the toolbar. Default: `true`. */
  refresh?: boolean;
  /** Called after a manual refresh (button click) completes, success or not. */
  onRefresh?: () => void;

  /** Show a Min / Avg / Max summary row below the chart, computed from the fetched range data. Default: `false`. */
  summary?: boolean;

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

  /**
   * Customize the D3 line generator directly. Receives a `d3.line()`
   * already bound to the fetched data's x/y accessors — return it
   * modified however you'd normally chain D3 methods.
   */
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

  /**
   * Hover tooltip. On by default with built-in content and positioning.
   * Provide `content` to keep the built-in positioning but customize
   * what's shown, or provide any of `onMouseOver`/`onMouseMove`/
   * `onMouseOut` to fully take over with raw D3 event handlers.
   */
  tooltip?: LineChartTooltipConfig;

  /**
   * Whether to show the floating "latest value" badge. Default: `true`.
   * The underlying `getLatestData` call is always made regardless — it's
   * also used as the single-point fallback when `getData` returns no
   * points in range — this prop only controls the badge's visibility.
   */
  showLatestValue?: boolean;

  title?: string;
  styles?: SlotClassNames<LineChartSlot>;
  className?: string;

  onDataChange?: (
    data: LineChartDataPoint[] | null,
    meta: LineChartDataMeta
  ) => AnedyaLineChartUpdate | void;

  renderError?: (error: string) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT_RATIO = 0.5;
const DEFAULT_HEIGHT = 240;
const SUMMARY_ROW_HEIGHT = 44;

const formatMillisecond = d3.timeFormat(".%L");
const formatSecond = d3.timeFormat("%H:%M:%S");
const formatMinute = d3.timeFormat("%H:%M");
const formatHour = d3.timeFormat("%H:%M");
const formatDay = d3.timeFormat("%b %d");
const formatWeek = d3.timeFormat("%b %d");
const formatMonth = d3.timeFormat("%b %Y");
const formatYear = d3.timeFormat("%Y");

function multiFormat(date: Date): string {
  return (
    d3.timeSecond(date) < date
      ? formatMillisecond
      : d3.timeMinute(date) < date
      ? formatSecond
      : d3.timeHour(date) < date
      ? formatMinute
      : d3.timeDay(date) < date
      ? formatHour
      : d3.timeMonth(date) < date
      ? d3.timeWeek(date) < date
        ? formatDay
        : formatWeek
      : d3.timeYear(date) < date
      ? formatMonth
      : formatYear
  )(date);
}

const tooltipTimeFormat = d3.timeFormat("%b %d, %H:%M:%S");

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
  refresh = true,
  onRefresh,
  summary = false,
  title,
  theme,
  className,
  width=600,
  height=300,
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
  showLatestValue = true,
}: AnedyaLineChartProps): React.JSX.Element {
  if (!node) throw new Error("[AnedyaLineChart] `node` is required.");
  if (!variable) throw new Error("[AnedyaLineChart] `variable` is required.");

  const svgRef = useRef<SVGSVGElement>(null);

  const [dataPoints, setDataPoints] = useState<LineChartDataPoint[] | null>(
    null
  );
  const [latestPoint, setLatestPoint] = useState<LineChartDataPoint | null>(
    null
  );
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

  const mountedRef = useRef(false);
  const { ref: chartWrapperRef, size: dims } =
    useResizeObserver<HTMLDivElement>(width == null);

  const resolvedTo = useMemo(() => to ?? Date.now(), [to]);
  const resolvedFrom = useMemo(
    () => from ?? resolvedTo - MS_PER_YEAR,
    [from, resolvedTo]
  );

  const hasAnyData =
    (dataPoints && dataPoints.length > 0) || latestPoint != null;

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

  const effectiveDataPoints = useMemo(() => {
    if (dataPoints && dataPoints.length > 0) return dataPoints;
    if (latestPoint) return [latestPoint];
    return [];
  }, [dataPoints, latestPoint]);

  const isEmpty = !loading && !error && effectiveDataPoints.length === 0;

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
    summary,
    className,
    showLatestValue,
    ...dynamicProps,
    styles: mergedStyles,
  };

  const resolvedArea: Required<LineChartAreaConfig> = {
    show: resolvedProps.area?.show ?? area?.show ?? false,
    opacity: resolvedProps.area?.opacity ?? area?.opacity ?? 0.35,
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
        return FORMATTERS[resolvedProps.format](
          raw,
          resolvedProps.formatOptions
        ).value;
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
      return formatter(toMs(ts), {
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
            {tooltipTimeFormat(new Date(toMs(d.timestamp)))}
          </span>
        </div>
      );
    },
    [displayFor, resolvedProps.unit]
  );

  const boxWidth = resolvedProps.width ?? (dims.width || DEFAULT_WIDTH);
  const rawBoxHeight =
    resolvedProps.height ??
    (dims.height || boxWidth * DEFAULT_HEIGHT_RATIO) ??
    DEFAULT_HEIGHT;
  const boxHeight = rawBoxHeight;

  // Extra bottom margin so rotated x-axis labels have room to extend
  // below the axis line without getting clipped by the SVG's own
  // viewBox boundary.
  const margin = { top: 44, right: 16, bottom: 64, left: 44 };
  const innerWidth = Math.max(0, boxWidth - margin.left - margin.right);
  const innerHeight = Math.max(0, boxHeight - margin.top - margin.bottom);

  const isSinglePoint = effectiveDataPoints.length === 1;

  useEffect(() => {
    if (!svgRef.current || innerWidth <= 0 || innerHeight <= 0) return;
    if (effectiveDataPoints.length === 0) return;

    const svg = d3.select(svgRef.current);
    let defs = svg.select<SVGDefsElement>("defs");
    if (defs.empty()) defs = svg.append("defs");

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

    const xExtentMs: [number, number] = [
      toMs(xExtentRaw[0]),
      toMs(xExtentRaw[1]),
    ];
    const xPad = xExtentMs[0] === xExtentMs[1] ? 60 * 60 * 1000 : 0;
    const yRange = yExtentRaw[1] - yExtentRaw[0];
    const yPad = yRange > 0 ? yRange * 0.1 : Math.abs(yExtentRaw[0]) * 0.1 || 1;

    let x = d3
      .scaleTime()
      .domain([new Date(xExtentMs[0] - xPad), new Date(xExtentMs[1] + xPad)])
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

      gridGroup
        .append("g")
        .attr("class", twMerge("anedya-linechart-grid-x", resolveSlot("grid")))
        .attr("transform", `translate(0,${innerHeight})`)
        .call(
          d3
            .axisBottom(x)
            .ticks(resolvedGrid.ticksX)
            .tickSize(-innerHeight)
            .tickFormat(() => "")
        )
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g.selectAll("line").attr("stroke", "currentColor").attr("opacity", 0.5)
        );
    }

    // ---- Axes ----
    let xAxisGen = d3.axisBottom(x).ticks(5).tickFormat(multiFormat as any);
    if (resolvedProps.xAxis) xAxisGen = resolvedProps.xAxis(xAxisGen as any) as any;

    const xAxisSelection = root
      .select<SVGGElement>("g.anedya-linechart-xaxis")
      .attr("class", twMerge("anedya-linechart-xaxis", resolveSlot("xAxis")))
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxisGen as any)
      .call((g) => g.select(".domain").attr("stroke", "currentColor").attr("opacity", 0.3))
      .call((g) => g.selectAll("line").attr("stroke", "currentColor").attr("opacity", 0.3))
      .call((g) =>
        g
          .selectAll("text")
          .attr("fill", "currentColor")
          .attr("transform", null)
          .style("text-anchor", "middle")
          .attr("dx", null)
          .attr("dy", null)
      );

    const tickTexts = xAxisSelection.selectAll<SVGTextElement, unknown>("text");
    const tickCount = tickTexts.size();
    if (tickCount > 1) {
      const avgSpacing = innerWidth / tickCount;
      let needsRotation = false;
      tickTexts.each(function () {
        const bbox = (this as SVGTextElement).getBBox();
        if (bbox.width > avgSpacing * 0.9) needsRotation = true;
      });
      if (needsRotation) {
        tickTexts
          .attr("transform", "rotate(-35)")
          .style("text-anchor", "end")
          .attr("dx", "-0.5em")
          .attr("dy", "0.4em");
      }
    }

    let yAxisGen = d3.axisLeft(y).ticks(5);
    if (resolvedProps.yAxis) yAxisGen = resolvedProps.yAxis(yAxisGen as any) as any;
    root
      .select<SVGGElement>("g.anedya-linechart-yaxis")
      .attr("class", twMerge("anedya-linechart-yaxis", resolveSlot("yAxis")))
      .call(yAxisGen as any)
      .call((g) => g.select(".domain").attr("stroke", "currentColor").attr("opacity", 0.3))
      .call((g) => g.selectAll("text").attr("fill", "currentColor"))
      .call((g) => g.selectAll("line").attr("stroke", "currentColor").attr("opacity", 0.3));

    // ---- Area (gradient fill) ----
    const areaGroup = root.select<SVGGElement>("g.anedya-linechart-area");
    areaGroup.selectAll("*").remove();
    if (resolvedArea.show && !isSinglePoint) {
      const gradientId = "anedya-linechart-area-gradient";
      let gradient = defs.select<SVGLinearGradientElement>(`#${gradientId}`);
      if (gradient.empty()) {
        gradient = defs
          .append("linearGradient")
          .attr("id", gradientId)
          .attr("class", resolveSlot("area"))
          .attr("x1", "0")
          .attr("x2", "0")
          .attr("y1", "0")
          .attr("y2", "1");
        gradient
          .append("stop")
          .attr("class", "anedya-linechart-gradient-top")
          .attr("offset", "0%")
          .attr("stop-color", "currentColor")
          .attr("stop-opacity", resolvedArea.opacity);
        gradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "currentColor")
          .attr("stop-opacity", 0);
      } else {
        gradient
          .attr("class", resolveSlot("area"))
          .select(".anedya-linechart-gradient-top")
          .attr("stop-opacity", resolvedArea.opacity);
      }

      const areaGen = d3
        .area<LineChartDataPoint>()
        .x((d) => x(new Date(toMs(d.timestamp))))
        .y0(innerHeight)
        .y1((d) => y(d.value));

      areaGroup
        .append("path")
        .attr("class", twMerge("anedya-linechart-area-path", resolveSlot("area")))
        .attr("d", areaGen(effectiveDataPoints)!)
        .attr("fill", `url(#${gradientId})`)
        .attr("stroke", "none");
    }

    // ---- Line ----
    let lineGen = d3
      .line<LineChartDataPoint>()
      .x((d) => x(new Date(toMs(d.timestamp))))
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

    // ---- Points ----
    const pointGroup = root.select<SVGGElement>("g.anedya-linechart-points");
    pointGroup.selectAll("*").remove();
    if (resolvedPoint.show || isSinglePoint) {
      pointGroup
        .selectAll("circle")
        .data(effectiveDataPoints)
        .join("circle")
        .attr("class", resolveSlot("point"))
        .attr("cx", (d) => x(new Date(toMs(d.timestamp))))
        .attr("cy", (d) => y(d.value))
        .attr(
          "r",
          isSinglePoint ? Math.max(resolvedPoint.radius, 4) : resolvedPoint.radius
        )
        .attr("fill", "currentColor");
    }

    // ---- Crosshair ----
    let crosshair = root.select<SVGLineElement>("line.anedya-linechart-crosshair");
    if (crosshair.empty()) {
      crosshair = root
        .append("line")
        .attr("class", "anedya-linechart-crosshair")
        .attr("stroke", "currentColor")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4")
        .attr("opacity", 0)
        .attr("pointer-events", "none");
    }
    crosshair.attr("y1", 0).attr("y2", innerHeight);

    // ---- Tooltip hit area + handlers ----
    const bisect = d3.bisector((d: LineChartDataPoint) => toMs(d.timestamp)).left;

    const handleMove = (event: MouseEvent) => {
      const wrapperEl = chartWrapperRef.current as HTMLDivElement | null;
      if (!wrapperEl) return;
      const rect = wrapperEl.getBoundingClientRect();
      const relX = event.clientX - rect.left - margin.left;

      const targetTs = x.invert(relX).getTime();
      const idx = bisect(effectiveDataPoints, targetTs);
      const closest =
        effectiveDataPoints[
          Math.min(effectiveDataPoints.length - 1, Math.max(0, idx))
        ];

      const closestX = x(new Date(toMs(closest.timestamp)));
      crosshair.attr("x1", closestX).attr("x2", closestX).attr("opacity", 0.5);

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
      crosshair.attr("opacity", 0);
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
  const effectiveMinHeight = resolvedProps.summary
    ? DEFAULT_HEIGHT + SUMMARY_ROW_HEIGHT
    : DEFAULT_HEIGHT;

  return (
    <div
      className="anedya-linechart-container"
      style={{
        width: resolvedProps.width ?? "100%",
        minWidth: resolvedProps.minWidth,
        maxWidth: resolvedProps.maxWidth,
        ...(hasExplicitHeight
          ? { height: resolvedProps.height }
          : { minHeight: effectiveMinHeight }),
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
        {(resolvedProps.title || resolvedProps.refresh !== false) && (
          <div className="flex items-center justify-between w-full gap-2 flex-wrap shrink-0">
            {resolvedProps.title ? (
              <span className={resolveSlot("title")}>
                {resolvedProps.title}
              </span>
            ) : (
              <span />
            )}

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
        )}

        {loading && !hasAnyData ? (
          <div className="relative w-full flex-1 min-h-0 flex items-center justify-center">
            <svg
              viewBox={`0 0 ${boxWidth || 200} ${boxHeight || 100}`}
              className="block w-full h-full opacity-30"
            >
              <g transform={`translate(${margin.left},${margin.top})`}>
                <line
                  x1={0}
                  y1={innerHeight}
                  x2={innerWidth}
                  y2={innerHeight}
                  stroke="currentColor"
                />
                <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="currentColor" />
              </g>
            </svg>
            <span className={twMerge("absolute", resolveSlot("label"))}>
              Loading data…
            </span>
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
              <defs />
              <g className="anedya-linechart-root">
                <g className="anedya-linechart-grid" />
                <g className="anedya-linechart-area" />
                <g className="anedya-linechart-line" />
                <g className="anedya-linechart-points" />
                <g className="anedya-linechart-xaxis" />
                <g className="anedya-linechart-yaxis" />
              </g>
            </svg>

            {resolvedProps.showLatestValue !== false &&
              latestPoint &&
              !loading &&
              !error &&
              !isEmpty && (
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
          </div>
        )}

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
                {displayFor(summaryStats.min.value)} |{" "}
                {formatTimestamp(summaryStats.min.timestamp)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="opacity-60 text-[0.85em]">AVG</span>
              <span className="font-medium">{displayFor(summaryStats.avg)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="opacity-60 text-[0.85em]">MAX</span>
              <span className="font-medium">
                {displayFor(summaryStats.max.value)} |{" "}
                {formatTimestamp(summaryStats.max.timestamp)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}