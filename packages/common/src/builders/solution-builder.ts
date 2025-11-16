import type { SolutionSubmission, IGSSolution } from '../types/index.js';
import { Transaction } from '@mysten/sui/transactions';

/**
 * Fluent API for building IGS solutions
 * Provides a convenient way to construct Solution objects with proper validation
 *
 * @example
 * const solution = new SolutionBuilder(intentId, solverAddress)
 *   .withPromisedOutput('0x...::usdc::USDC', '300000000')
 *   .withGasEstimate('0.01')
 *   .withProtocols(['Cetus', 'Turbos'])
 *   .withSlippageEstimate(30)
 *   .withSurplus('305.50', '300.00', '5.50', '1.83')
 *   .build();
 */
export class SolutionBuilder {
  private ptb: Transaction;
  private promisedOutputs: Array<{ asset_id: string; amount: string }> = [];
  private estimatedGas: string = '0.01';
  private estimatedSlippageBps: number = 0;
  private protocolFees?: string;
  private protocols: string[] = [];
  private totalHops: number = 0;
  private executionPath: string = '';
  private uniqueTechniques?: string;
  private surplusCalculation: {
    benchmark_value_usd: string;
    solution_value_usd: string;
    surplus_usd: string;
    surplus_percentage: string;
  } = {
    benchmark_value_usd: '0',
    solution_value_usd: '0',
    surplus_usd: '0',
    surplus_percentage: '0',
  };

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
   * Add a promised output for the solution
   * @param assetId - Asset identifier
   * @param amount - Promised amount in base units
   */
  withPromisedOutput(assetId: string, amount: string): this {
    this.promisedOutputs.push({ asset_id: assetId, amount });
    return this;
  }

  /**
   * Add multiple promised outputs
   * @param outputs - Array of promised outputs
   */
  withPromisedOutputs(outputs: Array<{ asset_id: string; amount: string }>): this {
    this.promisedOutputs.push(...outputs);
    return this;
  }

  /**
   * Set estimated gas cost
   * @param gasEstimate - Estimated gas cost
   */
  withGasEstimate(gasEstimate: string): this {
    this.estimatedGas = gasEstimate;
    return this;
  }

  /**
   * Set estimated slippage
   * @param slippageBps - Estimated slippage in basis points
   */
  withSlippageEstimate(slippageBps: number): this {
    this.estimatedSlippageBps = slippageBps;
    return this;
  }

  /**
   * Set protocol fees
   * @param fees - Protocol fees amount
   */
  withProtocolFees(fees: string): this {
    this.protocolFees = fees;
    return this;
  }

  /**
   * Add protocols used in the solution
   * @param protocols - Array of protocol names
   */
  withProtocols(protocols: string[]): this {
    this.protocols = protocols;
    return this;
  }

  /**
   * Set total number of hops
   * @param hops - Total number of hops in the routing path
   */
  withHops(hops: number): this {
    this.totalHops = hops;
    return this;
  }

  /**
   * Set execution path description
   * @param path - Human-readable execution path
   */
  withExecutionPath(path: string): this {
    this.executionPath = path;
    return this;
  }

  /**
   * Set unique techniques or optimizations used
   * @param techniques - Description of unique techniques
   */
  withUniqueTechniques(techniques: string): this {
    this.uniqueTechniques = techniques;
    return this;
  }

  /**
   * Set surplus calculation
   * @param solutionValueUsd - Actual value from this solution in USD
   * @param benchmarkValueUsd - Expected value from intent benchmark in USD
   * @param surplusUsd - Surplus amount (solution - benchmark) in USD
   * @param surplusPercentage - Surplus as percentage of benchmark
   */
  withSurplus(
    solutionValueUsd: string,
    benchmarkValueUsd: string,
    surplusUsd: string,
    surplusPercentage: string
  ): this {
    this.surplusCalculation = {
      benchmark_value_usd: benchmarkValueUsd,
      solution_value_usd: solutionValueUsd,
      surplus_usd: surplusUsd,
      surplus_percentage: surplusPercentage,
    };
    return this;
  }

  /**
   * Set strategy summary
   * @param strategy - Strategy configuration
   */
  withStrategy(strategy: {
    protocols: string[];
    hops: number;
    path: string;
    techniques?: string;
  }): this {
    this.protocols = strategy.protocols;
    this.totalHops = strategy.hops;
    this.executionPath = strategy.path;
    if (strategy.techniques) {
      this.uniqueTechniques = strategy.techniques;
    }
    return this;
  }

  /**
   * Build final IGS solution
   * @param options - Build options including SuiClient for PTB serialization
   * @returns Complete IGS solution ready for submission
   */
  async build(options?: { client?: any }): Promise<IGSSolution> {
    // Build PTB bytes (requires SuiClient in production)
    const ptbBytes = options?.client
      ? await this.ptb.build({ client: options.client })
      : new Uint8Array(); // Placeholder - real implementation needs client

    const ptbHex = Buffer.from(ptbBytes).toString('hex');
    const ptbHash = this.hashPTB(ptbHex);

    // Calculate compliance score based on completeness
    const complianceScore = this.calculateComplianceScore();

    const solution: IGSSolution = {
      solution_id: crypto.randomUUID(),
      intent_id: this.intentId,
      solver_address: this.solverAddress,
      submitted_at: Date.now(),
      ptb_bytes: ptbHex,
      ptb_hash: ptbHash,
      promised_outputs: this.promisedOutputs,
      estimated_gas: this.estimatedGas,
      estimated_slippage_bps: this.estimatedSlippageBps,
      protocol_fees: this.protocolFees,
      surplus_calculation: this.surplusCalculation,
      strategy_summary: {
        protocols_used: this.protocols,
        total_hops: this.totalHops,
        execution_path: this.executionPath,
        unique_techniques: this.uniqueTechniques,
      },
      compliance_score: complianceScore,
    };

    return solution;
  }

  /**
   * Build final solution submission (legacy format)
   * @param options - Build options including SuiClient
   * @returns Solution submission and PTB bytes
   * @deprecated Use build() instead for full IGS solution
   */
  async buildSubmission(options?: { client?: any }): Promise<{
    submission: SolutionSubmission;
    ptbBytes: Uint8Array;
  }> {
    const ptbBytes = options?.client
      ? await this.ptb.build({ client: options.client })
      : new Uint8Array();

    const submission: SolutionSubmission = {
      solution_id: crypto.randomUUID(),
      intent_id: this.intentId,
      solver_address: this.solverAddress,
      submitted_at: Date.now(),
      blob_id: Buffer.from(ptbBytes).toString('base64'),
    };

    return { submission, ptbBytes };
  }

  /**
   * Calculate compliance score based on solution completeness
   * @returns Compliance score (0-100)
   * @private
   */
  private calculateComplianceScore(): number {
    let score = 100;

    // Deduct points for missing required fields
    if (this.promisedOutputs.length === 0) score -= 30;
    if (!this.estimatedGas || this.estimatedGas === '0') score -= 10;
    if (this.protocols.length === 0) score -= 15;
    if (!this.executionPath) score -= 10;
    if (this.surplusCalculation.surplus_usd === '0') score -= 10;

    return Math.max(0, score);
  }

  /**
   * Generate hash for PTB bytes
   * @param ptbHex - PTB bytes in hex format
   * @returns Hash of the PTB
   * @private
   */
  private hashPTB(ptbHex: string): string {
    // Simple hash implementation - in production use proper crypto hash
    return `0x${Buffer.from(ptbHex).toString('base64').substring(0, 64)}`;
  }
}
