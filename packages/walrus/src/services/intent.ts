/**
 * Intent Storage Service
 * Store and fetch IGSIntent data to/from Walrus
 */

import type { Signer } from '@mysten/sui/cryptography';
import type { IntenusWalrusClient } from '../client.js';
import type { StorageResult } from '../types/index.js';
import { BaseStorageService } from './base.js';
import type { Intent as IGSIntent } from '@intenus/common';

export class IntentStorageService extends BaseStorageService {
  constructor(client: IntenusWalrusClient) {
    super(client);
  }

  /**
   * Store IGSIntent to Walrus
   * @param intent IGSIntent object
   * @param epochs Storage duration in epochs
   * @param signer Sui signer
   * @returns Storage result with blob_id
   */
  async store(
    intent: IGSIntent,
    epochs: number,
    signer: Signer
  ): Promise<StorageResult> {
    const data = Buffer.from(JSON.stringify(intent), 'utf-8');
    const path = `/intents/${intent.intent_id}.json`;
    
    return this.client.storeRaw(path, data, epochs, signer);
  }

  /**
   * Fetch IGSIntent from Walrus by blob_id
   * @param blob_id Walrus blob ID
   * @returns IGSIntent object
   */
  async fetch(blob_id: string): Promise<IGSIntent> {
    const data = await this.client.fetchRaw(blob_id);
    return JSON.parse(data.toString('utf-8')) as IGSIntent;
  }
}
