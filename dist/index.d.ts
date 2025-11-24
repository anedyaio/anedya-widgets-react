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
declare function initAnedyaClient(tokenId: string, token: string, options?: InitOptions): AnedyaClient;

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
interface LatestDataComponentProps {
    client: AnedyaClient;
    nodeId: string;
    variable: string;
    title?: string;
    unit?: string;
    styles?: StyleSet;
    colorRange?: typeof defaultColorRanges;
    colorRangeCallback?: (value: number, defaultColor: string) => string;
    fontFamily?: string;
}
declare const LatestDataComponent: React.FC<LatestDataComponentProps>;

interface ChartDataPoint {
    timestamp: number;
    value: number;
}
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
}
interface ChartWidgetProps {
    client?: any;
    nodeId?: string;
    variable?: string;
    title?: string;
    styles?: ChartStyleSet;
    tooltipFormatter?: (d: ChartDataPoint) => string;
    tickCount?: number;
    tickFormatter?: (d: Date) => string;
}
declare const ChartWidget: React.FC<ChartWidgetProps>;

interface Zone {
    from: number;
    to: number;
    color: string;
}
interface GaugeStyleSet {
    container?: CSSProperties;
    title?: CSSProperties;
    valueText?: CSSProperties;
    subtitle?: CSSProperties;
    arc?: CSSProperties;
}
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
    value?: number;
    min?: number;
    max?: number;
    startAngleDeg?: number;
    endAngleDeg?: number;
    width?: number;
    height?: number;
    thickness?: number;
    zones?: Zone[];
    showNeedle?: boolean;
    needleColor?: string;
    needleWidth?: number;
    title?: string;
    subtitle?: string;
    styles?: GaugeStyleSet;
    disabled?: boolean;
    tickCount?: number;
    uom?: string;
    uomOffset?: number;
    labelOffset?: number;
    onMetrics?: (metrics: GaugeMetrics) => void;
    valueText?: (opts: {
        value?: number;
        valueMin: number;
        valueMax: number;
    }) => string;
}
declare const LatestDataGauge: React.FC<GaugeWidgetProps>;

export { ChartWidget, LatestDataComponent, LatestDataGauge, initAnedyaClient };
