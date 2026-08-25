import { CardSlot } from "../components/AnedyaCard";
import { WidgetTheme } from "../types/root";

export const CARD_DEFAULT_CLASSES: Record<CardSlot, string> = {
  container:
    "flex flex-col items-center justify-center text-center border rounded-xl " +
    "p-[var(--anedya-card-padding)] gap-[var(--anedya-card-gap)] " +
    "bg-[var(--card,var(--anedya-fallback-bg))] " +
    "border-[var(--border,var(--anedya-fallback-border))]",

  title:
    "text-[length:var(--anedya-card-title-size)] font-medium " +
    "text-[var(--muted-foreground,var(--anedya-fallback-muted))]",

  value:
    "text-[length:var(--anedya-card-value-size)] font-bold leading-none " +
    "text-[var(--card-foreground,var(--anedya-fallback-fg))]",

  unit:
    "text-[length:var(--anedya-card-unit-size)] " +
    "text-[var(--card-foreground,var(--anedya-fallback-fg))]",

  label:
    "text-[length:var(--anedya-card-label-size)] " +
    "text-[var(--muted-foreground,var(--anedya-fallback-muted))]",

  error: "text-sm font-medium text-red-600",
  empty: "text-[length:var(--anedya-card-value-size)] font-bold text-[var(--muted-foreground,var(--anedya-fallback-muted))]",
};

// `lightTheme`/`darkTheme` remain as explicit OPT-IN presets — a consumer
// who passes theme="dark" still gets your hand-picked dark palette
// regardless of what the app's own CSS variables say. Auto-detection only
// applies when NO theme prop is set at all (the default state), via
// CARD_DEFAULT_CLASSES above.
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
