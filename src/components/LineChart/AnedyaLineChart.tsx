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
  /** Start of the time range, in milliseconds. Default: one year before `to`. */
  from?: number;
  /** End of the time range, in milliseconds. Default: now. */
  to?: number;
  /** Max data points to fetch. Default: 1000. */
  limit?: number;
  /**
   * Fetch order. Default: `"asc"` — chronological, left-to-right, which
   * is what a line chart timeline needs. The underlying SDK itself
   * defaults to `"desc"`; this widget deliberately overrides that
   * default so lines don't render backwards unless you explicitly ask
   * for `"desc"`.
   */
  order?: "asc" | "desc";

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
   * modified however you'd normally chain D3 methods. Nothing about
   * this is reshaped; it's the real d3.Line object.
   *
   * @example line={(line) => line.curve(d3.curveMonotoneX)}
   */
  line?: (line: d3.Line<LineChartDataPoint>) => d3.Line<LineChartDataPoint>;

  /** Customize the x (time) scale directly — same passthrough pattern as `line`. */
  xScale?: (
    scale: d3.ScaleTime<number, number>
  ) => d3.ScaleTime<number, number>;
  /** Customize the y (value) scale directly. */
  yScale?: (
    scale: d3.ScaleLinear<number, number>
  ) => d3.ScaleLinear<number, number>;

  /** Customize the x-axis generator directly (e.g. `.ticks()`, `.tickFormat()`). */
  xAxis?: (
    axis: d3.Axis<Date | d3.NumberValue>
  ) => d3.Axis<Date | d3.NumberValue>;
  /** Customize the y-axis generator directly. */
  yAxis?: (axis: d3.Axis<d3.NumberValue>) => d3.Axis<d3.NumberValue>;

  /** Optional filled area under the line. Off by default. */
  area?: LineChartAreaConfig;
  /** Optional dots at each data point. Off by default. */
  point?: LineChartPointConfig;
  /** Background gridlines. On by default. */
  grid?: LineChartGridConfig;

  /**
   * Hover tooltip. On by default with built-in content and positioning.
   * Provide `content` to keep the built-in positioning but customize
   * what's shown, or provide any of `onMouseOver`/`onMouseMove`/
   * `onMouseOut` to fully take over with raw D3 event handlers — in
   * that case the built-in tooltip is bypassed entirely.
   */
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
}

const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT_RATIO = 0.5;
const DEFAULT_HEIGHT = 240;

