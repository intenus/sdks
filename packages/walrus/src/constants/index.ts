/**
 * Re-export from common for backward compatibility
 */
export { NETWORKS as WALRUS_NETWORKS } from '@intenus/common';

export const DEFAULT_EPOCHS = {
  BATCH_MANIFEST: 1,      // Short-term
  BATCH_ARCHIVE: 5,     // Long-term
  USER_HISTORY: 3,       // Medium-term
  TRAINING_DATA: 5,     // Long-term
  ML_MODELS: 5,         // Long-term
} as const;

export const SCHEMA_VERSIONS = {
  BATCH_MANIFEST: '1.0.0',
  BATCH_ARCHIVE: '1.0.0',
  USER_HISTORY: '1.0.0',
  TRAINING_DATASET: '1.0.0',
  MODEL_METADATA: '1.0.0',
} as const;
