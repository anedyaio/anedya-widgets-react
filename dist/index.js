// src/AnedyaFrontendClient.ts
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
var globalClient = null;
var globalNode = null;
function initAnedyaClient(tokenId, token, options) {
  const useGlobal = options?.useGlobal ?? false;
  const forceReinit = options?.forceReinit ?? false;
  if (useGlobal && globalClient && globalNode && !forceReinit) {
    return globalClient;
  }
  const anedya = new Anedya();
  const config = anedya.NewConfig(tokenId, token);
  const client = anedya.NewClient(config);
  if (useGlobal) {
    globalClient = client;
  }
  return client;
}

// src/widgets/LatestDataWidget.tsx
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var LatestDataWidget = ({
  client,
  nodeId,
  variable,
  refreshInterval = 0,
  fontSize = "16px",
  backgroundColor = "#f4f4f4",
  textColor = "#333",
  borderRadius = "8px",
  padding = "1rem"
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [node, setNode] = useState(null);
  useEffect(() => {
    if (client && nodeId) {
      const createdNode = client.NewNode(client, nodeId);
      setNode(createdNode);
    }
  }, [client, nodeId]);
  async function fetchData() {
    if (!node)
      return;
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
    } catch (err) {
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
  return /* @__PURE__ */ jsxs("div", { style: { border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }, children: [
    /* @__PURE__ */ jsxs("p", { children: [
      "Latest value: ",
      loading ? "Loading..." : error ? "Error fetching latest data" : data?.value ?? "Error fetching latest data"
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: fetchData, disabled: loading, children: loading ? "Refreshing..." : "Refresh Now" })
  ] });
};
export {
  LatestDataWidget,
  initAnedyaClient
};
//# sourceMappingURL=index.js.map