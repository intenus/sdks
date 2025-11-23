/**
 * @intenus/walrus - Walrus storage wrapper for Intenus Protocol
 * Uses WalrusFile API for optimal storage efficiency
 */

// Main client
export { IntenusWalrusClient } from './client.js';

// Export types
export type {
  IntenusWalrusConfig,
  StorageResult,
  WalrusStorageError,
  WalrusFetchError
} from './types/index.js';

// Export all types
export type * from './types/index.js';

// Services
export type {
  IntentStorageService,
  SolutionStorageService,
  DatasetStorageService,
  EncryptedStorageService,
  DatasetVersionBuilder,
  DatasetVersionResult,
  EncryptedStorageResult
} from './services/index.js';

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
  WalrusOptions,
  WalrusFile
} from '@mysten/walrus';

// Re-export Seal types for encrypted storage
export type {
  IntenusSealClient,
  IntentEncryptionConfig,
  SolutionEncryptionConfig,
  EncryptionResult,
  DecryptionRequest
} from '@intenus/seal';
