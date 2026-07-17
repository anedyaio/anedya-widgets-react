import { CardSlot } from "../components/CardWidget";
import { WidgetTheme } from "../types/root";


export const CARD_DEFAULT_CLASSES: Record<CardSlot, string> = {
  container: "flex flex-col gap-1 rounded-xl border p-4",
  title: "text-sm font-medium",
  value: "text-4xl font-bold",
  unit: "text-[0.5em] font-normal ml-1",
  label: "text-xs",
};


export const lightTheme: WidgetTheme<CardSlot> = {
  classNames: {
    container: "bg-white border-slate-200",
    title: "text-slate-500",
    value: "text-slate-900",
    label: "text-slate-400",
  },
};

export const darkTheme: WidgetTheme<CardSlot> = {
  classNames: {
    container: "bg-slate-900 border-slate-800",
    title: "text-slate-400",
    value: "text-white",
    label: "text-slate-500",
  },
};
export const themes = { light: lightTheme, dark: darkTheme } as const;
export type ThemeName = keyof typeof themes;
export const DEFAULT_THEME: ThemeName = "light";