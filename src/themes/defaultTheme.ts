
import { WidgetTheme } from "../types/root";
import { themeVar } from "../helpers/themeVar";
import { CardSlot } from "../components/AnedyaCard";

export const CARD_DEFAULT_CLASSES: Record<CardSlot, string> = {
container:
  "flex flex-col items-center justify-center text-center border " +
  `rounded-[${themeVar("--radius", "--mui-shape-borderRadius", "--anedya-fallback-radius")}] ` +
  "p-[var(--anedya-card-padding)] gap-[var(--anedya-card-gap)] " +
  `bg-[${themeVar("--card", "--mui-palette-background-paper", "--anedya-card-fallback-bg")}] ` +
  `border-[${themeVar("--border", "--mui-palette-divider", "--anedya-card-fallback-border")}]`,

  title:
    "text-[length:var(--anedya-card-title-size)] font-medium " +
    `text-[${themeVar("--muted-foreground", "--mui-palette-text-secondary", "--anedya-fallback-muted-title")}]`,

  value:
    "text-[length:var(--anedya-card-value-size)] font-bold leading-none " +
    `text-[${themeVar("--card-foreground", "--mui-palette-text-primary", "--anedya-fallback-fg")}]`,

  unit:
    "text-[length:var(--anedya-card-unit-size)] " +
    `text-[${themeVar("--card-foreground", "--mui-palette-text-primary", "--anedya-fallback-fg")}]`,

  label:
    "text-[length:var(--anedya-card-label-size)] " +
    `text-[${themeVar("--muted-foreground", "--mui-palette-text-secondary", "--anedya-fallback-muted-label")}]`,

  error:
    "text-sm font-medium " +
    `text-[${themeVar("--destructive", "--mui-palette-error-main", "--anedya-fallback-error")}]`,

  empty:
    "text-[length:var(--anedya-card-value-size)] font-bold " +
    `text-[${themeVar("--muted-foreground", "--mui-palette-text-secondary", "--anedya-fallback-muted")}]`,
};

// Explicit opt-in presets — bypass auto-detection entirely when a
// consumer sets theme="light"/"dark" or a custom WidgetTheme.
export const lightTheme: WidgetTheme<CardSlot> = {
  styles: {
    container: "bg-white border-slate-200",
    title: "text-slate-500",
    value: "text-slate-900",
    label: "text-slate-400",
    error: "text-red-600",
    empty: "text-slate-400",
  },
};

export const darkTheme: WidgetTheme<CardSlot> = {
  styles: {
    container: "bg-slate-900 border-slate-800",
    title: "text-slate-400",
    value: "text-white",
    label: "text-slate-500",
    error: "text-red-400",
    empty: "text-slate-500",
  },
};



export type ThemeName = "light" | "dark";

export const themes: Record<ThemeName, WidgetTheme<CardSlot>> = {
  light: lightTheme,
  dark: darkTheme,
};

export const DEFAULT_THEME: ThemeName = "light";
