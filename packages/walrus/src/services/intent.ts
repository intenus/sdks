/**
 * Intent Storage Service
 * Simple blob storage for IGSIntent
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
   * Store IGSIntent as blob
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
    const result = await this.client.walrusClient.writeBlob({
      blob: new Uint8Array(data),
      epochs,
      deletable: true,
      signer,
    });

    return {
      blob_id: result.blobId,
      size_bytes: data.length,
      created_at: Date.now(),
      epochs,
    };
  }

  /**
   * Fetch IGSIntent by blob_id
   * @param blob_id Walrus blob ID
   * @returns IGSIntent object
   */
  async fetch(blob_id: string): Promise<IGSIntent> {
    const data = await this.client.walrusClient.readBlob({ blobId: blob_id });
    return JSON.parse(Buffer.from(data).toString('utf-8')) as IGSIntent;
  }
}
