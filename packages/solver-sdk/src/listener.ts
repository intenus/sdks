import Redis from 'ioredis';
import type { Batch, SolutionSubmission } from '@intenus/common';

/**
 * OPTIONAL: Redis listener for batch notifications
 * Solvers can implement their own or use this
 */
export class SolverListener {
  private redis: Redis;
  private batchCallbacks: Set<(batch: Batch) => Promise<void>> = new Set();
  
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }
  
  /**
   * Subscribe to new batch notifications
   */
  onNewBatch(callback: (batch: Batch) => Promise<void>): void {
    this.batchCallbacks.add(callback);
    
    if (this.batchCallbacks.size === 1) {
      // First subscriber, start listening
      this.redis.subscribe('solver:batch:new', (err) => {
        if (err) throw err;
      });
      
      this.redis.on('message', async (channel, message) => {
        if (channel === 'solver:batch:new') {
          const batch: Batch = JSON.parse(message);
          for (const callback of this.batchCallbacks) {
            await callback(batch).catch(console.error);
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
