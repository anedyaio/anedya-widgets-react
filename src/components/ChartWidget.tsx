import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";


import { CSSProperties } from "react";
import "../../src/index.css"
import { validateRequiredProps } from "../helpers/validate";
import { defaultDateFormatter, formatDate, formatNumber } from "../helpers/formatDate";

function computeBottomMargin(ticks: string[]) {
  if (!ticks.length) return 40;

  // estimate width of text based on average character width
  const longest = ticks.reduce((a, b) => (a.length > b.length ? a : b), "");
  const approxCharWidth = 7;       // px
  const approximateTextWidth = longest.length * approxCharWidth;

  // because labels rotate -30deg, height ≈ width * sin(30°)
  const estimatedHeight = approximateTextWidth * 0.5;

  return Math.max(40, estimatedHeight + 20); // + extra padding
}

/* ------------------------ Types ------------------------ */
export interface ChartDataPoint {
  timestamp: number;
  value: number;
}
type WidgetState = {
  value?: any;
  loading?: boolean;
  error?: string | null; // ✅ matches your React state
};


interface ChartStyleSet {
  container?: CSSProperties;
  title?: CSSProperties;
  tooltip?: CSSProperties;
  axis?: CSSProperties;
  chart?: {
    strokeColor?: string;
    strokeWidth?: number;
    gradientColors?: [string, string];
    dotRadius?: number;
  };
  fontFamily:string
}
type StylesInput =
  | ChartStyleSet
  | ((state: WidgetState) => ChartStyleSet);

export interface ChartWidgetProps {
  client: any;
  nodeId: string;
  variable: string;
  from:number,
  to:number,
  limit?:number,
  title?: string;
  styles?: StylesInput;
  tooltipFormatter?: (d: ChartDataPoint) => string;
  tickCount?: number; // number of ticks on x axis (default: 4)
  tickFormatter?: (d: Date) => string; // optional custom formatter
    xTickFormat?: string | ((d: Date) => string);  // date formatting
  yTickFormat?: string | ((v: number) => string); // numeric formatting
  tooltipFormat?: string | ((d: ChartDataPoint) => string);
    onStyleChange?:(data:ChartDataPoint[]) =>{}
}

/* ------------------------ Helpers ------------------------ */
const normalizeSx = (sx: Record<string, any>  | undefined): Record<string, any> => {
  if (!sx) return {};
  if (Array.isArray(sx)) return Object.assign({}, ...sx);
  if (typeof sx === "function") return sx({}) as Record<string, any>;
  return sx as Record<string, any>;
};

const toDateSafe = (ts: number): Date => {
  // If ts < 1e12, treat as seconds -> convert to ms
  if (ts < 1e12) return new Date(ts * 1000);

  return new Date(ts);
};

/* ------------------------ Defaults ------------------------ */
const defaultFontFamily = "Roboto, sans-serif";

const defaultStyles: Required<ChartStyleSet> = {
  container: {
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
gap:0,
   background: "rgb(248, 249, 250)",
                border: "1px solid rgba(211, 216, 220, 1)",
 

    textAlign: "center",
        fontFamily: defaultFontFamily,
  },
  title: {
  
    fontWeight: 600,
    color: "rgba(0,0,0,0.75)",
    // marginBottom: 1,
        fontFamily: defaultFontFamily,
  },
  tooltip: {
    background: "rgba(0,0,0,0.75)",

    color: "#ffffff",

    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "12px",
        fontFamily: defaultFontFamily,
  },
  axis: {
    color: "#666",
    fontSize: "11px",
    fontFamily:defaultFontFamily,

  },
  chart: {
    strokeColor: "#1e88e5",
    strokeWidth: 2,
    gradientColors: ["#1e88e5", "#90caf9"],
       dotRadius: 4,

  },
   fontFamily:defaultFontFamily

   
};


