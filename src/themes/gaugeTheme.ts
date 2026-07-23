import { SlotClassNames, WidgetTheme } from "../types/root";

// The exact same slot names we'll use in the widget
export type GaugeSlot =
  | "container"
  | "title"
  | "track"
  | "bar"
  | "needle"
  | "centerValue"
  | "needleLabel"
  | "tick"
  | "tickLabel"
  | "segment";

export const GAUGE_DEFAULT_CLASSES: Record<GaugeSlot, string> = {
  container:
    "flex flex-col items-center justify-center text-center border rounded-xl p-[var(--anedya-gauge-padding)] gap-[var(--anedya-gauge-gap)]",
  title:
    "text-[length:var(--anedya-gauge-title-size)] font-medium",
  track:
    "[stroke:var(--anedya-gauge-track-stroke)] [fill:var(--anedya-gauge-track-fill)]",
  bar:
    "[stroke:var(--anedya-gauge-bar-stroke)] [fill:var(--anedya-gauge-bar-fill)]",
  needle:
    "[fill:var(--anedya-gauge-needle-color)] [stroke:var(--anedya-gauge-needle-color)]",
  centerValue:
    "text-[length:var(--anedya-gauge-center-value-size)] font-[var(--anedya-gauge-center-value-weight)] text-[var(--anedya-gauge-center-value-color)]",
  needleLabel:
    "text-[length:var(--anedya-gauge-needle-label-size)] text-[var(--anedya-gauge-needle-label-color)]",
  tick:
    "[stroke:var(--anedya-gauge-tick-stroke)]",
  tickLabel:
    "text-[length:var(--anedya-gauge-tick-label-size)] text-[var(--anedya-gauge-tick-label-color)] fill-[var(--anedya-gauge-tick-label-color)]",
  segment:
    "[stroke:var(--anedya-gauge-segment-stroke)]",
};

export const lightTheme: WidgetTheme<GaugeSlot> = {
  classNames: {
    container: "bg-white border-slate-200",
    title: "text-slate-500",
    centerValue: "text-slate-900",
    needleLabel: "text-slate-400",
    tickLabel: "fill-slate-400 text-slate-400",
  },
};

export const darkTheme: WidgetTheme<GaugeSlot> = {
  classNames: {
    container: "bg-slate-900 border-slate-800",
    title: "text-slate-400",
    centerValue: "text-white",
    needleLabel: "text-slate-500",
    tickLabel: "fill-slate-500 text-slate-500",
  },
};

export const gaugeThemes = {
  light: lightTheme,
  dark: darkTheme,
} as const;
export type GaugeThemeName = keyof typeof gaugeThemes;