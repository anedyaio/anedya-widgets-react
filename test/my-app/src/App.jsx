import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "../../../src";
import { GaugeWidget } from "../../../src/components/GaugeChart/GaugeChartWidget";

const tokenId = "sdaIC9xpHKdPQpWXPtOlG1Pl";
const token =
  "eMYc82DiKX2oO9TgXylCCeyugok8MDOY65XMTRDLdsh2ENHOi0Tyv3RmfCuLQ6kb";
const nodeId = "019e8d46-e895-713f-b763-6969b36e37a4";

const anedya = new Anedya();
const config = anedya.newConfig(tokenId, token);
const client = anedya.newClient(config);
const node = anedya.newNode(client, nodeId);

/**
 * A reusable theme, shareable across every CardWidget instance in your
 * app. Only specify the slots you actually want to change from the
 * built-in default — anything omitted falls back to lightTheme/darkTheme.
 */
const emeraldTheme = {
  classNames: {
    container: "bg-emerald-50 border-emerald-200",
    title: "text-emerald-700",
    value: "text-emerald-900",
    label: "text-emerald-500",
  },
};

const commonProps = { node, variable: "humidity" };

export default function App() {
  return (
    <div
      style={{ padding: "2rem", display: "flex", gap: 24, flexWrap: "wrap" }}
    >
      {/* ============================================================
       * 1. Default appearance — no theme, no classNames, no
       * formatting props. Every fallback in the widget in one place.
       * ============================================================ */}
      <CardWidget {...commonProps} title="Default" unit="%" precision={1} />

      {/* ============================================================
       * 2. theme — a reusable, shareable WidgetTheme object. Same
       * effect across every widget instance that uses it.
       * ============================================================ */}
      <CardWidget
        {...commonProps}
        title="Emerald Theme"
        unit="%"
        precision={1}
        theme={emeraldTheme}
      />

      {/* Built-in preset names also work directly: */}
      <CardWidget
        {...commonProps}
        title="Dark Preset"
        unit="%"
        precision={1}
        theme="dark"
      />

      {/* ============================================================
       * 3. classNames vs className — THE distinction to understand:
       *
       *   - `classNames` (plural, an OBJECT): per-SLOT overrides.
       *     Keys are "container" | "title" | "value" | "unit" | "label"
       *     — lets you reach INSIDE the widget and style individual
       *     pieces independently.
       *
       *   - `className` (singular, a STRING): the ordinary React
       *     convention — one class applied ONLY to the widget's
       *     outermost container element, same as you'd pass to any
       *     other component. It's merged (via twMerge) with whatever
       *     classNames.container already resolved to, not a
       *     replacement for it.
       *
       * This example uses BOTH at once so the difference is visible:
       * className adds a shadow to the outer box, classNames.value/
       * classNames.title style two INNER pieces independently.
       * ============================================================ */}
      <CardWidget
        node={node}
        client={client}
        nodeId={nodeId}
        variable="humidity"
        title="Default"
        unit="%"
        precision={1}
      />

      {/* Reusable theme */}
      <CardWidget
        node={node}
        client={client}
        nodeId={nodeId}
        variable="humidity"
        title="Emerald Theme"
        unit="%"
        precision={1}
        theme={emeraldTheme}
      />

      {/* Per-instance overrides */}
      <CardWidget
        node={node}
        client={client}
        nodeId={nodeId}
        variable="humidity"
        title="Custom Classes"
        unit="%"
        precision={1}
        classNames={{
          value: "text-red-500 text-5xl",
          title: "uppercase tracking-wider",
        }}
      />

      {/* Plain CSS */}
      <CardWidget
        node={node}
        client={client}
        nodeId={nodeId}
        variable="humidity"
        title="CSS Classes"
        unit="%"
        precision={1}
        classNames={{
          container: "my-card",
          value: "my-card-value",
        }}
      />

      {/* <GaugeWidget {...commonProps} title="Temp" unit="°C" precision={1} /> */}

      {/* Needle gauge with threshold colors */}
      {/* <GaugeWidget
        {...commonProps}
        variant="needle"
        title="CPU"
        needle={{ show: true }}
        thresholds={[
          { value: 50, color: "#10b981" },
          { value: 80, color: "#f59e0b" },
          { value: 100, color: "#ef4444" },
        ]}
      /> */}

      {/* Segmented gauge */}
      {/* <GaugeWidget
        {...commonProps}
        variant="segmented"
        segments={[
          { from: 0, to: 30, color: "#ef4444" },
          { from: 30, to: 70, color: "#f59e0b" },
          { from: 70, to: 100, color: "#10b981" },
        ]}
      /> */}

      {/* Multi-bar */}
      {/* <GaugeWidget
        {...commonProps}
        variant="multiBar"
        bars={[
          { value: 25, color: "#3b82f6", label: "CPU" },
          { value: 65, color: "#8b5cf6", label: "Memory" },
        ]}
      /> */}

      {/* Responsive – will resize to its container */}
      {/* <div style={{ width: "50%", height: "250px" }}>
        <GaugeWidget {...commonProps} variant="needle" />
      </div> */}
    </div>
  );
}

{
  /* 
//create react app
//link public-widget-sdk
//npm run dev
//send this file tp yash to copy paste  */
}
