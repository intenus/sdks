/**
 * Walrus storage constants
 */
export { NETWORKS as WALRUS_NETWORKS } from '@intenus/common';

export const DEFAULT_EPOCHS = {
  INTENT: 1,           // Short-term intent storage
  SOLUTION: 1,         // Short-term solution storage
  DATASET_VERSION: 5,  // Long-term ML dataset versions
} as const;

export const SCHEMA_VERSIONS = {
  DATASET_VERSION: '1.0.0',
  MODEL_METADATA: '1.0.0',
} as const;
