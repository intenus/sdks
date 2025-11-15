import type { SolutionSubmission } from '@intenus/common';
import { Transaction } from '@mysten/sui/transactions';
import { Buffer } from 'node:buffer';

/**
 * Light-weight helper for building the minimal IGSSolution payload.
 * If you need more control, interact with the Sui SDK directly.
 */
export class SolutionBuilder {
  private readonly ptb: Transaction;

  constructor(private readonly solverAddress: string) {
    this.ptb = new Transaction();
  }

  getPTB(): Transaction {
    return this.ptb;
  }

  async build(options?: { client?: any; encoding?: 'base64' | 'hex' }): Promise<{
    submission: SolutionSubmission;
    ptbBytes: Uint8Array;
  }> {
    const ptbBytes = options?.client
      ? await this.ptb.build({ client: options.client })
      : new Uint8Array();

    const encoding = options?.encoding ?? 'base64';
    const transaction_bytes =
      encoding === 'hex'
        ? Buffer.from(ptbBytes).toString('hex')
        : Buffer.from(ptbBytes).toString('base64');

    return {
      submission: {
        solver_address: this.solverAddress,
        transaction_bytes,
      },
      ptbBytes,
    };
  }
}
