import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "../../../src";
import { GaugeWidget } from "../../../src/components/GaugeChart/GaugeChartWidget";
import "public-widget-sdk/styles.css";

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
      style={{
        padding: "2rem",
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        backgroundColor: "white",
      }}
    >
      <CardWidget
        {...commonProps}
        title="Default"
        unit="%"
        decimalPlaces={1}
        labelText={(ts) => `Last synced ${relativeTime(ts)}`}
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
        className="shadow-lg shadow-amber-400" // <- outer box only, ordinary React convention
        styles={{
          value: "text-red-500 text-5xl", // <- targets the INNER "value" slot specifically
          title: "lowercase tracking-wider text-yellow-500", // <- targets the INNER "title" slot specifically
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
      <GaugeWidget {...commonProps} title="API Value" />

      <GaugeWidget
        value={72}
        min={0}
        max={80}
        title="Light Theme"
        theme="light"
      />

      <GaugeWidget
        value={72}
        min={0}
        max={100}
        title="Dark Theme"
        theme="dark"
        styles={{
          value: "text-red-500",
          needle: "text-red-500",
          needleCap: "text-yellow-500",
        }}
      />

      <GaugeWidget
        value={25.445678}
        min={0}
        max={50}
        unit="°C"
        decimalPlaces={3}
        title="Temperature - Decimal Place 3"
      />

      <GaugeWidget
        value={55}
        title="No Value Label"
        valueLabel={{ show: false }}
      />

      <GaugeWidget
        value={60}
        title="270° Arc"
        arc={{
          startAngle: -135,
          endAngle: 135,
          thickness: 30,
          cornerRadius: 10,
        }}
      />

      <GaugeWidget
        value={80}
        title="No Track"
        track={{ show: false }}
        color="#FFE000"
      />

      <GaugeWidget
        value={80}
        title="Gradient Bar"
        color={["#03001e", "#7303c0", "#ec38bc", "#fdeff9"]}
        track={{ color: "#e0e7ff" }}
        tick={{
          show: false,
        }}
        animation={{
          show: true,
          easing: "easeCubicInOut",
        }}
      />

      <GaugeWidget
        value={50}
        title='Needle "line" length "full"'
        needle={{ type: "line", width: 2, length: "full", capRadius: 12 }}
      />

      <GaugeWidget
        value={50}
        title='Needle "rounded" length "number"'
        needle={{ type: "rounded", width: 12, length: 50, capRadius: 12 }}
      />

      <GaugeWidget
        value={70}
        title='Needle "triangle" length "short"'
        needle={{
          type: "triangle",
          width: 8,
          length: "short",
          capRadius: 12,
          color: "#7303c0",
          needleColor: "#f05053",
          capColor: "green",
        }}
      />

      <GaugeWidget
        value={85}
        title='Needle "drop" length "full"'
        needle={{
          type: "drop",
          length: "full",
          capRadius: 8,
          color: "#db2777",
        }}
      />

      <GaugeWidget value={25} title="No Needle" needle={{ show: false }} />

      <GaugeWidget
        value={75}
        title="Slow Elastic"
        animation={{ duration: 3000, easing: "easeElasticOut" }}
      />

      <GaugeWidget
        value={90}
        title="No Animation"
        animation={{ duration: 0 }}
      />

      <div
        style={{
          width: 300,
          border: "1px dashed gray",
          backgroundColor: "#ec38bc",
        }}
      >
        <GaugeWidget
          value={40}
          title="Responsive inside container"
          responsive
          styles={{
            title: "text-white text-lg",
          }}
        />
      </div>
      <GaugeWidget
        value={60}
        title="200×150 px"
        width={200}
        height={150}
        styles={{ value: "text-md" }}
        color="green"
      />
      <GaugeWidget
        value={66}
        title="Clickable"
        onClick={(v) => alert(`Clicked ${v}`)}
      />
      {/* <GaugeWidget title="Loading Skeleton (no value provided)" /> */}
      {/* <GaugeWidget title="Error Demo (replace with a failing node)" /> */}
      <GaugeWidget
        {...commonProps}
        // value={42}
        timestamp={Date.now() - 3600000} // 1 hour ago
        title="Relative Time"
        labelFormat="relative"
      />
      <GaugeWidget
        {...commonProps}
        // value={42}
        timestamp={Date.now()}
        title="Custom Label"
        labelText={(ts) => `Last seen: ${new Date(ts).toLocaleTimeString()}`}
      />
      <GaugeWidget
        {...commonProps}
        title="Custom Formatter"
        // value={66.7}
        min={0}
        max={100}
        formatValue={(v) => `⭐ ${Math.round(v)}%`} // your own text
        unit="" // hide unit
        labelText={(ts) => `recorded ${new Date(ts).toLocaleString()}`}
        timestamp={Date.now() - 86400000} // 1 day ago
        onClick={(v) => console.log("Clicked", v)}
      />
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
        className="bg-red-400 rounded-2xl p-6 shadow-md w-64 h-48"
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

      {/* <h1 style={{color:"red"}}>Testing All Gauge Widget Props</h1>


      <GaugeWidget/>
      <GaugeWidget {...commonProps}/>
      <GaugeWidget 
        {...commonProps}
        title="Custom Title"
        styles={{
          title:"lowercase text-yellow-500 font-bold text-[50px] italic"
        }}/> */}
      
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
