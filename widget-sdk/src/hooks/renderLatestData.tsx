import React, { useState, useCallback, JSX } from "react";
import { LatestDataWidget } from "../components/LatestDataWidget";
import { AnedyaClient } from "../components/types";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";

interface renderLatestDataProps {
  client: AnedyaClient;
  anedya: Anedya;
  nodeId: string;
  variable: string;
  title: string;
  refreshInterval?: number; // in milliseconds, optional
  backgroundColor?: string;
  fontSize?: string;
  textColor?: string;
  borderRadius?: string;
  padding?: string;
}
interface RenderLatestDataReturn {
  WidgetComponent: JSX.Element;
}
export const renderLatestData = ({
  client,
  anedya,
  nodeId,
  variable,
  title,
  refreshInterval = 0,

  fontSize = "16px",
  backgroundColor = "#f4f4f4",
  textColor = "#333",
  borderRadius = "8px",
  padding = "1rem",
}: renderLatestDataProps): //  position = "bottom-right"
RenderLatestDataReturn => {
  const WidgetComponent = (
    <div
      style={{
        height: "200px",
        width: "200px",
      }}
    >
      <LatestDataWidget
        title={title}
        anedya={anedya}
        client={client}
        nodeId={nodeId}
        variable={variable}
        refreshInterval={refreshInterval}
        fontSize={fontSize}
        backgroundColor={backgroundColor}
        textColor={textColor}
        borderRadius={borderRadius}
        padding={padding}
      />
    </div>
  );

  return { WidgetComponent };
};
