import React, { useEffect, useMemo, useRef, useState } from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";

import { AnedyaClient } from "./types";
import MainCard from "./MainCard";
// material-ui
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CircularProgress, Theme, SxProps } from "@mui/material";
// --- Default color ranges ---
const defaultColorRanges = [
  { max: 20, color: "red" },
  { max: 50, color: "yellow" },
  { max: Infinity, color: "green" },
];

// --- Default styles ---
interface StyleSet {
  container?: SxProps<Theme>;
  label?: SxProps<Theme>;
  value?: SxProps<Theme>;
  unit?: SxProps<Theme>;
  fontFamily?: string; // optional global font family for all 3
}

const defaultFontFamily = "Roboto, sans-serif";

const defaultStyles: Required<StyleSet> = {
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
    width: 200,
    height: 200,
  },
  label: { fontWeight: 500, color: "#ffffff", fontFamily: defaultFontFamily },
  value: { fontWeight: 700, color: "#ffffff", fontFamily: defaultFontFamily },
  unit: { fontWeight: 400, color: "#ffffff", fontFamily: defaultFontFamily },
  fontFamily: defaultFontFamily,
};

// --- Helper: get color from range ---
const getColorFromRange = (value: number, ranges = defaultColorRanges) => {
  const range = ranges.find((r) => value <= r.max);
  return range?.color ?? "#333";
};

// --- Helper: normalize sx for TypeScript ---
const normalizeSx = (sx: SxProps<Theme> | undefined): Record<string, any> => {
  if (!sx) return {};
  if (Array.isArray(sx)) return Object.assign({}, ...sx);
  if (typeof sx === "function") return sx({} as Theme) as Record<string, any>;
  return sx as Record<string, any>;
};

// --- Circuit Breaker Config ---
const MAX_FAILURES = 3;

// --- Rate limiter settings ---
const MIN_FETCH_INTERVAL = 10000; // 10 seconds between fetches

// --- Props ---
interface WidgetProps {
  client: any;
  nodeId: string;
  variable: string;
  title?: string;
  unit?: string;
  styles?: StyleSet;
  colorRange?: typeof defaultColorRanges;
  colorRangeCallback?: (value: number, defaultColor: string) => string;
}

export const LatestDataWidget: React.FC<WidgetProps> = ({
  client,
  nodeId,
  variable,
  title = "Latest Data",
  unit = "",
  styles = {},
  colorRange,
  colorRangeCallback,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [node, setNode] = useState<any>(null); // <-- store node in state

  // --- Preventing stale closures / infinite renders ---

  const isFetchingRef = useRef(false);
  const failureCountRef = useRef(0);
 const mountedRef = useRef(false);
const lastFetchRef = useRef(0);





  // Create node once when client or nodeId changes
  // useEffect(() => {
  //   if (client && nodeId) {
  //     const anedya = new Anedya();
  //     const createdNode = anedya.NewNode(client, nodeId);
  //     setNode(createdNode);
  //   }
  // }, [client, nodeId]);


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
        setData(res.data?.value);
        setError("");
      } else {
        setData(null);
        setError("No data available");
      }
       failureCountRef.current = 0; // reset on success
    } catch (err: any) {
  if (!mountedRef.current) return;
  console.error("Error fetching latest data:", err);
      setData(null);
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


  // --- Normalize styles ---
  const containerSx = normalizeSx(styles?.container);
  const labelSx = normalizeSx(styles?.label);
  const valueSx = normalizeSx(styles?.value);
  const unitSx = normalizeSx(styles?.unit);

  // --- Container dimensions with TypeScript-safe default ---
  const containerDefaults: any = defaultStyles.container!;
  const width = containerSx.width ?? containerDefaults.width;
  const height = containerSx.height ?? containerDefaults.height;

  // --- Scaled font sizes ---
  const baseFont = Math.min(Number(width), Number(height)) * 0.15;

  // --- Compute font sizes dynamically if not provided by user ---
  const labelFont = (styles?.label as any)?.fontSize ?? baseFont * 0.6;

  const valueFont = (styles?.value as any)?.fontSize ?? baseFont * 1.2;

  const unitFont = (styles?.unit as any)?.fontSize ?? baseFont * 0.8;

  // --- Font family handling ---
  const globalFontFamily = styles?.fontFamily ?? "Roboto";
  const labelFontFamily = labelSx.fontFamily ?? globalFontFamily;
  const valueFontFamily = valueSx.fontFamily ?? globalFontFamily;
  const unitFontFamily = unitSx.fontFamily ?? globalFontFamily;

  // --- Gap scaling ---
  const containerGap = (containerSx as any).gap ?? baseFont * 0.2; // scale gap if user didn't pass one

  // --- Compute dynamic text color ---
  const finalRange = colorRange ?? defaultColorRanges;
  let textColor = getColorFromRange(Number(data) ?? 0, finalRange);
  if (colorRangeCallback) {
    textColor = colorRangeCallback(Number(data) ?? 0, textColor);
  }

  // --- Merge styles safely ---
  const mergedContainerSx: SxProps<Theme> = {
    ...defaultStyles.container,
    ...containerSx,
    gap: containerGap,
  };
  const mergedLabelSx: SxProps<Theme> = {
    ...defaultStyles.label,
    fontSize: labelFont,
    ...labelSx,
    fontFamily: labelFontFamily,
  };
  const mergedValueSx: SxProps<Theme> = {
    ...defaultStyles.value,
    fontSize: valueFont,
    color: textColor,
    ...valueSx,
    fontFamily: valueFontFamily,
  };
  const mergedUnitSx: SxProps<Theme> = {
    ...defaultStyles.unit,
    fontSize: unitFont,
    ...unitSx,
    fontFamily: unitFontFamily,
  };
  return (
    <Box sx={mergedContainerSx}>
      {title && <Box sx={mergedLabelSx}>{title}</Box>}
      <Box sx={mergedValueSx}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <CircularProgress
              size={Math.min(Number(width), Number(height)) * 0.3} // scales with container
              thickness={4}
            />
          </Box>
        ) : error ? (
          "Error fetching latest data"
        ) : (
          data ?? "--"
        )}
      </Box>
      {unit && <Box sx={mergedUnitSx}>{unit}</Box>}
    </Box>
  );
};

export default LatestDataWidget;

