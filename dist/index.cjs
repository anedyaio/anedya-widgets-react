"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  LatestDataWidget: () => LatestDataWidget,
  initAnedyaClient: () => initAnedyaClient
});
module.exports = __toCommonJS(src_exports);

// src/AnedyaFrontendClient.ts
var import_anedya_frontend_sdk = require("@anedyasystems/anedya-frontend-sdk");
var globalClient = null;
var globalNode = null;
function initAnedyaClient(tokenId, token, options) {
  const useGlobal = options?.useGlobal ?? false;
  const forceReinit = options?.forceReinit ?? false;
  if (useGlobal && globalClient && globalNode && !forceReinit) {
    return globalClient;
  }
  const anedya = new import_anedya_frontend_sdk.Anedya();
  const config = anedya.NewConfig(tokenId, token);
  const client = anedya.NewClient(config);
  if (useGlobal) {
    globalClient = client;
  }
  return client;
}

// src/widgets/LatestDataWidget.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
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
  const [data, setData] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const [node, setNode] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
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
  (0, import_react.useEffect)(() => {
    fetchData();
  }, [node, variable]);
  (0, import_react.useEffect)(() => {
    if (refreshInterval > 0 && node) {
      const intervalId = setInterval(fetchData, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, node, variable]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
      "Latest value: ",
      loading ? "Loading..." : error ? "Error fetching latest data" : data?.value ?? "Error fetching latest data"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: fetchData, disabled: loading, children: loading ? "Refreshing..." : "Refresh Now" })
  ] });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LatestDataWidget,
  initAnedyaClient
});
//# sourceMappingURL=index.cjs.map