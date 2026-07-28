import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "../../../src";
import { GaugeWidget } from "../../../src/components/GaugeChart/GaugeChartWidget";
import "public-widget-sdk/styles.css";
import { relativeTime } from "public-widget-sdk/formatters";
import "./index.css";
// This demo has its own Tailwind build (see vite.config.js + src/index.css),
// specifically to test consumer-side class overrides via `className`/`styles`.
// A real consumer app needs the same setup — the widget package's own
// precompiled stylesheet only covers its built-in default classes, not
// arbitrary classes a consumer passes in.

const tokenId = import.meta.env.VITE_CARD_WIDGET_TOKEN_ID;
const token = import.meta.env.VITE_CARD_WIDGET_TOKEN;
const nodeId = import.meta.env.VITE_CARD_WIDGET_NODE_ID;

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
  styles: {
    container: "bg-emerald-50 border-emerald-200",
    title: "text-emerald-700",
    value: "text-emerald-900",
    label: "text-emerald-500",
  },
};

export const gaugeCustomLightTheme = {
  styles: {
    // Tailwind classes for HTML container and text wrappers
    container: "bg-emerald-50 border-emerald-200",
    title: "text-emerald-800",
    value: "text-emerald-950",
    label: "text-emerald-600",

    // Hex colors for D3 SVG elements
    track: "#E2E8F0", // Soft gray background arc (slate-200)
    bar: "#10B981", // Primary value fill (emerald-500)
    needle: "#047857", // Darker accent needle for high visibility (emerald-700)
    needleCap: "#065F46", // Needle center cap (emerald-800)
  },
};

export const gaugeCustomDarkTheme = {
  styles: {
    // Tailwind classes for HTML container and text wrappers
    container: "bg-yellow-500 border-emerald-800/50 backdrop-blur-sm",
    title: "text-red-500",
    value: "text-yellow-500",
    label: "text-red-500",

    // Hex colors for D3 SVG elements
    track: "text-red-500", // Dark muted background arc (slate-800)
    bar: "text-yellow-500", // High-contrast bright fill (emerald-400)
    needle: "text-red-500", // Bright needle for dark mode contrast (emerald-300)
    needleCap: "text-yellow-500", // Bright needle center cap (emerald-200)
  },
};

const commonProps = { node, variable: "humidity" };

