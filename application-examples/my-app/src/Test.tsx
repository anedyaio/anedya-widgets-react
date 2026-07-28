// import React from "react";
// import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
// import { CardWidget } from "../../../src";
// import { GaugeWidget } from "../../../src/components/GaugeChart/GaugeChartWidget";
// import "../../../dist/styles.css";

// import { relativeTime } from "../../../src/helpers/formatters";
// const tokenId = "sdaIC9xpHKdPQpWXPtOlG1Pl";
// const token =
//   "eMYc82DiKX2oO9TgXylCCeyugok8MDOY65XMTRDLdsh2ENHOi0Tyv3RmfCuLQ6kb";
// const nodeId = "019e8d46-e895-713f-b763-6969b36e37a4";

// const anedya = new Anedya();
// const config = anedya.newConfig(tokenId, token);
// const client = anedya.newClient(config);
// const node = anedya.newNode(client, nodeId);

// /**
//  * A reusable theme, shareable across every CardWidget instance in your
//  * app. Only specify the slots you actually want to change from the
//  * built-in default — anything omitted falls back to lightTheme/darkTheme.
//  */
// const emeraldTheme = {
//   classNames: {
//     container: "bg-emerald-50 border-emerald-200",
//     title: "text-emerald-700",
//     value: "text-emerald-900",
//     label: "text-emerald-500",
//   },
// };


// const commonProps = { node, variable: "humidity" };

// export default function App() {
//   return (
    
//     <div
//       style={{ padding: "2rem", display: "flex", gap: 24, flexWrap: "wrap" }}
//     >

// <CardWidget {...commonProps}title="Default" unit="%" decimalPlaces={1}
//       labelText={(ts) => `Last synced ${relativeTime(ts)}`}
    
//        />


//       {/* ============================================================
//        * 2. theme — a reusable, shareable WidgetTheme object. Same
//        * effect across every widget instance that uses it.
//        * ============================================================ */}
//       <CardWidget {...commonProps} title="Emerald Theme" unit="%" decimalPlaces={1} theme={emeraldTheme} />

//       {/* Built-in preset names also work directly: */}
//       <CardWidget {...commonProps} title="Dark Preset" unit="%" decimalPlaces={1} theme="dark" />

//       {/* ============================================================
//        * 3. styles vs className — THE distinction to understand:
//        *
//        *   - `styles` (plural, an OBJECT): per-SLOT overrides.
//        *     Keys are "container" | "title" | "value" | "unit" | "label"
//        *     — lets you reach INSIDE the widget and style individual
//        *     pieces independently.
//        *
//        *   - `className` (singular, a STRING): the ordinary React
//        *     convention — one class applied ONLY to the widget's
//        *     outermost container element, same as you'd pass to any
//        *     other component. It's merged (via twMerge) with whatever
//        *     styles.container already resolved to, not a
//        *     replacement for it.
//        *
//        * This example uses BOTH at once so the difference is visible:
//        * className adds a shadow to the outer box, styles.value/
//        * styles.title style two INNER pieces independently.
//        * ============================================================ */}
//       <CardWidget
//         {...commonProps}
//         title="styles vs className"
//         unit="%"
//         decimalPlaces={1}
//         className="shadow-lg shadow-amber-400" // <- outer box only, ordinary React convention
//         styles={{
//           value: "text-red-500 text-5xl", // <- targets the INNER "value" slot specifically
//           title: "uppercase tracking-wider text-yellow-500", // <- targets the INNER "title" slot specifically
//         }}
        
//       />

//       {/* ============================================================
//        * 4. Plain CSS classes — styles works with ANY class source,
//        * not just Tailwind. These reference plain hand-written CSS
//        * classes (e.g. defined in a .css file this app already imports).
//        * ============================================================ */}
//       {/* <CardWidget
//         {...commonProps}
//         title="Plain CSS Classes"
//         unit="%"
//         decimalPlaces={1}
//         styles={{ container: "my-card", value: "my-card-value" }}
//       /> */}

//       {/* ============================================================
//        * 5. Native Tailwind responsive prefixes — `sm:`/`md:`/`lg:`
//        * work exactly as they do anywhere else in your app, because
//        * styles just forwards whatever string you write straight
//        * to `className`. This widget does NOT have its own custom
//        * breakpoint system — these prefixes are compiled by YOUR
//        * project's Tailwind config and respond to the BROWSER VIEWPORT,
//        * same as native Tailwind everywhere else. If your own
//        * tailwind.config.js customizes `theme.screens`, these prefixes
//        * automatically follow that customization too — nothing to
//        * configure on the widget's side.
//        * ============================================================ */}
//       {/* <CardWidget
//         {...commonProps}
//         title="Responsive Text"
//         unit="%"
//         decimalPlaces={1}
//         styles={{ value: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl" }}
//       /> */}

//       {/* ============================================================
//        * 6. formatValue / labelText — simple formatting hooks, distinct
//        * from styling. formatValue controls the displayed number's
//        * text; labelText controls the caption under it.
//        * ============================================================ */}
//       {/* <CardWidget
//         {...commonProps}
//         title="Custom Formatting"
//         formatValue={(v) => `${v.toFixed(2)} % RH`}
//         labelText={(ts) => `As of ${new Date(ts).toLocaleDateString()}`}
       
//       /> */}

//       {/* ============================================================
//        * 7. onStyleChange — conditional class overrides driven by the
//        * RAW fetched data ({ value, timestamp }), always applied on top
//        * of everything else (theme, styles, className).
//        * ============================================================ */}
//       {/* <CardWidget
//         {...commonProps}
//         title="Threshold Coloring"
//         unit="%"
//         decimalPlaces={1}

