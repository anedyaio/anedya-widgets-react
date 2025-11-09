import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Typography, SxProps, Theme } from "@mui/material";

// ---- Helper: Normalize sx like in LatestDataWidget ----
const normalizeSx = (sx: SxProps<Theme> | undefined): Record<string, any> => {
  if (!sx) return {};
  if (Array.isArray(sx)) return Object.assign({}, ...sx);
  if (typeof sx === "function") return sx({} as Theme) as Record<string, any>;
  return sx as Record<string, any>;
};

// ---- Type Definitions ----
export interface ChartDataPoint {
  timestamp: number;
  value: number;
}

interface ChartStyleSet {
  container?: SxProps<Theme>;
  title?: SxProps<Theme>;
  tooltip?: SxProps<Theme>;
  chart?: {
    strokeColor?: string;
    strokeWidth?: number;
    gradientColors?: [string, string];
  };
}

export interface ChartWidgetProps {
  client?: any;
  nodeId?: string;
  variable?: string;
  title?: string;
  styles?: ChartStyleSet;
  tooltipFormatter?: (d: ChartDataPoint) => string;
}

// ---- Default Styles ----
const defaultStyles: Required<ChartStyleSet> = {
  container: {
    width: 400,
    height: 250,
    p: 2,
    m: 2,
    background: "linear-gradient(to right, #1e1e2f, #2c2c54)",
    borderRadius: 4,
    textAlign: "center",
  },
  title: {
    fontSize: "20px",
    fontWeight: 600,
    color: "rgba(0,0,0,0.75)",
    mb: 1,
  },
  tooltip: {
    background: "rgba(0,0,0,0.75)",
    color: "#ffffff",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "12px",
  },
  chart: {
    strokeColor: "#1e88e5",
    strokeWidth: 2,
    gradientColors: ["#1e88e5", "#90caf9"],
  },
};

// ---- ChartWidget ----
export const ChartWidget: React.FC<ChartWidgetProps> = ({
  client,
  nodeId,
  variable,
  title = "Chart Widget",
  styles = {},
  tooltipFormatter = (d) =>
    `${new Date(d.timestamp).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}: ${d.value}`,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<ChartDataPoint[]>([
    { timestamp: Date.now() - 60000, value: 33 },
    { timestamp: Date.now() - 30000, value: 44 },
    { timestamp: Date.now(), value: 38 },
  ]);
  const [node, setNode] = useState<any>(null);
  const mountedRef = useRef(false);
  const failureCountRef = useRef(0);
  const isFetchingRef = useRef(false);
  const MAX_FAILURES = 3;

  // ---- Normalize Styles ----
  const containerSx = normalizeSx(styles?.container);
  const titleSx = normalizeSx(styles?.title);
  const tooltipSx = normalizeSx(styles?.tooltip);
  const chartSx = styles.chart ?? {};

    // --- Container dimensions with TypeScript-safe default ---
  const containerDefaults: any = defaultStyles.container!;
  const width = containerSx.width ?? containerDefaults.width;
  const height = containerSx.height ?? containerDefaults.height;

  const strokeColor = chartSx.strokeColor ?? defaultStyles.chart.strokeColor;
  const strokeWidth = chartSx.strokeWidth ?? defaultStyles.chart.strokeWidth;
  const gradientColors =
    chartSx.gradientColors ?? defaultStyles.chart.gradientColors;

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
    if (!node 
      // || data.length>0
    ) return;

    const fetchData = async () => {
      if (isFetchingRef.current || failureCountRef.current >= MAX_FAILURES) return;
      isFetchingRef.current = true;

      try {
        const currentTime = Date.now();
        const twentyFourHoursAgo = currentTime - 86400 * 1000;

       const req = { variable, from: twentyFourHoursAgo, to: currentTime, limit: 20, order: "asc" };
        const res = await node.getData(req);

        if (!mountedRef.current) return;

        if (res.isSuccess && res.isDataAvailable) {
          setData(res.data);
        } else {
          console.warn("No data available");
        }
        failureCountRef.current = 0;
      } catch (err) {
        console.error("Error fetching chart data:", err);
        failureCountRef.current += 1;
      } finally {
        if (mountedRef.current) isFetchingRef.current = false;
      }
    };

    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [node, variable]);

  // ---- D3 Render ----
useEffect(() => {
  if (!svgRef.current || data.length === 0) return;

  const svg = d3.select(svgRef.current);
  svg.selectAll("*").remove();

  const margin = { top: 20, right: 30, bottom: 90, left: 40 };
  const chartWidth = Number(width) - margin.left - margin.right;
  const chartHeight = Number(height) - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => new Date(d.timestamp)) as [Date, Date])
    .range([0, chartWidth]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) ?? 10])
    .nice()
    .range([chartHeight, 0]);

  const safeGradient = gradientColors ?? ["#1e88e5", "#90caf9"];
  const safeStroke = strokeColor ?? "#1e88e5";
  const safeWidth = strokeWidth ?? 2;

  const gradient = svg
    .append("defs")
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
    .attr("stop-opacity", 0.6);

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", safeGradient[1])
    .attr("stop-opacity", 0.1);

  const area = d3
    .area<ChartDataPoint>()
    .x((d) => x(new Date(d.timestamp)))
    .y0(chartHeight)
    .y1((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  g.append("path").datum(data).attr("fill", "url(#chartGradient)").attr("d", area);

  const line = d3
    .line<ChartDataPoint>()
    .x((d) => x(new Date(d.timestamp)))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", safeStroke)
    .attr("stroke-width", safeWidth)
    .attr("d", line);

  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(new Date(d.timestamp)))
    .attr("cy", (d) => y(d.value))
    .attr("r", 4)
    .attr("fill", safeStroke);

    const tooltipDefaults: any = defaultStyles.tooltip!;
  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("background", tooltipSx.background ?? tooltipDefaults.background)
    .style("color", tooltipSx.color ?? tooltipDefaults.color)
    .style("border-radius", tooltipSx.borderRadius ?? tooltipDefaults?.borderRadius)
    .style("padding", tooltipSx.padding ?? tooltipDefaults.padding)
    .style("font-size", tooltipSx.fontSize ?? tooltipDefaults.fontSize);

  g.selectAll("circle")
    .on("mouseover", function (event, d:any) {
      tooltip.transition().duration(150).style("opacity", 1);
      tooltip.html(tooltipFormatter(d));
    })
    .on("mousemove", function (event) {
      tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(200).style("opacity", 0);
    });

  const xAxis = d3
    .axisBottom(x)
    .ticks(4)
    .tickFormat((d) =>
      new Date(d as Date).toLocaleString(undefined, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );

  g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-25)")
    .style("text-anchor", "end");

  g.append("g").call(d3.axisLeft(y).ticks(5));

  // ✅ Proper cleanup
  return () => {
    tooltip.remove();
  };
}, [data, width, height, strokeColor, gradientColors, strokeWidth, tooltipFormatter]);

  return (
    <div style={normalizeSx({ ...defaultStyles.container, ...containerSx })}>
      {title && (
        <Typography sx={{ ...defaultStyles.title, ...titleSx }}>{title}</Typography>
      )}
      <svg ref={svgRef} width={width as number} height={height as number}></svg>
    </div>
  );
};
