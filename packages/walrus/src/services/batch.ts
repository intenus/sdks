/**
 * Batch storage service
 */

import type { Signer } from '@mysten/sui/cryptography';
import { WalrusFile } from '@mysten/walrus';
import { BaseStorageService } from './base.js';
import { StoragePathBuilder } from '../utils/paths.js';
import { DEFAULT_EPOCHS } from '../constants/index.js';
import type { WalrusBatchManifest as CommonBatchManifest } from '@intenus/common';
import type { StorageResult } from '../types/index.js';

export class BatchStorageService extends BaseStorageService<CommonBatchManifest> {
  protected getPath(epoch: number): string {
    return StoragePathBuilder.build('batchManifest', epoch);
  }
  
  protected serialize(data: CommonBatchManifest): Buffer {
    return Buffer.from(JSON.stringify(data, null, 2));
  }
  
  protected deserialize(buffer: Buffer): CommonBatchManifest {
    return JSON.parse(buffer.toString()) as CommonBatchManifest;
  }
  
  async storeManifest(manifest: CommonBatchManifest, signer: Signer): Promise<StorageResult> {
    return this.store(manifest, DEFAULT_EPOCHS.BATCH_MANIFEST, signer, manifest.epoch);
  }
  
  async fetchManifest(epoch: number): Promise<CommonBatchManifest> {
    return this.fetch(epoch);
  }
  
  async fetchManifestById(blobId: string): Promise<CommonBatchManifest> {
    const buffer = await this.client.fetchRaw(blobId);
    return this.deserialize(buffer);
  }
  
  async manifestExists(epoch: number): Promise<boolean> {
    return this.exists(epoch);
  }
  
  /**
   * Store batch intents efficiently
   */
  async storeIntents(
    intents: Array<{ intent_id: string; data: any; category?: string }>,
    batchId: string,
    signer: Signer,
    epochs: number = DEFAULT_EPOCHS.BATCH_MANIFEST
  ): Promise<{ blobId: string; intentIds: string[] }> {
    const files = intents.map(intent => 
      WalrusFile.from({
        contents: new TextEncoder().encode(JSON.stringify(intent)),
        identifier: intent.intent_id,
        tags: {
          'content-type': 'application/json',
          'batch-id': batchId,
          'category': intent.category || 'unknown'
        }
      })
    );

    const results = await this.client.walrusClient.writeFiles({
      files,
      epochs,
      deletable: true,
      signer
    });

    return {
      blobId: results[0].blobId,
      intentIds: intents.map(i => i.intent_id)
    };
  }
  
  /**
   * Fetch all intents by epoch
   */
  async fetchIntentsByEpoch(epoch: number): Promise<Array<{
    intent_id: string;
    data: any;
    category: string;
  }>> {
    const manifest = await this.fetchManifest(epoch);
    
    // If intents are stored inline in manifest
    if (manifest.intents && manifest.intents.length > 0) {
      return manifest.intents.map(intent => ({
        intent_id: intent.intent_id,
        data: JSON.parse(intent.intent_data),
        category: intent.category
      }));
    }
    
    // If intents are stored separately (via quilt_reference)
    if (manifest.quilt_reference) {
      return this.fetchIntents(manifest.quilt_reference.blob_id);
    }
    
    return [];
  }
  
  /**
   * Fetch all intents from storage blob
   */
  async fetchIntents(blobId: string): Promise<Array<{
    intent_id: string;
    data: any;
    category: string;
  }>> {
    const blob = await this.client.walrusClient.getBlob({ blobId });
    const files = await blob.files();
    
    const intents = [];
    for (const file of files) {
      const content = await file.text();
      const identifier = await file.getIdentifier();
      const tags = await file.getTags();
      const intent = JSON.parse(content);

      intents.push({
        intent_id: identifier || intent.intent_id,
        data: intent.data,
        category: tags.category || intent.category || 'unknown'
      });
    }
    
    return intents;
  }
  
  /**
   * Fetch single intent by epoch and intent ID
   */
  async fetchIntentByEpoch(epoch: number, intentId: string): Promise<{
    intent_id: string;
    data: any;
    category: string;
  } | null> {
    const manifest = await this.fetchManifest(epoch);
    
    // If intents are stored inline in manifest
    if (manifest.intents && manifest.intents.length > 0) {
      const intent = manifest.intents.find(i => i.intent_id === intentId);
      if (intent) {
        return {
          intent_id: intent.intent_id,
          data: JSON.parse(intent.intent_data),
          category: intent.category
        };
      }
    }
    
    // If intents are stored separately (via quilt_reference)
    if (manifest.quilt_reference) {
      return this.fetchIntent(manifest.quilt_reference.blob_id, intentId);
    }
    
    return null;
  }

  /**
   * Fetch single intent by blob ID and intent ID
   */
  async fetchIntent(blobId: string, intentId: string): Promise<{
    intent_id: string;
    data: any;
    category: string;
  } | null> {
    try {
      const blob = await this.client.walrusClient.getBlob({ blobId });
      const files = await blob.files({ identifiers: [intentId] });
      
      if (files.length === 0) return null;
      
      const file = files[0];
      const content = await file.text();
      const intent = JSON.parse(content);
      const tags = await file.getTags();
      
      return {
        intent_id: intentId,
        data: intent.data,
        category: tags.category || intent.category || 'unknown'
      };
    } catch (error) {
      return null;
    }
  }
}
