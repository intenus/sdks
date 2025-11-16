import Redis from 'ioredis';
import type { SolutionSubmission } from '@intenus/common';
import type { IntenusWalrusClient } from '@intenus/walrus';

/**
 * Batch notification message structure
 */
export interface BatchNotification {
  batch_id: string;
  epoch: number;
  intent_ids: string[];
  solver_window_ms: number;
  created_at: number;
}

/**
 * OPTIONAL: Redis listener for batch notifications
 * Solvers can implement their own or use this
 */
export class SolverListener {
  private redis: Redis;
  private batchCallbacks: Set<(batch: BatchNotification) => Promise<void>> = new Set();

  constructor(
    redisUrl: string,
    walrusClient?: IntenusWalrusClient
  ) {
    this.redis = new Redis(redisUrl);
  }

  /**
   * Subscribe to new batch notifications
   */
  onNewBatch(
    callback: (batch: BatchNotification) => Promise<void>
  ): void {
    this.batchCallbacks.add(callback);

    if (this.batchCallbacks.size === 1) {
      // First subscriber, start listening
      this.redis.subscribe('solver:batch:new', (err) => {
        if (err) throw err;
      });

      this.redis.on('message', async (channel, message) => {
        if (channel === 'solver:batch:new') {
          const batch: BatchNotification = JSON.parse(message);
          for (const callback of this.batchCallbacks) {
            await callback(batch);
          }
        }
      });
    }
  }

  /**
   * Submit solution to backend
   */
  async submitSolution(solution: SolutionSubmission, batchId: string): Promise<void> {
    await this.redis.publish(
      `solver:solution:${batchId}`,
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
