// GaugeWidget.tsx
import React, { useEffect, useRef, useMemo, useState } from "react";
import * as d3 from "d3";

import ReactDOM from "react-dom";

import Gauge from "../components/Gauge/Gauge";
import useGradient from "../components/Gauge/hooks/useGradient";
import { CSSProperties } from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";

/**
 * Helper: Normalize SxProps to plain object (like in your other widgets)
 */
const normalizeSx = (
  sx: Record<string, any> | undefined
): Record<string, any> => {
  if (!sx) return {};
  if (Array.isArray(sx)) return Object.assign({}, ...sx);
  if (typeof sx === "function") return sx({}) as Record<string, any>;
  return sx as Record<string, any>;
};

/* ---------------------- Types ---------------------- */

export interface Zone {
  from: number; // inclusive
  to: number; // exclusive
  color: string;
}

export interface GaugeStyleSet {
  container?: CSSProperties;
  title?: CSSProperties;
  valueText?: CSSProperties;
  subtitle?: CSSProperties;
  arc?: CSSProperties;
}

export interface GaugeMetrics {
  maxRadius: number;
  valueAngleDeg: number;
  valueAngleRad: number;
  startAngleDeg: number;
  endAngleDeg: number;
  innerRadius: number;
  outerRadius: number;
  cx: number;
  cy: number;
}

export interface GaugeWidgetProps {
  client: any;
  nodeId: string;
  variable: string;
  min?: number; // default 0
  max?: number; // default 100
  startAngleDeg?: number; // degrees, default -90 (left) for semi-circle
  endAngleDeg?: number; // degrees, default 90 (right) for semi-circle
  width?: number; // overall width in px (default 400)
  height?: number; // overall height in px (default 250)
  thickness?: number; // thickness of the arc (absolute px) — default: 0.2 * radius
  zones?: Zone[]; // colored zones, optional (defaults provided)
  showNeedle?: boolean; // draw a needle for the value
  needleColor?: string;
  needleWidth?: number;
  title?: string;
  subtitle?: string;
  styles?: GaugeStyleSet;
  disabled?: boolean; //for pointer label
  tickCount?: number;
  uom?: string;
  uomOffset?: number;
  labelOffset?: number;
  // callback to receive computed values (optional)
  onMetrics?: (metrics: GaugeMetrics) => void;
  // function that returns the inner text (defaults to "value / max")
  valueText?: (opts: {
    value?: number;
    valueMin: number;
    valueMax: number;
  }) => string;
}

/* ---------------------- Defaults ---------------------- */

const defaultZones: Zone[] = [
  { from: 0, to: 40, color: "#4caf50" }, // green
  { from: 40, to: 60, color: "#ffeb3b" }, // yellow
  { from: 60, to: 100, color: "#f44336" }, // red
];
const defaultFontFamily = "Roboto, sans-serif";

const defaultContainerSx: CSSProperties = {
  width: 400,
  height: 250,
  borderRadius: 10,
  backgroundColor: "#f4f4f4",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 2,
    fontFamily: defaultFontFamily,
    color:"#ffffff"
};

// --- Circuit Breaker Config ---
const MAX_FAILURES = 3;

/* ---------------------- Component ---------------------- */

