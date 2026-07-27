// themes/gaugeTheme.ts

import { GaugeSlot } from "../types/gauge";
import { WidgetTheme } from "../types/root";

export const GAUGE_DEFAULT_CLASSES: Record<GaugeSlot, string> = {
  container:
    "flex flex-col items-center justify-center text-center gap-[var(--anedya-gauge-gap)] p-[var(--anedya-gauge-padding)]",
  title: "text-[length:var(--anedya-gauge-title-size)] font-medium",
  unit: "text-[length:var(--anedya-gauge-unit-size)] font-medium",
  track: "",
  bar: "",
  needle: "",
  needleCap: "",
  value: "text-[length:var(--anedya-gauge-value-size)] font-bold leading-none",
  label: "text-[length:var(--anedya-gauge-label-size)]",
  // NEW — tick line has no default utility classes; color comes from theme below.
  tick: "",
  // NEW — font-size is always driven by the `tick.labelSize` prop (set via
  // inline style in the widget, which wins over classes), so this only
  // needs non-size utilities.
  tickLabel: "font-medium select-none",
  error: "text-sm font-medium",
  empty: "text-[length:var(--anedya-card-value-size)] font-bold",
};

export const gaugeLightTheme: WidgetTheme<GaugeSlot> = {
  styles: {
    container: "",
    title: "text-slate-500",
    unit: "text-slate-500",
    label: "text-slate-400",
    track: "text-slate-200", // read via `currentColor` on the track path
    bar: "text-indigo-500",
    needle: "text-slate-700",
    needleCap: "text-slate-700",
    value: "text-slate-900",
    tick: "text-slate-300",
    tickLabel: "text-slate-400",
    error: "text-red-600",
    empty: "text-slate-400",
  },
};

export const gaugeDarkTheme: WidgetTheme<GaugeSlot> = {
  styles: {
    container: "",
    title: "text-slate-400",
    unit: "text-slate-400",
    track: "text-slate-700",
    bar: "text-indigo-400",
    needle: "text-slate-200",
    needleCap: "text-slate-200",
    value: "text-white",
    label: "text-slate-500",
    tick: "text-slate-600",
    tickLabel: "text-slate-500",
    error: "text-red-400",
    empty: "text-slate-500",
  },
};

export const gaugeThemes = {
  light: gaugeLightTheme,
  dark: gaugeDarkTheme,
} as const;
export const DEFAULT_GAUGE_THEME = gaugeLightTheme;