//        onDataChange={(data) => {
//     if (!data) return;

//     if (data.value > 80) {
//       return {
//         title: "High Humidity",
//         theme: "dark",
//         styles: {
//           value: "text-red-500"
//         }
//       };
//     }

//     return {
//       title: "Humidity",
//       theme: "light"
//     };
//   }}
  
//       /> */}

//       {/* ============================================================
//        * 8. Sizing — width/height/minWidth/maxWidth are plain props,
//        * applied as inline styles on the container, independent of the
//        * whole styles/theme system.
//        * ============================================================ */}
//       {/* <CardWidget {...commonProps} title="Custom Size" unit="%" width={320} minWidth={280} maxWidth={400} height={200} /> */}
    

//       {/* <GaugeWidget
//         {...commonProps}
//         // label="Gauge Chart"
//         // min={0}
//         // max={100}
//         // size={400}
//         // value={99}
//         // width={400}
//         // height={400}
//         // valueLabel={{ precision: 1 }}
//         // arc={{
//         //   startAngle: -90,
//         //   endAngle: 90,
//         //   // radius: not working proper
//         //   thickness: 70,
//         //   // cornerRadius:100
//         // }}
//         track={{
//           show: true,
//           color: "",
//         }}
//         fillMode="progress"
//         // color={["red","orange", "yellow", "green"]}
//         color="#1fa2ff"
//         needle={{
//           show: true,
//           type: "line",
//           length: "medium",
//           width: 3,
//           color: "white",
//           capRadius: 7,
//         }}
//         // needleLabel={{
//         //   show: true,
//         //   formatter: () => {
//         //     "Hello";
//         //   },
//         // }}
//         // labels={{
//         //   show: true,
//         //   position: "outside",
//         // }}
//         // scale={{
//         //   minLabel: "Hello",
//         //   maxLabel: "World",
//         // }}
//         // ticks={{
//         //   show: true,
//         //   count: 10,
//         //   position: "outside",
//         //   length: 10,
//         //   labels: true,
//         // }}
//         animation={{
//           duration: 4000,
//           easing: "easeElasticOut", // easeCubicOut, easeElasticOut
//         }}
//         // tooltip={{
//         //   show:false,
//         // }}
//         // classNames={{
//         //   title: "text-white",
//         //   tickLabel: "text-white text-lg",
//         //   label: "text-red",
//         //   value: "text-white",
//         // }}
//         theme="dark"
//       /> */}

//       <GaugeWidget
//         {...commonProps}
//         // color="#1fa2ff"
//         // color={["#9796f0", "#fbc7d4"]}
//         // color={["#799F0C", "#FFE000"]}
//         color={["#A5FECB", "#20BDFF", "#5433FF"]}
//         title="Gauge Chart Widget"
//         // value={40}
//         // labelText={"Hello"}
//         // valueLabel={"Hello"}
//         arc={{
//           // radius:400,
//           // cornerRadius:10,
//           thickness: 80,
//         }}
//         animation={{
//           duration: 4000,
//           easing: "easeElasticOut", // easeCubicOut, easeElasticOut
//         }}
//         needle={{
//           color: "white",
//           length: "short",
//           type: "triangle",
//           animation: true,
//         }}
//         theme="dark"
//         styles={{
//           container: "",
//           title: "text-black text-[90px]",
//         }}
//       />

//       <GaugeWidget
//         title="Battery Level"
//         value={65}
//         unit="%"
//         min={0}
//         max={100}
//         className="w-64 mx-auto"
//         theme="dark"
//       />

//       <GaugeWidget
//         title="CPU Usage"
//         value={78}
//         unit="%"
//         theme="dark"
//         // 'style' affects ONLY the outer wrapper <div>
//         style={{
//           backgroundColor: "#1e1e2f",
//           borderRadius: "16px",
//           padding: "10px",
//         }}
//         // 'styles' affects specific internal SVG/HTML slots via Tailwind classes
//         styles={{
//           container: "border border-gray-700", // merges with outer wrapper
//           title: "text-purple-400 text-xs uppercase tracking-wider",
//           value: "text-white text-2xl font-mono",
//           unit: "text-gray-400 text-sm",
//           label: "text-gray-500 text-[10px]",
//           bar: "fill-gradient-to-r from-purple-500 to-pink-500", // if using Tailwind gradients
//           needle: "stroke-pink-400 stroke-2",
//           needleCap: "fill-pink-400",
//         }}
//       />

//       <GaugeWidget
//         value={85}
//         theme="dark" // Applies gaugeDarkTheme internally
//         // 1. style: Sets fixed size and injects CSS variables for text scaling
//         style={{
//           width: "400px",
//           height: "400px",
//           padding: 0,
//         }}
//         // 2. styles: Override internal slot classes
//         styles={{
//           container: "bg-gray-900 rounded-2xl border border-red-700", // Merged with dark theme's container
//           bar: "text-emerald-400", // Overrides dark theme's "text-indigo-400"
//           needle: "text-yellow-500",
//           needleCap: "red", // Makes the needle yellow
//           value: "text-emerald-50", // Overrides dark theme's "text-white"
//           label: "text-gray-400", // Overrides dark theme's "text-slate-500"
//         }}
//       />

//       <GaugeWidget
//         value={75}
//         needle={{
//           type: "triangle", // 'drop' or 'triangle' use fill
//         }}
//         styles={{
//           bar: "text-red-500",
//           track: "text-yellow-300",
//           needle: "text-green-600",
//           needleCap: "text-green-600",
//         }}
//       />

