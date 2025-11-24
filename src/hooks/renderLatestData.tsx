import React, { useState, useCallback, JSX } from "react";
import { LatestDataWidget } from "../components/LatestDataWidget";
import { AnedyaClient } from "../components/types";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";

// --- Default color ranges ---
const defaultColorRanges = [
  { max: 20, color: "red" },
  { max: 50, color: "yellow" },
  { max: Infinity, color: "green" },
];
import { CSSProperties } from "react";

// --- Default styles ---
interface StyleSet {
  container?: CSSProperties;
  label?: CSSProperties;
  value?: CSSProperties;
  unit?: CSSProperties;
}

interface LatestDataComponentProps {
 client: AnedyaClient;
  nodeId: string;
  variable: string;
  title?: string;
  unit?: string;
  styles?: StyleSet;
  colorRange?: typeof defaultColorRanges;
  colorRangeCallback?: (value: number, defaultColor: string) => string;
  fontFamily? : string
}

export const LatestDataComponent: React.FC<LatestDataComponentProps> = React.memo((
  {
   client,
  nodeId,
  variable,
  title,
  unit,
  styles = {},
  colorRange,
  colorRangeCallback,
  } 
) => {
  return (
    <>
      <div
        style={{
          height: "200px",
          width: "200px",
        }}
      >
        <LatestDataWidget
         client={client}
  nodeId={nodeId}
  variable={variable}
  title={title}
  unit={unit}
  styles = {styles}
  colorRange={colorRange}
  colorRangeCallback={colorRangeCallback}
        />
      </div>
    </>
  );
}, 
(prev, next) => JSON.stringify(prev) === JSON.stringify(next))
