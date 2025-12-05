import React, { CSSProperties } from 'react';

interface AnedyaClient {
    tokenId: string;
    tokenBytes: Uint8Array;
    signatureVersionBytes: Uint8Array;
    signatureVersion: string;
    authorizationMode: string;
    baseUrl: string;
}

interface InitOptions {
    useGlobal?: boolean;
    forceReinit?: boolean;
    rateLimitMs?: number;
}
/**
 * Initialize the Anedya client and optionally store globally.
 *
 * @returns client
 */
declare function anedyaClientInit(tokenId: string, token: string, options?: InitOptions): AnedyaClient;

declare const defaultColorRanges: {
    max: number;
    color: string;
}[];

interface StyleSet {
    container?: CSSProperties;
    label?: CSSProperties;
    value?: CSSProperties;
    unit?: CSSProperties;
}
type UnitPosition$1 = "left" | "right" | "top" | "bottom";
type UnitStyle$1 = "normal" | "subscript" | "superscript";
interface DisplayTextResult$1 {
    text: string;
    unitText?: string;
    position?: UnitPosition$1;
    unitStyle?: UnitStyle$1;
}
type DisplayTextFormatter$1 = (value: number, unit?: string) => DisplayTextResult$1;
interface LatestDataWidgetProps {
    client: AnedyaClient;
    nodeId: string;
    variable: string;
    title?: string;
    unit?: string;
    styles?: StyleSet;
    colorRange?: typeof defaultColorRanges;
    colorRangeCallback?: (value: number, defaultColor: string) => string;
    fontFamily?: string;
    displayText?: DisplayTextFormatter$1;
    onStyleChange?: (value: number) => {};
}
declare const LatestDataWidget: React.FC<LatestDataWidgetProps>;

interface ChartDataPoint {
    timestamp: number;
    value: number;
}
type WidgetState$1 = {
    value?: any;
    loading?: boolean;
    error?: string | null;
};
interface ChartStyleSet {
    container?: CSSProperties;
    title?: CSSProperties;
    tooltip?: CSSProperties;
    axis?: CSSProperties;
    chart?: {
        strokeColor?: string;
        strokeWidth?: number;
        gradientColors?: [string, string];
        dotRadius?: number;
    };
    fontFamily: string;
}
type StylesInput$1 = ChartStyleSet | ((state: WidgetState$1) => ChartStyleSet);
interface ChartWidgetProps {
    client: any;
    nodeId: string;
    variable: string;
    from: number;
    to: number;
    limit?: number;
    title?: string;
    styles?: StylesInput$1;
    tooltipFormatter?: (d: ChartDataPoint) => string;
    tickCount?: number;
    tickFormatter?: (d: Date) => string;
    xTickFormat?: string | ((d: Date) => string);
    yTickFormat?: string | ((v: number) => string);
    tooltipFormat?: string | ((d: ChartDataPoint) => string);
    onStyleChange?: (data: ChartDataPoint[]) => {};
}
declare const ChartWidget: React.FC<ChartWidgetProps>;

interface GaugeArcStyle {
    trackColor?: string;
    progressColor?: string;
    progressStroke?: string;
    fontSize?: string | number;
    fontFamily?: string;
}
interface Zone {
    from: number;
    to: number;
    color: string;
}
type WidgetState = {
    value?: any;
    loading?: boolean;
    error?: string | null;
};
interface GaugeStyleSet {
    container?: CSSProperties;
    label?: CSSProperties;
    value?: CSSProperties;
    unit?: CSSProperties;
    subtitle?: CSSProperties;
    arc?: GaugeArcStyle;
    fontFamily?: string;
}
type StylesInput = GaugeStyleSet | ((state: WidgetState) => GaugeStyleSet);
interface GaugeMetrics {
    maxRadius: number;
    valueAngleDeg: number;
    valueAngleRad: number;
    startAngleDeg: number;
    endAngleDeg: number;
    innerRadius: number;
    outerRadius: number;
    cx: number;
    cy: number;
}
interface GaugeWidgetProps {
    client: any;
    nodeId: string;
    variable: string;
    min?: number;
    max?: number;
    startAngleDeg?: number;
    endAngleDeg?: number;
    thickness?: number;
    zones?: Zone[];
    showNeedle?: boolean;
    needleColor?: string;
    needleWidth?: number;
    title?: string;
    subtitle?: string;
    styles?: StylesInput;
    disabled?: boolean;
    tickCount?: number;
    unit?: string;
    uomOffset?: number;
    labelOffset?: number;
    onMetrics?: (metrics: GaugeMetrics) => void;
    valueText?: (opts: {
        value?: number;
        valueMin: number;
        valueMax: number;
    }) => string;
    onStyleChange?: (value: number) => {};
    displayText?: DisplayTextFormatter;
}
type UnitPosition = "left" | "right" | "top" | "bottom";
type UnitStyle = "normal" | "subscript" | "superscript";
interface DisplayTextResult {
    text: string;
    unitText?: string;
    position?: UnitPosition;
    unitStyle?: UnitStyle;
}
type DisplayTextFormatter = (value: number, unit?: string) => DisplayTextResult;
declare const LatestDataGauge: React.FC<GaugeWidgetProps>;

export { ChartWidget, LatestDataGauge, LatestDataWidget, anedyaClientInit };
