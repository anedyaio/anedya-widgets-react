// GaugeWidget.tsx

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
  GaugeAnimationConfig,
  GaugeArcConfig,
  GaugeColor,
  GaugeNeedleConfig,
  GaugeSlot,
  GaugeTickConfig, // NEW
  GaugeTrackConfig,
  GaugeValueLabelConfig,
  GaugeEasing,
} from "../../types/gauge";
import {
  DEFAULT_GAUGE_THEME,
  GAUGE_DEFAULT_CLASSES,
  gaugeDarkTheme,
  gaugeLightTheme,
} from "../../themes/gaugeTheme";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { FORMATTERS, LABEL_FORMATTERS } from "../../helpers/formatters";

/** The raw data this widget fetched — exactly what comes back from the request, not yet formatted. */
export interface GaugeData {
  value: number;
  timestamp: number;
}

export type GaugeWidgetUpdate = Partial<
  Omit<GaugeWidgetProps, "node" | "variable" | "onDataChange">
>;

export interface GaugeWidgetProps extends AnedyaWidgetBaseProps {
  value?: number;
  min?: number;
  max?: number;
  size?: number;
  responsive?: boolean;

  arc?: GaugeArcConfig;
  track?: GaugeTrackConfig;
  color?: GaugeColor;

  needle?: GaugeNeedleConfig;
  valueLabel?: GaugeValueLabelConfig;
  /** REQUIREMENT 3/4: radial min/max tick marks drawn around the arc. */
  tick?: GaugeTickConfig;
  animation?: GaugeAnimationConfig;

  // ---- Card-parity formatting props ----
  unit?: string;
  decimalPlaces?: number;
  formatValue?: (value: number) => string;
  format?: FormatPreset;
  formatOptions?: FormatOptions;
  labelText?: (timestamp: number) => string;
  labelFormat?: LabelFormatPreset;

  styles?: SlotClassNames<GaugeSlot>;
  style?: React.CSSProperties;

  onClick?: (value: number) => void;
  // REQUIREMENT 5: onValueChange removed — onDataChange already lets the
  // caller override *any* prop whenever new data arrives, so a separate
  // value-only callback was redundant.
  onDataChange?: (data: GaugeData | null) => GaugeWidgetUpdate | void;
}

const DEG2RAD = Math.PI / 180;

const DEFAULT_ARC: Required<Omit<GaugeArcConfig, "radius" | "thickness">> = {
  startAngle: -90,
  endAngle: 90,
  cornerRadius: 0,
};

const DEFAULT_ANIMATION: Required<GaugeAnimationConfig> = {
  show: true,
  duration: 1000,
  easing: "cubicOut",
};

const DEFAULT_WIDTH = 240;
const DEFAULT_HEIGHT_RATIO = 0.68;

const EASE_MAP: Record<GaugeEasing, string> = {
  linear: "easeLinear",
  quadIn: "easeQuadIn",
  quadOut: "easeQuadOut",
  quadInOut: "easeQuadInOut",
  cubicIn: "easeCubicIn",
  cubicOut: "easeCubicOut",
  cubicInOut: "easeCubicInOut",
  sinIn: "easeSinIn",
  sinOut: "easeSinOut",
  sinInOut: "easeSinInOut",
  expIn: "easeExpIn",
  expOut: "easeExpOut",
  expInOut: "easeExpInOut",
  circleIn: "easeCircleIn",
  circleOut: "easeCircleOut",
  circleInOut: "easeCircleInOut",
  backIn: "easeBackIn",
  backOut: "easeBackOut",
  backInOut: "easeBackInOut",
  elasticIn: "easeElasticIn",
  elasticOut: "easeElasticOut",
  elasticInOut: "easeElasticInOut",
  bounceIn: "easeBounceIn",
  bounceOut: "easeBounceOut",
  bounceInOut: "easeBounceInOut",
};

function resolveEase(name: GaugeEasing) {
  const d3Name = EASE_MAP[name] ?? "easeCubicOut";
  return (d3 as any)[d3Name] ?? d3.easeCubicOut;
}

