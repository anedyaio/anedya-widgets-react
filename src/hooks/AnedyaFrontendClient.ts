import { Anedya } from "@anedyasystems/anedya-frontend-sdk";
import { AnedyaClient } from "../components/types";

let globalClient: AnedyaClient | null = null;

// --- Global rate limiter map ---
type RateLimiter = {
  lastCallTime: number;
  interval: number;
};

const nodeRateLimiters = new Map<string, RateLimiter>();


// --- Type for InitOptions ---
interface InitOptions {
  useGlobal?: boolean;
  forceReinit?: boolean;
  rateLimitMs?: number; // ✅ configurable rate limit interval
}

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
  const rateLimitMs = options?.rateLimitMs ?? 100; // ✅ default: 10 seconds

  if (useGlobal && globalClient && !forceReinit) {
    return globalClient;
  }

  const anedya = new Anedya();
  const config = anedya.NewConfig(tokenId, token);
  const client = anedya.NewClient(config);

  // --- Patch NewNode with per-node rate limiter ---
  const originalNewNode: (...args: any[]) => any = anedya.NewNode.bind(anedya);

  anedya.NewNode = (...args: any[]): any => {
    const node = originalNewNode(...args); // ✅ now properly typed

    // Extract nodeId (second argument)
    const nodeId = typeof args[1] === "string" ? args[1] : `unknown-${Date.now()}`;

    const limiter =
      nodeRateLimiters.get(nodeId) || {
        lastCallTime: 0,
        interval: rateLimitMs, // ✅ use configurable rate limit
      };
    nodeRateLimiters.set(nodeId, limiter);

    if (node.getLatestData) {
      const originalGetLatestData: (...params: any[]) => Promise<any> =
        node.getLatestData.bind(node);

      node.getLatestData = async (...params: any[]): Promise<any> => {
        const now = Date.now();
        const elapsed = now - limiter.lastCallTime;

        if (elapsed < limiter.interval) {
          const wait = limiter.interval - elapsed;
          console.warn(
            `⏳ Rate limited for node ${nodeId}: waiting ${wait}ms before next call`
          );
          await new Promise((r) => setTimeout(r, wait));
        }

        limiter.lastCallTime = Date.now();

        try {
          return await originalGetLatestData(...params);
        } catch (err) {
          console.error(`⚠️ API call failed for node ${nodeId}:`, err);
          throw err;
        }
      };
    }

    return node;
  };

  // Attach wrapped anedya instance to client
  (client as any)._anedya = anedya;

  if (useGlobal) {
    globalClient = client;
  }

  return client;
}


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


//tick count less -- done
//rate interval less -- dpne
//guagae not taking unit -- done
//error change-- add border and svg icon  -- done
//latest data widget error not cventered -- done 
// default should be white background --- done 
//displaytext gauage
// Total callbacks to be provided for Number widget: 1-> Styling, 2-> Display Text Formatter - done
// Callbacks for Chart: 1-> Styling, 2-> Tick Formaters for x and y, 3-> Tooltip formatter -- done 


//0-100 red, 40-100, yellow, less than 40 is green - done
//make  value text defualt bigger in latest data -- done 
//text styling label not matching in chart and latest data, one is bolder and diff font family ---done
//make chart size and all others bigger to accodomate overflow of x axis -- done
//rekmove error keywrd, make opacity higher -- done 
//fix gauage value init styling
//afdd display number func in guage
//make swure its all responsive and make example responsive 
//x axis tick count and y axis count 
// user get input for timezone and what format u want to follow -- see how it is managed in the UI-- make callbacks more optimized and user friendly