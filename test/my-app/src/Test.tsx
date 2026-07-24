import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "../../../src";
import { GaugeWidget } from "../../../src/components/GaugeChart/GaugeChartWidget";
import "../../../dist/styles.css";

import { relativeTime } from "../../../src/helpers/formatters";
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

<CardWidget {...commonProps}title="Default" unit="%" decimalPlaces={1}
      labelText={(ts) => `Last synced ${relativeTime(ts)}`}
    
       />


      {/* ============================================================
       * 2. theme — a reusable, shareable WidgetTheme object. Same
       * effect across every widget instance that uses it.
       * ============================================================ */}
      <CardWidget {...commonProps} title="Emerald Theme" unit="%" decimalPlaces={1} theme={emeraldTheme} />

      {/* Built-in preset names also work directly: */}
      <CardWidget {...commonProps} title="Dark Preset" unit="%" decimalPlaces={1} theme="dark" />

      {/* ============================================================
       * 3. styles vs className — THE distinction to understand:
       *
       *   - `styles` (plural, an OBJECT): per-SLOT overrides.
       *     Keys are "container" | "title" | "value" | "unit" | "label"
       *     — lets you reach INSIDE the widget and style individual
       *     pieces independently.
       *
       *   - `className` (singular, a STRING): the ordinary React
       *     convention — one class applied ONLY to the widget's
       *     outermost container element, same as you'd pass to any
       *     other component. It's merged (via twMerge) with whatever
       *     styles.container already resolved to, not a
       *     replacement for it.
       *
       * This example uses BOTH at once so the difference is visible:
       * className adds a shadow to the outer box, styles.value/
       * styles.title style two INNER pieces independently.
       * ============================================================ */}
      <CardWidget
        {...commonProps}
        title="styles vs className"
        unit="%"
        decimalPlaces={1}
        className="shadow-lg shadow-amber-400" // <- outer box only, ordinary React convention
        styles={{
          value: "text-red-500 text-5xl", // <- targets the INNER "value" slot specifically
          title: "uppercase tracking-wider text-yellow-500", // <- targets the INNER "title" slot specifically
        }}
        
      />

      {/* ============================================================
       * 4. Plain CSS classes — styles works with ANY class source,
       * not just Tailwind. These reference plain hand-written CSS
       * classes (e.g. defined in a .css file this app already imports).
       * ============================================================ */}
      {/* <CardWidget
        {...commonProps}
        title="Plain CSS Classes"
        unit="%"
        decimalPlaces={1}
        styles={{ container: "my-card", value: "my-card-value" }}
      /> */}

      {/* ============================================================
       * 5. Native Tailwind responsive prefixes — `sm:`/`md:`/`lg:`
       * work exactly as they do anywhere else in your app, because
       * styles just forwards whatever string you write straight
       * to `className`. This widget does NOT have its own custom
       * breakpoint system — these prefixes are compiled by YOUR
       * project's Tailwind config and respond to the BROWSER VIEWPORT,
       * same as native Tailwind everywhere else. If your own
       * tailwind.config.js customizes `theme.screens`, these prefixes
       * automatically follow that customization too — nothing to
       * configure on the widget's side.
       * ============================================================ */}
      {/* <CardWidget
        {...commonProps}
        title="Responsive Text"
        unit="%"
        decimalPlaces={1}
        styles={{ value: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl" }}
      /> */}

      {/* ============================================================
       * 6. formatValue / labelText — simple formatting hooks, distinct
       * from styling. formatValue controls the displayed number's
       * text; labelText controls the caption under it.
       * ============================================================ */}
      {/* <CardWidget
        {...commonProps}
        title="Custom Formatting"
        formatValue={(v) => `${v.toFixed(2)} % RH`}
        labelText={(ts) => `As of ${new Date(ts).toLocaleDateString()}`}
       
      /> */}

      {/* ============================================================
       * 7. onStyleChange — conditional class overrides driven by the
       * RAW fetched data ({ value, timestamp }), always applied on top
       * of everything else (theme, styles, className).
       * ============================================================ */}
      {/* <CardWidget
        {...commonProps}
        title="Threshold Coloring"
        unit="%"
        decimalPlaces={1}

       onDataChange={(data) => {
    if (!data) return;

    if (data.value > 80) {
      return {
        title: "High Humidity",
        theme: "dark",
        styles: {
          value: "text-red-500"
        }
      };
    }

    return {
      title: "Humidity",
      theme: "light"
    };
  }}
  
      /> */}

      {/* ============================================================
       * 8. Sizing — width/height/minWidth/maxWidth are plain props,
       * applied as inline styles on the container, independent of the
       * whole styles/theme system.
       * ============================================================ */}
      {/* <CardWidget {...commonProps} title="Custom Size" unit="%" width={320} minWidth={280} maxWidth={400} height={200} /> */}
    

      {/* <GaugeWidget
        {...commonProps}
        // label="Gauge Chart"
        // min={0}
        // max={100}
        // size={400}
        // value={99}
        // width={400}
        // height={400}
        // valueLabel={{ precision: 1 }}
        // arc={{
        //   startAngle: -90,
        //   endAngle: 90,
        //   // radius: not working proper
        //   thickness: 70,
        //   // cornerRadius:100
        // }}
        track={{
          show: true,
          color: "",
        }}
        fillMode="progress"
        // color={["red","orange", "yellow", "green"]}
        color="#1fa2ff"
        needle={{
          show: true,
          type: "line",
          length: "medium",
          width: 3,
          color: "white",
          capRadius: 7,
        }}
        // needleLabel={{
        //   show: true,
        //   formatter: () => {
        //     "Hello";
        //   },
        // }}
        // labels={{
        //   show: true,
        //   position: "outside",
        // }}
        // scale={{
        //   minLabel: "Hello",
        //   maxLabel: "World",
        // }}
        // ticks={{
        //   show: true,
        //   count: 10,
        //   position: "outside",
        //   length: 10,
        //   labels: true,
        // }}
        animation={{
          duration: 4000,
          easing: "easeElasticOut", // easeCubicOut, easeElasticOut
        }}
        // tooltip={{
        //   show:false,
        // }}
        // classNames={{
        //   title: "text-white",
        //   tickLabel: "text-white text-lg",
        //   label: "text-red",
        //   value: "text-white",
        // }}
        theme="dark"
      /> */}

      <GaugeWidget
        {...commonProps}
        // color="#1fa2ff"
        // color={["#9796f0", "#fbc7d4"]}
        // color={["#799F0C", "#FFE000"]}
        color={["#A5FECB", "#20BDFF", "#5433FF"]}
        title="Gauge Chart Widget"
        // value={40}
        // labelText={"Hello"}
        // valueLabel={"Hello"}
        arc={{
          // radius:400,
          // cornerRadius:10,
          thickness: 80,
        }}
        animation={{
          duration: 4000,
          easing: "easeElasticOut", // easeCubicOut, easeElasticOut
        }}
        needle={{
          color: "white",
          length: "short",
          type: "triangle",
          animation: true,
        }}
        theme="dark"
        styles={{
          container: "",
          title: "text-black text-[90px]",
        }}
      />

      <GaugeWidget
        title="Battery Level"
        value={65}
        unit="%"
        min={0}
        max={100}
        className="w-64 mx-auto"
        theme="dark"
      />

      <GaugeWidget
        title="CPU Usage"
        value={78}
        unit="%"
        theme="dark"
        // 'style' affects ONLY the outer wrapper <div>
        style={{
          backgroundColor: "#1e1e2f",
          borderRadius: "16px",
          padding: "10px",
        }}
        // 'styles' affects specific internal SVG/HTML slots via Tailwind classes
        styles={{
          container: "border border-gray-700", // merges with outer wrapper
          title: "text-purple-400 text-xs uppercase tracking-wider",
          value: "text-white text-2xl font-mono",
          unit: "text-gray-400 text-sm",
          label: "text-gray-500 text-[10px]",
          bar: "fill-gradient-to-r from-purple-500 to-pink-500", // if using Tailwind gradients
          needle: "stroke-pink-400 stroke-2",
          needleCap: "fill-pink-400",
        }}
      />

      <GaugeWidget
        value={85}
        theme="dark" // Applies gaugeDarkTheme internally
        // 1. style: Sets fixed size and injects CSS variables for text scaling
        style={{
          width: "400px",
          height: "400px",
          padding: 0,
        }}
        // 2. styles: Override internal slot classes
        styles={{
          container: "bg-gray-900 rounded-2xl border border-red-700", // Merged with dark theme's container
          bar: "text-emerald-400", // Overrides dark theme's "text-indigo-400"
          needle: "text-yellow-500",
          needleCap: "red", // Makes the needle yellow
          value: "text-emerald-50", // Overrides dark theme's "text-white"
          label: "text-gray-400", // Overrides dark theme's "text-slate-500"
        }}
      />

      <GaugeWidget
        value={75}
        needle={{
          type: "triangle", // 'drop' or 'triangle' use fill
        }}
        styles={{
          bar: "text-red-500",
          track: "text-yellow-300",
          needle: "text-green-600",
          needleCap: "text-green-600",
        }}
      />

      <GaugeWidget
        responsive={true} // ensure it reacts to container
        aspectRatio={1.6}
        value={34}
        valueLabel={{
          show: true,
        }}
        // make it wider than tall, reducing overall height
        // OR set fixed size:
        size={300}
        styles={{
          container: "bg-gray-900 rounded-2xl border border-red-700",
        }}
      />

      {/* // 1. Show a custom static text */}
      <GaugeWidget
        value={78}
        labelText={() => "Last reading"} // Always shows "Last reading"
      />

      {/* // 2. Format the timestamp exactly how you want */}
      <GaugeWidget
        value={78}
        labelText={(timestamp) =>
          `Updated at ${new Date(timestamp).toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}`
        }
        // Output: "Updated at 02:30:45 PM"
      />

      {/* // 3. Show relative time with custom wording */}
      <GaugeWidget
        value={78}
        labelText={(timestamp) => {
          const diff = Math.floor((Date.now() - timestamp) / 60000);
          if (diff < 1) return "Just now";
          if (diff < 60) return `${diff} min ago`;
          return `${Math.floor(diff / 60)} hours ago`;
        }}
      />

      {/* // 4. Hide the label entirely (return null or empty string) */}
      <GaugeWidget
        value={78}
        labelText={() => null} // No label shown
      />
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
