import { useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import * as d3 from "d3";
import {SlotClassNames, WidgetTheme } from "../../types/root";
import { AnedyaWidgetBaseProps } from "../../common";
import {
  GAUGE_DEFAULT_CLASSES,
  gaugeThemes,
  GaugeSlot,
} from "../../themes/gaugeTheme";
import { useResizeObserver } from "../../hooks/useResizeObserver";

export interface GaugeWidgetProps extends AnedyaWidgetBaseProps {
  variant?: "progress" | "needle" | "segmented" | "multiBar";
  value?: number;

  min?: number;
  max?: number;
  size?: number;

  arc?: {
    startAngle?: number;   // degrees, default 180
    endAngle?: number;     // degrees, default 0 (semi-circle left to right)
    thickness?: number;
    cornerRadius?: number;
    gap?: number;
  };

  track?: {
    show?: boolean;
    color?: string;
  };

  fillMode?: "progress" | "solid";

  bars?: Array<{
    value: number;
    color?: string;
    label?: string;
  }>;

  needle?: {
    show?: boolean;
    type?: "line" | "rounded" | "drop" | "triangle";
    length?: "short" | "medium" | "full" | number;
    width?: number;
    color?: string;
    capRadius?: number;
    animation?: boolean;
  };

  valueLabel?: {
    show?: boolean;
    precision?: number;
    prefix?: string;
    suffix?: string;
    formatter?: (value: number) => string;
  };

  needleLabel?: {
    show?: boolean;
    formatter?: (value: number) => string;
  };

  scale?: {
    minLabel?: string;
    maxLabel?: string;
  };

  ticks?: {
    show?: boolean;
    count?: number;
    position?: "inside" | "outside" | "cross";
    length?: number;
    labels?: boolean;
  };

  segments?: Array<{
    from: number;
    to: number;
    color: string;
  }>;

  thresholds?: Array<{
    value: number;
    color: string;
  }>;

  gradient?: {
    colors: string[];
  };

  animation?: {
    duration?: number;
    easing?: string;
  };

  tooltip?: {
    show?: boolean;
  };

  onClick?: () => void;
  onHover?: (isHover: boolean) => void;
  onValueChange?: (value: number) => void;

  classNames?: SlotClassNames<GaugeSlot>;
}

// Helper: convert degrees to radians
const deg2rad = (deg: number) => (deg * Math.PI) / 180;

// Default angles for semi-circle (left to right)
const DEFAULT_START_ANGLE = 180;
const DEFAULT_END_ANGLE = 0;

export function GaugeWidget({
  node,
  variable,
  value: valueOverride,
  title,
  variant = "progress",
  min = 0,
  max = 100,
  size,
  arc: arcProps = {},
  track: trackProps = {},
  fillMode = "progress",
  bars,
  needle: needleProps = {},
  valueLabel: valueLabelProps = {},
  needleLabel: needleLabelProps = {},
  scale: scaleProps = {},
  ticks: ticksProps = {},
  segments,
  thresholds,
  gradient,
  animation,
  tooltip,
  onClick,
  onHover,
  onValueChange,
  classNames = {},
  theme,
  className,
  width: initialWidth,
  height: initialHeight,
  minWidth,
  maxWidth,
}: GaugeWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ----- Data fetching (same as CardWidget) -----
  const [fetchedValue, setFetchedValue] = useState<number | null>(null);
  const [fetchedTimestamp, setFetchedTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!node) return;
    mountedRef.current = true;
    const fetchLatest = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await node.getLatestData(variable);
        if (!mountedRef.current) return;
        if (res.isSuccess && res.isDataAvailable) {
          setFetchedValue(res.data.value);
          setFetchedTimestamp(res.data.timestamp);
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
        }
      }
    };
    fetchLatest();
    return () => {
      mountedRef.current = false;
    };
  }, [node, variable]);

  // Resolve displayed value
  const value = valueOverride ?? fetchedValue;

  // ----- Dynamic overrides (like onDataChange in Card) -----
  const [dynamicProps, setDynamicProps] = useState<Partial<GaugeWidgetProps>>({});
  useEffect(() => {
    if (onValueChange) {
      onValueChange(value ?? 0);
    }
  }, [value, onValueChange]);

  // We can support an onDataChange like callback if desired; for now keep simple

  // Merge all props (original + dynamic)
  const resolvedProps = {
    ...({
      variant,
      min,
      max,
      arc: arcProps,
      track: trackProps,
      fillMode,
      bars,
      needle: needleProps,
      valueLabel: valueLabelProps,
      needleLabel: needleLabelProps,
      scale: scaleProps,
      ticks: ticksProps,
      segments,
      thresholds,
      gradient,
      animation,
      tooltip,
    } as GaugeWidgetProps),
    ...dynamicProps,
    classNames: {
      ...classNames,
      ...(dynamicProps.classNames ?? {}),
    },
  };

  // Resolve theme
  const resolvedTheme: WidgetTheme<GaugeSlot> =
    theme === "dark"
      ? gaugeThemes.dark
      : theme === "light"
        ? gaugeThemes.light
        : (theme as WidgetTheme<GaugeSlot>) ?? gaugeThemes.light;

  // Slot resolution (lowest to highest precedence)
  const resolveSlot = (slot: GaugeSlot) =>
    twMerge(
      GAUGE_DEFAULT_CLASSES[slot],
      resolvedTheme.classNames[slot],
      resolvedProps.classNames?.[slot],
    );

  // ----- Resize observer for dynamic SVG size -----
  const { ref: gaugeContainerRef, width: containerWidth, height: containerHeight } =
  useResizeObserver();

  // Combine refs: containerRef for our own use, resizeRef for observer
  const setContainerRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    (resizeRef as any)(node);
  };

  // Final dimensions (shorthand size overrides width/height)
  const effectiveWidth = size ?? initialWidth ?? containerWidth;
  const effectiveHeight = size ?? initialHeight ?? containerHeight;

  // ----- Arc configuration -----
  const startAngleDeg = arcProps.startAngle ?? DEFAULT_START_ANGLE;
  const endAngleDeg = arcProps.endAngle ?? DEFAULT_END_ANGLE;
  const thickness = arcProps.thickness ?? 12;
  const cornerRadius = arcProps.cornerRadius ?? 0;
  const gap = arcProps.gap ?? 2;

  // Convert to radians for D3
  const startAngleRad = deg2rad(startAngleDeg);
  const endAngleRad = deg2rad(endAngleDeg);

  // Compute angle for a given value
  const valueToAngle = (val: number) => {
    const clamped = Math.min(max, Math.max(min, val));
    const ratio = (clamped - min) / (max - min);
    return startAngleRad + ratio * (endAngleRad - startAngleRad);
  };

  // D3 arc generator
  const createArc = (innerRadius: number, outerRadius: number) =>
    d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startAngleRad)
      .endAngle(endAngleRad)
      .cornerRadius(cornerRadius);

  // ----- SVG drawing -----
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear previous render

    const w = effectiveWidth;
    const h = effectiveHeight;
    const cx = w / 2;
    const cy = h / 2;

    // Determine arc radii based on available space and thickness
    const maxRadius = Math.min(cx, cy) - 10; // padding
    const outerRadius = maxRadius;
    const innerRadius = outerRadius - thickness;

    // Helper to draw an arc (for track, bar, segments)
    const drawArc = (
      selection: d3.Selection<any, any, any, any>,
      startAngle: number,
      endAngle: number,
      innerR: number,
      outerR: number,
      className?: string,
    ) => {
      const arcGen = d3.arc()
        .innerRadius(innerR)
        .outerRadius(outerR)
        .startAngle(startAngle)
        .endAngle(endAngle)
        .cornerRadius(cornerRadius);
      selection.attr("d", arcGen as any);
      if (className) selection.attr("class", className);
    };

    // ----- Track -----
    if (trackProps.show !== false) {
      const trackArc = createArc(innerRadius, outerRadius);
      svg.append("path")
        .datum({ endAngle: endAngleRad })
        .attr("d", trackArc as any)
        .attr("class", resolveSlot("track"))
        .attr("fill", "none")
        .attr("stroke-width", thickness);
    }

    // ----- Determine bar fill color (from thresholds or single color) -----
    let barColorClass = ""; // we use Tailwind classes for dynamic color via CSS variables? We'll rely on the slot class.
    // For simplicity, we let the slot "bar" carry the default stroke color via CSS variable.
    // Segments and thresholds add their own inline styles if needed.
    // We'll apply colors directly via inline style when needed.

    // ----- Variant: progress bar (single arc) -----
    if (variant === "progress" || variant === "needle" || variant === "segmented") {
      const currentAngle = valueToAngle(value ?? min);
      const progressArc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngleRad)
        .endAngle(currentAngle)
        .cornerRadius(cornerRadius);

      // Handle segments
      if (segments && segments.length > 0) {
        // Draw segments as separate colored arcs spanning the full range
        segments.forEach((seg) => {
          const segStart = valueToAngle(seg.from);
          const segEnd = valueToAngle(seg.to);
          svg.append("path")
            .datum({ endAngle: segEnd })
            .attr("d", (d) => {
              const arc = d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius)
                .startAngle(segStart)
                .endAngle(d.endAngle)
                .cornerRadius(0);
              return arc(d);
            })
            .attr("fill", "none")
            .attr("stroke", seg.color)
            .attr("stroke-width", thickness)
            .attr("class", resolveSlot("segment"));
        });

        // If fillMode is progress, we overlay the bar only up to current value using a clip-path? 
        // We'll just draw the bar on top.
        if (fillMode === "progress") {
          svg.append("path")
            .attr("d", progressArc as any)
            .attr("fill", "none")
            .attr("stroke", "currentColor") // will be overridden by class
            .attr("stroke-width", thickness)
            .attr("class", resolveSlot("bar"));
        }
      } else {
        // Standard bar (no segments)
        // If thresholds exist, choose color based on current value
        let strokeColor = "";
        if (thresholds && thresholds.length > 0) {
          const threshold = [...thresholds]
            .sort((a, b) => a.value - b.value)
            .find(t => (value ?? min) <= t.value) ?? thresholds[thresholds.length - 1];
          strokeColor = threshold.color;
        }

        if (fillMode === "solid") {
          // Draw a full arc as the bar, with solid color
          const fullArc = createArc(innerRadius, outerRadius);
          svg.append("path")
            .datum({ endAngle: endAngleRad })
            .attr("d", fullArc as any)
            .attr("fill", "none")
            .attr("stroke", strokeColor || "currentColor")
            .attr("stroke-width", thickness)
            .attr("class", resolveSlot("bar"));
        } else {
          // Progress fill
          svg.append("path")
            .attr("d", progressArc as any)
            .attr("fill", "none")
            .attr("stroke", strokeColor || "currentColor")
            .attr("stroke-width", thickness)
            .attr("class", resolveSlot("bar"));
        }
      }
    }

    // ----- Variant: multiBar -----
    if (variant === "multiBar" && bars && bars.length > 0) {
      const totalThickness = thickness * bars.length + gap * (bars.length - 1);
      const startRadius = outerRadius - totalThickness + thickness;
      bars.forEach((bar, i) => {
        const barThickness = thickness; // shared
        const innerR = startRadius + i * (thickness + gap);
        const outerR = innerR + barThickness;
        const barAngle = valueToAngle(bar.value);
        const barArc = d3.arc()
          .innerRadius(innerR)
          .outerRadius(outerR)
          .startAngle(startAngleRad)
          .endAngle(barAngle)
          .cornerRadius(cornerRadius);

        svg.append("path")
          .attr("d", barArc as any)
          .attr("fill", "none")
          .attr("stroke", bar.color || "currentColor")
          .attr("stroke-width", barThickness)
          .attr("class", resolveSlot("bar"));
      });
    }

    // ----- Needle -----
    const needleShow = needleProps.show !== false && (variant === "needle" || variant === "segmented" || variant === "progress" ? needleProps.show : false);
    if (needleShow && value != null) {
      const needleAngle = valueToAngle(value);
      const needleLength = (() => {
        const len = needleProps.length ?? "medium";
        switch (len) {
          case "short": return outerRadius * 0.6;
          case "medium": return outerRadius * 0.8;
          case "full": return outerRadius * 1.05;
          default: return len;
        }
      })();
      const needleWidth = needleProps.width ?? 2;
      const capRadius = needleProps.capRadius ?? 4;
      const needleColor = needleProps.color ?? "currentColor";

      // Needle tip coordinates
      const tipX = cx + needleLength * Math.cos(needleAngle - Math.PI / 2);
      const tipY = cy + needleLength * Math.sin(needleAngle - Math.PI / 2);

      const needleGroup = svg.append("g").attr("class", resolveSlot("needle"));

      // Draw needle line (simple line)
      needleGroup.append("line")
        .attr("x1", cx)
        .attr("y1", cy)
        .attr("x2", tipX)
        .attr("y2", tipY)
        .attr("stroke", needleColor)
        .attr("stroke-width", needleWidth)
        .attr("stroke-linecap", "round");

      // Center cap
      needleGroup.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", capRadius)
        .attr("fill", needleColor);

      // Optional: animation (we'll keep simple for now)
    }

    // ----- Ticks -----
    if (ticksProps.show) {
      const tickCount = ticksProps.count ?? 5;
      const tickLength = ticksProps.length ?? 5;
      const tickPosition = ticksProps.position ?? "outside";
      const tickAngles = d3.range(tickCount).map(i => {
        const ratio = i / (tickCount - 1);
        return startAngleRad + ratio * (endAngleRad - startAngleRad);
      });

      tickAngles.forEach(angle => {
        const cos = Math.cos(angle - Math.PI / 2);
        const sin = Math.sin(angle - Math.PI / 2);
        let innerP, outerP;
        const baseR = (tickPosition === "inside") ? innerRadius : outerRadius;
        if (tickPosition === "inside") {
          innerP = { x: cx + (baseR - tickLength) * cos, y: cy + (baseR - tickLength) * sin };
          outerP = { x: cx + baseR * cos, y: cy + baseR * sin };
        } else if (tickPosition === "outside") {
          innerP = { x: cx + baseR * cos, y: cy + baseR * sin };
          outerP = { x: cx + (baseR + tickLength) * cos, y: cy + (baseR + tickLength) * sin };
        } else { // cross
          innerP = { x: cx + (baseR - tickLength / 2) * cos, y: cy + (baseR - tickLength / 2) * sin };
          outerP = { x: cx + (baseR + tickLength / 2) * cos, y: cy + (baseR + tickLength / 2) * sin };
        }
        svg.append("line")
          .attr("x1", innerP.x)
          .attr("y1", innerP.y)
          .attr("x2", outerP.x)
          .attr("y2", outerP.y)
          .attr("class", resolveSlot("tick"))
          .attr("stroke-width", 1);
      });

      if (ticksProps.labels) {
        const labelOffset = (ticksProps.position === "outside" ? 15 : -15);
        tickAngles.forEach((angle, i) => {
          const val = min + (i / (tickCount - 1)) * (max - min);
          const cos = Math.cos(angle - Math.PI / 2);
          const sin = Math.sin(angle - Math.PI / 2);
          const labelR = outerRadius + labelOffset;
          const x = cx + labelR * cos;
          const y = cy + labelR * sin;
          svg.append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("class", resolveSlot("tickLabel"))
            .text(Math.round(val).toString());
        });
      }
    }

    // ----- Scale labels (min/max) -----
    if (scaleProps.minLabel || scaleProps.maxLabel) {
      // Place labels at the start/end of the arc, outside
      const minAngle = startAngleRad;
      const maxAngle = endAngleRad;
      const labelDist = outerRadius + 20;
      const minX = cx + labelDist * Math.cos(minAngle - Math.PI / 2);
      const minY = cy + labelDist * Math.sin(minAngle - Math.PI / 2);
      const maxX = cx + labelDist * Math.cos(maxAngle - Math.PI / 2);
      const maxY = cy + labelDist * Math.sin(maxAngle - Math.PI / 2);

      if (scaleProps.minLabel) {
        svg.append("text")
          .attr("x", minX)
          .attr("y", minY)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("class", resolveSlot("tickLabel"))
          .text(scaleProps.minLabel);
      }
      if (scaleProps.maxLabel) {
        svg.append("text")
          .attr("x", maxX)
          .attr("y", maxY)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("class", resolveSlot("tickLabel"))
          .text(scaleProps.maxLabel);
      }
    }

  }, [
    value, variant, min, max, effectiveWidth, effectiveHeight,
    arcProps, trackProps, fillMode, bars, needleProps, segments,
    thresholds, gradient, ticksProps, scaleProps, resolveSlot
  ]);

  // ----- Center value text (HTML) -----
  const displayValue = useMemo(() => {
    if (value == null) return "—";
    if (valueLabelProps.formatter) return valueLabelProps.formatter(value);
    const prec = valueLabelProps.precision ?? 0;
    const num = value.toFixed(prec);
    return `${valueLabelProps.prefix ?? ""}${num}${valueLabelProps.suffix ?? ""}`;
  }, [value, valueLabelProps]);

  // ----- Needle label (HTML) -----
  const needleLabelText = useMemo(() => {
    if (!needleLabelProps.show || value == null) return null;
    if (needleLabelProps.formatter) return needleLabelProps.formatter(value);
    return `${value}`;
  }, [value, needleLabelProps]);

  // ----- Render -----
  return (
    <div
      ref={gaugeContainerRef}
      className={twMerge(
        "anedya-gauge",
        resolveSlot("container"),
        className,
      )}
      style={{
        width: effectiveWidth,
        height: effectiveHeight,
        minWidth,
        maxWidth,
        boxSizing: "border-box",
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {title && <span className={resolveSlot("title")}>{title}</span>}

      {loading ? (
        <div
          style={{
            height: 24,
            width: 24,
            borderRadius: "50%",
            border: "2px solid #cbd5e1",
            borderTopColor: "#475569",
            animation: "anedya-card-spin 0.8s linear infinite",
          }}
        >
          <style>{`@keyframes anedya-card-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <span className="text-red-600 text-sm">{error}</span>
      ) : (
        <>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
          />

          {/* Center value (HTML overlay) */}
          {valueLabelProps.show !== false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={resolveSlot("centerValue")}>
                {displayValue}
              </span>
              {needleLabelText && (
                <span className={resolveSlot("needleLabel")}>
                  {needleLabelText}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* Tooltip placeholder */}
      {tooltip?.show && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* D3 tooltip handling can be added later */}
        </div>
      )}
    </div>
  );
}