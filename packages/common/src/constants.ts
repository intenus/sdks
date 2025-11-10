/**
 * Protocol constants
 */
export const PROTOCOL_CONSTANTS = {
  MIN_SOLVER_STAKE: '1000000000000', // 1000 SUI
  EPOCH_DURATION_MS: 10_000, // 10 seconds
  SOLVER_WINDOW_MS: 5_000, // 5 seconds
  MAX_SLIPPAGE_BPS: 1000, // 10%
  DEFAULT_SLIPPAGE_BPS: 50, // 0.5%
} as const;

/**
 * Network endpoints
 */
export const NETWORKS = {
  MAINNET: {
    sui: 'https://fullnode.mainnet.sui.io:443',
    walrus: 'https://walrus.mainnet.walrus.site',
  },
  TESTNET: {
    sui: 'https://fullnode.testnet.sui.io:443',
    walrus: 'https://walrus.testnet.walrus.site',
  },
} as const;

/**
 * Walrus path types for type safety
 */
export interface WalrusPath {
  intents: `/intents/${number}/${string}.json`;
  batches: `/batches/${number}/manifest.json`;
  solutions: `/solutions/${string}/${string}.json`;
}
