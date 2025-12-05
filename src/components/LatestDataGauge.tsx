
// GaugeWidget.tsx
import React, { useEffect, useRef, useMemo, useState } from "react";
import * as d3 from "d3";

import ReactDOM from "react-dom";

import Gauge from "../components/Gauge/Gauge";
import useGradient from "../components/Gauge/hooks/useGradient";
import { CSSProperties } from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { validateRequiredProps } from "../helpers/validate";

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
const defaultFontFamily = "Roboto, sans-serif";

interface GaugeArcStyle {
  trackColor?: string;
  progressColor?: string;
  progressStroke?: string;
  fontSize?: string | number;
  fontFamily?: string;
}

const defaultArcSx: GaugeArcStyle = {
  trackColor: "#e6e6e6",        // light background arc
  progressColor: "#4caf50",     // the “filled” arc part
  progressStroke: "none",
  fontSize: "20px",
  fontFamily: defaultFontFamily,
};
const defaultSubtitleSx: CSSProperties = {
  fontSize: "12px",
  color: "#666",
  fontFamily: defaultFontFamily,
};


/* ---------------------- Types ---------------------- */

export interface Zone {
  from: number; // inclusive
  to: number; // exclusive
  color: string;
}
type WidgetState = {
  value?: any;
  loading?: boolean;
  error?: string | null; // ✅ matches your React state
};

export interface GaugeStyleSet {
  container?: CSSProperties;
  label?: CSSProperties;
  value?: CSSProperties;
  unit?: CSSProperties;
subtitle?: CSSProperties;
  arc?: GaugeArcStyle;   
    fontFamily?: string; // optional global font family for all 3
}


type StylesInput =
  | GaugeStyleSet
  | ((state: WidgetState) => GaugeStyleSet);



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
  thickness?: number; // thickness of the arc (absolute px) — default: 0.2 * radius
  zones?: Zone[]; // colored zones, optional (defaults provided)
  showNeedle?: boolean; // draw a needle for the value
  needleColor?: string;
  needleWidth?: number;
  title?: string;
  subtitle?: string;
styles?: StylesInput;
  disabled?: boolean; //for pointer label
  tickCount?: number;
  unit?: string;
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
   onStyleChange?:(value:number) =>{};
     displayText?: DisplayTextFormatter;
}

type UnitPosition = "left" | "right" | "top" | "bottom";
type UnitStyle = "normal" | "subscript" | "superscript";


interface DisplayTextResult {
  text: string;
  unitText?: string;
  position?: UnitPosition;
  unitStyle?: UnitStyle;
}

type DisplayTextFormatter = (
  value: number,
  unit?: string
) => DisplayTextResult;


/* ---------------------- Defaults ---------------------- */

const defaultZones: Zone[] = [
  { from: 0, to: 40, color: "#4caf50" }, // green
  { from: 40, to: 60, color: "#ffeb3b" }, // yellow
  { from: 60, to: 100, color: "#f44336" }, // red
];

// --- Default styles ---
interface StyleSet {

  label?: CSSProperties;
  value?: CSSProperties;
  unit?: CSSProperties;
  fontFamily?: string; // optional global font family for all 3
}

