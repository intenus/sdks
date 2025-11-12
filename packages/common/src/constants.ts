import { getEnv, getEnvNumber } from './utils/env.js';

/**
 * Protocol constants with environment support
 */
export const PROTOCOL_CONSTANTS = {
  MIN_SOLVER_STAKE: getEnv('MIN_SOLVER_STAKE', '1000000000000'),
  EPOCH_DURATION_MS: getEnvNumber('EPOCH_DURATION_MS', 10_000),
  SOLVER_WINDOW_MS: getEnvNumber('SOLVER_WINDOW_MS', 5_000),
  MAX_SLIPPAGE_BPS: getEnvNumber('MAX_SLIPPAGE_BPS', 1000),
  DEFAULT_SLIPPAGE_BPS: getEnvNumber('DEFAULT_SLIPPAGE_BPS', 50),
  BATCH_TIMEOUT_MS: getEnvNumber('BATCH_TIMEOUT_MS', 30000),
  MAX_INTENTS_PER_BATCH: getEnvNumber('MAX_INTENTS_PER_BATCH', 100),
  DEFAULT_GAS_BUDGET: getEnvNumber('DEFAULT_GAS_BUDGET', 10000000),
} as const;

/**
 * Network configuration with environment support
 */
export const NETWORKS = {
  MAINNET: {
    sui_rpc_url: getEnv('SUI_MAINNET_RPC_URL', 'https://fullnode.mainnet.sui.io:443')!,
    walrus: {
      publisher: getEnv('WALRUS_MAINNET_PUBLISHER_URL', 'https://publisher.walrus.space')!,
      aggregator: getEnv('WALRUS_MAINNET_AGGREGATOR_URL', 'https://aggregator.walrus.space')!,
      uploadRelay: getEnv('WALRUS_MAINNET_UPLOAD_RELAY_URL', 'https://upload-relay.mainnet.walrus.space')!,
    },
  },
  TESTNET: {
    sui_rpc_url: getEnv('SUI_TESTNET_RPC_URL', 'https://fullnode.testnet.sui.io:443')!,
    walrus: {
      publisher: getEnv('WALRUS_TESTNET_PUBLISHER_URL', 'https://publisher.walrus-testnet.walrus.space')!,
      aggregator: getEnv('WALRUS_TESTNET_AGGREGATOR_URL', 'https://aggregator.walrus-testnet.walrus.space')!,
      uploadRelay: getEnv('WALRUS_TESTNET_UPLOAD_RELAY_URL', 'https://upload-relay.testnet.walrus.space')!,
    },
  }
} as const;

/**
 * Redis configuration with environment support
 */
export const REDIS_CONFIG = {
  url: getEnv('REDIS_URL', 'redis://localhost:6379')!,
  channels: {
    NEW_BATCHES: getEnv('REDIS_CHANNEL_NEW_BATCHES', 'intenus:batches:new')!,
    SOLUTIONS: getEnv('REDIS_CHANNEL_SOLUTIONS', 'intenus:solutions')!,
  },
} as const;

/**
 * Walrus storage paths for AI infrastructure standard
 */
export const WALRUS_PATHS = {
  batchManifest: (epoch: number) => `/batches/${epoch}/batch_manifest.json`,
  batchArchive: (epoch: number, batchId: string) => `/archives/${epoch}/batch_${batchId}.json`,
  userHistory: (address: string) => `/users/${address}/history_aggregated.json`,
  datasetMetadata: (version: string) => `/training/datasets/${version}/dataset_metadata.json`,
  datasetFeatures: (version: string) => `/training/datasets/${version}/features.parquet`,
  datasetLabels: (version: string) => `/training/datasets/${version}/labels.parquet`,
  modelMetadata: (name: string, version: string) => `/training/models/${name}/${version}/model_metadata.json`,
  modelFile: (name: string, version: string) => `/training/models/${name}/${version}/model.onnx`,
} as const;

/**
 * Legacy Walrus path types for backward compatibility
 */
export interface WalrusPath {
  intents: `/intents/${number}/${string}.json`;
  batches: `/batches/${number}/manifest.json`;
  solutions: `/solutions/${string}/${string}.json`;
}
