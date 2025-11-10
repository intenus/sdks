/**
 * Batch storage service
 */

import type { Signer } from '@mysten/sui/cryptography';
import { BaseStorageService } from './base.js';
import { StoragePathBuilder } from '../utils/paths.js';
import { DEFAULT_EPOCHS } from '../constants/index.js';
import type { BatchManifest, StorageResult } from '../types/index.js';

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
}
