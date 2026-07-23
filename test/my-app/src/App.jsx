



import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "../../../src";
import "../../../dist/style.css";

const tokenId = "sdaIC9xpHKdPQpWXPtOlG1Pl";
const token = "eMYc82DiKX2oO9TgXylCCeyugok8MDOY65XMTRDLdsh2ENHOi0Tyv3RmfCuLQ6kb";
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
const emeraldTheme= {
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
    <div style={{ padding: "2rem", display: "flex", gap: 24, flexWrap: "wrap" }}>
      {/* ============================================================
       * 1. Default appearance — no theme, no classNames, no
       * formatting props. Every fallback in the widget in one place.
       * ============================================================ */}
      <CardWidget {...commonProps} height={300} width={700}  title="Default" unit="%" precision={1} />


      {/* ============================================================
       * 2. theme — a reusable, shareable WidgetTheme object. Same
       * effect across every widget instance that uses it.
       * ============================================================ */}
      <CardWidget {...commonProps} title="Emerald Theme" unit="%" precision={1} theme={emeraldTheme} />

      {/* Built-in preset names also work directly: */}
      <CardWidget {...commonProps} title="Dark Preset" unit="%" precision={1} theme="dark" />

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
        {...commonProps}
        title="classNames vs className"
        unit="%"
        precision={1}
        className="shadow-lg" // <- outer box only, ordinary React convention
        classNames={{
          value: "text-red-500 text-5xl", // <- targets the INNER "value" slot specifically
          title: "uppercase tracking-wider", // <- targets the INNER "title" slot specifically
        }}
        
      />

      {/* ============================================================
       * 4. Plain CSS classes — classNames works with ANY class source,
       * not just Tailwind. These reference plain hand-written CSS
       * classes (e.g. defined in a .css file this app already imports).
       * ============================================================ */}
      <CardWidget
        {...commonProps}
        title="Plain CSS Classes"
        unit="%"
        precision={1}
        classNames={{ container: "my-card", value: "my-card-value" }}
      />

      {/* ============================================================
       * 5. Native Tailwind responsive prefixes — `sm:`/`md:`/`lg:`
       * work exactly as they do anywhere else in your app, because
       * classNames just forwards whatever string you write straight
       * to `className`. This widget does NOT have its own custom
       * breakpoint system — these prefixes are compiled by YOUR
       * project's Tailwind config and respond to the BROWSER VIEWPORT,
       * same as native Tailwind everywhere else. If your own
       * tailwind.config.js customizes `theme.screens`, these prefixes
       * automatically follow that customization too — nothing to
       * configure on the widget's side.
       * ============================================================ */}
      <CardWidget
        {...commonProps}
        title="Responsive Text"
        unit="%"
        precision={1}
        classNames={{ value: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl" }}
      />

      {/* ============================================================
       * 6. formatValue / labelText — simple formatting hooks, distinct
       * from styling. formatValue controls the displayed number's
       * text; labelText controls the caption under it.
       * ============================================================ */}
      <CardWidget
        {...commonProps}
        title="Custom Formatting"
        formatValue={(v) => `${v.toFixed(2)} % RH`}
        labelText={(ts) => `As of ${new Date(ts).toLocaleDateString()}`}
      />

      {/* ============================================================
       * 7. onStyleChange — conditional class overrides driven by the
       * RAW fetched data ({ value, timestamp }), always applied on top
       * of everything else (theme, classNames, className).
       * ============================================================ */}
      <CardWidget
        {...commonProps}
        title="Threshold Coloring"
        unit="%"
        precision={1}

       onDataChange={(data) => {
    if (!data) return;

    if (data.value > 80) {
      return {
        title: "High Humidity",
        theme: "dark",
        classNames: {
          value: "text-red-500"
        }
      };
    }

    return {
      title: "Humidity",
      theme: "light"
    };
  }}
  
      />

      {/* ============================================================
       * 8. Sizing — width/height/minWidth/maxWidth are plain props,
       * applied as inline styles on the container, independent of the
       * whole classNames/theme system.
       * ============================================================ */}
      <CardWidget {...commonProps} title="Custom Size" unit="%" width={320} minWidth={280} maxWidth={400} height={200} />
    </div>
  );
}