//       <GaugeWidget
//         responsive={true} // ensure it reacts to container
//         aspectRatio={1.6}
//         value={34}
//         valueLabel={{
//           show: true,
//         }}
//         // make it wider than tall, reducing overall height
//         // OR set fixed size:
//         size={300}
//         styles={{
//           container: "bg-gray-900 rounded-2xl border border-red-700",
//         }}
//       />

//       {/* // 1. Show a custom static text */}
//       <GaugeWidget
//         value={78}
//         labelText={() => "Last reading"} // Always shows "Last reading"
//       />

//       {/* // 2. Format the timestamp exactly how you want */}
//       <GaugeWidget
//         value={78}
//         labelText={(timestamp) =>
//           `Updated at ${new Date(timestamp).toLocaleString("en-US", {
//             hour: "2-digit",
//             minute: "2-digit",
//             second: "2-digit",
//           })}`
//         }
//         // Output: "Updated at 02:30:45 PM"
//       />

//       {/* // 3. Show relative time with custom wording */}
//       <GaugeWidget
//         value={78}
//         labelText={(timestamp) => {
//           const diff = Math.floor((Date.now() - timestamp) / 60000);
//           if (diff < 1) return "Just now";
//           if (diff < 60) return `${diff} min ago`;
//           return `${Math.floor(diff / 60)} hours ago`;
//         }}
//       />

//       {/* // 4. Hide the label entirely (return null or empty string) */}
//       <GaugeWidget
//         value={78}
//         labelText={() => null} // No label shown
//       />
//     </div>
//   );
// }

{
  /* 
//create react app
//link public-widget-sdk
//npm run dev
//send this file tp yash to copy paste  */
}



// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import * as d3 from "d3";
// import { twMerge } from "tailwind-merge";
// import { AnedyaWidgetBaseProps } from "../../common";
// import { SlotClassNames, WidgetTheme } from "../../types/root";
// import {
//   GaugeAnimationConfig,
//   GaugeArcConfig,
//   GaugeBarSpec,
//   GaugeColor,
//   GaugeLabelsConfig,
//   GaugeNeedleConfig,
//   GaugeNeedleLabelConfig,
//   GaugeScaleConfig,
//   GaugeSegment,
//   GaugeSlot,
//   GaugeThreshold,
//   GaugeTicksConfig,
//   GaugeTooltipConfig,
//   GaugeTrackConfig,
//   GaugeValueLabelConfig,
//   GaugeVariant,
// } from "../../types/gauge";
// import {
//   DEFAULT_GAUGE_THEME,
//   GAUGE_DEFAULT_CLASSES,
//   gaugeDarkTheme,
//   gaugeLightTheme,
// } from "../../themes/gaugeTheme";
// import { useResizeObserver } from "../../hooks/useResizeObserver";

// export interface GaugeWidgetProps extends AnedyaWidgetBaseProps {
//   variant?: GaugeVariant;
//   /** Used before live data arrives, or standalone in dummy-data mode. */
//   value?: number;
//   min?: number;
//   max?: number;
//   size?: number;
//   responsive?: boolean;

//   arc?: GaugeArcConfig;
//   track?: GaugeTrackConfig;
//   fillMode?: "progress" | "solid";
//   /** Single-bar fill color (progress/needle/segmented variants). Pass an array of 2+ colors for a gradient. */
//   color?: GaugeColor;
//   bars?: GaugeBarSpec[];

//   needle?: GaugeNeedleConfig;
//   labels?: GaugeLabelsConfig;
//   valueLabel?: GaugeValueLabelConfig;
//   needleLabel?: GaugeNeedleLabelConfig;
//   scale?: GaugeScaleConfig;
//   ticks?: GaugeTicksConfig;
//   segments?: GaugeSegment[];
//   thresholds?: GaugeThreshold[];
//   animation?: GaugeAnimationConfig;
//   tooltip?: GaugeTooltipConfig;

//   classNames?: SlotClassNames<GaugeSlot>;
//   style?: React.CSSProperties;

//   onClick?: (value: number) => void;
//   onHover?: (value: number | null) => void;
//   onValueChange?: (value: number) => void;
// }

// const DEG2RAD = Math.PI / 180;

// const DEFAULT_ARC: Required<Omit<GaugeArcConfig, "radius" | "thickness">> = {
//   startAngle: -90,
//   endAngle: 90,
//   cornerRadius: 0,
//   gap: 6,
// };

// const DEFAULT_ANIMATION: Required<GaugeAnimationConfig> = {
//   duration: 750,
//   easing: "easeCubicOut",
// };

// function resolveEase(name: string) {
//   return (d3 as any)[name] ?? d3.easeCubicOut;
// }

// function needlePixelLength(
//   length: GaugeNeedleConfig["length"],
//   radius: number
// ) {
//   if (typeof length === "number") return length;
//   switch (length) {
//     case "short":
//       return radius * 0.55;
//     case "full":
//       return radius * 0.95;
//     case "medium":
//     default:
//       return radius * 0.75;
//   }
// }

