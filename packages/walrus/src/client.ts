/**
 * Main Intenus Walrus Client
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
  
  // Cache for quilt indices
  private quiltIndexCache: Map<string, QuiltResult> = new Map();
  
  // Services
  public readonly batches: BatchStorageService;
  public readonly archives: ArchiveStorageService;
  public readonly users: UserStorageService;
  public readonly training: TrainingStorageService;
  
  constructor(config: IntenusWalrusConfig) {
    const networkConfig = NETWORKS[config.network.toUpperCase() as keyof typeof NETWORKS];
    
    if (!networkConfig) {
      throw new Error(`Unknown network: ${config.network}`);
    }
    
    // Initialize configuration
    this.config = {
      network: config.network,
      publisherUrl: config.publisherUrl || networkConfig.walrus.publisher,
      aggregatorUrl: config.aggregatorUrl || networkConfig.walrus.aggregator,
      defaultEpochs: config.defaultEpochs || 1,
    };
    
    // Initialize Walrus client
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
  
  async fetchRaw(blobId: string): Promise<Buffer> {
    try {
      const result = await this.walrusClient.readBlob({ blobId });
      return Buffer.from(result);
    } catch (error: any) {
      throw new WalrusFetchError(
        `Failed to fetch blob ${blobId}: ${error.message}`,
        blobId
      );
    }
  }
  
  async exists(blobId: string): Promise<boolean> {
    try {
      await this.fetchRaw(blobId);
      return true;
    } catch {
      return false;
    }
  }
  
  // ===== QUILT METHODS =====
  
  /**
   * Store multiple blobs efficiently using Quilt
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
      
      const quiltResult: QuiltResult = {
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
      
      // Cache for future reads
      this.quiltIndexCache.set(result.blobId, quiltResult);
      
      return quiltResult;
    } catch (error: any) {
      throw new WalrusStorageError(
        `Failed to store quilt: ${error.message}`,
        'QUILT_STORE_FAILED'
      );
    }
  }
  
  /**
   * Fetch individual blob from quilt
   */
  async fetchFromQuilt(
    quiltBlobId: string,
    patchIdentifier: string
  ): Promise<Buffer> {
    try {
      // Retrieve cached index
      let quiltResult = this.quiltIndexCache.get(quiltBlobId);
      
      if (!quiltResult) {
        throw new Error(
          `Quilt index not found for blobId ${quiltBlobId}. ` +
          `Store the QuiltResult when writing to enable individual patch reads.`
        );
      }
      
      // Locate target patch
      const patch = quiltResult.patches.find(p => p.identifier === patchIdentifier);
      
      if (!patch) {
        throw new Error(`Patch ${patchIdentifier} not found in quilt ${quiltBlobId}`);
      }
      
      // Fetch complete quilt data
      const quiltData = await this.walrusClient.readBlob({ blobId: quiltBlobId });
      
      // Extract target patch
      const patchData = quiltData.slice(patch.startIndex, patch.endIndex);
      
      return Buffer.from(patchData);
    } catch (error: any) {
      throw new WalrusFetchError(
        `Failed to fetch from quilt: ${error.message}`,
        quiltBlobId
      );
    }
  }
  
  /**
   * Read entire quilt and return all patches
   */
  async readQuilt(quiltBlobId: string): Promise<{
    patches: Array<{
      identifier: string;
      tags: Record<string, string>;
      data: Buffer;
    }>;
  }> {
    try {
      // Retrieve cached index
      let quiltResult = this.quiltIndexCache.get(quiltBlobId);
      
      if (!quiltResult) {
        throw new Error(
          `Quilt index not found. Cannot read quilt without stored QuiltResult.`
        );
      }
      
      // Fetch complete quilt data
      const quiltData = await this.walrusClient.readBlob({ blobId: quiltBlobId });
      
      // Extract all patches
      const patches = quiltResult.patches.map(patch => ({
        identifier: patch.identifier,
        tags: patch.tags,
        data: Buffer.from(quiltData.slice(patch.startIndex, patch.endIndex))
      }));
      
      return { patches };
    } catch (error: any) {
      throw new WalrusFetchError(
        `Failed to read quilt: ${error.message}`,
        quiltBlobId
      );
    }
  }
  
  /**
   * Store quilt result for later retrieval
   */
  cacheQuiltIndex(quiltResult: QuiltResult): void {
    this.quiltIndexCache.set(quiltResult.blobId, quiltResult);
  }
  
  /**
   * Get cached quilt index
   */
  getQuiltIndex(quiltBlobId: string): QuiltResult | undefined {
    return this.quiltIndexCache.get(quiltBlobId);
  }
  
  /**
   * Encode quilt without storing
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
   */
  calculateOptimalBatchSize(averageBlobSize: number): number {
    const MAX_QUILT_BLOBS = 666;
    const OPTIMAL_QUILT_SIZE = 5 * 1024 * 1024; // 5MB
    
    const recommendedCount = Math.floor(OPTIMAL_QUILT_SIZE / averageBlobSize);
    return Math.min(recommendedCount, MAX_QUILT_BLOBS);
  }
  
  // ===== DIRECT WALRUS CLIENT ACCESS =====
  
  getWalrusClient(): WalrusClient {
    return this.walrusClient;
  }
  
  reset(): void {
    this.walrusClient.reset();
    this.quiltIndexCache.clear();
  }
}
