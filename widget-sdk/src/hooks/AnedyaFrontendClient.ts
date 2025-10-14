import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { AnedyaClient } from "../components/types";

let globalAnedya: Anedya | null = null;
let globalClient: AnedyaClient | null = null;

interface InitOptions {
  useGlobal?: boolean;     // default: false
  forceReinit?: boolean;   // default: false
}

/**
 * Initialize the Anedya client and optionally store globally.
 *
 * @returns { anedya, client }
 */
export function initAnedyaClient(
  tokenId: string,
  token: string,
  options?: InitOptions
): { anedya: Anedya; client: AnedyaClient } {
  const useGlobal = options?.useGlobal ?? false;
  const forceReinit = options?.forceReinit ?? false;

  if (useGlobal && globalAnedya && globalClient && !forceReinit) {
    return { anedya: globalAnedya, client: globalClient };
  }

  // Always create fresh instances
  const anedya = new Anedya();
  const config = anedya.NewConfig(tokenId, token);
  const client = anedya.NewClient(config);

  if (useGlobal) {
    globalAnedya = anedya;
    globalClient = client;
  }

  return { anedya, client };
}

/**
 * Retrieve the globally initialized Anedya instance and client.
 */
export function getAnedyaClient(): { anedya: Anedya; client: AnedyaClient } {
  if (!globalAnedya || !globalClient) {
    throw new Error("Anedya client not initialized! Call initAnedyaClient first.");
  }
  return { anedya: globalAnedya, client: globalClient };
}

/**
 * Clear the global Anedya client (for logout/reset).
 */
export function resetAnedyaClient(): void {
  globalAnedya = null;
  globalClient = null;
}
