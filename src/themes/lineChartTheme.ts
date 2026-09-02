import { LineChartSlot } from "../types/lineChart";
import { WidgetTheme } from "../types/root";
import { themeVar } from "../helpers/themeVar";

export const LINECHART_DEFAULT_CLASSES: Record<LineChartSlot, string> = {
  container:
    "flex flex-col text-center gap-[var(--anedya-linechart-gap)] p-[var(--anedya-linechart-padding)] border " +
    `rounded-[${themeVar("--radius", "--mui-shape-borderRadius", "--anedya-fallback-radius")}] ` +
    `bg-[${themeVar("--card", "--mui-palette-background-paper", "--anedya-card-fallback-bg")}] ` +
    `border-[${themeVar("--border", "--mui-palette-divider", "--anedya-card-fallback-border")}]`,

  title:
    "text-[length:var(--anedya-linechart-title-size)] font-medium text-left " +
    `text-[${themeVar("--card-foreground", "--mui-palette-text-primary", "--anedya-fallback-fg")}]`,

  label:
    "text-[length:var(--anedya-linechart-label-size)] " +
    `text-[${themeVar("--muted-foreground", "--mui-palette-text-secondary", "--anedya-fallback-muted-label")}]`,

  line: `text-[${themeVar("--primary", "--mui-palette-primary-main", "--anedya-fallback-primary")}]`,
  area: `text-[${themeVar("--primary", "--mui-palette-primary-main", "--anedya-fallback-primary")}]`,
  point: `text-[${themeVar("--primary", "--mui-palette-primary-main", "--anedya-fallback-primary")}]`,

  grid: `text-[${themeVar("--border", "--mui-palette-divider", "--anedya-fallback-border")}]`,

  xAxis:
    "text-[length:var(--anedya-linechart-axis-size)] " +
    `text-[${themeVar("--muted-foreground", "--mui-palette-text-secondary", "--anedya-fallback-muted-label")}]`,
  yAxis:
    "text-[length:var(--anedya-linechart-axis-size)] " +
    `text-[${themeVar("--muted-foreground", "--mui-palette-text-secondary", "--anedya-fallback-muted-label")}]`,

  error:
    "text-sm font-medium " +
    `text-[${themeVar("--destructive", "--mui-palette-error-main", "--anedya-fallback-error")}]`,
  empty:
    "text-sm font-medium " +
    `text-[${themeVar("--muted-foreground", "--mui-palette-text-secondary", "--anedya-fallback-muted-label")}]`,

  // Tooltip: intentionally hardcoded, NOT auto-detected — same reasoning
  // as AnedyaGauge's tooltip (always readable regardless of app theme).
  tooltip:
    "pointer-events-none z-10 rounded-md px-2 py-1 text-[length:var(--anedya-linechart-tooltip-size)] " +
    "shadow-lg whitespace-nowrap font-medium " +
    "bg-[var(--anedya-fallback-tooltip-bg)] text-[var(--anedya-fallback-tooltip-fg)]",
};

export const lineChartLightTheme: WidgetTheme<LineChartSlot> = {
  styles: {
    container: "",
    title: "text-slate-900",
    label: "text-slate-400",
    line: "text-indigo-500",
    area: "text-indigo-500",
    point: "text-indigo-500",
    grid: "text-slate-200",
    xAxis: "text-slate-400",
    yAxis: "text-slate-400",
    error: "text-red-600",
    empty: "text-slate-400",
    tooltip: "bg-slate-900 text-white",
  },
};

export const lineChartDarkTheme: WidgetTheme<LineChartSlot> = {
  styles: {
    container: "bg-slate-900 border-slate-800",
    title: "text-white",
    label: "text-slate-500",
    line: "text-indigo-400",
    area: "text-indigo-400",
    point: "text-indigo-400",
    grid: "text-slate-700",
    xAxis: "text-slate-500",
    yAxis: "text-slate-500",
    error: "text-red-400",
    empty: "text-slate-500",
    tooltip: "bg-white text-slate-900",
  },
};

export type LineChartThemeName = "light" | "dark";

export const lineChartThemes: Record<LineChartThemeName, WidgetTheme<LineChartSlot>> = {
  light: lineChartLightTheme,
  dark: lineChartDarkTheme,
};

export const DEFAULT_LINECHART_THEME: WidgetTheme<LineChartSlot> = lineChartLightTheme;