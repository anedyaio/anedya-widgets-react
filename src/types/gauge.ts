// import { CardSlot } from "./card"; // for BuiltInTheme reuse pattern

// export type GaugeVariant = "progress" | "needle" | "segmented" | "multiBar";

// export type GaugeSlot =
//   | "container"
//   | "title"
//   | "track"
//   | "bar"
//   | "segment"
//   | "needle"
//   | "needleCap"
//   | "tick"
//   | "tickLabel"
//   | "scaleLabel"
//   | "value"
//   | "unit"
//   | "label"
//   | "tooltip";

// export interface GaugeArcConfig {
//   /** Degrees, 0 = 12 o'clock, clockwise-positive. */
//   startAngle?: number;
//   endAngle?: number;
//   radius?: number;
//   /** Bar/track thickness in px. Auto-computed from radius if omitted. */
//   thickness?: number;
//   cornerRadius?: number;
//   /** Gap between concentric bars (multiBar) or track/bar (px). */
//   gap?: number;
// }

// export interface GaugeTrackConfig {
//   show?: boolean;
//   color?: string;
// }

// export type GaugeColor = string | string[];

// export interface GaugeBarSpec {
//   value: number;
//   color?: GaugeColor;
//   label?: string;
// }

// export type NeedleType = "line" | "rounded" | "drop" | "triangle";

// export interface GaugeNeedleConfig {
//   show?: boolean;
//   type?: NeedleType;
//   /** Preset or px. Relative to computed radius when a preset is used. */
//   length?: "short" | "medium" | "full" | number;
//   width?: number;
//   color?: string;
//   capRadius?: number;
//   animation?: boolean;
// }

// export interface GaugeLabelsConfig {
//   show?: boolean;
//   position?: "inside" | "outside";
// }

// export interface GaugeValueLabelConfig {
//   show?: boolean;
//   precision?: number;
//   prefix?: string;
//   suffix?: string;
//   formatter?: (value: number) => string;
// }

// export interface GaugeNeedleLabelConfig {
//   show?: boolean;
//   formatter?: (value: number) => string;
// }

// export interface GaugeScaleConfig {
//   minLabel?: string;
//   maxLabel?: string;
// }

// export interface GaugeTicksConfig {
//   show?: boolean;
//   count?: number;
//   position?: "inside" | "outside" | "cross";
//   length?: number;
//   labels?: boolean;
// }

// export interface GaugeSegment {
//     from: number;
//     to: number;
//     color: GaugeColor;
//   }
  
//   export interface GaugeThreshold {
//     value: number;
//     color: GaugeColor;
//   }

// export interface GaugeGradientConfig {
//   colors: string[];
// }

// export interface GaugeAnimationConfig {
//   duration?: number;
//   /* .g. "easeCubicOut", "easeElasticOut". */
//   easing?: string;
// }

// export interface GaugeTooltipConfig {
//   show?: boolean;
// }

export type GaugeSlot =
  | "container"
  | "title"
  | "unit"
  | "track"
  | "bar"
  | "needle"
  | "needleCap"
  | "value"
  | "label";

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

/** A flat color, or an array of 2+ colors to render as a gradient across the bar. */
export type GaugeColor = string | string[];

export type NeedleType = "line" | "rounded" | "drop" | "triangle";

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

export interface GaugeValueLabelConfig {
  show?: boolean;
  precision?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (value: number) => string;
}

export interface GaugeAnimationConfig {
  duration?: number;
  /** Any d3-ease export name, e.g. "easeCubicOut", "easeElasticOut". */
  easing?: string;
}