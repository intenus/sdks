/**
 * IGS Solution Builder
 *
 * After the solution schema simplification, solvers only need to submit their
 * address and the serialized PTB bytes. This helper keeps the API ergonomic
 * while embracing the new minimal payload.
 */

import type { Intent as IGSIntent, IGSSolution } from '@intenus/common';
import { Transaction } from '@mysten/sui/transactions';
import { Buffer } from 'node:buffer';

export interface IGSSolutionBuilderOptions {
  solver_address: string;
  /**
   * Encoding to use when serializing the PTB bytes.
   * Defaults to base64 because it works well with JSON transports.
   */
  encoding?: 'base64' | 'hex';
}

export class IGSSolutionBuilder {
  private readonly ptb: Transaction;

  constructor(
    private readonly intent: IGSIntent,
    private readonly options: IGSSolutionBuilderOptions
  ) {
    this.ptb = new Transaction();
  }

  /**
   * Expose the underlying PTB for custom modifications.
   */
  getPTB(): Transaction {
    return this.ptb;
  }

  /**
   * Build the serialized PTB and wrap it inside an IGSSolution payload.
   */
  async build(options?: { client?: any }): Promise<{
    solution: IGSSolution;
    ptbBytes: Uint8Array;
  }> {
    const ptbBytes = options?.client
      ? await this.ptb.build({ client: options.client })
      : new Uint8Array();

    const encoding = this.options.encoding ?? 'base64';
    const transaction_bytes =
      encoding === 'hex'
        ? Buffer.from(ptbBytes).toString('hex')
        : Buffer.from(ptbBytes).toString('base64');

    return {
      solution: {
        solver_address: this.options.solver_address,
        transaction_bytes,
      },
      ptbBytes,
    };
  }
}

export function createIGSSolutionBuilder(
  intent: IGSIntent,
  options: IGSSolutionBuilderOptions
): IGSSolutionBuilder {
  return new IGSSolutionBuilder(intent, options);
}

export function validateIGSSolution(
  _intent: IGSIntent,
  solution: IGSSolution,
  _intent_id?: string
): {
  compliant: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];

  if (!/^0x[a-fA-F0-9]{1,64}$/.test(solution.solver_address)) {
    issues.push('solver_address must be a valid Sui address');
  }

  if (!solution.transaction_bytes || solution.transaction_bytes.length === 0) {
    issues.push('transaction_bytes cannot be empty');
  }

  return {
    compliant: issues.length === 0,
    score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 50),
    issues,
  };
}

export function compareIGSSolutions(
  _intent: IGSIntent,
  solution1: IGSSolution,
  solution2: IGSSolution
): number {
  // Without surplus metadata we compare by byte length as a deterministic tie breaker.
  return solution2.transaction_bytes.length - solution1.transaction_bytes.length;
}
