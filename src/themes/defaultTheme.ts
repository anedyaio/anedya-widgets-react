import { CardSlot } from "../components/CardWidget";
import { WidgetTheme } from "../types/root";


export const CARD_DEFAULT_CLASSES: Record<CardSlot, string> = {

  title:
  "text-[length:var(--anedya-card-title-size)] font-medium",

value: "text-[length:var(--anedya-card-value-size)] font-bold max-w-full min-w-0 leading-tight",

unit:
  "text-[length:var(--anedya-card-unit-size)]",

label:
  "text-[length:var(--anedya-card-label-size)]",
container:
  "flex flex-col items-center justify-center text-center border rounded-xl p-[var(--anedya-card-padding)] gap-[var(--anedya-card-gap)]",
  error: "text-sm font-medium",
  empty: "text-[length:var(--anedya-card-value-size)] font-bold",
};


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
export const themes = { light: lightTheme, dark: darkTheme } as const;
export type ThemeName = keyof typeof themes;
export const DEFAULT_THEME: ThemeName = "light";