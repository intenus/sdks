/**
 * User storage service
 */

import type { Signer } from '@mysten/sui/cryptography';
import { BaseStorageService } from './base.js';
import { StoragePathBuilder } from '../utils/paths.js';
import { DEFAULT_EPOCHS } from '../constants/index.js';
import type { UserHistoryAggregated, StorageResult } from '../types/index.js';

export class UserStorageService extends BaseStorageService<UserHistoryAggregated> {
  protected getPath(address: string): string {
    return StoragePathBuilder.build('userHistory', address);
  }
  
  protected serialize(data: UserHistoryAggregated): Buffer {
    return Buffer.from(JSON.stringify(data, null, 2));
  }
  
  protected deserialize(buffer: Buffer): UserHistoryAggregated {
    return JSON.parse(buffer.toString());
  }
  
  async storeHistory(history: UserHistoryAggregated, signer: Signer): Promise<StorageResult> {
    return this.store(history, DEFAULT_EPOCHS.USER_HISTORY, signer, history.user_address);
  }
  
  async fetchHistory(address: string): Promise<UserHistoryAggregated> {
    return this.fetch(address);
  }
  
  async fetchHistoryById(blobId: string): Promise<UserHistoryAggregated> {
    const buffer = await this.client.fetchRaw(blobId);
    return this.deserialize(buffer);
  }
  
  async historyExists(address: string): Promise<boolean> {
    return this.exists(address);
  }
}
