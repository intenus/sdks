import Redis from 'ioredis';
import type { Batch, SolutionSubmission, WalrusBatchManifest } from '@intenus/common';
import type { IntenusWalrusClient } from '@intenus/walrus';
import { WalrusBatchFetcher } from './walrus-fetcher.js';

/**
 * OPTIONAL: Redis listener for batch notifications
 * Solvers can implement their own or use this
 */
export class SolverListener {
  private redis: Redis;
  private batchCallbacks: Set<(batch: Batch, manifest?: WalrusBatchManifest) => Promise<void>> = new Set();
  private walrusFetcher?: WalrusBatchFetcher;
  
  constructor(
    redisUrl: string,
    walrusClient?: IntenusWalrusClient
  ) {
    this.redis = new Redis(redisUrl);
    if (walrusClient) {
      this.walrusFetcher = new WalrusBatchFetcher(walrusClient);
    }
  }
  
  /**
   * Subscribe to new batch notifications
   */
  onNewBatch(
    callback: (batch: Batch, manifest?: WalrusBatchManifest) => Promise<void>
  ): void {
    this.batchCallbacks.add(callback);
    
    if (this.batchCallbacks.size === 1) {
      // First subscriber, start listening
      this.redis.subscribe('solver:batch:new', (err) => {
        if (err) throw err;
      });
      
      this.redis.on('message', async (channel, message) => {
        if (channel === 'solver:batch:new') {
          const batch: Batch = JSON.parse(message);
          
          // Fetch manifest from Walrus if fetcher available
          let manifest: WalrusBatchManifest | undefined;
          if (this.walrusFetcher) {
            try {
              manifest = await this.walrusFetcher.fetchBatchManifest(batch.epoch);
            } catch (error) {
              console.warn('Failed to fetch batch manifest from Walrus:', error);
            }
          }
          
          for (const callback of this.batchCallbacks) {
            await callback(batch, manifest).catch(console.error);
          }
        }
      });
    }
  }
  
  /**
   * Submit solution to backend
   */
  async submitSolution(solution: SolutionSubmission): Promise<void> {
    await this.redis.publish(
      `solver:solution:${solution.batch_id}`,
      JSON.stringify(solution)
    );
  }
  
  /**
   * Send heartbeat
   */
  async sendHeartbeat(solverAddress: string): Promise<void> {
    await this.redis.publish('solver:heartbeat', JSON.stringify({
      solver_address: solverAddress,
      timestamp: Date.now(),
    }));
  }
  
  async close(): Promise<void> {
    await this.redis.quit();
  }
}
