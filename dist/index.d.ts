import React from 'react';

interface AnedyaNode {
    getNodeId(): string;
    getData(accessDataReq: any): Promise<any>;
    getLatestData(variableIdentifier: string): Promise<any>;
    getSnapshot(reqConfig: any): Promise<any>;
    setKey(reqConfig: any): Promise<any>;
    getKey(reqConfig: any): Promise<any>;
    deleteKey(reqConfig: any): Promise<any>;
    scanKeys(reqConfig: any): Promise<any>;
    getDeviceStatus(lastContactThreshold: number): Promise<any>;
}
interface AnedyaClient {
    tokenId: string;
    tokenBytes: Uint8Array;
    signatureVersionBytes: Uint8Array;
    signatureVersion: string;
    authorizationMode: string;
    baseUrl: string;
    NewNode(client: AnedyaClient, nodeId: string): AnedyaNode;
}

/**
 * Initializes (or retrieves) an Anedya client instance.
 *
 * @param tokenId  - Your Anedya token ID
 * @param token    - Your Anedya token
 * @param options  - Optional settings
 *    - useGlobal: use a shared global instance (default true)
 *    - forceReinit: recreate client even if one exists (default false)
 */
declare function initAnedyaClient(tokenId: string, token: string, options?: {
    useGlobal?: boolean;
    forceReinit?: boolean;
}): AnedyaClient;

interface LatestDataWidgetProps {
    client: AnedyaClient;
    nodeId: string;
    variable: string;
    refreshInterval?: number;
    backgroundColor?: string;
    fontSize?: string;
    textColor?: string;
    borderRadius?: string;
    padding?: string;
}
declare const LatestDataWidget: React.FC<LatestDataWidgetProps>;

export { LatestDataWidget, initAnedyaClient };
