import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { AnedyaClient } from "../components/types";

let globalClient: AnedyaClient | null = null;

interface InitOptions {
  useGlobal?: boolean; // default: false
  forceReinit?: boolean; // default: false
}
type RateLimiter = {
  lastCallTime: number;
  interval: number;
};

const nodeRateLimiters = new Map<string, RateLimiter>();

/**
 * Initialize the Anedya client and optionally store globally.
 *
 * @returns client
 */
export function anedyaClientInit(
  tokenId: string,
  token: string,
  options?: InitOptions
): AnedyaClient {
  const useGlobal = options?.useGlobal ?? false;
  const forceReinit = options?.forceReinit ?? false;
  if (useGlobal && globalClient && !forceReinit) {
    return globalClient;
  } // Always create fresh instances
  const anedya = new Anedya();
  const config = anedya.NewConfig(tokenId, token);
  const client = anedya.NewClient(config);
  if (useGlobal) {
    globalClient = client;
  }
  return client;
}

// --- Global rate limiter map ---



/**
 * Retrieve the globally initialized Anedya instance and client.
 */
export function getAnedyaClient(): AnedyaClient {
  if (!globalClient) {
    throw new Error(
      "Anedya client not initialized! Call anedyaClientInit first."
    );
  }
  return globalClient;
}

/**
 * Clear the global Anedya client (for logout/reset).
 */
export function resetAnedyaClient(): void {
  globalClient = null;
}
