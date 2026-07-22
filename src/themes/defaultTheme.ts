import { CardSlot } from "../components/CardWidget";
import { WidgetTheme } from "../types/root";


export const CARD_DEFAULT_CLASSES: Record<CardSlot, string> = {

  title:
  "text-[length:var(--anedya-card-title-size)] font-medium",

value:
  "text-[length:var(--anedya-card-value-size)] font-bold",

unit:
  "text-[length:var(--anedya-card-unit-size)]",

label:
  "text-[length:var(--anedya-card-label-size)]",

container:
  "flex flex-col border rounded-xl justify-center items-center p-[var(--anedya-card-padding)] gap-[var(--anedya-card-gap)]"
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