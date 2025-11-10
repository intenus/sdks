/**
 * @intenus/walrus - Walrus storage wrapper for Intenus Protocol
 */

// Main client
export { IntenusWalrusClient } from './client.js';

// Export types
export type {
  IntenusWalrusConfig,
  StorageResult,
  QuiltBlob,
  QuiltPatch,
  QuiltResult,
  WalrusStorageError,
  WalrusFetchError
} from './types/index.js';

// Export utilities
export {
  createQuiltBlob,
  createQuiltBlobFromBuffer,
  batchIntentsToQuilt,
  batchSolutionsToQuilt,
  batchTrainingDataToQuilt,
  calculateQuiltSavings,
  shouldUseQuilt,
  parsePatchIdentifier
} from './utils/quilt.js';

// Types
export type * from './types/index.js';

// Services
export type {
  BatchStorageService,
  ArchiveStorageService,
  UserStorageService,
  TrainingStorageService
} from './services/index.js';

// Utilities
export { StoragePathBuilder } from './utils/index.js';

// Constants
export { 
  WALRUS_NETWORKS,
  DEFAULT_EPOCHS,
  SCHEMA_VERSIONS 
} from './constants/index.js';

// Re-export useful Walrus types
export type { 
  WalrusClient,
  WalrusClientConfig,
  WalrusOptions 
} from '@mysten/walrus';
