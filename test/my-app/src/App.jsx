import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "../../../src";
import { GaugeWidget } from "../../../src/components/GaugeChart/GaugeChartWidget";
import "../../../dist/styles.css"

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
    // <div
    //   style={{ padding: "2rem", display: "flex", gap: 24, flexWrap: "wrap" }}
    // >
    //   {/* ============================================================
    //    * 1. Default appearance — no theme, no styles, no
    //    * formatting props. Every fallback in the widget in one place.
    //    * ============================================================ */}
    //   <CardWidget {...commonProps} title="Default" unit="%" precision={1} />

    //   {/* ============================================================
    //    * 2. theme — a reusable, shareable WidgetTheme object. Same
    //    * effect across every widget instance that uses it.
    //    * ============================================================ */}
    //   <CardWidget
    //     {...commonProps}
    //     title="Emerald Theme"
    //     unit="%"
    //     precision={1}
    //     theme={emeraldTheme}
    //   />

    //   {/* Built-in preset names also work directly: */}
    //   <CardWidget
    //     {...commonProps}
    //     title="Dark Preset"
    //     unit="%"
    //     precision={1}
    //     theme="dark"
    //   />

    //   {/* ============================================================
    //    * 3. styles vs className — THE distinction to understand:
    //    *
    //    *   - `styles` (plural, an OBJECT): per-SLOT overrides.
    //    *     Keys are "container" | "title" | "value" | "unit" | "label"
    //    *     — lets you reach INSIDE the widget and style individual
    //    *     pieces independently.
    //    *
    //    *   - `className` (singular, a STRING): the ordinary React
    //    *     convention — one class applied ONLY to the widget's
    //    *     outermost container element, same as you'd pass to any
    //    *     other component. It's merged (via twMerge) with whatever
    //    *     styles.container already resolved to, not a
    //    *     replacement for it.
    //    *
    //    * This example uses BOTH at once so the difference is visible:
    //    * className adds a shadow to the outer box, styles.value/
    //    * styles.title style two INNER pieces independently.
    //    * ============================================================ */}
    //   <CardWidget
    //     {...commonProps}
    //     title="classNames vs className"
    //     unit="%"
    //     precision={1}
    //     className="shadow-lg" // <- outer box only, ordinary React convention
    //     classNames={{
    //       value: "text-red-500 text-5xl", // <- targets the INNER "value" slot specifically
    //       title: "uppercase tracking-wider", // <- targets the INNER "title" slot specifically
    //     }}
    //   />

    //   {/* ============================================================
    //    * 4. Plain CSS classes — classNames works with ANY class source,
    //    * not just Tailwind. These reference plain hand-written CSS
    //    * classes (e.g. defined in a .css file this app already imports).
    //    * ============================================================ */}
    //   <CardWidget
    //     {...commonProps}
    //     title="Plain CSS Classes"
    //     unit="%"
    //     precision={1}
    //     classNames={{ container: "my-card", value: "my-card-value" }}
    //   />

    //   {/* ============================================================
    //    * 5. Native Tailwind responsive prefixes — `sm:`/`md:`/`lg:`
    //    * work exactly as they do anywhere else in your app, because
    //    * classNames just forwards whatever string you write straight
    //    * to `className`. This widget does NOT have its own custom
    //    * breakpoint system — these prefixes are compiled by YOUR
    //    * project's Tailwind config and respond to the BROWSER VIEWPORT,
    //    * same as native Tailwind everywhere else. If your own
    //    * tailwind.config.js customizes `theme.screens`, these prefixes
    //    * automatically follow that customization too — nothing to
    //    * configure on the widget's side.
    //    * ============================================================ */}
    //   <CardWidget
    //     {...commonProps}
    //     title="Responsive Text"
    //     unit="%"
    //     precision={1}
    //     classNames={{ value: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl" }}
    //   />

    //   {/* ============================================================
    //    * 3. Segmented variant — colored ranges (risk zones), with
    //    * needle enabled to point at the current value (like your
    //    * ChartExpo reference image).
    //    * ============================================================ */}
    //   <CardWidget
    //     {...commonProps}
    //     title="Custom Formatting"
    //     formatValue={(v) => `${v.toFixed(2)} % RH`}
    //     labelText={(ts) => `As of ${new Date(ts).toLocaleDateString()}`}
    //   />

    //   {/* ============================================================
    //    * 7. onStyleChange — conditional class overrides driven by the
    //    * RAW fetched data ({ value, timestamp }), always applied on top
    //    * of everything else (theme, classNames, className).
    //    * ============================================================ */}
    //   <CardWidget
    //     {...commonProps}
    //     title="Threshold Coloring"
    //     unit="%"
    //     precision={1}
    //     onDataChange={(data) => {
    //       if (!data) return;

    //       if (data.value > 80) {
    //         return {
    //           title: "High Humidity",
    //           theme: "dark",
    //           classNames: {
    //             value: "text-red-500",
    //           },
    //         };
    //       }

    //       return {
    //         title: "Humidity",
    //         theme: "light",
    //       };
    //     }}
    //   />

    //   {/* ============================================================
    //    * 8. Sizing — width/height/minWidth/maxWidth are plain props,
    //    * applied as inline styles on the container, independent of the
    //    * whole classNames/theme system.
    //    * ============================================================ */}
    //   <CardWidget
    //     {...commonProps}
    //     title="Custom Size"
    //     unit="%"
    //     width={320}
    //     minWidth={280}
    //     maxWidth={400}
    //     height={200}
    //   />

    //   <GaugeWidget
    //     {...commonProps}
    //     min={0}
    //     max={100}
    //     // size= not working proper
    //     valueLabel={{ precision: 1 }}
    //     arc={{
    //       startAngle: -90,
    //       endAngle: 90,
    //       // radius: not working proper
    //       thickness: 30,
    //       // cornerRadius:100
    //     }}
    //     track={{
    //       show: true,
    //       color: "yellow",
    //     }}
    //     fillMode="progress"
    //     color="#1fa2ff"
    //     needle={{
    //       show: true,
    //       type: "triangle",
    //       length: "medium",
    //       width: 5,
    //       color: "white",
    //       capRadius: 7,
    //     }}
    //     needleLabel={{
    //       show: true,
    //       formatter: () => {
    //         "Hello";
    //       },
    //     }}
    //     labels={{
    //       show: true,
    //       position: "outside",
    //     }}
    //     scale={{
    //       minLabel: "Minimum",
    //       maxLabel: "Maximum",
    //     }}
    //     ticks={{
    //       show: true,
    //       count: 10,
    //       position: "outside",
    //       length: 10,
    //       labels: true,
    //     }}
    //     animation={{
    //       duration: 5000,
    //       easing: "easeElasticOut",
    //     }}
    //     tooltip={{
    //       show: false,
    //     }}
    //     classNames={{
    //       title: "text-white",
    //       tickLabel: "text-white text-lg",
    //       label: "text-white",
    //       value: "text-white",
    //     }}
    //   />
    // </div>
    <div
      style={{ padding: "2rem", display: "flex", gap: 24, flexWrap: "wrap" }}
    >
     
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
      color={["red", "yellow"]}
      arc={{
        // radius:400,
        // cornerRadius:10,
        thickness:80,
      }}
      animation={{
        duration: 4000,
        easing: "easeElasticOut", // easeCubicOut, easeElasticOut
      }}
      needle={{
        color:"white",
        length:"short",
        type:"triangle",
        animation:true,
      }}
      theme="dark"  />
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
