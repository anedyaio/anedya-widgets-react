



import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { CardWidget } from "public-widget-sdk";

// Import your stylesheet via the industry-standard subpath
import "public-widget-sdk/styles.css";
import { relativeTime } from "public-widget-sdk/formatters";



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
const emeraldTheme= {
  styles: {
    container: "bg-emerald-50 border-emerald-200",
    title: "text-emerald-700",
    value: "text-emerald-900",
    label: "text-emerald-500",
  },
};

const commonProps = { node, variable: "humidity" };

export default function App() {
  return (
<div style={{ padding: "2rem", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}
>
      {/* ============================================================
       * 1. Default appearance — no theme, no styles, no
       * formatting props. Every fallback in the widget in one place.
       * ============================================================ */}
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
        className="shadow-lg" // <- outer box only, ordinary React convention
        styles={{
          value: "text-red-500 text-5xl", // <- targets the INNER "value" slot specifically
          title: "uppercase tracking-wider", // <- targets the INNER "title" slot specifically
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
    </div>
  );
}