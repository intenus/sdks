/**
 * Solution Storage Service
 * Store and fetch IGSSolution data to/from Walrus
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
   * Store IGSSolution to Walrus
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
    const path = `/solutions/${solution.solution_id}.json`;
    
    return this.client.storeRaw(path, data, epochs, signer);
  }

  /**
   * Fetch IGSSolution from Walrus by blob_id
   * @param blob_id Walrus blob ID
   * @returns IGSSolution object
   */
  async fetch(blob_id: string): Promise<IGSSolution> {
    const data = await this.client.fetchRaw(blob_id);
    return JSON.parse(data.toString('utf-8')) as IGSSolution;
  }
}