// ---- ChartWidget ----
export const ChartWidget: React.FC<ChartWidgetProps> = ({
  client,
  nodeId,
  variable,
  from,
  to,
  limit=20,
  title = "Latest Data",
  styles = {},
  tooltipFormatter = (d) =>
    `${new Date(
      new Date(d.timestamp < 1e12 ? d.timestamp * 1000 : d.timestamp)
    ).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}: ${d.value}`,
      tickCount = 4,
  tickFormatter,
  xTickFormat,
  yTickFormat,
  tooltipFormat,
  onStyleChange
}) => {

   validateRequiredProps(
    "Chart Widget",
    { client, nodeId, variable,from,to },
    ["client", "nodeId", "variable","from time","to time"]
  );

  const resolvedXFormatter =
  typeof xTickFormat === "string"
    ? (d: Date) => formatDate(d, xTickFormat)
    : xTickFormat;

const resolvedYFormatter =
  typeof yTickFormat === "string"
    ? (v: number) => formatNumber(v, yTickFormat)
    : yTickFormat;

const resolvedTooltipFormatter =
  typeof tooltipFormat === "string"
    ? (d: ChartDataPoint) =>
        `${formatDate(toDateSafe(d.timestamp), tooltipFormat)}: ${d.value}`
    : tooltipFormat;


  // Refs + state
  const svgRef = useRef<SVGSVGElement | null>(null);
   const tooltipNodeRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<ChartDataPoint[]>([
    // { timestamp: Date.now() - 60000, value: 33 },
    // { timestamp: Date.now() - 30000, value: 44 },
    // { timestamp: Date.now(), value: 38 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [node, setNode] = useState<any>(null);


  const state = { data, loading, error }; // <-- your widget’s internal state

// Resolve function or static style object
const [dynamicStyles, setDynamicStyles] = useState<Partial<ChartStyleSet>>({});

const baseResolvedStyles =
  typeof styles === "function" ? styles(state) : styles || {};

const resolvedStyles = {
  container: { ...baseResolvedStyles.container, ...dynamicStyles?.container },
  title: { ...baseResolvedStyles.title, ...dynamicStyles?.title },
  tooltip: { ...baseResolvedStyles.tooltip, ...dynamicStyles?.tooltip },
  chart: { ...baseResolvedStyles.chart, ...dynamicStyles?.chart },
  axis:  { ...baseResolvedStyles.axis, ...dynamicStyles?.axis },
  fontFamily: dynamicStyles?.fontFamily ?? baseResolvedStyles.fontFamily,
};
  const mountedRef = useRef(false);
  const failureCountRef = useRef(0);
  const isFetchingRef = useRef(false);
  const MAX_FAILURES = 3;

  // ---- Normalize Styles ----
  const containerSx = normalizeSx(resolvedStyles?.container);
  const titleSx = normalizeSx(resolvedStyles?.title);
  const tooltipSx = normalizeSx(resolvedStyles?.tooltip);
  const chartSx = resolvedStyles.chart ?? {};
  const axisSx = normalizeSx(resolvedStyles?.axis);

  // --- Container dimensions with TypeScript-safe default ---
  const containerDefaults: any = defaultStyles.container!;
  const width = containerSx.width ?? containerDefaults.width;
  const height = containerSx.height ?? containerDefaults.height;


  // --- Font family handling ---
  const globalFontFamily = resolvedStyles?.fontFamily ?? "Roboto";
  const labelFontFamily = titleSx.fontFamily ??  globalFontFamily;


  




  // --- Scaled font sizes ---
  const baseFont = Math.min(Number(width), Number(height)) * 0.15;

  // --- Compute font sizes dynamically if not provided by user ---
  const labelFont = (resolvedStyles?.title as any)?.fontSize ?? baseFont * 0.6;

  
  const strokeColor = chartSx.strokeColor ?? defaultStyles.chart.strokeColor;
  const strokeWidth = chartSx.strokeWidth ?? defaultStyles.chart.strokeWidth;
  const gradientColors =
    chartSx.gradientColors ?? defaultStyles.chart.gradientColors;
const dotRadius = chartSx.dotRadius ?? defaultStyles.chart.dotRadius;
  // ---- Fetch Node ----
  useEffect(() => {
    if (!client || !nodeId) return;
    const anedya = (client as any)._anedya;
    const createdNode = anedya?.NewNode?.(client, nodeId);
    setNode(createdNode);
  }, [client, nodeId]);

  // ---- Fetch Data ----
  useEffect(() => {
    mountedRef.current = true;
    if (
      !node
      // || data.length>0
    )
      return;

    const fetchData = async () => {
      if (isFetchingRef.current || failureCountRef.current >= MAX_FAILURES)
        return;
      isFetchingRef.current = true;

      try {
        setLoading(true);
        setError(null);
        // const currentTime = Date.now();
        // const twentyFourHoursAgo = currentTime - 86400 * 1000;
//1732420983000
//1763956983000
        const req = {
          variable,
          from: from,
          to: to,
          limit: limit,
          order: "asc",
        };
        const res = await node.getData(req);

        if (!mountedRef.current) return;

        if (res.isSuccess && res.isDataAvailable) {
          setData(res.data);
          setError("");

        } else {
          console.error("error fetching data:", res.error);
          setError(res.error.errorMessage);
        }
        failureCountRef.current = 0;
      } catch (err: any) {
        console.error("Error fetching chart data:", err);
        setData([]);
        setError(err?.message ?? "Failed to fetch data");
        failureCountRef.current += 1;
      } finally {
        setLoading(false);
        if (mountedRef.current) isFetchingRef.current = false;
      }
    };

    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [node, variable]);

 /* ------------------------ D3 render (dots + line + area + tooltip + axes) ------------------------ */
  useEffect(() => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    // If no data, nothing to draw
    if (!data || data.length === 0) {
      return;
    }



  // // --- COMPUTE SCALES --- //
  // const tempDates = data.map((d) => toDateSafe(d.timestamp));
  // const tempX = d3.scaleTime().domain(d3.extent(tempDates)  as [Date, Date]).range([0, 1]); // temp range
  // const provisionalTicks = tempX.ticks(tickCount);

  // const tickLabels = provisionalTicks.map((d) =>
  //   resolvedXFormatter ? resolvedXFormatter(d) : defaultDateFormatter(d)
  // );

  // const dynamicBottom = computeBottomMargin(tickLabels);

  // // --- NOW REAL MARGINS --- //
  // const margin = { top: 20, right: 20, bottom: dynamicBottom, left: 50 };

  // // recompute chart area
  // const chartW = Math.max(10, width - margin.left - margin.right);
  // const chartH = Math.max(10, height - margin.top - margin.bottom);

  // // recompute x with real width
  // tempX.range([0, chartW]);

    //.attr("transform", "rotate(-30)")
//margins (leave extra bottom space for rotated ticks)
    const margin = { top: 20, right: 20, bottom: 130, left: 50 };
    const chartW = Math.max(10, width - margin.left - margin.right);
    const chartH = Math.max(10, height - margin.top - margin.bottom);

    // group
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // parse / convert timestamps to Date safely
    const dates = data.map((d) => toDateSafe(d.timestamp));
    const x = d3.scaleTime().domain(d3.extent(dates) as [Date, Date]).range([0, chartW]);
    const maxY = Math.max(10, d3.max(data, (d) => Number(d.value)) ?? 10);
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([chartH, 0]);

    // gradient
  const safeGradient = gradientColors ?? ["#1e88e5", "#90caf9"];
  const safeStroke = strokeColor ?? "#1e88e5";
  const safeWidth = strokeWidth ?? 2;
  const safeDotRadius = dotRadius ?? 4
    const defs = svg.append("defs");

    const gradient = defs
      .append("linearGradient")
      .attr("id", "chartGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", safeGradient[0])
      .attr("stop-opacity", 0.5);
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", safeGradient[1])
      .attr("stop-opacity", 0);

    // area
    const area = d3
      .area<ChartDataPoint>()
      .x((d) => x(toDateSafe(d.timestamp)))
      .y0(chartH)
      .y1((d) => y(d.value))
      .curve(d3.curveMonotoneX);

  g.append("path").datum(data).attr("fill", "url(#chartGradient)").attr("d", area);

    // line
    const line = d3
      .line<ChartDataPoint>()
      .x((d) => x(toDateSafe(d.timestamp)))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

   g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", safeStroke)
    .attr("stroke-width", safeWidth)
    .attr("d", line);

    // dots
    const dotR = computeDotRadius(chartW, chartH, safeDotRadius);
    const dots = g
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(toDateSafe(d.timestamp)))
      .attr("cy", (d) => y(d.value))
      .attr("r", dotR)
      .attr("fill", safeStroke)
      .style("cursor", "default");

    // Tooltip (create single DOM node appended to body)
    // Reuse tooltip div if present
    let tooltipDiv = tooltipNodeRef.current;
    if (!tooltipDiv) {
      tooltipDiv = document.createElement("div");
      tooltipNodeRef.current = tooltipDiv;
      document.body.appendChild(tooltipDiv);
    }
    // apply tooltip styles (inline)
    const tooltipDefaults: any = defaultStyles.tooltip;
    tooltipDiv.style.position = "absolute";
    tooltipDiv.style.pointerEvents = "none";
    tooltipDiv.style.opacity = "0";
    tooltipDiv.style.background = (tooltipSx.backgroundColor ?? tooltipDefaults.background) as string;
    tooltipDiv.style.color = (tooltipSx.color ?? tooltipDefaults.color) as string;
    tooltipDiv.style.borderRadius = (tooltipSx.borderRadius ?? tooltipDefaults.borderRadius) as string;
    tooltipDiv.style.padding = (tooltipSx.padding ?? tooltipDefaults.padding) as string;
    tooltipDiv.style.fontSize = (tooltipSx.fontSize ?? tooltipDefaults.fontSize) as string;
    tooltipDiv.style.transition = "opacity 120ms";

    // interactions
    dots
      .on("mouseover", function (event, d: ChartDataPoint) {
        tooltipDiv!.style.opacity = "1";
        tooltipDiv!.innerHTML = resolvedTooltipFormatter
  ? resolvedTooltipFormatter(d)
  : tooltipFormatter(d);
      })
      .on("mousemove", function (event) {
        // place tooltip near pointer but keep inside window
        const pad = 8;
        const left = Math.min(window.innerWidth - 200, event.pageX + pad);
        const top = Math.max(8, event.pageY - 36);
        tooltipDiv!.style.left = `${left}px`;
        tooltipDiv!.style.top = `${top}px`;
      })
      .on("mouseout", function () {
        tooltipDiv!.style.opacity = "0";
      });

    // axes - bottom x with custom tick formatting and rotated labels
    const xAxis = d3
      .axisBottom(x)
      .ticks(tickCount)
      .tickFormat((d) => {
    if (resolvedXFormatter) return resolvedXFormatter(d as Date);
    return defaultDateFormatter(d as Date);
  });


      const axisDefaults : any = defaultStyles.axis
    g.append("g")
      .attr("transform", `translate(0,${chartH})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end")
      .style("font-size", (axisSx.fontSize ?? axisDefaults.fontSize) as string)
      .style("fill", (axisSx.color ?? axisDefaults.color) as string)
      .style("font-family", (axisSx.fontFamily ?? axisDefaults.fontFamily) as string);

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat((v) => {
        if (resolvedYFormatter) return resolvedYFormatter(v as number);
        return String(v);
      }))
      .selectAll("text")
      .style("font-size", (axisSx.fontSize ?? axisDefaults.fontSize) as string)
      .style("fill", (axisSx.color ?? axisDefaults.color) as string)
      .style("font-family", (axisSx.fontFamily ?? axisDefaults.fontFamily) as string);

    // keep axes inside container by clipping overflow
    // Add clipPath so elements don't overflow container boundaries visually
    const clipId = `clip-${Math.random().toString(36).slice(2, 9)}`;
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("width", width)
      .attr("height", height);
    svg.attr("clip-path", `url(#${clipId})`);

    // cleanup on effect re-run
    return () => {
      // remove tooltip div if created by this component
      if (tooltipNodeRef.current) {
        try {
          tooltipNodeRef.current.remove();
        } catch {}
        tooltipNodeRef.current = null;
      }
      svg.selectAll("*").remove();
    };
  }, [
    data,
    width,
    height,
    strokeColor,
    strokeWidth,
    gradientColors,
    dotRadius,
    tickCount,
    tickFormatter,
    tooltipFormatter,
    axisSx,
    tooltipSx,
  ]);



      // Whenever value changes, allow user to modify styles dynamically
   useEffect(() => {
      if (typeof onStyleChange === "function") {
        const updated = onStyleChange(data);
        if (updated && typeof updated === "object") {
          setDynamicStyles(updated);
        }
      }
    }, [data]);
  
  /* ------------------------ Helpers ------------------------ */
  function computeDotRadius(chartW: number, chartH: number, requested: number) {
    // scale dot radius a bit relative to min dimension but honor requested if provided
    const base = Math.max(2, Math.min(chartW, chartH) * 0.012);
    return requested ?? Math.round(base);
  }
  // --- Merge styles safely ---
  const mergedContainerSx: CSSProperties = {
    ...defaultStyles.container,
    ...containerSx,
  
  };
  const mergedLabelSx: CSSProperties = {
    ...defaultStyles.title,
    fontSize: labelFont,
    ...titleSx,
    fontFamily: labelFontFamily,
  };


  return (
    <div style={{...mergedContainerSx}}>
      {title && (
       <h2
      style={{
       ...mergedLabelSx
      }}
    >
      {title}
    </h2>
      )}
      {loading ? (
      <div
      style={{
        display: "flex",
     
        width: "100%",
        height: "100%",
           justifyContent: "center",
        alignItems: "center",
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
      ) : data?.length === 0?
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

          </div>:
       (
        <svg
          ref={svgRef}
          width={width as number}
          height={"90%"}
        ></svg>
      )}
    </div>
  );
};


//add customizable toolips, stroke width and color, and title obvs , timestamps for get data request
//match customization and failsafes to latest data
//documentation
//modify anedya client as well
//adjust rateLimitMs
//how do i also ensure that the y axis labels dont crpss the container card border , all labels are contained within th container card

//ftick format functions
//responsiveness
//frequesncy of ticks
//show all widgets
//documentation
//consistent widget default styling , default color palette and theme
//beta launch
//how to add docs in npm --- add them in read me
