import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { AnedyaCard } from "@anedyasystems/anedya-widgets-react";
import { AnedyaGauge } from "@anedyasystems/anedya-widgets-react";
import "@anedyasystems/anedya-widgets-react/styles.css";
import "./index.css";

// This demo has its own Tailwind build (see vite.config.js + src/index.css),
// specifically to test consumer-side class overrides via `className`/`styles`.
// A real consumer app needs the same setup — the widget package's own
// precompiled stylesheet only covers its built-in default classes, not
// arbitrary classes a consumer passes in.

const tokenId = "YOUR-TOKEN-ID";
const token = "YOUR-TOKEN";
const nodeId = "YOUR-NODE-ID";

const anedya = new Anedya();
const config = anedya.newConfig(tokenId, token);
const client = anedya.newClient(config);
const node = anedya.newNode(client, nodeId);

// Shared node/variable pair reused across most examples below.
const commonProps = { node, variable: "humidity" };

// ============================================================
// Reusable theme objects — shareable across every widget instance
// that uses them. Only specify the slots you actually want to change
// from the built-in default; anything omitted falls back to the
// light/dark preset.
// ============================================================

/** A custom AnedyaCard theme. */
const emeraldCardTheme = {
  styles: {
    container: "bg-emerald-50 border-emerald-200",
    title: "text-emerald-700",
    value: "text-emerald-900",
    label: "text-emerald-500",
  },
};

/**
 * A custom AnedyaGauge theme.
 *
 * Note the two different color formats in play:
 * - `container`/`title`/`value`/`label` are Tailwind classes, since those
 *   slots render as normal HTML elements.
 * - `track`/`bar`/`needle`/`needleCap` accept hex colors OR Tailwind
 *   `text-*` classes (read via `currentColor`), since those slots render
 *   as SVG elements drawn by D3, not plain HTML.
 */
const emeraldGaugeTheme = {
  styles: {
    container: "bg-emerald-50 border-emerald-200",
    title: "text-emerald-800",
    value: "text-emerald-950",
    label: "text-emerald-600",

    track: "#E2E8F0",   // hex color, applied directly
    bar: "#10B981",
    needle: "#047857",
    needleCap: "#065F46",
  },
};

export default function App() {
  return (
    <div
      style={{
        padding: "2rem",
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        alignItems: "flex-start", // prevents one tall card from stretching its row-siblings — see README/Sizing
      }}
    >

      <div style={{ width: "100%", textAlign: "center", marginBottom: 24 }}>
        <h1 className="text-3xl font-bold">Anedya React Widgets Example</h1>
        <p className="text-gray-600">
          A live demo of the Anedya React widget SDK, showing the built-in
          default behavior and some common customization patterns.
        </p>
      </div>


      {/* ================================================================
       * SECTION 1 — AnedyaCard
       * ================================================================ */}

      {/* ----------------------------------------------------------------
       * 1.1 Default appearance — no theme, no styles, no formatting
       * props. Every built-in fallback in one place.
       * ---------------------------------------------------------------- */}
      <AnedyaCard {...commonProps} title="Default" unit="%" decimalPlaces={1} />

      {/* ----------------------------------------------------------------
       * 1.2 theme — a reusable, shareable WidgetTheme object. Same
       * effect across every widget instance that uses it. Built-in
       * preset names ("light" / "dark") also work directly.
       * ---------------------------------------------------------------- */}
      <AnedyaCard
        {...commonProps}
        title="Emerald Theme"
        unit="%"
        decimalPlaces={1}
        theme={emeraldCardTheme}
      />
      <AnedyaCard {...commonProps} title="Dark Preset" unit="%" decimalPlaces={1} theme="dark" />

      {/* ----------------------------------------------------------------
       * 1.3 styles vs className — the distinction that matters most:
       *
       *   - `styles` (object): per-SLOT overrides. Keys are
       *     "container" | "title" | "value" | "unit" | "label"
       *     ("error"/"empty" too — see 1.5) — reach INSIDE the widget.
       *
       *   - `className` (string): the ordinary React convention — one
       *     class applied ONLY to the widget's outermost container.
       *     Merged (via twMerge) with whatever styles.container already
       *     resolved to, not a replacement for it.
       *
       * IMPORTANT: any class you pass here (Tailwind or otherwise) must
       * already exist in YOUR app's own compiled CSS — the widget's
       * precompiled stylesheet only covers its own built-in classes.
       * This demo has its own Tailwind build for exactly this reason.
       * ---------------------------------------------------------------- */}
      <AnedyaCard
        {...commonProps}
        title="styles vs className"
        unit="%"
        decimalPlaces={1}
        className="shadow-lg"
        styles={{

          container: "bg-blue-50 border-blue-300",
          value: "text-red-500 text-5xl",
          title: "uppercase tracking-wider text-blue-700",
        }}
      />

      {/* ================================================================
       * SECTION 2 — AnedyaGauge
       * ================================================================ */}

      {/* ----------------------------------------------------------------
       * 2.1 Default appearance — live data, no theme/styling overrides.
       * ---------------------------------------------------------------- */}
      <AnedyaGauge 
        {...commonProps} 
        title="Default Gauge" 
        unit="%" 
        min={0} 
        max={100} 
        theme="dark"
        />

      {/* ----------------------------------------------------------------
       * 2.2 Manual value mode — pass `value` directly instead of `node`/
       * `variable` for a static/controlled gauge (e.g. driven by your
       * own app state rather than live Anedya data).
       * ---------------------------------------------------------------- */}
      <AnedyaGauge value={72} title="Manual Value" className="shadow-md" theme="dark" />

      {/* ----------------------------------------------------------------
       * 2.4 onDataChange — same pattern as AnedyaCard: conditional
       * overrides (title, color, needle color, track color, animation
       * speed) driven by the raw fetched value.
       * ---------------------------------------------------------------- */}
      <AnedyaGauge
        {...commonProps}
        theme="dark"
        title="Threshold Coloring"
        min={0}
        max={100}
        onDataChange={(data) => {
          if (!data) return;
          const isCritical = data.value > 70;
          const isWarning = data.value > 40 && data.value <= 60;

          return {
            title: isCritical ? "Critical" : isWarning ? "Warning" : "Normal",
            color: isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981",
            needle: { needleColor: isCritical ? "#ef4444" : "#10b981" },
            animation: { duration: isCritical ? 400 : 1000 },
            styles: {
              value: isCritical ? "text-red-500 animate-pulse" : undefined,
            },
          };
        }}
      />

      {/* ----------------------------------------------------------------
       * 2.5 formatValue / labelText — full custom formatting, same
       * relationship to format/labelFormat as AnedyaCard.
       * ---------------------------------------------------------------- */}
      <AnedyaGauge
        value={49}
        min={0}
        max={80}
        title="Custom Formatting"
        theme="light"
        needle={{
          type:"triangle",
          color:"oklch(59.2% 0.249 0.584)"
        }}
        formatValue={(v) => `${v} km/h`}
        labelText={(ts) => `Refreshed at ${new Date(ts).toLocaleTimeString()}`}
        className="bg-white p-4 rounded-xl"
      />
    </div>
  );
}
 
//css classes instead of ts classes --- rn css is getting converting to ts and back to ts - follow base ui - tailwind format support 