// /** Builds a needle shape as an SVG path/element string, pointing "up" (-y) from the origin. */
// function needleShape(
//   type: NonNullable<GaugeNeedleConfig["type"]>,
//   length: number,
//   width: number
// ) {
//   const w = width;
//   switch (type) {
//     case "line":
//       return {
//         tag: "line",
//         attrs: {
//           x1: 0,
//           y1: 0,
//           x2: 0,
//           y2: -length,
//           strokeWidth: w,
//           strokeLinecap: "butt",
//         },
//       };
//     case "rounded":
//       return {
//         tag: "line",
//         attrs: {
//           x1: 0,
//           y1: 0,
//           x2: 0,
//           y2: -length,
//           strokeWidth: w,
//           strokeLinecap: "round",
//         },
//       };
//     case "triangle": {
//       const half = w / 2;
//       return {
//         tag: "polygon",
//         attrs: {
//           points: `0,0 ${-half},${-length * 0.15} 0,${-length} ${half},${
//             -length * 0.15
//           }`,
//         },
//       };
//     }
//     case "drop":
//     default: {
//       const half = w / 2;
//       // Teardrop: rounded base, sharp tip.
//       const d = `M ${-half} 0
//                  C ${-half} ${-length * 0.35}, ${-w} ${
//         -length * 0.7
//       }, 0 ${-length}
//                  C ${w} ${-length * 0.7}, ${half} ${-length * 0.35}, ${half} 0
//                  A ${half} ${half} 0 1 1 ${-half} 0 Z`;
//       return { tag: "path", attrs: { d } };
//     }
//   }
// }

// function isGradientColor(c?: GaugeColor): c is string[] {
//   return Array.isArray(c) && c.length >= 2;
// }

// /** Ensures a <linearGradient> with the given id/colors exists in <defs> and returns its url() reference. Reuses the def if colors are unchanged. */
// function resolveFill(
//   defs: d3.Selection<SVGDefsElement, unknown, null, undefined>,
//   id: string,
//   color: GaugeColor | undefined,
//   fallback: string
// ): string {
//   if (!color) return fallback;
//   if (!isGradientColor(color)) return color;

//   let grad = defs.select<SVGLinearGradientElement>(`#${id}`);
//   if (grad.empty()) {
//     grad = defs.append("linearGradient").attr("id", id);
//   }
//   grad.attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");
//   grad.selectAll("stop").remove();
//   color.forEach((c, i) =>
//     grad
//       .append("stop")
//       .attr("offset", `${(i / (color.length - 1)) * 100}%`)
//       .attr("stop-color", c)
//   );
//   return `url(#${id})`;
// }

// /** Normalized (r=1) bounding box of an arc sweep, for any start/end angle — handles semicircle, 270°, full circle, custom. */
// function getArcBounds(startDeg: number, endDeg: number) {
//   const lo = Math.min(startDeg, endDeg);
//   const hi = Math.max(startDeg, endDeg);
//   const angles = [startDeg, endDeg];
//   for (let k = Math.ceil(lo / 90) * 90; k <= hi; k += 90) angles.push(k);

//   let minX = Infinity,
//     maxX = -Infinity,
//     minY = Infinity,
//     maxY = -Infinity;
//   angles.forEach((deg) => {
//     const a = deg * DEG2RAD;
//     const x = Math.sin(a);
//     const y = -Math.cos(a);
//     minX = Math.min(minX, x);
//     maxX = Math.max(maxX, x);
//     minY = Math.min(minY, y);
//     maxY = Math.max(maxY, y);
//   });
//   return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
// }

// export function GaugeWidget({
//   node,
//   variable,
//   title,
//   theme,
//   className,
//   style,
//   width,
//   height,
//   minWidth = 160,
//   maxWidth = 480,
//   minHeight = 160,
//   maxHeight = 480,
//   aspectRatio,

//   variant = "progress",
//   value: valueProp,
//   min = 0,
//   max = 100,
//   size,
//   responsive = true,

//   arc,
//   track,
//   fillMode = "progress",
//   color,
//   bars,

//   needle,
//   labels,
//   valueLabel,
//   needleLabel,
//   scale,
//   ticks,
//   segments,
//   thresholds,
//   animation,
//   tooltip,

//   classNames = {},
//   onClick,
//   onHover,
//   onValueChange,
// }: GaugeWidgetProps) {
//   const svgRef = useRef<SVGSVGElement>(null);
//   const tooltipRef = useRef<HTMLDivElement>(null);
//   const prevValueRef = useRef<number>(min);

//   const [fetchedValue, setFetchedValue] = useState<number | null>(null);
//   const [hoverValue, setHoverValue] = useState<number | null>(null);

//   // ---- Live data fetch (mirrors CardWidget) ----
//   useEffect(() => {
//     if (!node) return;
//     let mounted = true;

//     node
//       .getLatestData(variable)
//       .then((res: any) => {
//         if (!mounted) return;
//         if (res?.isSuccess && res?.isDataAvailable) {
//           setFetchedValue(res.data.value);
//         }
//       })
//       .catch(() => {
//         /* fall back to `value` prop / dummy data silently */
//       });

//     return () => {
//       mounted = false;
//     };
//   }, [node, variable]);

//   const rawValue = fetchedValue ?? valueProp ?? min;
//   const clampedValue = Math.min(max, Math.max(min, rawValue));

//   useEffect(() => {
//     onValueChange?.(clampedValue);
//   }, [clampedValue]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ---- Responsive sizing ----
//   const { ref: wrapperRef, size: dims } = useResizeObserver<HTMLDivElement>(
//     responsive && size == null
//   );

//   // ---- Resolved config (defaults per variant) ----
//   const resolvedArc = { ...DEFAULT_ARC, ...arc };

//   const resolvedTrack: Required<GaugeTrackConfig> = {
//     show: track?.show ?? true,
//     color: track?.color ?? "",
//   };

//   const needleShownByDefault = variant === "progress" || variant === "needle";

