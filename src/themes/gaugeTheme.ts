import { GaugeSlot } from "../types/gauge";
import { WidgetTheme } from "../types/root";
import { themeVar } from "../helpers/themeVar";

export const GAUGE_DEFAULT_CLASSES: Record<GaugeSlot, string> = {
  container:
    "flex flex-col items-center justify-center text-center gap-[var(--anedya-gauge-gap)] p-[var(--anedya-gauge-padding)] " +
    `bg-[${themeVar("--card", "--mui-palette-background-paper", "--anedya-fallback-bg")}] ` +
    `border-[${themeVar("--border", "--mui-palette-divider", "--anedya-fallback-border")}]`,

  title:
    "text-[length:var(--anedya-gauge-title-size)] font-medium " +
    `text-[${themeVar("--muted-foreground", "--mui-palette-text-secondary", "--anedya-fallback-muted")}]`,

  unit:
    "text-[length:var(--anedya-gauge-unit-size)] font-medium " +
    `text-[${themeVar("--card-foreground", "--mui-palette-text-primary", "--anedya-fallback-fg")}]`,

  value:
    "text-[length:var(--anedya-gauge-value-size)] font-bold leading-none " +
    `text-[${themeVar("--card-foreground", "--mui-palette-text-primary", "--anedya-fallback-fg")}]`,

  label:
    "text-[length:var(--anedya-gauge-label-size)] " +
    `text-[${themeVar("--muted-foreground", "--mui-palette-text-secondary", "--anedya-fallback-muted")}]`,

  track: `text-[${themeVar("--border", "--mui-palette-divider", "--anedya-fallback-border")}]`,
  bar: `text-[${themeVar("--primary", "--mui-palette-primary-main", "--anedya-fallback-primary")}]`,
  needle: `text-[${themeVar("--card-foreground", "--mui-palette-text-primary", "--anedya-fallback-fg")}]`,
  needleCap: `text-[${themeVar("--card-foreground", "--mui-palette-text-primary", "--anedya-fallback-fg")}]`,
  tick: `text-[${themeVar("--border", "--mui-palette-divider", "--anedya-fallback-border")}]`,
  tickLabel:
    "font-medium select-none " +
    `text-[${themeVar("--muted-foreground", "--mui-palette-text-secondary", "--anedya-fallback-muted")}]`,

  error:
    "text-sm font-medium " +
    `text-[${themeVar("--destructive", "--mui-palette-error-main", "--anedya-fallback-error")}]`,

  empty:
    "text-[length:var(--anedya-gauge-value-size)] font-bold " +
    `text-[${themeVar("--muted-foreground", "--mui-palette-text-secondary", "--anedya-fallback-muted")}]`,

  // Tooltip: intentionally hardcoded, NOT run through themeVar/auto-
  // detection — always inverted for guaranteed readability regardless of
  // the app's theme (a tooltip that blends into the page is a real usability
  // bug, so this one favors reliability over automatic matching).
  tooltip:
    "pointer-events-none z-10 rounded-md px-2 text-[length:var(--anedya-gauge-tooltip-size)] " +
    "shadow-lg whitespace-nowrap font-medium " +
    "bg-[var(--anedya-fallback-tooltip-bg)] text-[var(--anedya-fallback-tooltip-fg)]",
};

export const gaugeLightTheme: WidgetTheme<GaugeSlot> = {
  styles: {
    container: "",
    title: "text-slate-500",
    unit: "text-slate-500",
    label: "text-slate-400",
    track: "text-slate-200",
    bar: "text-indigo-500",
    needle: "text-slate-700",
    needleCap: "text-slate-700",
    value: "text-slate-900",
    tick: "text-slate-300",
    tickLabel: "text-slate-400",
    error: "text-red-600",
    empty: "text-slate-400",
    tooltip: "bg-slate-900 text-white",
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
    tooltip: "bg-white text-slate-900",
  },
};


export type GaugeThemeName = "light" | "dark";

export const gaugeThemes: Record<GaugeThemeName, WidgetTheme<GaugeSlot>> = {
  light: gaugeLightTheme,
  dark: gaugeDarkTheme,
};

export const DEFAULT_GAUGE_THEME: WidgetTheme<GaugeSlot> = gaugeLightTheme;