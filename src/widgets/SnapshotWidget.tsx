import React, { useState, useEffect } from "react";
import { useAnedyaNode } from "../AnedyaProvider";

interface SnapshotProps {
  variable: string;
  timestamp: number;
  fontSize?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function SnapshotWidget({
  variable,
  timestamp,
  fontSize = "16px",
  backgroundColor = "#f4f4f4",
  textColor = "#333",
}: SnapshotProps) {
  const node = useAnedyaNode();
  const [snapshot, setSnapshot] = useState<any>(null);

  async function fetchSnapshot() {
    const req = { time: timestamp, variable };
    const res = await node.getSnapshot(req);
    if (res.isSuccess) {
      setSnapshot(res.data);
    }
  }

  useEffect(() => {
    fetchSnapshot();
  }, []);

  return (
    <div
      style={{
        backgroundColor,
        color: textColor,
        fontSize,
        borderRadius: "8px",
        padding: "1rem",
        margin: "1rem 0",
      }}
    >
      <h2>Snapshot for {variable}</h2>
      <p>Time: {new Date(timestamp * 1000).toLocaleString()}</p>
      <p>Value: {snapshot?.value ?? "No data found"}</p>
      <button onClick={fetchSnapshot}>Refresh Snapshot</button>
    </div>
  );
}
