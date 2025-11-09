
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Box, CircularProgress, Typography, SxProps, Theme } from "@mui/material";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";

// --- Circuit Breaker Config ---
const MAX_FAILURES = 3;
const MIN_FETCH_INTERVAL = 10000;

// --- Default Styles ---
interface ChartStyleSet {
  container?: SxProps<Theme>;
  title?: SxProps<Theme>;
  tooltip?: React.CSSProperties;
  fontFamily?: string;
}

const defaultFontFamily = "Roboto, sans-serif";

const defaultStyles: Required<ChartStyleSet> = {
  container: {
    bgcolor: "#f4f4f4",
    borderRadius: 2,
    p: 2,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
    textAlign: "center",
    width: 400,
    height: 300,
  },
  title: {
    fontWeight: 600,
    color: "rgba(0,0,0,0.75)",
    fontFamily: defaultFontFamily,
  },
  tooltip: {
    position: "absolute",
    display: "none",
    background: "#333",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    pointerEvents: "none",
  },
  fontFamily: defaultFontFamily,
};

interface ChartDataPoint {
  timestamp: number;
  value: number;
}

interface ChartWidgetProps {
  client: any;
  nodeId: string;
  variable: string;
  title?: string;
  width?: number;
  height?: number;
  gradientColors?: [string, string];
  strokeColor?: string;
  strokeWidth?: number;
  styles?: ChartStyleSet;
  tooltipFormatter?: (point: { timestamp: number; value: number }) => string;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  client,
  nodeId,
  variable,
  title = "Chart",
  width = 400,
  height = 250,
  gradientColors = ["#1e88e5", "#90caf9"],
  strokeColor = "#1e88e5",
  strokeWidth = 2,
  styles = {},
  tooltipFormatter = (d) =>
    `${new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(d.timestamp))} - ${d.value}`,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
   const [data, setData] = useState<ChartDataPoint[]>([
    { timestamp: Date.now() - 60000, value: 33 },
    { timestamp: Date.now() - 30000, value: 44 },
    { timestamp: Date.now(), value: 38 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [node, setNode] = useState<any>(null);

  const isFetchingRef = useRef(false);
  const failureCountRef = useRef(0);
  const mountedRef = useRef(false);
  const lastFetchRef = useRef(0);

  // --- Normalize styles ---
  const normalizeSx = (sx: SxProps<Theme> | undefined): Record<string, any> => {
    if (!sx) return {};
    if (Array.isArray(sx)) return Object.assign({}, ...sx);
    if (typeof sx === "function") return sx({} as Theme) as Record<string, any>;
    return sx as Record<string, any>;
  };

  const containerSx = normalizeSx(styles.container);
  const titleSx = normalizeSx(styles.title);

  const mergedContainerSx: SxProps<Theme> = {
    ...defaultStyles.container,
    ...containerSx,
  };

  const mergedTitleSx: SxProps<Theme> = {
    ...defaultStyles.title,
    ...titleSx,
    fontFamily: styles.fontFamily ?? defaultFontFamily,
  };

  const mergedTooltipStyle: React.CSSProperties = {
    ...defaultStyles.tooltip,
    ...styles.tooltip,
  };

  // --- Initialize Node ---
  useEffect(() => {
    if (!client || !nodeId) return;
    const anedya = (client as any)._anedya as Anedya;
    const createdNode = anedya.NewNode(client, nodeId);
    setNode(createdNode);
  }, [client, nodeId]);

  // --- Fetch Data ---
  useEffect(() => {
    mountedRef.current = true;
    if (!node || data.length>0) return;

    const fetchData = async () => {
      const now = Date.now();
      if (
        isFetchingRef.current ||
        failureCountRef.current >= MAX_FAILURES ||
        now - lastFetchRef.current < MIN_FETCH_INTERVAL
      )
        return;

      isFetchingRef.current = true;
      lastFetchRef.current = now;

      try {
        setLoading(true);
        setError(null);

        const currentTime = Date.now();
        const twentyFourHoursAgo = currentTime - 86400 * 1000;
        const req = { variable, from: twentyFourHoursAgo, to: currentTime, limit: 20, order: "asc" };
        const res = await node.getData(req);

        if (!mountedRef.current) return;
                
        if (res.isSuccess && res.isDataAvailable) {

          setData(res.data);
          failureCountRef.current = 0;
        } else {
          setError("No data available");
        }
      } catch (err: any) {
        if (!mountedRef.current) return;
        console.error("Error fetching chart data:", err);
        setError(err?.message ?? "Failed to fetch chart data");
        failureCountRef.current += 1;
      } finally {
        if (!mountedRef.current) return;
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [node, variable]);

  // --- Draw Chart ---
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 60, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Gradient
    const defs = svg.append("defs");
    const gradientId = "chartGradient";
    const gradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", gradientColors[0])
      .attr("stop-opacity", 0.6);
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", gradientColors[1])
      .attr("stop-opacity", 0);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) ?? 10])
      .nice()
      .range([chartHeight, 0]);

    const area = d3
      .area<ChartDataPoint>()
      .x((d) => x(new Date(d.timestamp)))
      .y0(chartHeight)
      .y1((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    g.append("path").datum(data).attr("fill", `url(#${gradientId})`).attr("d", area);

    const line = d3
      .line<ChartDataPoint>()
      .x((d) => x(new Date(d.timestamp)))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", strokeColor)
      .attr("stroke-width", strokeWidth)
      .attr("d", line);

    // Scatter Dots
    g.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(new Date(d.timestamp)))
      .attr("cy", (d) => y(d.value))
      .attr("r", 4)
      .attr("fill", strokeColor)
      .on("mouseover", (event, d) => {
        const tooltip = tooltipRef.current;
        if (tooltip) {
          tooltip.innerHTML = tooltipFormatter(d);
          tooltip.style.display = "block";
          tooltip.style.left = event.pageX + 10 + "px";
          tooltip.style.top = event.pageY - 30 + "px";
        }
      })
      .on("mouseout", () => {
        const tooltip = tooltipRef.current;
        if (tooltip) tooltip.style.display = "none";
      });

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(4).tickFormat((d) => dateFormatter.format(d as Date)))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-35)")
      .attr("dx", "-0.5em")
      .attr("dy", "0.5em");

    g.append("g").call(d3.axisLeft(y).ticks(5));
  }, [data, width, height, strokeColor, strokeWidth, gradientColors]);

console.log(data,"data")
  return (
    <Box sx={mergedContainerSx} position="relative">
      {title && <Typography sx={mergedTitleSx}>{title}</Typography>}

      {loading ? (
        <CircularProgress />
      ) 
      // : error ? (
      //   <Typography color="error">{error}</Typography>
      // ) 
      : (
        <svg ref={svgRef} width={width} height={height}></svg>
      )}

      <div ref={tooltipRef} style={mergedTooltipStyle} />
    </Box>
  );
};

export default ChartWidget;

