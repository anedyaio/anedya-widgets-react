import React from "react";
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { AnedyaCard } from "anedya-widgets-react";
import { AnedyaGauge } from "anedya-widgets-react";
import "anedya-widgets-react/styles.css";
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

      {/* ----------------------------------------------------------------
       * 1.4 formatValue / format / labelText / labelFormat — see README
       * "Formatting vs rendering" and "The last-updated label" sections
       * for the full precedence rules. formatValue/labelText are full
       * escape hatches; format/labelFormat are zero-code presets.
       * ---------------------------------------------------------------- */}
      <AnedyaCard
        {...commonProps}
        title="Custom Formatting"
        formatValue={(v) => `${v.toFixed(2)} % RH`}
        labelFormat="relative"
      />

      {/* ----------------------------------------------------------------
       * 1.5 Error & empty states — onDataChange's second argument
       * (`meta`) tells you which state just occurred, so you can swap in
       * fully custom JSX via renderError/renderEmpty. See README "Error
       * & empty states" for the full behavior and styles.error/empty.
       * ---------------------------------------------------------------- */}
      <AnedyaCard
        {...commonProps}
        title="Error & Empty Handling"
        unit="%"
        decimalPlaces={1}
        onDataChange={(data, meta) => {
          if (meta.kind === "error") {
            return {
              renderError: () => (
                <span className="text-orange-500 italic">Sensor unreachable</span>
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

      {/* ----------------------------------------------------------------
       * 1.6 onDataChange — conditional overrides driven by the RAW
       * fetched data ({ value, timestamp }), applied on top of
       * everything else (theme, styles, className).
       * ---------------------------------------------------------------- */}
      <AnedyaCard
        {...commonProps}
        title="Threshold Coloring"
        unit="%"
        decimalPlaces={1}
        onDataChange={(data) => {
          if (!data) return;
          if (data.value > 80) {
            return { title: "High Humidity", theme: "dark", styles: { value: "text-red-500" } };
          }
          return { title: "Humidity", theme: "light" };
        }}
      />

      {/* ----------------------------------------------------------------
       * 1.7 Sizing — width/height/minWidth/maxWidth are plain props,
       * applied as inline styles on the container. See README "Sizing"
       * — `height` has two distinct modes (auto-grow vs. fixed+clip).
       * ---------------------------------------------------------------- */}
      <AnedyaCard
        {...commonProps}
        title="Custom Size"
        unit="%"
        width={320}
        minWidth={280}
        maxWidth={400}
        height={200}
      />

      {/* ----------------------------------------------------------------
       * 1.8 timezone — pins the last-updated label to a specific IANA
       * timezone instead of the visitor's auto-detected one.
       * ---------------------------------------------------------------- */}
      <AnedyaCard {...commonProps} title="Pinned to IST" labelFormat="datetime" timezone="Asia/Kolkata" />

      {/* ================================================================
       * SECTION 2 — AnedyaGauge
       * ================================================================ */}

      {/* ----------------------------------------------------------------
       * 2.1 Default appearance — live data, no theme/styling overrides.
       * ---------------------------------------------------------------- */}
      <AnedyaGauge {...commonProps} title="Default Gauge" unit="%" min={0} max={100} />

      {/* ----------------------------------------------------------------
       * 2.2 Manual value mode — pass `value` directly instead of `node`/
       * `variable` for a static/controlled gauge (e.g. driven by your
       * own app state rather than live Anedya data).
       * ---------------------------------------------------------------- */}
      <AnedyaGauge value={72} title="Manual Value" className="shadow-md" />

      {/* ----------------------------------------------------------------
       * 2.3 Full arc/track/needle/color/tick configuration, plus a
       * custom theme. Demonstrates most visual knobs at once.
       * ---------------------------------------------------------------- */}
      <AnedyaGauge
        {...commonProps}
        title="Fully Configured"
        theme={emeraldGaugeTheme}
        min={0}
        max={100}
        arc={{ startAngle: -120, endAngle: 120, thickness: 20 }}
        track={{ show: true }}
        needle={{ show: true, length: "medium", width: 6 }}
        tick={{ show: true, count: 10, size: 6, labelSize: 11 }}
        color="#10B981"
      />

      {/* ----------------------------------------------------------------
       * 2.4 onDataChange — same pattern as AnedyaCard: conditional
       * overrides (title, color, needle color, track color, animation
       * speed) driven by the raw fetched value.
       * ---------------------------------------------------------------- */}
      <AnedyaGauge
        {...commonProps}
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
        formatValue={(v) => `${v} km/h`}
        labelText={(ts) => `Refreshed at ${new Date(ts).toLocaleTimeString()}`}
      />

      {/* ----------------------------------------------------------------
       * 2.6 Per-slot styles — including the SVG-backed slots
       * (track/bar/needle/needleCap/tick/tickLabel), which accept hex
       * colors or `text-*` Tailwind classes (read via currentColor).
       * ---------------------------------------------------------------- */}
      <AnedyaGauge
        {...commonProps}
        title="Wind Speed"
        unit="km/h"
        tick={{ show: true }}
        styles={{
          container: "bg-slate-900 rounded-2xl border border-slate-700 shadow-lg",
          title: "text-slate-300 uppercase tracking-wide text-xs",
          value: "text-white text-4xl font-black",
          label: "text-slate-500 text-[11px] italic",
          track: "text-slate-700",
          bar: "text-emerald-400",
          needle: "text-red-500",
          needleCap: "text-yellow-500",
          tick: "text-slate-700",
          tickLabel: "text-slate-500 text-[9px]",
        }}
      />

      {/* ----------------------------------------------------------------
       * 2.7 Error & empty states — identical mechanism to AnedyaCard.
       * ---------------------------------------------------------------- */}
      <AnedyaGauge
        {...commonProps}
        theme="dark"
        renderError={(error) => (
          <div className="flex flex-col items-center gap-1">
            <span className="text-orange-500">⚠ Sensor unreachable</span>
            <span className="text-xs text-slate-400">{error}</span>
          </div>
        )}
        renderEmpty={() => <span className="text-slate-300">— no reading yet —</span>}
      />

      {/* ----------------------------------------------------------------
       * 2.8 timezone — same as AnedyaCard's.
       * ---------------------------------------------------------------- */}
      <AnedyaGauge {...commonProps} theme="dark" title="IST" timezone="Asia/Kolkata" />
    </div>
  );
}
 
//css classes instead of ts classes --- rn css is getting converting to ts and back to ts - follow base ui - tailwind format support 