function needlePixelLength(
  length: GaugeNeedleConfig["length"],
  radius: number
) {
  if (typeof length === "number") return length;
  switch (length) {
    case "short":
      return radius * 0.55;
    case "full":
      return radius * 0.95;
    case "medium":
    default:
      return radius * 0.75;
  }
}

function needleShape(
  type: NonNullable<GaugeNeedleConfig["type"]>,
  length: number,
  width: number
) {
  const w = width;
  switch (type) {
    case "line":
      return {
        tag: "line",
        attrs: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: -length,
          strokeWidth: w,
          strokeLinecap: "butt",
        },
      };
    case "rounded":
      return {
        tag: "line",
        attrs: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: -length,
          strokeWidth: w,
          strokeLinecap: "round",
        },
      };
    case "triangle": {
      const half = w / 2;
      return {
        tag: "polygon",
        attrs: {
          points: `0,0 ${-half},${-length * 0.15} 0,${-length} ${half},${
            -length * 0.15
          }`,
        },
      };
    }
    case "drop":
    default: {
      const half = w / 2;
      const d = `M ${-half} 0
                 C ${-half} ${-length * 0.35}, ${-w} ${
        -length * 0.7
      }, 0 ${-length}
                 C ${w} ${-length * 0.7}, ${half} ${-length * 0.35}, ${half} 0
                 A ${half} ${half} 0 1 1 ${-half} 0 Z`;
      return { tag: "path", attrs: { d } };
    }
  }
}

function isGradientColor(c?: GaugeColor): c is string[] {
  return Array.isArray(c) && c.length >= 2;
}

function resolveFill(
  defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
  id: string,
  color: GaugeColor | undefined,
  fallback: string
): string {
  if (!color) return fallback;
  if (!isGradientColor(color)) return color;

  let grad = defs.select<SVGLinearGradientElement>(`#${id}`);
  if (grad.empty()) {
    grad = defs.append("linearGradient").attr("id", id);
  }
  grad.attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");
  grad.selectAll("stop").remove();
  color.forEach((c, i) =>
    grad
      .append("stop")
      .attr("offset", `${(i / (color.length - 1)) * 100}%`)
      .attr("stop-color", c)
  );
  return `url(#${id})`;
}

