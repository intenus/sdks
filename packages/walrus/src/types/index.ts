/**
 * Walrus storage configuration and result types
 */

import { SuiClientOptions } from '@mysten/sui/client';
import { WalrusClientConfig } from '@mysten/walrus';

export type { 
  BatchIntent, 
  BatchManifest,
  BatchArchive,
  ArchivedSolution,
  ExecutionOutcome,
  MLFeatures,
  UserHistoryAggregated,
  TrainingDatasetMetadata,
  ModelMetadata,
  StorageResult
} from '@intenus/common';

export type { 
  WalrusClientConfig,
  WalrusOptions 
} from '@mysten/walrus';


export interface IntenusWalrusConfig {
  network: 'mainnet' | 'testnet';
  walrusConfig?: WalrusClientConfig;
  suiClientOptions?: SuiClientOptions;
}





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