//   const resolvedNeedle: Required<Omit<GaugeNeedleConfig, "length">> & {
//     length: NonNullable<GaugeNeedleConfig["length"]>;
//   } = {
//     show: needle?.show ?? needleShownByDefault,
//     type: needle?.type ?? "rounded",
//     length: needle?.length ?? "medium",
//     width: needle?.width ?? 4,
//     color: needle?.color ?? "",
//     capRadius: needle?.capRadius ?? 6,
//     animation: needle?.animation ?? true,
//   };

//   const resolvedLabels: Required<GaugeLabelsConfig> = {
//     show: labels?.show ?? true,
//     position: labels?.position ?? "outside",
//   };

//   const resolvedValueLabel: Required<
//     Omit<GaugeValueLabelConfig, "formatter">
//   > & { formatter?: (v: number) => string } = {
//     show: valueLabel?.show ?? true,
//     precision: valueLabel?.precision ?? 0,
//     prefix: valueLabel?.prefix ?? "",
//     suffix: valueLabel?.suffix ?? "",
//     formatter: valueLabel?.formatter,
//   };

//   const resolvedNeedleLabel: Required<
//     Omit<GaugeNeedleLabelConfig, "formatter">
//   > & { formatter?: (v: number) => string } = {
//     show: needleLabel?.show ?? false,
//     formatter: needleLabel?.formatter,
//   };

//   const resolvedTicks: Required<GaugeTicksConfig> = {
//     show: ticks?.show ?? (variant === "needle" || variant === "segmented"),
//     count: ticks?.count ?? 5,
//     position: ticks?.position ?? "outside",
//     length: ticks?.length ?? 6,
//     labels: ticks?.labels ?? true,
//   };

//   const resolvedAnimation = { ...DEFAULT_ANIMATION, ...animation };

//   const resolvedTooltip: Required<GaugeTooltipConfig> = {
//     show: tooltip?.show ?? true,
//   };

//   // ---- Theme + slot classes (identical precedence chain to CardWidget) ----
//   const resolvedTheme: WidgetTheme<GaugeSlot> =
//     theme === "dark"
//       ? gaugeDarkTheme
//       : theme === "light"
//       ? gaugeLightTheme
//       : (theme as WidgetTheme<GaugeSlot>) ?? DEFAULT_GAUGE_THEME;

//   const resolveSlot = useCallback(
//     (slot: GaugeSlot) =>
//       twMerge(
//         GAUGE_DEFAULT_CLASSES[slot],
//         resolvedTheme.styles[slot],
//         classNames[slot]
//       ),
//     [resolvedTheme, classNames]
//   );

//   const boxWidth = size ?? width ?? (dims.width || 240);

//   const boxHeight = size ?? height ?? (dims.height || boxWidth * 0.62);

//   const bounds = useMemo(
//     () => getArcBounds(resolvedArc.startAngle, resolvedArc.endAngle),
//     [resolvedArc.startAngle, resolvedArc.endAngle]
//   );

//   const pad = 8;
//   // Reserve room below the arc for value/needle-label/variable text so
//   // the dome never gets crowded — bigger reserve when the value label is on.
//   const textReserve = resolvedValueLabel.show ? 0.34 : 0.16;

//   // Ticks (and their number labels) draw *outside* the arc's own radius,
//   // so the radius-fit math below must shrink the arc enough to leave
//   // room for them — otherwise tick labels get clipped by the SVG
//   // viewBox, which looked like "some ticks are hidden".
//   const tickOverflow =
//     resolvedTicks.show && resolvedTicks.position !== "inside"
//       ? resolvedTicks.length + (resolvedTicks.labels ? 26 : 8)
//       : 0;
//   // Scale min/max labels also draw past the arc's radius at the two ends.
//   const scaleLabelOverflow =
//     resolvedLabels.show && (scale?.minLabel || scale?.maxLabel) ? 24 : 0;
//   const edgeOverflow = Math.max(tickOverflow, scaleLabelOverflow);

//   const availW = boxWidth - pad * 2 - edgeOverflow * 2;
//   const availH = boxHeight * (1 - textReserve) - pad * 2 - edgeOverflow;

//   const outerRadius =
//     resolvedArc.radius ??
//     Math.max(24, Math.min(availW / (bounds.w || 1), availH / (bounds.h || 1)));

//   const thickness = resolvedArc.thickness ?? Math.max(6, outerRadius * 0.18);

//   // Center the arc's bounding box within the available width, anchor its top at `pad`.
//   const cx =
//     pad - bounds.minX * outerRadius + (availW - bounds.w * outerRadius) / 2;
//   const cy = pad - bounds.minY * outerRadius;

//   const angleScale = useMemo(
//     () =>
//       d3
//         .scaleLinear()
//         .domain([min, max])
//         .range([
//           resolvedArc.startAngle * DEG2RAD,
//           resolvedArc.endAngle * DEG2RAD,
//         ])
//         .clamp(true),
//     [min, max, resolvedArc.startAngle, resolvedArc.endAngle]
//   );

//   // ---- D3 draw ----
//   useEffect(() => {
//     if (!svgRef.current || boxWidth === 0 || boxHeight === 0) return;

//     const svg = d3.select(svgRef.current);
//     const defs = svg.select<SVGDefsElement>("defs");
//     const root = svg.select<SVGGElement>("g.anedya-gauge-root");
//     root.attr("transform", `translate(${cx},${cy})`);

//     const ease = resolveEase(resolvedAnimation.easing);
//     const arcGen = d3
//       .arc<{ startAngle: number; endAngle: number; r: number }>()
//       .innerRadius((d) => d.r - thickness)
//       .outerRadius((d) => d.r)
//       .cornerRadius(resolvedArc.cornerRadius)
//       .startAngle((d) => d.startAngle)
//       .endAngle((d) => d.endAngle);