function getArcBounds(startDeg: number, endDeg: number) {
  const lo = Math.min(startDeg, endDeg);
  const hi = Math.max(startDeg, endDeg);
  const angles = [startDeg, endDeg];
  for (let k = Math.ceil(lo / 90) * 90; k <= hi; k += 90) angles.push(k);

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  angles.forEach((deg) => {
    const a = deg * DEG2RAD;
    const x = Math.sin(a);
    const y = -Math.cos(a);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

export function GaugeWidget({
  node,
  variable,
  title = "Latest Value",
  theme,
  className,
  style,
  width,
  height,
  minWidth = 160,
  maxWidth = 480,
  minHeight = 140,
  maxHeight = 420,
  aspectRatio,
  value: valueProp,
  min = 0,
  max = 100,
  size,
  responsive = true,
  arc,
  track,
  color,
  needle,
  valueLabel,
  tick,
  animation,
  unit,
  decimalPlaces,
  formatValue,
  format,
  formatOptions,
  labelText,
  labelFormat,
  styles = {},
  onDataChange,
  // onClick,
}: GaugeWidgetProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  // REQUIREMENT 2: stable "now" fallback for manual/custom `value` mode,
  // captured once on mount (not recomputed every render).
  const manualTimestampRef = useRef<number>(Date.now());

  const [fetchedValue, setFetchedValue] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dynamicProps, setDynamicProps] = useState<GaugeWidgetUpdate>({});

  const mountedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // ---- Live data fetch (mirrors CardWidget, plus timestamp) ----
  useEffect(() => {
    if (!node) return;
    mountedRef.current = true;

    const fetchLatest = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await node.getLatestData(variable);
        if (!mountedRef.current) return;

        if (res.isSuccess && res.isDataAvailable) {
          setFetchedValue(res.data.value);
          setTimestamp(res.data.timestamp);
        } else {
          setFetchedValue(null);
          setError(res.error?.errorMessage ?? "No data available");
        }
      } catch (err: any) {
        if (!mountedRef.current) return;
        setFetchedValue(null);
        setError(err?.message ?? "Failed to fetch data");
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchLatest();
    return () => {
      mountedRef.current = false;
    };
  }, [node, variable]);

  // ---- onDataChange resolution (identical pattern to CardWidget) ----
  useEffect(() => {
    if (!onDataChange) {
      setDynamicProps({});
      return;
    }

    const data =
      fetchedValue != null && timestamp != null
        ? { value: fetchedValue, timestamp }
        : null;

    setDynamicProps(onDataChange(data) ?? {});
  }, [fetchedValue, timestamp, onDataChange]);

  const rawValue = fetchedValue ?? valueProp ?? min;
  const clampedValue = Math.min(max, Math.max(min, rawValue));

  // REQUIREMENT 5: onValueChange effect removed (see prop removal above).

  // const { ref: wrapperRef, size: dims } = useResizeObserver<HTMLDivElement>(
  //   responsive && size == null
  // );

  const { ref: arcWrapperRef, size: dims } = useResizeObserver<HTMLDivElement>(
    responsive && size == null
  );

  const mergedStyles = useMemo(
    () => ({ ...(styles ?? {}), ...(dynamicProps.styles ?? {}) }),
    [styles, dynamicProps.styles]
  );

  // ---- Merge static props with dynamic onDataChange overrides ----
  const resolvedProps = {
    title,
    theme,
    className,
    width,
    height,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    aspectRatio,
    min,
    max,
    size,
    responsive,
    arc,
    track,
    color,
    needle,
    valueLabel,
    tick,
    animation,
    unit,
    decimalPlaces,
    formatValue,
    format,
    formatOptions,
    labelText,
    labelFormat,
    ...dynamicProps,
    styles: mergedStyles,
  };

  // ---- Resolved config ----
  const resolvedArc = { ...DEFAULT_ARC, ...resolvedProps.arc };

  const resolvedTrack: Required<GaugeTrackConfig> = {
    show: resolvedProps.track?.show ?? true,
    color: resolvedProps.track?.color ?? "",
  };

  const resolvedNeedle: Required<Omit<GaugeNeedleConfig, "length">> & {
    length: NonNullable<GaugeNeedleConfig["length"]>;
  } = {
    show: resolvedProps.needle?.show ?? true,
    type: resolvedProps.needle?.type ?? "rounded",
    length: resolvedProps.needle?.length ?? "medium",
    width: resolvedProps.needle?.width ?? 4,
    color: resolvedProps.needle?.color ?? "",
    needleColor:
      resolvedProps.needle?.needleColor ??
      resolvedProps.needle?.color ??
      "currentColor",
    capColor:
      resolvedProps.needle?.capColor ??
      resolvedProps.needle?.color ??
      "currentColor",
    capRadius: resolvedProps.needle?.capRadius ?? 6,
    animation: resolvedProps.needle?.animation ?? true,
  };

  const resolvedValueLabel: Required<Pick<GaugeValueLabelConfig, "show">> = {
    show: resolvedProps.valueLabel?.show ?? true,
  };

  const resolvedAnimation = {
    ...DEFAULT_ANIMATION,
    ...resolvedProps.animation,
  };

  // ---- REQUIREMENT 3/4: tick marks config ----
  // `count` = number of INTERVALS between min/max, so count=10 with the
  // default min=0/max=100 draws 11 marks (0,10,20...100) — "10 count" per
  // the ask. All sizing/color/gap knobs are user-overridable; `tick`/
  // `tickLabel` GaugeSlot entries (in `styles`) layer Tailwind classes on
  // top for anything not covered by these direct props.
  const resolvedTick = {
    show: resolvedProps.tick?.show ?? false,
    count: resolvedProps.tick?.count ?? 10,
    size: resolvedProps.tick?.size ?? 6,
    color: resolvedProps.tick?.color ?? "",
    radiusOffset: resolvedProps.tick?.radiusOffset ?? 4,
    labelGap: resolvedProps.tick?.labelGap ?? 4,
    labelSize: resolvedProps.tick?.labelSize ?? 10,
    labelColor: resolvedProps.tick?.labelColor ?? "",
    labelFormat: resolvedProps.tick?.labelFormat,
  };

  // ---- Theme + slot classes ----
  const resolvedTheme: WidgetTheme<GaugeSlot> =
    resolvedProps.theme === "dark"
      ? gaugeDarkTheme
      : resolvedProps.theme === "light"
      ? gaugeLightTheme
      : (resolvedProps.theme as WidgetTheme<GaugeSlot>) ?? DEFAULT_GAUGE_THEME;

  const resolveSlot = useCallback(
    (slot: GaugeSlot) =>
      twMerge(
        GAUGE_DEFAULT_CLASSES[slot],
        resolvedTheme.styles[slot],
        resolvedProps.styles[slot]
      ),
    [resolvedTheme, resolvedProps.styles]
  );

  // ---- REQUIREMENT 3: tick values (min..max split into `count` even steps) ----
  const tickValues = useMemo(() => {
    if (!resolvedTick.show || resolvedTick.count <= 0) return [];
    const step = (resolvedProps.max - resolvedProps.min) / resolvedTick.count;
    return d3
      .range(resolvedTick.count + 1)
      .map((i) => resolvedProps.min + i * step);
  }, [
    resolvedTick.show,
    resolvedTick.count,
    resolvedProps.min,
    resolvedProps.max,
  ]);

  // ---- REQUIREMENT 3/4: tick label formatting ----
  // Reuses the same `format` preset as the main value (if set) so tick
  // labels and the big value stay consistent; falls back to a plain
  // rounded number when nothing else is configured.
  const formatTickLabel = useCallback(
    (v: number) => {
      if (resolvedTick.labelFormat) return resolvedTick.labelFormat(v);
      if (resolvedProps.format)
        return FORMATTERS[resolvedProps.format](v, resolvedProps.formatOptions)
          .value;
      return String(Math.round(v * 100) / 100);
    },
    [
      resolvedTick.labelFormat,
      resolvedProps.format,
      resolvedProps.formatOptions,
    ]
  );

  // ---- Value + unit formatting (same precedence as CardWidget) ----
  const { displayValue, displayUnit } = useMemo(() => {
    if (resolvedProps.formatValue) {
      return {
        displayValue: resolvedProps.formatValue(clampedValue),
        displayUnit: resolvedProps.unit,
      };
    }

    if (resolvedProps.format) {
      const result = FORMATTERS[resolvedProps.format](
        clampedValue,
        resolvedProps.formatOptions
      );
      return { displayValue: result.value, displayUnit: result.unit };
    }

    if (resolvedProps.decimalPlaces != null) {
      return {
        displayValue: clampedValue.toFixed(resolvedProps.decimalPlaces),
        displayUnit: resolvedProps.unit,
      };
    }

    return {
      displayValue: String(clampedValue),
      displayUnit: resolvedProps.unit,
    };
  }, [
    clampedValue,
    resolvedProps.formatValue,
    resolvedProps.format,
    resolvedProps.formatOptions,
    resolvedProps.decimalPlaces,
    resolvedProps.unit,
  ]);

  // REQUIREMENT 2: in manual `value` mode there's no `node`, so the
  // live-fetch effect never runs and `timestamp` stays null forever — the
  // label used to just disappear in that case. Fall back to the timestamp
  // captured on mount so the label still renders for custom/manual values.
  const effectiveTimestamp = useMemo(
    () => timestamp ?? (valueProp != null ? manualTimestampRef.current : null),
    [timestamp, valueProp]
  );

  // ---- Last-updated label — THIS is what shows the time ----
  const displayLabel = useMemo(() => {
    if (effectiveTimestamp == null) return null;

    if (resolvedProps.labelText)
      return resolvedProps.labelText(effectiveTimestamp);

    const formatter = LABEL_FORMATTERS[resolvedProps.labelFormat ?? "time"];
    return formatter(effectiveTimestamp, resolvedProps.formatOptions?.locale);
  }, [
    effectiveTimestamp,
    resolvedProps.labelText,
    resolvedProps.labelFormat,
    resolvedProps.formatOptions?.locale,
  ]);

  // ---- Geometry ----
  const boxWidth =
    resolvedProps.size ?? resolvedProps.width ?? (dims.width || DEFAULT_WIDTH);
  const boxHeight =
    resolvedProps.size ??
    resolvedProps.height ??
    (dims.height || boxWidth * DEFAULT_HEIGHT_RATIO);

  const bounds = useMemo(
    () => getArcBounds(resolvedArc.startAngle, resolvedArc.endAngle),
    [resolvedArc.startAngle, resolvedArc.endAngle]
  );

  const pad = 8;
  // const textReserve = resolvedValueLabel.show ? 0.34 : 0.16;
  const textReserve = 0;
  const availW = boxWidth - pad * 2;
  const availH = boxHeight * (1 - textReserve) - pad * 2;

  // REQUIREMENT 3: reserve room for the tick ring (line + gaps + label)
  // so ticks never get clipped by the SVG viewBox. Rather than growing the
  // outer container, we shrink the arc radius by this padding — the whole
  // gauge (arc + ticks) then always fits inside whatever box the
  // responsive container currently has.
  const tickPadding = resolvedTick.show
    ? resolvedTick.radiusOffset +
      resolvedTick.size +
      resolvedTick.labelGap +
      resolvedTick.labelSize * 1.5
    : 0;

  const maxFitRadius = Math.max(
    24,
    Math.min(
      (availW - tickPadding * 2) / (bounds.w || 1),
      (availH - tickPadding * 2) / (bounds.h || 1)
    )
  );

  const outerRadius = resolvedArc.radius
    ? Math.min(resolvedArc.radius, maxFitRadius)
    : maxFitRadius;

  const thickness = resolvedArc.thickness ?? Math.max(6, outerRadius * 0.18);

  const cx =
    pad - bounds.minX * outerRadius + (availW - bounds.w * outerRadius) / 2;
  const cy = pad - bounds.minY * outerRadius;

  const angleScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([resolvedProps.min, resolvedProps.max])
        .range([
          resolvedArc.startAngle * DEG2RAD,
          resolvedArc.endAngle * DEG2RAD,
        ])
        .clamp(true),
    [
      resolvedProps.min,
      resolvedProps.max,
      resolvedArc.startAngle,
      resolvedArc.endAngle,
    ]
  );

  // ---- D3 draw ----
  useEffect(() => {
    if (!svgRef.current || boxWidth === 0 || boxHeight === 0) return;

    const svg = d3.select(svgRef.current);
    const defs = svg.select<SVGDefsElement>("defs");
    const root = svg.select<SVGGElement>("g.anedya-gauge-root");
    root.attr("transform", `translate(${cx},${cy})`);

    const ease = resolveEase(resolvedAnimation.easing);
    const safeCornerRadius = Math.min(resolvedArc.cornerRadius, thickness / 2);

    const arcGen = d3
      .arc<{ startAngle: number; endAngle: number; r: number }>()
      .innerRadius((d) => d.r - thickness)
      .outerRadius((d) => d.r)
      .cornerRadius(safeCornerRadius)
      .startAngle((d) => d.startAngle)
      .endAngle((d) => d.endAngle);

    const startA = resolvedArc.startAngle * DEG2RAD;
    const endA = resolvedArc.endAngle * DEG2RAD;

    const trackSel = root.select<SVGPathElement>(
      "path.anedya-gauge-track-path"
    );
    if (resolvedTrack.show) {
      trackSel
        .attr(
          "d",
          arcGen({ startAngle: startA, endAngle: endA, r: outerRadius })!
        )
        .attr("fill", resolvedTrack.color || "currentColor")
        .attr("opacity", 1);
    } else {
      trackSel.attr("opacity", 0);
    }

    // ---- REQUIREMENT 3/4: tick marks + labels ----
    // Ticks don't animate (they're static reference marks), so it's a
    // simple remove-and-redraw each time rather than the persistent-node
    // + transition pattern used for the bar/needle.
    const tickGroup = root.select<SVGGElement>("g.anedya-gauge-ticks");
    tickGroup.selectAll("*").remove();

    if (resolvedTick.show) {
      const lineStartR = outerRadius + resolvedTick.radiusOffset;
      const lineEndR = lineStartR + resolvedTick.size;
      const labelR = lineEndR + resolvedTick.labelGap;

      tickValues.forEach((v) => {
        const angleDeg = angleScale(v) / DEG2RAD;

        // Tick line: drawn pointing "up" then rotated into place — the
        // rotate-then-translate idea is the one piece taken from the
        // reference D3 gauge's tick-label positioning.
        tickGroup
          .append("line")
          .attr("class", twMerge("anedya-gauge-tick", resolveSlot("tick")))
          .attr("x1", 0)
          .attr("y1", -lineStartR)
          .attr("x2", 0)
          .attr("y2", -lineEndR)
          .attr("stroke", resolvedTick.color || "currentColor")
          .attr("stroke-width", 1.5)
          .attr("transform", `rotate(${angleDeg})`);

        // Tick label: rotate to the tick's angle, translate out to its
        // radius, then rotate back — keeps every label upright/horizontal
        // no matter where it sits around the arc. font-size is set via
        // `.style()` (inline style) so `tick.labelSize` always wins over
        // any Tailwind class on the `tickLabel` slot.
        tickGroup
          .append("text")
          .attr(
            "class",
            twMerge("anedya-gauge-tick-label", resolveSlot("tickLabel"))
          )
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .style("font-size", `${resolvedTick.labelSize}px`)
          .attr("fill", resolvedTick.labelColor || "currentColor")
          .attr(
            "transform",
            `rotate(${angleDeg}) translate(0, ${-labelR}) rotate(${-angleDeg})`
          )
          .text(formatTickLabel(v));
      });
    }

    const barGroup = root.select<SVGGElement>("g.anedya-gauge-bar-group");

    const barValue = loading || error ? resolvedProps.min : clampedValue;
    const valueAngle = angleScale(barValue);
    const barFill = resolveFill(
      defs,
      "anedya-gauge-bar-fill",
      resolvedProps.color,
      "currentColor"
    );

    let path = barGroup.select<SVGPathElement>("path.anedya-gauge-bar-path");
    if (path.empty()) {
      path = barGroup
        .append("path")
        .attr("class", "anedya-gauge-bar-path")
        .attr("data-end-angle", String(startA));
    }

    path
      .attr("class", twMerge("anedya-gauge-bar-path", resolveSlot("bar")))
      .attr("fill", barFill)
      .attr("stroke", "none")
      .attr("opacity", loading ? 0.4 : 1);

    const currentEndAngle = path.attr("data-end-angle")
      ? +path.attr("data-end-angle")!
      : startA;

    if (resolvedAnimation.show) {
      path
        .datum({
          startAngle: startA,
          endAngle: currentEndAngle,
          r: outerRadius,
        })
        .transition()
        .duration(resolvedAnimation.duration)
        .ease(ease)
        .attrTween("d", function (d: any) {
          const interp = d3.interpolate(d.endAngle, valueAngle);
          return (t) => {
            d.endAngle = interp(t);
            path.attr("data-end-angle", String(d.endAngle));
            return arcGen({
              startAngle: startA,
              endAngle: d.endAngle,
              r: outerRadius,
            })!;
          };
        });
    } else {
      // NEW: animation disabled — snap straight to the target angle, no tween
      path
        .datum({ startAngle: startA, endAngle: valueAngle, r: outerRadius })
        .attr("data-end-angle", String(valueAngle))
        .attr(
          "d",
          arcGen({ startAngle: startA, endAngle: valueAngle, r: outerRadius })!
        );
    }

    const needleGroup = root.select<SVGGElement>("g.anedya-gauge-needle");
    if (resolvedNeedle.show) {
      const len = needlePixelLength(resolvedNeedle.length, outerRadius);
      const shape = needleShape(resolvedNeedle.type, len, resolvedNeedle.width);

      needleGroup.selectAll("*:not(circle.anedya-gauge-needle-cap)").remove();
      const needleEl = needleGroup.insert(
        shape.tag as any,
        "circle.anedya-gauge-needle-cap"
      );
      needleEl.attr("class", resolveSlot("needle"));

      needleEl
        .attr("class", resolveSlot("needle"))
        .attr("fill", resolvedNeedle.needleColor)
        .attr("stroke", resolvedNeedle.needleColor)
        .attr("opacity", loading ? 0.4 : 1);

      Object.entries(shape.attrs).forEach(([k, v]) =>
        needleEl.attr(
          k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()),
          v as any
        )
      );

      let cap = needleGroup.select<SVGCircleElement>(
        "circle.anedya-gauge-needle-cap"
      );
      if (cap.empty()) {
        cap = needleGroup
          .append("circle")
          .attr(
            "class",
            twMerge("anedya-gauge-needle-cap", resolveSlot("needleCap"))
          );
      }
      cap
        .attr("r", resolvedNeedle.capRadius)
        .attr("fill", resolvedNeedle.capColor) // ← use capColor
        .attr("opacity", loading ? 0.4 : 1);

      const targetDeg = valueAngle / DEG2RAD;
      // NEW: needle now only animates if BOTH the per-needle flag AND the
      // global resolvedAnimation.show are true
      if (resolvedNeedle.animation && resolvedAnimation.show) {
        needleGroup
          .transition()
          .duration(resolvedAnimation.duration)
          .ease(ease)
          .attrTween("transform", function () {
            const current = needleGroup.attr("data-angle")
              ? +needleGroup.attr("data-angle")!
              : startA / DEG2RAD;
            const interp = d3.interpolate(current, targetDeg);
            return (t) => {
              const a = interp(t);
              needleGroup.attr("data-angle", String(a));
              return `rotate(${a})`;
            };
          });
      } else {
        needleGroup
          .attr("transform", `rotate(${targetDeg})`)
          .attr("data-angle", String(targetDeg));
      }
      needleGroup.attr("opacity", 1);
    } else {
      needleGroup.attr("opacity", 0);
    }
  }, [
    boxWidth,
    boxHeight,
    cx,
    cy,
    outerRadius,
    thickness,
    clampedValue,
    loading,
    error,
    resolvedProps.min,
    resolvedProps.max,
    resolvedProps.color,
    resolvedArc.cornerRadius,
    resolvedTrack.show,
    resolvedTrack.color,
    resolvedNeedle.show,
    resolvedNeedle.type,
    resolvedNeedle.length,
    resolvedNeedle.width,
    resolvedNeedle.color,
    resolvedNeedle.capRadius,
    resolvedNeedle.animation,
    resolvedAnimation.duration,
    resolvedAnimation.easing,
    resolvedAnimation.show,
    resolvedTick.show,
    resolvedTick.count,
    resolvedTick.size,
    resolvedTick.color,
    resolvedTick.radiusOffset,
    resolvedTick.labelGap,
    resolvedTick.labelSize,
    resolvedTick.labelColor,
    tickValues,
    formatTickLabel,
    resolveSlot,
  ]);

  // const handleClick = useCallback(
  //   () => onClick?.(clampedValue),
  //   [onClick, clampedValue]
  // );

  // REQUIREMENT 1: value/unit/label extracted so the exact same markup can
  // be placed either below the arc (needle mode) or centered over it
  // (no-needle / donut mode) without duplicating JSX.
  const valueBlock = (
    <>
      {resolvedValueLabel.show && (
        <span
          className={twMerge(
            "inline-flex items-baseline justify-center gap-1",
            resolveSlot("value")
          )}
        >
          <span className="min-w-0 break-words">{displayValue}</span>
          {displayUnit && (
            <span className={resolveSlot("unit")}>{displayUnit}</span>
          )}
        </span>
      )}

      {displayLabel && (
        <span className={resolveSlot("label")}>{displayLabel}</span>
      )}
    </>
  );

  return (
    <div
      // ref={wrapperRef}
      className={twMerge(
        "anedya-gauge-container relative",
        resolvedProps.className
      )}
      style={{
        width: resolvedProps.size ?? resolvedProps.width ?? "100%",
        height: resolvedProps.size ?? resolvedProps.height ?? undefined,
        minWidth: resolvedProps.minWidth,
        maxWidth: resolvedProps.maxWidth,
        minHeight: resolvedProps.minHeight,
        maxHeight: resolvedProps.maxHeight,
        aspectRatio:
          resolvedProps.size || resolvedProps.height
            ? undefined
            : resolvedProps.aspectRatio ?? 1 / DEFAULT_HEIGHT_RATIO,
        boxSizing: "border-box",
        ...style,
      }}
      // onClick={handleClick}
    >
      {/* <div className={twMerge("anedya-gauge", resolveSlot("container"))}>
        {resolvedProps.title && (
          <span className={resolveSlot("title")}>{resolvedProps.title}</span>
        )} */}
      <div
        className={twMerge(
          "anedya-gauge relative flex flex-col items-center justify-center text-center w-full h-full",
          resolveSlot("container")
        )}
      >
        {resolvedProps.title && (
          <span className={resolveSlot("title")}>{resolvedProps.title}</span>
        )}

        {/* REQUIREMENT 1: wrapped in a relative container so the centered
          value/label overlay (no-needle mode) can be positioned directly
          on top of the arc. min-h-0 keeps this shrinkable inside the
          flex-column layout instead of overflowing it. */}
        <div
          ref={arcWrapperRef}
          className="relative w-full flex-1 min-h-0 flex items-center justify-center"
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${boxWidth || 200} ${boxHeight || 200}`}
            width={boxWidth || undefined}
            height={boxHeight || undefined}
            className="block"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          >
            <defs />
            <g className="anedya-gauge-root">
              <path
                className={twMerge(
                  "anedya-gauge-track-path",
                  resolveSlot("track")
                )}
                fill="currentColor"
                stroke="none"
              />
              {/* REQUIREMENT 3/4: tick marks + labels, populated in the D3 draw effect */}
              <g className="anedya-gauge-ticks" />
              <g className="anedya-gauge-bar-group" />
              <g className="anedya-gauge-needle">
                <circle
                  className={twMerge(
                    "anedya-gauge-needle-cap",
                    resolveSlot("needleCap")
                  )}
                />
              </g>
            </g>
          </svg>

          {/* REQUIREMENT 1: no needle → treat it like a donut and center the
            value/label directly over the arc's visual center (cx, cy).
            Position is expressed as a % of the viewBox so it stays correct
            at any container size. */}
          {!resolvedNeedle.show && !loading && !error && (
            <div
              className="absolute flex flex-col items-center justify-center gap-[var(--anedya-gauge-gap)] px-2 pointer-events-none"
              style={{
                left: `${(cx / (boxWidth || 1)) * 100}%`,
                top: `${(cy / (boxHeight || 1)) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {valueBlock}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-[var(--anedya-gauge-gap)] w-full items-center justify-center">
            <div
              className="w-2/3 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"
              style={{
                height: "var(--anedya-gauge-value-size)",
                backgroundColor:
                  resolvedProps.theme === "dark" ? "#374151" : "#e5e7eb",
              }}
            />
            <div
              className="w-1/2 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"
              style={{
                height: "var(--anedya-gauge-label-size)",
                backgroundColor:
                  resolvedProps.theme === "dark" ? "#374151" : "#e5e7eb",
              }}
            />
          </div>
        ) : error ? (
          <span className="text-red-600 text-sm">{error}</span>
        ) : (
          // REQUIREMENT 1: needle-mode keeps the original below-the-arc
          // layout. No-needle mode already rendered `valueBlock` centered above.
          resolvedNeedle.show && valueBlock
        )}
      </div>
    </div>
  );
}