export default function App() {
  return (
    <div
      style={{
        padding: "2rem",
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        alignItems: "flex-start",
      }}
    >
      {/* ============================================================
       * 1. Default appearance — no theme, no styles, no
       * formatting props. Every fallback in the widget in one place.
       * ============================================================ */}
      <CardWidget
        {...commonProps}
        title="Default"
        unit="%"
        decimalPlaces={1}
        //  timezone="Asia/Kolkata"
        // timezone="America/Los_Angeles"
        onDataChange={(data, meta) => {
          if (meta.kind === "error") {
            return {
              renderError: () => (
                <span className="text-orange-500 italic">
                  Sensor unreachable
                </span>
              ),
            };
          }
          if (meta.kind === "empty") {
            return {
              renderEmpty: () => (
                <span className="text-slate-300">— no reading yet —</span>
              ),
            };
          }
        }}
      />

      {/* ============================================================
       * 2. theme — a reusable, shareable WidgetTheme object. Same
       * effect across every widget instance that uses it.
       * ============================================================ */}
      <CardWidget
        {...commonProps}
        title="Emerald Theme"
        unit="%"
        decimalPlaces={1}
        theme={emeraldTheme}
      />
      {/* Built-in preset names also work directly: */}
      <CardWidget
        {...commonProps}
        title="Dark Preset"
        unit="%"
        decimalPlaces={1}
        theme="dark"
      />
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
        className="shadow-lg bg-blue-50 border-blue-300" // <- outer box only, ordinary React convention
        // styles={{
        //   value: "text-red-500 text-5xl", // <- targets the INNER "value" slot specifically
        //   title: "uppercase tracking-wider", // <- targets the INNER "title" slot specifically
        // }}
        styles={{
          container: "bg-blue-50 border-blue-300", // background/border of the card itself
          value: "text-red-500 text-5xl",
          title: "uppercase tracking-wider text-blue-700", // added color here
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

      <GaugeWidget
        {...commonProps}
        // value={78}
        unit="(*)"
        title="Dynamic Gauge"
        min={0}
        max={100}
        // className="border-2 border-blue-200 hover:border-blue-400 transition-colors"
        onDataChange={(data) => {
          if (!data) return {};
          const { value } = data;
          if (value > 60) return { title: "🔴 Critical", color: "#dc2626" };
          if (value > 50) return { title: "🟡 Warning", color: "#f59e0b" };
          return { title: "🟢 Normal", color: "#10b981" };
        }}
        // styles={{
        //   container:"",
        //     // "bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-lg border",
        //   title: "text-base font-bold tracking-wide",
        //   value: "text-[100px]",
        //   unit: "text-[200px] opacity-75",
        //   label: "text-xs italic text-gray-500",
        // }}
      />

      <GaugeWidget
        value={72}
        className="bg-red-400 rounded-2xl shadow-md shadow-blue-400"
      />

      {/* <GaugeWidget
        min={0}
        max={50}
        value={35}
        tick={{
          show: true,
          count: 5,
          size: 10,
          color: "#000000",
          radiusOffset: 5,
          labelGap: 40,
          labelSize: 15,
          labelColor: "#000000",
          labelFormat: (val) => val + " km/h",
        }}
        animation={{
          show: true,
          duration: 3000,
          easing: "bounceIn",
        }}
        style={{ backgroundColor: "yellow" }}
      /> */}

      <h1 style={{ color: "red" }}>Testing All Gauge Widget Props</h1>

      <GaugeWidget
        min={0}
        max={100}
        {...commonProps}
        title="Custom Title - Dark Theme"
        theme={gaugeCustomDarkTheme}
        styles={{
          title: "uppercase font-bold italic",
        }}
        tick={{
          show: false,
        }}
        // responsive
        // width={400}
        // height="100%"
        arc={{
          startAngle: -180,
          endAngle: 90,
          // radius:100,
          thickness: 30,
          // cornerRadius:50
        }}
        color="purple"
        track={{
          show: true,
          color: "#1fa2ff",
        }}
        needle={{
          show: true,
          length: "short",
          width: 10,
          color: "#1fa2ff",
          // needleColor:"red",
          capColor: "black",
          // capRadius:3,
          // animation:false,
        }}
      />

      <GaugeWidget
        min={0}
        max={80}
        value={49}
        formatValue={(v) => `Hello ${v} km/h`}
        // labelFormat="relative"
        // labelFormat="date"
        labelText={(ts) => `Refreshed at ${new Date(ts).toLocaleTimeString()}`} // format="bytes"
        // formatOptions={{"binary":true,"precision":2}}

        //         value={1234567.891}
        // format="number"
        // formatOptions={{"locale":"de-DE","precision":2}}
      />

      <GaugeWidget
        {...commonProps}
        title="Wind Speed"
        unit="Km/h"
        tick={{ show: true }}
        styles={{
          container:
            "bg-slate-900 rounded-2xl border border-slate-700 shadow-lg",
          title: "text-slate-300 uppercase tracking-wide text-xs",
          unit: "text-red-500 text-sm font-normal",
          value: "text-white text-4xl font-black",
          label: "text-slate-500 text-[11px] italic",
          track: "text-yellow-500",
          bar: "text-emerald-400",
          needle: "text-red-500",
          needleCap: "text-yellow-500",
          tick: "text-slate-700",
          tickLabel: "text-slate-500 text-[9px]",
        }}
      />

      <GaugeWidget
        {...commonProps}
        // value={90}
        styles={{
          container: "p-0 gap-0",
        }}
        onDataChange={(data) => {
          if (!data) {
            return {
              title: "No Data",
              color: "#6b7280",
            };
          }

          const isCritical = data.value > 70;
          const isWarning = data.value > 40 && data.value <= 60;

          return {
            // top-level scalar/config overrides
            title: isCritical ? "Critical" : isWarning ? "Warning" : "Normal",
            color: isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981",
            unit: "°C",
            formatValue: (v) => `${v.toFixed(1)}`,
            labelText: (ts) => `Sampled ${new Date(ts).toLocaleTimeString()}`,
            needle: { needleColor: isCritical ? "#ef4444" : "#10b981" },
            track: { color: isCritical ? "#450a0a" : "#052e2b" },
            animation: { duration: isCritical ? 400 : 1000 },

            // per-slot class overrides — merges with (doesn't replace) the static `styles` prop
            styles: {
              value: isCritical
                ? "text-red-500 animate-pulse"
                : "text-yellow-500",
              title: isCritical ? "text-red-400" : "text-slate-400",
            },
          };
        }}
      />

      <GaugeWidget
        {...commonProps}
        color="#1fa2ff"
        styles={{
          error: "text-orange-500 italic",
          empty: "text-slate-300",
          // container:"p-0 gap-0"
        }}
        theme="dark"
        renderError={(error) => (
          <div className="flex flex-col items-center gap-1">
            <span className="text-orange-500">⚠ Sensor unreachable</span>
            <span className="text-xs text-slate-400">{error}</span>
          </div>
        )}
        renderEmpty={() => (
          <span className="text-slate-300">— no reading yet —</span>
        )}
      />

      <GaugeWidget
        {...commonProps}
        color="yellow"
        theme="dark"
        title="IST"
        timezone="Asia/Kolkata"
        // styles={{
        // container:"p-0 gap-0"
        // }}
      />
      <GaugeWidget
        // {...commonProps}
        value={95}
        needle={{
          length:"full",
          type:"line",
          // show:false
        }}
        tick={{
          // show:true,
        }}
        color={[
          "#ff75c3",
          "#ffa647",
          "#ffe83f",
          "#9fff5b",
          "#70e2ff",
          "#7e22ce",
        ]}
        theme="dark"
        title="EST"
        timezone="America/New_York"
        // width={520}
        // height={300}
        // styles={{
        //   container:"p-0 gap-0"
        // }}
      />

      <GaugeWidget
        {...commonProps}
        color="rgb(255,0,127)"
        theme="dark"
        title="UTC"
        timezone="UTC"
        animation={{
          easing:"quadIn"
        }}
        // styles={{
        //   container:"p-0 gap-0"
        // }}
        // needle={{
        //   show:false,
        // }}
        // tick={{
        //   show:true,
        // }}
        
        arc={{
          startAngle: -180,
          endAngle: 90,
        }}
        size={400}
      />
      <GaugeWidget {...commonProps} />

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
