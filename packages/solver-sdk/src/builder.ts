import type { SolutionSubmission } from '@intenus/common';
import { Transaction } from '@mysten/sui/transactions';

/**
 * OPTIONAL: Helper for building solution PTBs
 * Solvers build PTBs using Sui SDK and submit to chain
 */
export class SolutionBuilder {
  private ptb: Transaction;

  constructor(
    private intentId: string,
    private solverAddress: string
  ) {
    this.ptb = new Transaction();
  }

  /**
   * Get the underlying PTB for custom modifications
   */
  getPTB(): Transaction {
    return this.ptb;
  }

  /**
   * Build final solution submission
   * Note: Pass a SuiClient to build() method for actual PTB serialization
   */
  async build(options?: { client?: any }): Promise<{
    submission: SolutionSubmission;
    ptbBytes: Uint8Array;
  }> {
    // Build PTB bytes (requires SuiClient in production)
    const ptbBytes = options?.client
      ? await this.ptb.build({ client: options.client })
      : new Uint8Array(); // Placeholder - real implementation needs client

    const submission: SolutionSubmission = {
      solution_id: crypto.randomUUID(),
      intent_id: this.intentId,
      solver_address: this.solverAddress,
      submitted_at: Date.now(),
      transaction_bytes_ref: Buffer.from(ptbBytes).toString('base64'),
    };

    return { submission, ptbBytes };
  }
}
