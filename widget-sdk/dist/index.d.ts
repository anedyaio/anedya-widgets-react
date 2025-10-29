import React from 'react';
import { SxProps, Theme } from '@mui/material';

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
    container?: SxProps<Theme>;
    label?: SxProps<Theme>;
    value?: SxProps<Theme>;
    unit?: SxProps<Theme>;
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

export { LatestDataComponent, initAnedyaClient };
