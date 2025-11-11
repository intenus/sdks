/**
 * Batch storage service
 */

import type { Signer } from '@mysten/sui/cryptography';
import { BaseStorageService } from './base.js';
import { StoragePathBuilder } from '../utils/paths.js';
import { batchIntentsToQuilt } from '../utils/quilt.js';
import { DEFAULT_EPOCHS } from '../constants/index.js';
import type { BatchManifest, StorageResult, QuiltResult } from '../types/index.js';

export class BatchStorageService extends BaseStorageService<BatchManifest> {
  protected getPath(epoch: number): string {
    return StoragePathBuilder.build('batchManifest', epoch);
  }
  
  protected serialize(data: BatchManifest): Buffer {
    return Buffer.from(JSON.stringify(data, null, 2));
  }
  
  protected deserialize(buffer: Buffer): BatchManifest {
    return JSON.parse(buffer.toString());
  }
  
  async storeManifest(manifest: BatchManifest, signer: Signer): Promise<StorageResult> {
    return this.store(manifest, DEFAULT_EPOCHS.BATCH_MANIFEST, signer, manifest.epoch);
  }
  
  async fetchManifest(epoch: number): Promise<BatchManifest> {
    return this.fetch(epoch);
  }
  
  async manifestExists(epoch: number): Promise<boolean> {
    return this.exists(epoch);
  }
  
  // ===== QUILT METHODS =====
  
  /**
   * Store batch intents efficiently using Quilt
   */
  async storeIntentsQuilt(
    intents: Array<{ intent_id: string; data: any; category?: string }>,
    batchId: string,
    signer: Signer,
    epochs: number = DEFAULT_EPOCHS.BATCH_MANIFEST
  ): Promise<QuiltResult> {
    const quiltBlobs = batchIntentsToQuilt(intents, batchId);
    const result = await this.client.storeQuilt(quiltBlobs, epochs, signer);
    
    // Cache for future reads
    this.client.cacheQuiltIndex(result);
    
    return result;
  }
  
  /**
   * Fetch individual intent from quilt
   */
  async fetchIntentFromQuilt(
    quiltBlobId: string,
    intentIdentifier: string
  ): Promise<any> {
    const buffer = await this.client.fetchFromQuilt(quiltBlobId, intentIdentifier);
    return JSON.parse(buffer.toString());
  }
  
  /**
   * Fetch all intents from quilt at once
   */
  async fetchAllIntentsFromQuilt(quiltBlobId: string): Promise<Array<{
    intent_id: string;
    data: any;
    category: string;
  }>> {
    const { patches } = await this.client.readQuilt(quiltBlobId);
    
    return patches.map(patch => {
      const data = JSON.parse(patch.data.toString());
      const intentId = patch.tags.intent_id || '';
      const category = patch.tags.category || 'unknown';
      
      return {
        intent_id: intentId,
        data,
        category
      };
    });
  }
  
  /**
   * Calculate if Quilt is beneficial for this batch
   */
  calculateQuiltBenefit(intentCount: number, averageIntentSize: number): {
    recommended: boolean;
    reason: string;
    estimatedSavings?: number;
  } {
    const { shouldUseQuilt } = require('../utils/quilt.js');
    return shouldUseQuilt(intentCount, averageIntentSize);
  }
}