export const LatestDataGauge: React.FC<GaugeWidgetProps> = ({
 client,
  nodeId,
  variable,
  title = "Latest Data",
  min = 0,
  max = 100,
  startAngleDeg = -135, // semi-circle: -90 .. 90
  endAngleDeg = 135,
  width = 400,
  height = 250,
  thickness, // optional
  zones = defaultZones,
  showNeedle = false,
  needleColor = "#111",
  needleWidth = 3,
  subtitle,
  styles = {},
  disabled = false,
  tickCount = 11,
  uom = "Units",
  uomOffset = -15,
  labelOffset = -7,
  onMetrics,
  valueText = ({ value: v, valueMin, valueMax }) =>
    v === undefined ? `-- / ${valueMax}` : `${v} / ${valueMax}`,
}) => {
  const [value,setValue] = useState<any>(null)
   const [node, setNode] = useState<any>(null); // <-- store node in state
    const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

   // --- Preventing stale closures / infinite renders ---
   
     const isFetchingRef = useRef(false);
     const failureCountRef = useRef(0);
    const mountedRef = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // normalize style objects
  const containerSx = normalizeSx(styles.container);
  const titleSx = normalizeSx(styles.title);
  const valueTextSx = normalizeSx(styles.valueText);
  const subtitleSx = normalizeSx(styles.subtitle);
  const arcSx = normalizeSx(styles.arc);

  // convert degrees -> radians helper
  const deg2rad = (d: number) => (d * Math.PI) / 180;

  // clamp value into min..max safely
  const clamp = (v?: number) =>
    v === undefined ? undefined : Math.max(min, Math.min(max, v));

  // derived, memoized (fast)
  const metrics = useMemo(() => {
    const padding = 8; // keep inside svg
    const cx = width / 2;
    const cy = height / 2;
    // Available radius limited by width/height and padding
    const maxRadius = Math.min(width / 2, height / 2) - padding;
    // default thickness if not provided: 20% of radius
    const outerRadius = maxRadius;
    const innerRadius = Math.max(
      6,
      outerRadius - (thickness ?? Math.round(outerRadius * 0.2))
    );
    // compute value angle
    const startRad = deg2rad(startAngleDeg);
    const endRad = deg2rad(endAngleDeg);
    // clamped value fraction
    const effectiveValue = value === undefined ? undefined : clamp(value);
    const frac =
      effectiveValue === undefined ? 0 : (effectiveValue - min) / (max - min);
    const valueAngleRad = startRad + frac * (endRad - startRad);
    const valueAngleDeg = (valueAngleRad * 180) / Math.PI;
    return {
      maxRadius,
      valueAngleDeg,
      valueAngleRad,
      startAngleDeg,
      endAngleDeg,
      innerRadius,
      outerRadius,
      cx,
      cy,
    } as GaugeMetrics;
  }, [value, min, max, startAngleDeg, endAngleDeg, width, height, thickness]);

  useEffect(() => {
  if (client && nodeId) {
    const anedya = (client as any)._anedya as Anedya; // retrieve wrapped instance
    const createdNode = anedya.NewNode(client, nodeId);
    setNode(createdNode);
  }
}, [client, nodeId]);


// --- Fetch data once safely ---
  useEffect(() => {


       mountedRef.current = true;
         if (!node) return;
      const fetchData= async()=> {
  
     if ( isFetchingRef.current|| failureCountRef.current >= MAX_FAILURES){

      //rate limiter ----> in client 
      console.log("!node:",node)
      console.log("isFetchingRef.current:",isFetchingRef.current)
      console.log("failureCountRef.current:",failureCountRef.current)
      return
     }; // don't try if node not ready or if an api call is being currently made already
    
     isFetchingRef.current = true;
    try {
      setLoading(true);
      setError(null);
      const res = await node.getLatestData(variable);

      if (!mountedRef.current) return; // <-- SAFE, stops state update if unmounted

      if (res.isSuccess && res.isDataAvailable) {
        setValue(res.data?.value);
        setError("");
      } else {
        setValue(null);
        setError("No data available");
      }
       failureCountRef.current = 0; // reset on success
    } catch (err: any) {
  if (!mountedRef.current) return;
  console.error("Error fetching latest data:", err);
      setValue(null);
      setError(err?.message ?? "Failed to fetch data");
         failureCountRef.current += 1;
    
    } finally {
        if (!mountedRef.current) return;
    setLoading(false);
    isFetchingRef.current = false;
    }
  }
    fetchData();

    return () => {
      mountedRef.current = false;
    };
    
  }, [node, variable]);



  // call metrics callback if provided
  useEffect(() => {
    if (onMetrics) onMetrics(metrics);
  }, [metrics, onMetrics]);

  // D3 draw/cleanup
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // clear previous
    d3.select(svg).selectAll("*").remove();

    const svgSel = d3.select(svg);

    const {
      cx,
      cy,
      outerRadius,
      innerRadius,
      valueAngleRad,
      startAngleDeg: sDeg,
      endAngleDeg: eDeg,
    } = metrics;

    // group container for translation and layering
    const g = svgSel.append("g").attr("transform", `translate(${cx}, ${cy})`); // center at 0,0 inside group

    // background track -> single full track from startAngle to endAngle (light gray)
    const startRad = deg2rad(sDeg);
    const endRad = deg2rad(eDeg);
    const fullArc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(startRad)
      .endAngle(endRad);

    const fullArcPathD = (fullArc as any)(undefined);
    g.append("path")
      .attr("d", fullArcPathD ?? "")
      .attr("fill", arcSx.trackColor ?? "#e6e6e6")
      .attr("stroke", "none");

    // draw zones as arcs - zones may exceed min/max so map zone percentages to angles
    // zones are in value units; convert zone from/to -> angles
    const totalAngleSpanRad = deg2rad(eDeg - sDeg);

    const valueToAngleRad = (v: number) => {
      const frac = (v - min) / (max - min);
      return startRad + frac * totalAngleSpanRad;
    };

    // sanitize zones: sort and clamp to [min, max]
    const safeZones = (zones ?? [])
      .map((z) => ({
        from: Math.max(z.from, min),
        to: Math.min(z.to, max),
        color: z.color,
      }))
      .filter((z) => z.to > z.from)
      .sort((a, b) => a.from - b.from);

    safeZones.forEach((z, idx) => {
      const zStart = valueToAngleRad(z.from);
      const zEnd = valueToAngleRad(z.to);
      const arcFn = d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(zStart)
        .endAngle(zEnd);

      const pathD = (arcFn as any)(undefined);
      g.append("path")
        .attr("d", pathD ?? "")
        .attr("fill", z.color)
        .attr("stroke", "none")
        .attr("opacity", 1);
    });

    // Draw progress arc from startRad to valueAngleRad (if value defined)
    if (value !== undefined) {
      // don't draw if value outside range? we clamp earlier to min..max
      const progArc = d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startRad)
        .endAngle(valueAngleRad);

      const progArcPathD = (progArc as any)(undefined);
      g.append("path")
        .attr("d", progArcPathD ?? "")
        .attr("fill", arcSx.progressColor ?? "rgba(255,255,255,0.15)")
        .attr("stroke", arcSx.progressStroke ?? "#00000000");
    }

    // optional needle - pointy line from center to outer radius at valueAngleRad
    if (showNeedle && value !== undefined) {
      const needleLen =
        (innerRadius + outerRadius) / 2 + (outerRadius - innerRadius) * 0.15;
      const needleG = g.append("g").attr("class", "needle");

      // create triangular needle or line
      const needleLine = d3.line<number[]>();
      const nx = Math.cos(valueAngleRad - Math.PI / 2) * needleLen;
      const ny = Math.sin(valueAngleRad - Math.PI / 2) * needleLen;
      // Slight rotation because group center at 0,0 and d3 arc angles use 0 at 12 o'clock
      // We'll produce a simple line
      needleG
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", nx)
        .attr("y2", ny)
        .attr("stroke", needleColor)
        .attr("stroke-width", needleWidth)
        .attr("stroke-linecap", "round");

      // small center cap
      needleG
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", Math.max(3, Math.min(6, (outerRadius - innerRadius) * 0.25)))
        .attr("fill", needleColor);
    }

    // center value text
    const valueString = valueText({ value, valueMin: min, valueMax: max });

    const valueGroup = g.append("g").attr("class", "value-group");

    valueGroup
      .append("text")
      .attr("class", "gauge-value-text")
      .attr("text-anchor", "middle")
      .attr("y", -((innerRadius + outerRadius) / 2) * 0.05) // slightly upward
      .style(
        "font-size",
        (arcSx.fontSize ?? `${Math.round(innerRadius * 0.45)}px`) as string
      )
      .style("font-family", arcSx.fontFamily ?? "Roboto, Arial, sans-serif")
      .style("fill", (valueTextSx.color as any) ?? "#111")
      .text(valueString);

    // optional subtitle below
    if (subtitle) {
      valueGroup
        .append("text")
        .attr("class", "gauge-subtitle-text")
        .attr("text-anchor", "middle")
        .attr("y", (outerRadius - innerRadius) * 0.6 + 14)
        .style("font-size", (subtitleSx.fontSize ?? "12px") as string)
        .style("fill", subtitleSx.color ?? "#666")
        .text(subtitle);
    }

    // cleanup on unmount
    return () => {
      d3.select(svg).selectAll("*").remove();
    };
  }, [
    metrics,
    zones,
    value,
    min,
    max,
    showNeedle,
    needleColor,
    needleWidth,
    valueText,
    styles, // keep redraw when style shape changes
  ]);

  /** Red gradient props for arcSegments */
  const redFade = useGradient(
    "rgba(255,0,0,0)",
    "rgba(255,0,0,1)",
    "redFade-randomkey"
  );

  /** Renders coloured arcs to demarcate target ranges. */
  const arcSegments = [
    // {min: 0, max:1, color: "#148382"}
    { min: 0, max: 0.5, color: "rgb(181,230,29)" },
    { min: 0.5, max: 1, color: "orange" },
    {
      min: 0.75,
      max: 1,
      ...redFade,
    },
  ];
  // overall container style (MUI Box)
  const mergedContainer = {
    ...defaultContainerSx,
    ...containerSx,
    width,
    height,
  };

  return (
    <div style={mergedContainer}>
      {title && (
        <h2 style={{ ...((styles.title as any) ?? {}), ...titleSx }}>
          {title}
        </h2>
      )}
   {loading ? (
            <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        className="spinner"
        style={{
          width: Math.min(Number(width), Number(height)) * 0.3,
          height: Math.min(Number(width), Number(height)) * 0.3,
        }}
      ></div>
       </div>
        ) : error ? (
          
       "Error fetching latest data"
    
   
        ) : value ? (
          <Gauge
        height={400}
        width={400}
        min={0}
        max={100}
        value={value}
        maxAngle={endAngleDeg}
        minAngle={startAngleDeg}
        disabled={disabled}
        pointerLabel={disabled ? "Disabled" : value + ""}
        tickCount={Number(tickCount)}
        uom={uom}
        uomProps={{
          offsetText: uomOffset,
        }}
        labelProps={{
          offsetText: labelOffset,
        }}
        arcSegments={arcSegments}
      />
        ): "--"}
    
    </div>
  );
};

export default LatestDataGauge;
