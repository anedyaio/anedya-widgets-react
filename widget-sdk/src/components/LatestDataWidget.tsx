import React, { useEffect, useState } from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";

import { AnedyaClient } from "./types";

interface LatestDataWidgetProps {
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

export const LatestDataWidget: React.FC<LatestDataWidgetProps> = ({
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
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [node, setNode] = useState<any>(null); // <-- store node in state

  // Create node once when client or nodeId changes
  useEffect(() => {
    if (client && nodeId) {
      const createdNode = anedya.NewNode(client, nodeId);
      setNode(createdNode);
    }
  }, [client, nodeId]);

  async function fetchData() {
    if (!node) return; // don't try if node not ready
    try {
      setLoading(true);
      setError(null);
      const res = await node.getLatestData(variable);
      if (res.isSuccess && res.isDataAvailable) {
        setData(res.data);
      } else {
        setData(null);
        setError("No data available");
      }
    } catch (err: any) {
      console.error("Error fetching latest data:", err);
      setData(null);
      setError(err?.message ?? "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [node, variable]);

  useEffect(() => {
    if (refreshInterval > 0 && node) {
      const intervalId = setInterval(fetchData, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, node, variable]);

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "1rem",
        borderRadius: "8px",
        height: "200px",
        width: "200px",
        display:"flex",
        justifyContent:"flex-start",
        alignItems:"center",
        flexDirection:"column",
        marginTop:20
      }}
    >
      <p>
        {title}:{" "}
        {loading
          ? "Loading..."
          : error
          ? "Error fetching latest data"
          : data?.value ?? "Error fetching latest data"}
      </p>
      <button onClick={fetchData} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh Now"}
      </button>
    </div>
  );
};

export default LatestDataWidget;
