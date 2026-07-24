import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "../../../src";
import { GaugeWidget } from "../../../src/components/GaugeChart/GaugeChartWidget";
import "../../../dist/style.css";

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

      {/* <div style={{backgroundColor:"white"}}> */}
        <GaugeWidget 
        {...commonProps} 
        min={0}
        max={100}
        // size= not working proper 
        valueLabel={{ precision: 1 }} 
        arc={{
          startAngle:-90,
          endAngle:90,
          // radius: not working proper
          thickness:30,
          // cornerRadius:100
        }}
        track={{
          show:true,
          color:"yellow"
        }}
        fillMode="progress"
        color="#1fa2ff"
        needle={{
          show:true,
          type:"triangle",
          length:"medium",
          width:5,
          color:"white",
          capRadius:7
       }}
       needleLabel={{
        show:true,
        formatter:(() => {"Hello"})
       }}
       labels={{
        show:true,
        position:"outside"
       }}
       scale={{
        minLabel:"Minimum",
        maxLabel:"Maximum"
       }}
       ticks={{
        show:true,
        count:10,
        position:"outside",
        length:10,
        labels:true,
       }}
       animation={{
        duration:5000,
        easing:"easeElasticOut"
       }}
       tooltip={{
        show:false
       }}
       classNames={{
        title:"text-white",
        tickLabel:"text-white text-lg",
        label:"text-white",
        value:"text-white"
       }}
        />
      {/* </div> */}
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

{/* ============================================================
       * 1. Progress variant (default) — track + fill + needle,
       * value below needle, variable name below that.
       * ============================================================ */}
      {/* <div style={{ width: 320, height: 240 }}>
        <GaugeWidget
          {...commonProps}
          title="Progress"
          value={47}
          valueLabel={{ suffix: "%", precision: 0 }}
        />
      </div> */}

      {/* ============================================================
       * 2. Needle variant — explicit ticks + needle, no fill sweep
       * (needle-only reading, like a speedometer).
       * ============================================================ */}
      {/* <div style={{ width: 320, height: 240 }}> */}
        <GaugeWidget
          {...commonProps}
          variant="needle"
          needle={{ 
            show: true,
            type:"triangle",
            color:"#1fa2ff"
          }}
          title="Needle"
          // value={68}
          min={0}
          max={100}
          ticks={{ show: true, count: 6 }}
          valueLabel={{ suffix: "°C", precision: 1 }}
          classNames={{value:"text-white"}}
        />
      {/* </div> */}

      {/* ============================================================
       * 3. Segmented variant — colored ranges (risk zones), with
       * needle enabled to point at the current value (like your
       * ChartExpo reference image).
       * ============================================================ */}
      {/* <div style={{ width: 820, height: 840 }}> */}
        <GaugeWidget
          {...commonProps}
          variant="segmented"
          title="Segmented"
          // value={72}
          min={0}
          max={100}
          needle={{ 
            show: true,
            type:"line"
          }}
          arc={{
            gap:0,
            cornerRadius:0,
          }}
          segments={[
            { from: 0, to: 20, color: "#ef4444" },
            { from: 20, to: 40, color: "#f59e0b" },
            { from: 40, to: 60, color: "#22c55e" },
            { from: 60, to: 80, color: "#ef4444" },
            { from: 80, to: 100, color: "#f59e0b" }
          ]}
          valueLabel={{ precision: 0 }}
          classNames={{value:"text-white"}}
          responsive={true}
        />
      {/* </div> */}

      {/* ============================================================
       * 4. Multi-bar variant — concentric bars, each with its own
       * value/color/label. Needle is not shown for this variant.
       * ============================================================ */}
      {/* <div style={{ width: 320, height: 240 }}> */}
        {/* <GaugeWidget
          {...commonProps}
          variant="multiBar"
          title="Multi-Bar"
          min={0}
          max={100}
          bars={[
            { value: 82, color: "#6366f1", label: "CPU" },
            { value: 64, color: "#22c55e", label: "Memory" },
            { value: 41, color: "#f59e0b", label: "Disk" },
          ]}
          valueLabel={{ show: false }}
          classNames={{value:"text-white"}}
        /> */}
      {/* </div> */}

      {/* ============================================================
       * 5. Bonus — gradient fill on the progress variant, per your
       * "user can pass their own gradient" requirement.
       * ============================================================ */}
      {/* <div style={{ width: 320, height: 240 }}> */}
        <GaugeWidget
          {...commonProps}
          title="Gradient Fill"
          // value={55}
          color={["#f43f5e", "#f59e0b", "#1fa2ff"]}
          valueLabel={{ suffix: "%", precision: 0 }}
          classNames={{value:"text-white"}}
        />
      {/* </div> */}

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
