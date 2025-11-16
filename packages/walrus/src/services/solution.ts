/**
 * Solution Storage Service
 * Simple blob storage for IGSSolution
 */

import type { Signer } from '@mysten/sui/cryptography';
import type { IntenusWalrusClient } from '../client.js';
import type { StorageResult } from '../types/index.js';
import { BaseStorageService } from './base.js';
import type { IGSSolution } from '@intenus/common';

export class SolutionStorageService extends BaseStorageService {
  constructor(client: IntenusWalrusClient) {
    super(client);
  }

  /**
   * Store IGSSolution as blob
   * @param solution IGSSolution object
   * @param epochs Storage duration in epochs
   * @param signer Sui signer
   * @returns Storage result with blob_id
   */
  async store(
    solution: IGSSolution,
    epochs: number,
    signer: Signer
  ): Promise<StorageResult> {
    const data = Buffer.from(JSON.stringify(solution), 'utf-8');
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
   * Fetch IGSSolution by blob_id
   * @param blob_id Walrus blob ID
   * @returns IGSSolution object
   */
  async fetch(blob_id: string): Promise<IGSSolution> {
    const data = await this.client.walrusClient.readBlob({ blobId: blob_id });
    return JSON.parse(Buffer.from(data).toString('utf-8')) as IGSSolution;
  }
}