//     const startA = resolvedArc.startAngle * DEG2RAD;
//     const endA = resolvedArc.endAngle * DEG2RAD;

//     // --- Track ---
//     const trackSel = root.select<SVGPathElement>(
//       "path.anedya-gauge-track-path"
//     );
//     if (resolvedTrack.show && variant !== "multiBar") {
//       trackSel
//         .attr(
//           "d",
//           arcGen({ startAngle: startA, endAngle: endA, r: outerRadius })!
//         )
//         .attr("fill", resolvedTrack.color || "currentColor")
//         .attr("opacity", 1);
//     } else {
//       trackSel.attr("opacity", 0);
//     }

//     // --- Bar (progress / solid / segmented base) ---
//     const barGroup = root.select<SVGGElement>("g.anedya-gauge-bar-group");
//     barGroup.selectAll("*").remove();

//     if (variant === "multiBar" && bars?.length) {
//       const maxBars = bars.slice(0, 10);
//       maxBars.forEach((bar, i) => {
//         const r = outerRadius - i * (thickness + resolvedArc.gap);
//         if (resolvedTrack.show) {
//           barGroup
//             .append("path")
//             .attr("d", arcGen({ startAngle: startA, endAngle: endA, r })!)
//             .attr(
//               "class",
//               twMerge("anedya-gauge-multibar-track", resolveSlot("track"))
//             )
//             .attr("fill", resolvedTrack.color || "currentColor")
//             .attr("stroke", "none");
//         }
//         const valAngle = d3
//           .scaleLinear()
//           .domain([min, max])
//           .range([startA, endA])
//           .clamp(true)(bar.value);

//         const barFill = resolveFill(
//           defs,
//           `anedya-gauge-bar-fill-${i}`,
//           bar.color,
//           "currentColor"
//         );

//         const path = barGroup
//           .append("path")
//           .attr("class", resolveSlot("bar"))
//           .attr("fill", barFill)
//           .attr("stroke", "none");
//         path
//           .datum({ startAngle: startA, endAngle: startA, r })
//           .attr("d", arcGen as any)
//           .transition()
//           .duration(resolvedAnimation.duration)
//           .ease(ease)
//           .attrTween("d", function (d: any) {
//             const i2 = d3.interpolate(d.endAngle, valAngle);
//             return (t) => {
//               d.endAngle = i2(t);
//               return arcGen(d)!;
//             };
//           });
//       });
//     } else if (segments?.length) {
//       const scaleAngle = d3
//         .scaleLinear()
//         .domain([min, max])
//         .range([startA, endA])
//         .clamp(true);
//       // Half the configured gap, converted from px to radians at this radius,
//       // so adjoining segments get visible separation like distinct blocks.
//       const gapRad = resolvedArc.gap / 2 / outerRadius || 0;

//       const segArcGen = d3
//         .arc<{ startAngle: number; endAngle: number; r: number }>()
//         .innerRadius((d) => d.r - thickness)
//         .outerRadius((d) => d.r)
//         .cornerRadius(resolvedArc.cornerRadius || thickness / 4)
//         .startAngle((d) => d.startAngle)
//         .endAngle((d) => d.endAngle);

//       segments.forEach((seg, idx) => {
//         const segStart = scaleAngle(seg.from) + gapRad;
//         const segEnd = scaleAngle(seg.to) - gapRad;
//         if (segEnd <= segStart) return;

//         const fill = resolveFill(
//           defs,
//           `anedya-gauge-segment-fill-${idx}`,
//           seg.color,
//           "currentColor"
//         );
//         barGroup
//           .append("path")
//           .attr("class", resolveSlot("segment"))
//           .attr("fill", fill)
//           .attr("stroke", "none")
//           .attr(
//             "d",
//             segArcGen({
//               startAngle: segStart,
//               endAngle: segEnd,
//               r: outerRadius,
//             })!
//           );
//       });
//     } else {
//       const valueAngle = angleScale(clampedValue);
//       const barColorRaw: GaugeColor | undefined =
//         color ??
//         (thresholds?.length
//           ? [...thresholds]
//               .sort((a, b) => a.value - b.value)
//               .reduce<GaugeColor | undefined>(
//                 (acc, th) => (clampedValue >= th.value ? th.color : acc),
//                 thresholds[0].color
//               )
//           : undefined);

//       const barFill = resolveFill(
//         defs,
//         "anedya-gauge-bar-fill",
//         barColorRaw,
//         "currentColor"
//       );

//       const path = barGroup
//         .append("path")
//         .attr("class", resolveSlot("bar"))
//         .attr("fill", barFill)
//         .attr("stroke", "none");

//       const from = fillMode === "solid" ? startA : startA;
//       const to = fillMode === "solid" ? endA : valueAngle;

//       path
//         .datum({
//           startAngle: startA,
//           endAngle:
//             prevValueRef.current != null
//               ? angleScale(prevValueRef.current)
//               : startA,
//           r: outerRadius,
//         })
//         .transition()
//         .duration(resolvedAnimation.duration)
//         .ease(ease)
//         .attrTween("d", function (d: any) {
//           const i2 = d3.interpolate(d.endAngle, to);
//           return (t) => {
//             d.endAngle = i2(t);
//             return arcGen({
//               startAngle: from,
//               endAngle: d.endAngle,
//               r: outerRadius,
//             })!;
//           };
//         });
//     }

