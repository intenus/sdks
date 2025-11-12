/**
 * Batch Manager Service - Handle batch lifecycle and statistics
 */

import { Transaction } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { INTENUS_PACKAGE_ID, SHARED_OBJECTS, MODULES } from '../constants.js';
import type { 
  IntenusClientConfig, 
  BatchSummary,
  TransactionResult
} from '../types.js';

export class BatchManagerService {
  constructor(
    private suiClient: SuiClient,
    private config: IntenusClientConfig
  ) {}

  /**
   * Start a new batch (admin only).
   * Initializes a new batch for intent collection and solver participation.
   * 
   * @param batchId - Unique batch identifier
   * @param adminCap - Admin capability object ID
   * @param signer - Admin's keypair
   * @returns Transaction result
   */
  async startNewBatch(
    batchId: string,
    adminCap: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${packageId}::${MODULES.BATCH_MANAGER}::start_new_batch`,
        arguments: [
          tx.object(adminCap),
          tx.object(sharedObjects.batchManager),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(batchId))),
          tx.object(sharedObjects.clock)
        ]
      });

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Batch start failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to start new batch: ${error.message}`);
    }
  }

  /**
   * Get current active batch information.
   * 
   * @returns Current batch summary or null if no active batch
   */
  async getCurrentBatch(): Promise<BatchSummary | null> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${packageId}::${MODULES.BATCH_MANAGER}::get_current_batch`,
            arguments: [
              tx.object(sharedObjects.batchManager)
            ]
          });
          return tx;
        })(),
        sender: '0x0' // Use dummy address for view functions
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const [batchData] = result.results[0].returnValues;
        return this.parseBatchSummary(batchData);
      }

      return null;
    } catch (error: any) {
      console.warn(`Failed to get current batch: ${error.message}`);
      return null;
    }
  }

  /**
   * Get batch statistics for a specific epoch.
   * 
   * @param epoch - Epoch number to query
   * @returns Batch summary for the epoch or null if not found
   */
  async getBatchStats(epoch: number): Promise<BatchSummary | null> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${packageId}::${MODULES.BATCH_MANAGER}::get_batch_stats`,
            arguments: [
              tx.object(sharedObjects.batchManager),
              tx.pure.u64(epoch)
            ]
          });
          return tx;
        })(),
        sender: '0x0'
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const [batchData] = result.results[0].returnValues;
        return this.parseBatchSummary(batchData);
      }

      return null;
    } catch (error: any) {
      console.warn(`Failed to get batch stats for epoch ${epoch}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get batch history for multiple epochs.
   * 
   * @param startEpoch - Starting epoch (inclusive)
   * @param endEpoch - Ending epoch (inclusive)
   * @returns Array of batch summaries
   */
  async getBatchHistory(startEpoch: number, endEpoch: number): Promise<BatchSummary[]> {
    const batches: BatchSummary[] = [];
    
    for (let epoch = startEpoch; epoch <= endEpoch; epoch++) {
      try {
        const batch = await this.getBatchStats(epoch);
        if (batch) {
          batches.push(batch);
        }
      } catch (error) {
        console.warn(`Failed to get batch for epoch ${epoch}:`, error);
      }
    }

    return batches;
  }

  /**
   * Get batch performance metrics.
   * 
   * @param batchId - Batch identifier
   * @returns Performance metrics or null
   */
  async getBatchMetrics(batchId: string): Promise<{
    total_intents: number;
    solver_participation: number;
    average_surplus: string;
    execution_time_ms: number;
  } | null> {
    try {
      const batch = await this.getCurrentBatch();
      if (!batch || batch.batch_id !== batchId) {
        // Try to find in history
        const currentEpoch = Math.floor(Date.now() / 10000);
        const history = await this.getBatchHistory(Math.max(0, currentEpoch - 100), currentEpoch);
        const targetBatch = history.find(b => b.batch_id === batchId);
        
        if (!targetBatch) {
          return null;
        }
        
        return this.calculateMetrics(targetBatch);
      }

      return this.calculateMetrics(batch);
    } catch (error: any) {
      console.warn(`Failed to get batch metrics: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculate performance metrics from batch summary
   */
  private calculateMetrics(batch: BatchSummary): {
    total_intents: number;
    solver_participation: number;
    average_surplus: string;
    execution_time_ms: number;
  } {
    const executionTime = batch.executed_at 
      ? batch.executed_at - batch.created_at 
      : 0;

    const averageSurplus = batch.intent_count > 0 
      ? (BigInt(batch.total_surplus_generated) / BigInt(batch.intent_count)).toString()
      : '0';

    return {
      total_intents: batch.intent_count,
      solver_participation: batch.solver_count,
      average_surplus: averageSurplus,
      execution_time_ms: executionTime
    };
  }

  /**
   * Parse batch summary from BCS data
   */
  private parseBatchSummary(data: any): BatchSummary {
    // This would need proper BCS deserialization in practice
    // For now, return a mock structure
    return {
      batch_id: 'batch_' + Date.now(),
      epoch: Math.floor(Date.now() / 10000),
      intent_count: 0,
      total_value_usd: '0',
      solver_count: 0,
      winning_solver: undefined,
      winning_solution_id: undefined,
      total_surplus_generated: '0',
      status: 0, // OPEN
      created_at: Date.now(),
      executed_at: undefined
    };
  }
}
