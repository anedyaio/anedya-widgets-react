import React, { useState, useCallback, JSX } from "react";

import { AnedyaClient } from "../components/types";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";

// --- Default color ranges ---
const defaultColorRanges = [
  { max: 20, color: "red" },
  { max: 50, color: "yellow" },
  { max: Infinity, color: "green" },
];
import { CSSProperties } from "react";
import LatestDataWidgetComponent from "../components/LatestDataWidget";

// --- Default styles ---
interface StyleSet {
  container?: CSSProperties;
  label?: CSSProperties;
  value?: CSSProperties;
  unit?: CSSProperties;
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


interface LatestDataWidgetProps {
 client: AnedyaClient;
  nodeId: string;
  variable: string;
  title?: string;
  unit?: string;
  styles?: StyleSet;
  colorRange?: typeof defaultColorRanges;
  colorRangeCallback?: (value: number, defaultColor: string) => string;
  fontFamily? : string;
  displayText?: DisplayTextFormatter;
  onStyleChange?:(value:number)=>{}
}

export const LatestDataWidget: React.FC<LatestDataWidgetProps> = React.memo((
  {
   client,
  nodeId,
  variable,
  title,
  unit,
  styles = {},
  colorRange,
  colorRangeCallback,
  displayText,
  onStyleChange
  } 
) => {
  return (
    <>
   
        <LatestDataWidgetComponent
        displayText={displayText}
         client={client}
  nodeId={nodeId}
  variable={variable}
  title={title}
  unit={unit}
  styles = {styles}
  colorRange={colorRange}
  colorRangeCallback={colorRangeCallback}
  onStyleChange={onStyleChange}
        />
      
    </>
  );
}, 
(prev, next) => JSON.stringify(prev) === JSON.stringify(next))
