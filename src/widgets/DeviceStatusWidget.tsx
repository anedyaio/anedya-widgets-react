import React, { useState, useEffect } from "react";
import { useAnedyaNode } from "../AnedyaProvider";

interface DeviceStatusProps {
  threshold: number;
  backgroundColor?: string;
  textColor?: string;
}

export function DeviceStatusWidget({
  threshold,
  backgroundColor = "#f4f4f4",
  textColor = "#333",
}: DeviceStatusProps) {
  const node = useAnedyaNode();
  const [status, setStatus] = useState<any>(null);

  async function fetchStatus() {
    const res = await node.getDeviceStatus(threshold);
    if (res.isSuccess) {
      setStatus(res.data[node.getNodeId()]);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div
      style={{
        backgroundColor,
        color: textColor,
        padding: "1rem",
        margin: "1rem 0",
        borderRadius: "8px",
      }}
    >
      <h2>Device Status</h2>
      {status ? (
        <p>
          Online: {status.online ? "✅ Yes" : "❌ No"} <br />
          Last Heartbeat:{" "}
          {new Date(status.lastHeartbeat * 1000).toLocaleString()}
        </p>
      ) : (
        <p>Loading...</p>
      )}
      <button onClick={fetchStatus}>Refresh Status</button>
    </div>
  );
}
