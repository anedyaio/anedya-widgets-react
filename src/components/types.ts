
export interface AnedyaNode {
  getNodeId(): string;

  // historical timeseries
  getData(accessDataReq: any): Promise<any>;

  // latest datapoint
  getLatestData(variableIdentifier: string): Promise<any>;

  // snapshot
  getSnapshot(reqConfig: any): Promise<any>;

  // value store API
  setKey(reqConfig: any): Promise<any>;
  getKey(reqConfig: any): Promise<any>;
  deleteKey(reqConfig: any): Promise<any>;
  scanKeys(reqConfig: any): Promise<any>;

  // device status
  getDeviceStatus(lastContactThreshold: number): Promise<any>;
}


export interface AnedyaClient {
  tokenId: string;
  tokenBytes: Uint8Array;
  signatureVersionBytes: Uint8Array;
  signatureVersion: string;
  authorizationMode: string;
  baseUrl: string;

}
