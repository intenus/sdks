/**
 * Walrus storage configuration and result types
 */

export * from './batch.js';
export * from './archive.js';
export * from './user.js';
export * from './training.js';

// Re-export common Walrus types
export type { 
  WalrusClientConfig,
  WalrusOptions 
} from '@mysten/walrus';

// ===== CONFIGURATION =====

export interface IntenusWalrusConfig {
  network: 'mainnet' | 'testnet' | 'devnet';
  publisherUrl?: string;
  aggregatorUrl?: string;
  defaultEpochs?: number;
}

// ===== STORAGE RESULT =====

export interface StorageResult {
  blob_id: string;
  path: string;
  size_bytes: number;
  created_at: number;
  epochs: number;
}

// ===== ERROR TYPES =====

export class WalrusStorageError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'WalrusStorageError';
  }
}

export class WalrusFetchError extends Error {
  constructor(message: string, public blobId: string) {
    super(message);
    this.name = 'WalrusFetchError';
  }
}