const defaultContainerSx: any = {
     width: 400,
   height: 250,
   padding: 2,
   margin: 0,
   display: "flex",
   flexDirection: "column",
   justifyContent: "flex-start",
   alignItems: "center",
   borderRadius: 10,
   boxSizing: "border-box",
  background:  "rgb(248, 249, 250)",
      border: "1px solid rgba(211, 216, 220, 1)",
//'linear-gradient(to right, rgb(47, 99, 255), rgb(20, 110, 180))'
    fontFamily: defaultFontFamily,
    color:"#000000",
 overflowWrap: "break-word",
  label: { fontWeight: 500, color: "#000000", fontFamily: defaultFontFamily },
  value: { fontWeight: 700, color: "#000000", fontFamily: defaultFontFamily },
  unit: { fontWeight: 400, color: "#000000", fontFamily: defaultFontFamily },

    
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
  thickness, // optional
  zones = defaultZones,
  showNeedle = false,
  needleColor = "#111",
  needleWidth = 3,
  subtitle,
  styles = {},
  disabled = false,
  tickCount = 11,
  unit = "Units",
  uomOffset = -15,
  labelOffset = -7,
  onMetrics,
  valueText = ({ value: v, valueMin, valueMax }) =>
    v === undefined ? `-- / ${valueMax}` : `${v} / ${valueMax}`,
  onStyleChange,
    displayText,
}) => {

     validateRequiredProps(
      "LatestDataGauge",
      { client, nodeId, variable },
      ["client", "nodeId", "variable"]
    );
  

 
  const [value,setValue] = useState<any>(null)
   const [node, setNode] = useState<any>(null); // <-- store node in state
    const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     // Build a state object to pass into the callback styles
const widgetState = { value, loading, error };


// Resolve function or static style object
const [dynamicStyles, setDynamicStyles] = useState<Partial<GaugeStyleSet>>({});

const baseResolvedStyles =
  typeof styles === "function" ? styles(widgetState) : styles || {};

const resolvedStyles = {
  container: { ...baseResolvedStyles.container, ...dynamicStyles?.container },
  label: { ...baseResolvedStyles.label, ...dynamicStyles?.label },
  value: { ...baseResolvedStyles.value, ...dynamicStyles?.value },
  unit: { ...baseResolvedStyles.unit, ...dynamicStyles?.unit },
  fontFamily: dynamicStyles?.fontFamily ?? baseResolvedStyles.fontFamily,
   subtitle: { ...defaultSubtitleSx, ...baseResolvedStyles.subtitle, ...dynamicStyles.subtitle },
  arc: { ...defaultArcSx, ...baseResolvedStyles.arc, ...dynamicStyles.arc },

};
   // --- Preventing stale closures / infinite renders ---
   
     const isFetchingRef = useRef(false);
     const failureCountRef = useRef(0);
    const mountedRef = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // normalize style objects
  const containerSx = normalizeSx(resolvedStyles.container);
  const titleSx = normalizeSx(resolvedStyles.label);
  const valueTextSx = normalizeSx(resolvedStyles.value);
  const subtitleSx = normalizeSx(resolvedStyles.subtitle);
  const unitSx =  normalizeSx(resolvedStyles.unit);
  const arcSx = normalizeSx(resolvedStyles.arc);


    // --- Container dimensions with TypeScript-safe default ---
  const containerDefaults: any = defaultContainerSx!;
  const width = containerSx.width ?? containerDefaults.width;
  const height = containerSx.height ?? containerDefaults.height;

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
          //  setValue(null);
      } else {
        setValue(null);
         console.error("error fetching data:", res.error);
          setError(res.error.errorMessage);
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

    // Whenever value changes, allow user to modify styles dynamically
 useEffect(() => {
    if (typeof onStyleChange === "function") {
      const updated = onStyleChange(value);
      if (updated && typeof updated === "object") {
        setDynamicStyles(updated);
      }
    }
  }, [value]);
const formatted: DisplayTextResult = displayText
  ? displayText(Number(value), unit)
  : {
      text: String(value ?? ""),
      unitText: unit,
      position: "right",
      unitStyle: "normal",
    };





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
    resolvedStyles, // keep redraw when style shape changes
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

    // --- Scaled font sizes ---
  const baseFont = Math.min(Number(width), Number(height)) * 0.15;

  // --- Compute font sizes dynamically if not provided by user ---
  const labelFont = (resolvedStyles?.label as any)?.fontSize ?? baseFont * 0.6;

  const valueFont = (resolvedStyles?.value as any)?.fontSize ?? baseFont * 1.2;

  const unitFont = (resolvedStyles?.unit as any)?.fontSize ?? baseFont * 0.8;

  // overall container style (MUI Box)
  const mergedContainer = {
    ...defaultContainerSx,
    ...containerSx,
    width,
    height,
  
  };
  // --- Font family handling ---
  const globalFontFamily = resolvedStyles?.fontFamily ?? "Roboto";
  const labelFontFamily = defaultContainerSx.label?.fontFamily ?? globalFontFamily;
  const valueFontFamily = defaultContainerSx.value?.fontFamily ?? globalFontFamily;
  const unitFontFamily = defaultContainerSx.label?.fontFamily ?? globalFontFamily;
  

   const mergedLabelSx: CSSProperties = {
      ...defaultContainerSx.label,
      fontSize: labelFont,
      ...titleSx,
      fontFamily: labelFontFamily,
    };
    const mergedValueSx: CSSProperties = {
      ...defaultContainerSx.value,
      fontSize: valueFont,
      // color: textColor,
      ...valueTextSx,
      fontFamily: valueFontFamily,
    };
    const mergedUnitSx: CSSProperties = {
      ...defaultContainerSx.unit,
      fontSize: unitFont,
      ...unitSx,
      fontFamily: unitFontFamily,
    };
  

  return (
    
    <div style={{...mergedContainer}}>
      {title && (
        <h2 style={{
          ...mergedLabelSx
        }}>
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
          
       <div style={{
              fontSize: "25px",
    display: "flex",           // <-- required
    justifyContent: "center",
    alignItems: "center",
height:"100%",
paddingRight:"10px",
paddingLeft:"10px"
          }}
          >
            <div
            style={{
            background: "rgba(255, 0, 0, 0.15)",   // light transparent red
    border: "1px solid rgba(255, 0, 0, 0.6)", // softer red border
              boxShadow:'rgba(149, 157, 165, 0.2) 0px 8px 24px',
          
              color:"rgba(255, 0, 0, 0.6)",
              textAlign:"center",
              borderRadius:"5px",
              padding:"5px",
   
            }}
            >
{error}
            </div>

          </div>
    
   
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
        uom={unit}
        uomProps={{
          offsetText: uomOffset,
        }}
        labelProps={{
          offsetText: labelOffset,
        }}
        arcSegments={arcSegments}
        mergedValueSx={mergedValueSx}
        mergedUnitSx={mergedUnitSx}
        formatted={formatted}
      />
        ):  !value?
   

                <div style={{
              fontSize: "25px",
    display: "flex",           // <-- required
    justifyContent: "center",
    alignItems: "center",
height:"100%",
paddingRight:"10px",
paddingLeft:"10px"
          }}
          >
            <div
            style={{

    
          
        color:"#757575",
              textAlign:"center",
              borderRadius:"5px",
              padding:"5px",
   
            }}
            >
{     "No data available"}
            </div>

          </div>

         :<></>}
    
    </div>
  );
};

export default LatestDataGauge;