//     // --- Ticks ---
//     const tickGroup = root.select<SVGGElement>("g.anedya-gauge-ticks");
//     tickGroup.selectAll("*").remove();
//     if (resolvedTicks.show) {
//       const count = Math.max(2, resolvedTicks.count);
//       const tickR =
//         resolvedTicks.position === "inside"
//           ? outerRadius - thickness
//           : resolvedTicks.position === "cross"
//           ? outerRadius - thickness / 2
//           : outerRadius + 4;
//       d3.range(count).forEach((i) => {
//         const t = i / (count - 1);
//         const tv = min + t * (max - min);
//         const a = angleScale(tv);
//         const x1 = Math.sin(a) * tickR;
//         const y1 = -Math.cos(a) * tickR;
//         const x2 =
//           Math.sin(a) *
//           (tickR +
//             (resolvedTicks.position === "inside"
//               ? -resolvedTicks.length
//               : resolvedTicks.length));
//         const y2 =
//           -Math.cos(a) *
//           (tickR +
//             (resolvedTicks.position === "inside"
//               ? -resolvedTicks.length
//               : resolvedTicks.length));
//         tickGroup
//           .append("line")
//           .attr("class", resolveSlot("tick"))
//           .attr("stroke", "currentColor")
//           .attr("x1", x1)
//           .attr("y1", y1)
//           .attr("x2", x2)
//           .attr("y2", y2);

//         if (resolvedTicks.labels) {
//           const lx = Math.sin(a) * (tickR + resolvedTicks.length + 10);
//           const ly = -Math.cos(a) * (tickR + resolvedTicks.length + 10);
//           tickGroup
//             .append("text")
//             .attr("class", resolveSlot("tickLabel"))
//             .attr("x", lx)
//             .attr("y", ly)
//             .attr("text-anchor", "middle")
//             .attr("dominant-baseline", "middle")
//             .text(String(Math.round(tv)));
//         }
//       });
//     }
//     // --- Scale min/max labels (drawn at the arc's real start/end points,
// // not floated at the container's edges) ---
// const scaleLabelGroup = root.select<SVGGElement>(
//   "g.anedya-gauge-scale-labels"
// );
// scaleLabelGroup.selectAll("*").remove();
// if (resolvedLabels.show && (scale?.minLabel || scale?.maxLabel)) {
//   const labelR =
//     outerRadius +
//     (resolvedTicks.show ? resolvedTicks.length + 16 : 12);

//   const drawScaleLabel = (angle: number, text: string) => {
//     const x = Math.sin(angle) * labelR;
//     const y = -Math.cos(angle) * labelR;
//     // Anchor away from the point so the label doesn't overlap the arc:
//     // labels on the left side end at x, labels on the right start at x.
//     const anchor = x < -2 ? "end" : x > 2 ? "start" : "middle";
//     scaleLabelGroup
//       .append("text")
//       .attr("class", resolveSlot("scaleLabel"))
//       .attr("x", x)
//       .attr("y", y)
//       .attr("text-anchor", anchor)
//       .attr("dominant-baseline", "middle")
//       .text(text);
//   };

//   if (scale?.minLabel) drawScaleLabel(startA, scale.minLabel);
//   if (scale?.maxLabel) drawScaleLabel(endA, scale.maxLabel);
// }

//     // --- Needle ---
//     const needleGroup = root.select<SVGGElement>("g.anedya-gauge-needle");
//     if (resolvedNeedle.show && variant !== "multiBar") {
//       const len = needlePixelLength(resolvedNeedle.length, outerRadius);
//       const shape = needleShape(resolvedNeedle.type, len, resolvedNeedle.width);

//       needleGroup.selectAll("*:not(circle.anedya-gauge-needle-cap)").remove();
//       const needleEl = needleGroup.insert(
//         shape.tag as any,
//         "circle.anedya-gauge-needle-cap"
//       );
//       needleEl
//         .attr("class", resolveSlot("needle"))
//         .attr("fill", resolvedNeedle.color || "currentColor")
//         .attr("stroke", resolvedNeedle.color || "currentColor");
//       Object.entries(shape.attrs).forEach(([k, v]) =>
//         needleEl.attr(
//           k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()),
//           v as any
//         )
//       );

//       let cap = needleGroup.select<SVGCircleElement>(
//         "circle.anedya-gauge-needle-cap"
//       );
//       if (cap.empty()) {
//         cap = needleGroup
//           .append("circle")
//           .attr(
//             "class",
//             twMerge("anedya-gauge-needle-cap", resolveSlot("needleCap"))
//           );
//       }
//       cap
//         .attr("r", resolvedNeedle.capRadius)
//         .attr("fill", resolvedNeedle.color || "currentColor");

//       const targetDeg = angleScale(clampedValue) / DEG2RAD;
//       if (resolvedNeedle.animation) {
//         needleGroup
//           .transition()
//           .duration(resolvedAnimation.duration)
//           .ease(ease)
//           .attrTween("transform", function () {
//             const current = needleGroup.attr("data-angle")
//               ? +needleGroup.attr("data-angle")!
//               : startA / DEG2RAD;
//             const interp = d3.interpolate(current, targetDeg);
//             return (t) => {
//               const a = interp(t);
//               needleGroup.attr("data-angle", String(a));
//               return `rotate(${a})`;
//             };
//           });
//       } else {
//         needleGroup
//           .attr("transform", `rotate(${targetDeg})`)
//           .attr("data-angle", String(targetDeg));
//       }
//       needleGroup.attr("opacity", 1);
//     } else {
//       needleGroup.attr("opacity", 0);
//     }