export function AnedyaLineChart({
  node,
  variable,
  from,
  to,
  limit = 1000,
  order = "asc",
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
}: AnedyaLineChartProps): React.JSX.Element {
  if (!node) {
    throw new Error("[AnedyaLineChart] `node` is required.");
  }
  if (!variable) {
    throw new Error("[AnedyaLineChart] `variable` is required.");
  }

  const svgRef = useRef<SVGSVGElement>(null);
  const [dataPoints, setDataPoints] = useState<LineChartDataPoint[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
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
const resolvedFrom = useMemo(() => from ?? resolvedTo - MS_PER_YEAR, [from, resolvedTo]);

  // ---- Data fetch ----
  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await node.getData({
          variable,
          from: resolvedFrom,
          to: resolvedTo,
          limit,
          order,
        });

        if (!mountedRef.current) return;

        if (res.isSuccess && res.isDataAvailable) {
          const points: LineChartDataPoint[] = res.data.map((d: any) => ({
            timestamp: d.timestamp,
            value: d.value,
          }));
          setDataPoints(points);
          setIsEmpty(false);
        } else if (res.isSuccess && !res.isDataAvailable) {
          setDataPoints([]);
          setIsEmpty(true);
        } else {
          setDataPoints(null);
          setError(res.error?.errorMessage ?? "Failed to fetch data");
          setIsEmpty(false);
        }
      } catch (err: any) {
        if (!mountedRef.current) return;
        setDataPoints(null);
        setError(err?.message ?? "Failed to fetch data");
        setIsEmpty(false);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [node, variable, resolvedFrom, resolvedTo, limit, order]);

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
    className,
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
  // Providing ANY raw handler opts the consumer out of the built-in
  // tooltip entirely — matches the "exactly like D3" contract: once
  // you're wiring your own .on() handlers, we don't also drive our own.
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
      const formatter = LABEL_FORMATTERS[resolvedProps.labelFormat ?? "time"];
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

  // ---- Geometry ----
  const boxWidth =
    resolvedProps.width ?? (dims.width || DEFAULT_WIDTH);
  const boxHeight =
    resolvedProps.height ?? (dims.height || boxWidth * DEFAULT_HEIGHT_RATIO) ?? DEFAULT_HEIGHT;

  const margin = { top: 12, right: 16, bottom: 28, left: 44 };
  const innerWidth = Math.max(0, boxWidth - margin.left - margin.right);
  const innerHeight = Math.max(0, boxHeight - margin.top - margin.bottom);

  // ---- D3 draw ----
  useEffect(() => {
    if (!svgRef.current || innerWidth <= 0 || innerHeight <= 0) return;
    if (!dataPoints || dataPoints.length === 0) return;

    const svg = d3.select(svgRef.current);
    const root = svg.select<SVGGElement>("g.anedya-linechart-root");
    root.attr("transform", `translate(${margin.left},${margin.top})`);

    const xExtent = d3.extent(dataPoints, (d) => d.timestamp) as [
      number,
      number
    ];
    const yExtent = d3.extent(dataPoints, (d) => d.value) as [number, number];
    const yPad = (yExtent[1] - yExtent[0]) * 0.1 || 1;

    let x = d3
      .scaleTime()
      .domain([new Date(xExtent[0]), new Date(xExtent[1])])
      .range([0, innerWidth]);
    if (resolvedProps.xScale) x = resolvedProps.xScale(x) as any;

    let y = d3
      .scaleLinear()
      .domain([yExtent[0] - yPad, yExtent[1] + yPad])
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
        .call((g) => g.selectAll("line").attr("stroke", "currentColor").attr("opacity", 0.5));
    }

    // ---- Axes ----
    let xAxisGen = d3.axisBottom(x).ticks(5);
    if (resolvedProps.xAxis) xAxisGen = resolvedProps.xAxis(xAxisGen as any) as any;
    const xAxisGroup = root.select<SVGGElement>("g.anedya-linechart-xaxis");
    xAxisGroup
      .attr("class", twMerge("anedya-linechart-xaxis", resolveSlot("xAxis")))
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxisGen as any)
      .call((g) => g.select(".domain").attr("stroke", "currentColor").attr("opacity", 0.3))
      .call((g) => g.selectAll("text").attr("fill", "currentColor"))
      .call((g) => g.selectAll("line").attr("stroke", "currentColor").attr("opacity", 0.3));

    let yAxisGen = d3.axisLeft(y).ticks(5);
    if (resolvedProps.yAxis) yAxisGen = resolvedProps.yAxis(yAxisGen as any) as any;
    const yAxisGroup = root.select<SVGGElement>("g.anedya-linechart-yaxis");
    yAxisGroup
      .attr("class", twMerge("anedya-linechart-yaxis", resolveSlot("yAxis")))
      .call(yAxisGen as any)
      .call((g) => g.select(".domain").attr("stroke", "currentColor").attr("opacity", 0.3))
      .call((g) => g.selectAll("text").attr("fill", "currentColor"))
      .call((g) => g.selectAll("line").attr("stroke", "currentColor").attr("opacity", 0.3));

    // ---- Area ----
    const areaGroup = root.select<SVGGElement>("g.anedya-linechart-area");
    areaGroup.selectAll("*").remove();
    if (resolvedArea.show) {
      const areaGen = d3
        .area<LineChartDataPoint>()
        .x((d) => x(new Date(d.timestamp)))
        .y0(innerHeight)
        .y1((d) => y(d.value));
      areaGroup
        .append("path")
        .attr("class", twMerge("anedya-linechart-area-path", resolveSlot("area")))
        .attr("d", areaGen(dataPoints)!)
        .attr("fill", "currentColor")
        .attr("stroke", "none")
        .attr("opacity", resolvedArea.opacity);
    }

    // ---- Line — this is the literal D3 passthrough ----
    let lineGen = d3
      .line<LineChartDataPoint>()
      .x((d) => x(new Date(d.timestamp)))
      .y((d) => y(d.value));
    if (resolvedProps.line) lineGen = resolvedProps.line(lineGen);

    const lineGroup = root.select<SVGGElement>("g.anedya-linechart-line");
    lineGroup.selectAll("*").remove();
    lineGroup
      .append("path")
      .attr("class", twMerge("anedya-linechart-line-path", resolveSlot("line")))
      .attr("d", lineGen(dataPoints)!)
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("stroke-width", 2);

    // ---- Points ----
    const pointGroup = root.select<SVGGElement>("g.anedya-linechart-points");
    pointGroup.selectAll("*").remove();
    if (resolvedPoint.show) {
      pointGroup
        .selectAll("circle")
        .data(dataPoints)
        .join("circle")
        .attr("class", resolveSlot("point"))
        .attr("cx", (d) => x(new Date(d.timestamp)))
        .attr("cy", (d) => y(d.value))
        .attr("r", resolvedPoint.radius)
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
      const idx = bisect(dataPoints, targetTs);
      const closest =
        dataPoints[
          Math.min(dataPoints.length - 1, Math.max(0, idx))
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
      if (hasRawTooltipHandlers && dataPoints.length > 0) {
        resolvedTooltip.onMouseOver?.(event, dataPoints[0]);
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
      hitRect.style("cursor", null).on("mouseover", null).on("mousemove", null).on("mouseleave", null);
    }
  }, [
    dataPoints,
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
        {resolvedProps.title && (
          <span className={resolveSlot("title")}>{resolvedProps.title}</span>
        )}

        {loading ? (
          <div className="flex flex-col gap-2 w-full items-center justify-center flex-1">
            <div
              className="w-full bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"
              style={{ height: "60%" }}
            />
          </div>
        ) : error ? (
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
      </div>
    </div>
  );
}