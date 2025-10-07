
import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { AnedyaClient, AnedyaNode } from "./types/anedya";

let globalClient: AnedyaClient | null = null;
let globalNode: AnedyaNode | null = null;

/**
 * Initializes (or retrieves) an Anedya client instance.
 *
 * @param tokenId  - Your Anedya token ID
 * @param token    - Your Anedya token
 * @param options  - Optional settings
 *    - useGlobal: use a shared global instance (default true)
 *    - forceReinit: recreate client even if one exists (default false)
 */

export function initAnedyaClient(
  tokenId: string,
  token: string,
options?: {
    useGlobal?: boolean;
    forceReinit?: boolean;
  }
): AnedyaClient {
  const useGlobal = options?.useGlobal ?? false;
  const forceReinit = options?.forceReinit ?? false;

  // If using global instance, reuse unless forced to reinit
  if (useGlobal && globalClient && globalNode && !forceReinit) {
return globalClient;
  }

  // Always create new instances
  const anedya = new Anedya();
  const config = anedya.NewConfig(tokenId, token);
  const client = anedya.NewClient(config);


  // Store globally if required
  if (useGlobal) {
    globalClient = client;

  }

  return client;
}

/**
 * Retrieves the globally initialized Anedya client.
 * Throws if not initialized.
 */
export function getAnedyaClient(): AnedyaClient {
  if (!globalClient) {
    throw new Error("Anedya client not initialized! Call initAnedyaClient first.");
  }
  return globalClient;
}

/**
 * Clears the global Anedya client (for logout/reset).
 */
export function resetAnedyaClient(): void {
  globalClient = null;
}

