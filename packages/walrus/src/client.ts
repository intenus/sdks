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
  StorageResult,
  QuiltResult,
  QuiltBlob
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
  
  // ===== QUILT METHODS (BATCH OPTIMIZATION) =====
  
  /**
   * Store multiple blobs efficiently using Quilt
   * Ideal for batching intents, solutions, or training data
   */
  async storeQuilt(
    blobs: QuiltBlob[],
    epochs: number,
    signer: Signer,
    deletable: boolean = false
  ): Promise<QuiltResult> {
    try {
      const result = await this.walrusClient.writeQuilt({
        blobs: blobs.map(blob => ({
          contents: blob.contents,
          identifier: blob.identifier,
          tags: blob.tags || {}
        })),
        epochs,
        signer,
        deletable
      });
      
      return {
        blobId: result.blobId,
        patches: result.index.patches.map(patch => ({
          patchId: patch.patchId,
          identifier: patch.identifier,
          tags: patch.tags instanceof Map ? Object.fromEntries(patch.tags) : patch.tags,
          startIndex: patch.startIndex,
          endIndex: patch.endIndex
        })),
        size_bytes: blobs.reduce((total, blob) => total + blob.contents.length, 0),
        created_at: Date.now(),
        epochs
      };
    } catch (error: any) {
      throw new WalrusStorageError(
        `Failed to store quilt: ${error.message}`,
        'QUILT_STORE_FAILED'
      );
    }
  }
  
  /**
   * Fetch individual blob from quilt by patch ID
   */
  async fetchFromQuilt(patchId: string): Promise<Buffer> {
    try {
      // Note: This would need to be implemented based on Walrus SDK's quilt reading capabilities
      // For now, we'll use the regular blob reading with patch ID
      const result = await this.walrusClient.readBlob({ blobId: patchId });
      return Buffer.from(result);
    } catch (error: any) {
      throw new WalrusFetchError(
        `Failed to fetch from quilt patch ${patchId}: ${error.message}`,
        patchId
      );
    }
  }
  
  /**
   * Encode quilt without storing (for size estimation)
   */
  async encodeQuilt(blobs: QuiltBlob[]): Promise<{
    quilt: Uint8Array;
    patches: Array<{
      identifier: string;
      tags: Record<string, string>;
      startIndex: number;
      endIndex: number;
    }>;
  }> {
    try {
      const result = await this.walrusClient.encodeQuilt({
        blobs: blobs.map(blob => ({
          contents: blob.contents,
          identifier: blob.identifier,
          tags: blob.tags || {}
        }))
      });
      
      return {
        quilt: result.quilt,
        patches: result.index.patches.map(patch => ({
          identifier: patch.identifier,
          tags: patch.tags instanceof Map ? Object.fromEntries(patch.tags) : patch.tags,
          startIndex: patch.startIndex,
          endIndex: patch.endIndex
        }))
      };
    } catch (error: any) {
      throw new WalrusStorageError(
        `Failed to encode quilt: ${error.message}`,
        'QUILT_ENCODE_FAILED'
      );
    }
  }
  
  /**
   * Calculate optimal batch size for Quilt
   * Returns recommended number of blobs per quilt
   */
  calculateOptimalBatchSize(averageBlobSize: number): number {
    const MAX_QUILT_BLOBS = 666;
    const OPTIMAL_QUILT_SIZE = 5 * 1024 * 1024; // 5MB
    
    const recommendedCount = Math.floor(OPTIMAL_QUILT_SIZE / averageBlobSize);
    return Math.min(recommendedCount, MAX_QUILT_BLOBS);
  }
  
  // ===== UTILITIES =====
  
  private extractBlobIdFromPath(path: string): string {
    // Legacy method - kept for backward compatibility
    // With Quilt integration, this is less needed
    console.warn(`extractBlobIdFromPath: Consider using Quilt for better path management`);
    throw new Error('Path to blob_id mapping not implemented. Use Quilt for batch operations.');
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
