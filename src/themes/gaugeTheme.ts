// import { GaugeSlot } from "../types/gauge";
// import { WidgetTheme } from "../types/root";

// export const GAUGE_DEFAULT_CLASSES: Record<GaugeSlot, string> = {
//   container:
//     "flex flex-col items-center justify-center text-center gap-[var(--anedya-gauge-gap)] p-[var(--anedya-gauge-padding)]",
//   title:
//     "text-[length:var(--anedya-gauge-title-size)] font-medium",
//   track: "",
//   bar: "",
//   segment: "",
//   needle: "",
//   needleCap: "",
//   tick: "",
//   tickLabel:
//     "text-[length:var(--anedya-gauge-tick-size)] font-medium fill-current",
//   scaleLabel:
//     "text-[length:var(--anedya-gauge-tick-size)] font-medium fill-current",
//   value:
//     "text-[length:var(--anedya-gauge-value-size)] font-bold leading-none",
//   unit: "text-[length:var(--anedya-gauge-unit-size)] font-medium",
//   label: "text-[length:var(--anedya-gauge-label-size)]",
//   tooltip:
//     "pointer-events-none absolute z-10 rounded-md px-2 py-1 text-xs font-medium shadow-md",
// };

// export const gaugeLightTheme: WidgetTheme<GaugeSlot> = {
//   styles: {
//     container: "",
//     title: "text-slate-500",
//     track: "text-slate-200", // read via `currentColor` on the track path
//     bar: "text-indigo-500",
//     segment: "",
//     needle: "text-slate-700",
//     needleCap: "text-slate-700",
//     tick: "text-slate-300",
//     tickLabel: "text-slate-400",
//     scaleLabel: "text-slate-400",
//     value: "text-slate-900",
//     unit: "text-slate-500",
//     label: "text-slate-400",
//     tooltip: "bg-slate-900 text-white",
//   },
// };

// export const gaugeDarkTheme: WidgetTheme<GaugeSlot> = {
//   styles: {
//     container: "",
//     title: "text-slate-400",
//     track: "text-slate-700",
//     bar: "text-indigo-400",
//     segment: "",
//     needle: "text-slate-200",
//     needleCap: "text-slate-200",
//     tick: "text-slate-600",
//     tickLabel: "text-slate-500",
//     scaleLabel: "text-slate-500",
//     value: "text-white",
//     unit: "text-slate-400",
//     label: "text-slate-500",
//     tooltip: "bg-slate-100 text-slate-900",
//   },
// };

// export const gaugeThemes = { light: gaugeLightTheme, dark: gaugeDarkTheme } as const;
// export const DEFAULT_GAUGE_THEME = gaugeLightTheme;


import { GaugeSlot } from "../types/gauge";
import { WidgetTheme } from "../types/root";

export const GAUGE_DEFAULT_CLASSES: Record<GaugeSlot, string> = {
  container:
    "flex flex-col items-center justify-center text-center gap-[var(--anedya-gauge-gap)] p-[var(--anedya-gauge-padding)]",
  title: "text-[length:var(--anedya-gauge-title-size)] font-medium",
  track: "",
  bar: "",
  needle: "",
  needleCap: "",
  value: "text-[length:var(--anedya-gauge-value-size)] font-bold leading-none",
  label: "text-[length:var(--anedya-gauge-label-size)]",
};

export const gaugeLightTheme: WidgetTheme<GaugeSlot> = {
  styles: {
    container: "",
    title: "text-slate-500",
    track: "text-slate-200", // read via `currentColor` on the track path
    bar: "text-indigo-500",
    needle: "text-slate-700",
    needleCap: "text-slate-700",
    value: "text-slate-900",
    label: "text-slate-400",
  },
};

export const gaugeDarkTheme: WidgetTheme<GaugeSlot> = {
  styles: {
    container: "",
    title: "text-slate-400",
    track: "text-slate-700",
    bar: "text-indigo-400",
    needle: "text-slate-200",
    needleCap: "text-slate-200",
    value: "text-white",
    label: "text-slate-500",
  },
};

export const gaugeThemes = { light: gaugeLightTheme, dark: gaugeDarkTheme } as const;
export const DEFAULT_GAUGE_THEME = gaugeLightTheme;