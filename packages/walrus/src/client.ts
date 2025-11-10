/**
 * Main Intenus Walrus Client (Facade Pattern)
 */

import { WalrusClient } from '@mysten/walrus';
import type { Signer } from '@mysten/sui/cryptography';
import { NETWORKS } from '@intenus/common';
import { StoragePathBuilder } from './utils/paths.js';
import { 
  BatchStorageService,
  ArchiveStorageService,
  UserStorageService,
  TrainingStorageService
} from './services/index.js';
import type { 
  IntenusWalrusConfig,
  StorageResult
} from './types/index.js';
import { 
  WalrusStorageError,
  WalrusFetchError
} from './types/index.js';

export class IntenusWalrusClient {
  private walrusClient: WalrusClient;
  private config: Required<IntenusWalrusConfig>;
  
  // Services (Facade Pattern)
  public readonly batches: BatchStorageService;
  public readonly archives: ArchiveStorageService;
  public readonly users: UserStorageService;
  public readonly training: TrainingStorageService;
  
  constructor(config: IntenusWalrusConfig) {
    const networkConfig = NETWORKS[config.network.toUpperCase() as keyof typeof NETWORKS];
    
    if (!networkConfig) {
      throw new Error(`Unknown network: ${config.network}`);
    }
    
    // Set defaults
    this.config = {
      network: config.network,
      publisherUrl: config.publisherUrl || networkConfig.walrus.publisher,
      aggregatorUrl: config.aggregatorUrl || networkConfig.walrus.aggregator,
      defaultEpochs: config.defaultEpochs || 1,
    };
    
    // Initialize Walrus client with proper network configuration
    this.walrusClient = new WalrusClient({
      network: this.config.network === 'devnet' ? 'testnet' : this.config.network,
      suiRpcUrl: networkConfig.sui,
    });
    
    // Initialize services
    this.batches = new BatchStorageService(this, StoragePathBuilder);
    this.archives = new ArchiveStorageService(this, StoragePathBuilder);
    this.users = new UserStorageService(this, StoragePathBuilder);
    this.training = new TrainingStorageService(this);
  }
  
  // ===== LOW-LEVEL METHODS =====
  
  async storeRaw(
    path: string,
    data: Buffer,
    epochs: number,
    signer: Signer
  ): Promise<StorageResult> {
    try {
      const result = await this.walrusClient.writeBlob({
        blob: new Uint8Array(data),
        deletable: false,
        epochs,
        signer,
      });
      
      return {
        blob_id: result.blobId,
        path,
        size_bytes: data.length,
        created_at: Date.now(),
        epochs,
      };
    } catch (error: any) {
      throw new WalrusStorageError(
        `Failed to store to ${path}: ${error.message}`,
        'STORE_FAILED'
      );
    }
  }
  
  async fetchRaw(path: string): Promise<Buffer> {
    try {
      // Note: In real implementation, we'd need to maintain a mapping
      // from path to blob_id, or use a different approach
      // For now, we assume path contains the blob_id
      const blobId = this.extractBlobIdFromPath(path);
      const result = await this.walrusClient.readBlob({ blobId });
      return Buffer.from(result);
    } catch (error: any) {
      throw new WalrusFetchError(
        `Failed to fetch from ${path}: ${error.message}`,
        path
      );
    }
  }
  
  async exists(path: string): Promise<boolean> {
    try {
      await this.fetchRaw(path);
      return true;
    } catch {
      return false;
    }
  }
  
  // ===== UTILITIES =====
  
  private extractBlobIdFromPath(path: string): string {
    // This is a simplified implementation
    // In practice, you'd maintain a path -> blob_id mapping
    // or use a different storage strategy
    throw new Error('Path to blob_id mapping not implemented. Use direct blob operations.');
  }
  
  // ===== DIRECT WALRUS CLIENT ACCESS =====
  
  /**
   * Get the underlying Walrus client for direct access
   * Use this when you need functionality not provided by the wrapper
   */
  getWalrusClient(): WalrusClient {
    return this.walrusClient;
  }
  
  /**
   * Reset cached data in the client
   */
  reset(): void {
    this.walrusClient.reset();
  }
}
