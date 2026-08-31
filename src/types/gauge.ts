// types/gauge.ts

export type GaugeSlot =
  | "container"
  | "title"
  | "unit"
  | "track"
  | "bar"
  | "needle"
  | "needleCap"
  | "value"
  | "label"
  | "tick" // NEW — tick line styling via `styles` prop
  | "tickLabel" // NEW — tick number styling via `styles` prop
  | "error"
  | "empty"
  | "tooltip";
  
  /** A flat color, or an array of 2+ colors to render as a gradient across the bar. */
  export type GaugeColor = string | string[];
  
  export type NeedleType = "line" | "rounded" | "drop" | "triangle";
  
  export type GaugeEasing =
    | "linear"
    | "quadIn"
    | "quadOut"
    | "quadInOut"
    | "cubicIn"
    | "cubicOut"
    | "cubicInOut"
    | "sinIn"
    | "sinOut"
    | "sinInOut"
    | "expIn"
    | "expOut"
    | "expInOut"
    | "circleIn"
    | "circleOut"
    | "circleInOut"
    | "backIn"
    | "backOut"
    | "backInOut"
    | "elasticIn"
    | "elasticOut"
    | "elasticInOut"
    | "bounceIn"
    | "bounceOut"
    | "bounceInOut";
    
  export interface GaugeArcConfig {
  /** Degrees, 0 = 12 o'clock, clockwise-positive. */
  startAngle?: number;
  endAngle?: number;
  radius?: number;
  /** Bar/track thickness in px. Auto-computed from radius if omitted. */
  thickness?: number;
  cornerRadius?: number;
}

export interface GaugeTrackConfig {
  show?: boolean;
  color?: string;
}

export interface GaugeNeedleConfig {
  show?: boolean;
  type?: NeedleType;
  /** Preset or px. Relative to computed radius when a preset is used. */
  length?: "short" | "medium" | "full" | number;
  width?: number;
  color?: string;
  needleColor?: string;
  capColor?: string;
  capRadius?: number;
  animation?: boolean;
}

export interface GaugeTickConfig {
  show?: boolean;
  /** Number of INTERVALS between min and max. Default 10 → 11 marks (0,10,20...100 for the 0-100 default). */
  count?: number;
  /** Tick line length in px. */
  size?: number;
  /** Tick line color (falls back to theme via `currentColor`). */
  color?: string;
  /** Gap in px between the arc's outer edge and the start of the tick line. */
  radiusOffset?: number;
  /** Gap in px between the end of the tick line and its label. */
  labelGap?: number;
  /** Tick label font size in px. */
  labelSize?: number;
  /** Tick label color (falls back to theme). */
  labelColor?: string;
  /** Custom label formatter — receives the raw tick value (e.g. 0, 10, 20...). */
  labelFormat?: (value: number) => string;
}

export interface GaugeTooltipConfig {
  show?: boolean;
  /** Full custom tooltip content. Receives the raw + formatted value, unit, and the widget's `variable` name. */
  content?: (data: {
    variable: string;
    value: number;
    displayValue: string;
    unit?: string;
  }) => React.ReactNode;
}

export interface GaugeAnimationConfig {
  show?: boolean;
  duration?: number;
  /** Any d3-ease export name, e.g. "easeCubicOut", "easeElasticOut". */
  easing?: GaugeEasing;
}