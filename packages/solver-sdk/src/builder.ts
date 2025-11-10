import type { SolutionSubmission, SolutionOutcome } from '@intenus/common';
import { Transaction } from '@mysten/sui/transactions';

/**
 * OPTIONAL: Helper for building solution submissions
 * Solvers can build PTBs manually using Sui SDK if preferred
 */
export class SolutionBuilder {
  private outcomes: SolutionOutcome[] = [];
  private ptb: Transaction;
  
  constructor(
    private batchId: string,
    private solverAddress: string
  ) {
    this.ptb = new Transaction();
  }
  
  /**
   * Add outcome for an intent
   */
  addOutcome(outcome: SolutionOutcome): void {
    this.outcomes.push(outcome);
  }
  
  /**
   * Get the underlying PTB for custom modifications
   */
  getPTB(): Transaction {
    return this.ptb;
  }
  
  /**
   * Build final solution submission
   * Note: In production, you should pass a SuiClient to build() method
   */
  async build(options?: { client?: any }): Promise<{
    submission: Omit<SolutionSubmission, 'walrus_blob_id'>;
    ptbBytes: Uint8Array;
  }> {
    // For now, we'll use a simplified approach
    // In real usage, solvers should pass a SuiClient: await this.ptb.build({ client })
    const ptbBytes = options?.client 
      ? await this.ptb.build({ client: options.client })
      : new Uint8Array(); // Placeholder - real implementation needs client
    const ptbHash = await this.hashPTB(ptbBytes);
    
    const submission: Omit<SolutionSubmission, 'walrus_blob_id'> = {
      solution_id: crypto.randomUUID(),
      batch_id: this.batchId,
      solver_address: this.solverAddress,
      ptb_hash: ptbHash,
      outcomes: this.outcomes,
      total_surplus_usd: this.calculateTotalSurplus(),
      estimated_gas: '0', // Must simulate PTB
      estimated_slippage_bps: 0, // Must calculate
      submitted_at: Date.now(),
    };
    
    return { submission, ptbBytes };
  }
  
  private calculateTotalSurplus(): string {
    return this.outcomes
      .reduce((sum, o) => sum + parseFloat(o.surplus_claimed), 0)
      .toString();
  }
  
  private async hashPTB(bytes: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
