/**
 * Archive storage service
 */

import type { Signer } from '@mysten/sui/cryptography';
import { BaseStorageService } from './base.js';
import { StoragePathBuilder } from '../utils/paths.js';
import { DEFAULT_EPOCHS } from '../constants/index.js';
import type { BatchArchive, StorageResult } from '../types/index.js';

export class ArchiveStorageService extends BaseStorageService<BatchArchive> {
  protected getPath(epoch: number, batchId: string): string {
    return StoragePathBuilder.build('batchArchive', epoch, batchId);
  }
  
  protected serialize(data: BatchArchive): Buffer {
    return Buffer.from(JSON.stringify(data, null, 2));
  }
  
  protected deserialize(buffer: Buffer): BatchArchive {
    return JSON.parse(buffer.toString());
  }
  
  async storeArchive(archive: BatchArchive, signer: Signer): Promise<StorageResult> {
    return this.store(archive, DEFAULT_EPOCHS.BATCH_ARCHIVE, signer, archive.epoch, archive.batch_id);
  }
  
  async fetchArchive(epoch: number, batchId: string): Promise<BatchArchive> {
    return this.fetch(epoch, batchId);
  }
  
  async fetchArchiveById(blobId: string): Promise<BatchArchive> {
    const buffer = await this.client.fetchRaw(blobId);
    return this.deserialize(buffer);
  }
  
  async archiveExists(epoch: number, batchId: string): Promise<boolean> {
    return this.exists(epoch, batchId);
  }
}