//     prevValueRef.current = clampedValue;
//   }, [
//     boxWidth,
//     boxHeight,
//     cx,
//     cy,
//     outerRadius,
//     thickness,
//     variant,
//     clampedValue,
//     min,
//     max,
//     fillMode,
//     color,
//     JSON.stringify(bars),
//     JSON.stringify(segments),
//     JSON.stringify(thresholds),
//     resolvedTrack.show,
//     resolvedTrack.color,
//     resolvedNeedle.show,
//     resolvedNeedle.type,
//     resolvedNeedle.length,
//     resolvedNeedle.width,
//     resolvedNeedle.color,
//     resolvedNeedle.capRadius,
//     resolvedNeedle.animation,
//     resolvedTicks.show,
//     resolvedTicks.count,
//     resolvedTicks.position,
//     resolvedTicks.length,
//     resolvedTicks.labels,
//     resolvedAnimation.duration,
//     resolvedAnimation.easing,
//     resolveSlot,
//     resolvedLabels.show,
//     scale?.minLabel,
//     scale?.maxLabel,
//   ]);

//   // ---- Hover / tooltip / click (D3-driven, div overlay like BarChartWidget's tooltip) ----
//   const handlePointerMove = useCallback(
//     (e: React.PointerEvent<SVGSVGElement>) => {
//       if (!resolvedTooltip.show && !onHover) return;
//       const rect = svgRef.current!.getBoundingClientRect();
//       const x = e.clientX - rect.left - cx;
//       const y = e.clientY - rect.top - cy;
//       const dist = Math.hypot(x, y);
//       if (dist < outerRadius - thickness - 6 || dist > outerRadius + 6) {
//         setHoverValue(null);
//         onHover?.(null);
//         return;
//       }
//       let a = Math.atan2(x, -y);
//       const hv = angleScale.invert(a);
//       const clamped = Math.min(max, Math.max(min, hv));
//       setHoverValue(clamped);
//       onHover?.(clamped);
//       if (tooltipRef.current) {
//         tooltipRef.current.style.left = `${e.clientX - rect.left + 10}px`;
//         tooltipRef.current.style.top = `${e.clientY - rect.top - 24}px`;
//       }
//     },
//     [
//       cx,
//       cy,
//       outerRadius,
//       thickness,
//       angleScale,
//       min,
//       max,
//       onHover,
//       resolvedTooltip.show,
//     ]
//   );

//   const handlePointerLeave = useCallback(() => {
//     setHoverValue(null);
//     onHover?.(null);
//   }, [onHover]);

//   const handleClick = useCallback(
//     () => onClick?.(clampedValue),
//     [onClick, clampedValue]
//   );

//   const formattedValue = resolvedValueLabel.formatter
//     ? resolvedValueLabel.formatter(clampedValue)
//     : `${resolvedValueLabel.prefix}${clampedValue.toFixed(
//         resolvedValueLabel.precision
//       )}${resolvedValueLabel.suffix}`;

//   const needleLabelText = resolvedNeedleLabel.formatter?.(clampedValue);

//   return (
//     <div
//       ref={wrapperRef}
//       className={twMerge(
//         "anedya-gauge relative",
//         resolveSlot("container"),
//         className
//       )}
//       style={{
//         width: width ?? "100%",
//         height: height ?? undefined,
//         minWidth,
//         maxWidth,
//         minHeight,
//         maxHeight,
//         aspectRatio: height ? undefined : aspectRatio ?? 1.7,
//         boxSizing: "border-box",
//         ...style,
//       }}
//       onClick={handleClick}
//     >
//       {title && <span className={resolveSlot("title")}>{title}</span>}

//       <svg
//         ref={svgRef}
//         viewBox={`0 0 ${boxWidth || 200} ${boxHeight || 200}`}
//         className="block w-full h-full"
//         onPointerMove={handlePointerMove}
//         onPointerLeave={handlePointerLeave}
//       >
//         <defs />
//         <g className="anedya-gauge-root">
//           <path
//             className={twMerge("anedya-gauge-track-path", resolveSlot("track"))}
//             fill="currentColor"
//             stroke="none"
//           />
//           <g className="anedya-gauge-bar-group" />
//           <g className="anedya-gauge-ticks" />
//           <g className="anedya-gauge-scale-labels" />
//           <g className="anedya-gauge-needle">
//             <circle
//               className={twMerge(
//                 "anedya-gauge-needle-cap",
//                 resolveSlot("needleCap")
//               )}
//             />
//           </g>
//         </g>
//       </svg>

//       {/* {resolvedLabels.show && (scale?.minLabel || scale?.maxLabel) && (
//         <div className="flex w-full justify-between px-2 text-xs -mt-2">
//           <span className={resolveSlot("scaleLabel")}>{scale?.minLabel}</span>
//           <span className={resolveSlot("scaleLabel")}>{scale?.maxLabel}</span>
//         </div>
//       )} */}

//       {resolvedValueLabel.show && (
//         <span className={resolveSlot("value")}>{formattedValue}</span>
//       )}

//       {resolvedNeedleLabel.show && needleLabelText && (
//         <span className={resolveSlot("label")}>{needleLabelText}</span>
//       )}

//       {variable && <span className={resolveSlot("label")}>{variable}</span>}

//       {resolvedTooltip.show && hoverValue != null && (
//         <div
//           ref={tooltipRef}
//           className={twMerge("absolute", resolveSlot("tooltip"))}
//         >
//           {hoverValue.toFixed(resolvedValueLabel.precision)}
//         </div>
//       )}
//     </div>
//   );
// }
