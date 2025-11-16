/**
 * IGS Solution Builder
 * 
 * Helper for building IGS-compliant solutions from IGS intents
 */

import type { 
  Intent as IGSIntent, 
  IGSSolution, 
  IGSValidationResult,
  validateIGSIntent,
  calculateSurplus 
} from '@intenus/common';
import { Transaction } from '@mysten/sui/transactions';

export interface IGSSolutionBuilderOptions {
  solver_address: string;
  reputation_score?: number;
  enable_simulation?: boolean;
}

export class IGSSolutionBuilder {
  private tx: Transaction;
  private promised_outputs: Array<{ asset_id: string; amount: string }> = [];
  private estimated_gas: string = '0';
  private estimated_slippage_bps: number = 0;
  private protocol_fees?: string;
  private strategy_summary: {
    protocols_used: string[];
    total_hops: number;
    execution_path: string;
    unique_techniques?: string;
  } = {
    protocols_used: [],
    total_hops: 0,
    execution_path: ''
  };

  constructor(
    private intent: IGSIntent,
    private options: IGSSolutionBuilderOptions
  ) {
    this.tx = new Transaction();
    
    // Validate IGS intent first
    const validation = this.validateIntent();
    if (!validation.valid) {
      throw new Error(`Invalid IGS Intent: ${validation.errors.map(e => e.message).join(', ')}`);
    }
  }

  /**
   * Validate the IGS intent
   */
  private validateIntent(): IGSValidationResult {
    // Import validation function dynamically to avoid circular deps
    const { validateIGSIntent } = require('@intenus/common');
    return validateIGSIntent(this.intent);
  }

  /**
   * Get the underlying Tx for custom modifications
   */
  getTx(): Transaction {
    return this.tx;
  }

  /**
   * Add expected output for the solution
   */
  addOutput(asset_id: string, amount: string): void {
    this.promised_outputs.push({ asset_id, amount });
  }

  /**
   * Set gas estimation
   */
  setGasEstimate(gas: string): void {
    this.estimated_gas = gas;
  }

  /**
   * Set slippage estimation
   */
  setSlippageEstimate(slippage_bps: number): void {
    this.estimated_slippage_bps = slippage_bps;
  }

  /**
   * Set protocol fees
   */
  setProtocolFees(fees: string): void {
    this.protocol_fees = fees;
  }

  /**
   * Add protocol to strategy
   */
  addProtocol(protocol: string): void {
    if (!this.strategy_summary.protocols_used.includes(protocol)) {
      this.strategy_summary.protocols_used.push(protocol);
    }
  }

  /**
   * Set execution path description
   */
  setExecutionPath(path: string): void {
    this.strategy_summary.execution_path = path;
  }

  /**
   * Set total hops
   */
  setTotalHops(hops: number): void {
    this.strategy_summary.total_hops = hops;
  }

  /**
   * Set unique techniques used
   */
  setUniqueTechniques(techniques: string): void {
    this.strategy_summary.unique_techniques = techniques;
  }

  /**
   * Build the IGS solution
   */
  async build(options?: { client?: any }): Promise<{
    solution: IGSSolution;
    txBytes: Uint8Array;
  }> {
    // Build Tx
    const txBytes = options?.client 
      ? await this.tx.build({ client: options.client })
      : new Uint8Array(); // Placeholder - real implementation needs client
    
    const txHash = await this.hashTx(txBytes);

    // Calculate surplus
    const surplus = this.calculateSurplus();

    // Calculate compliance score
    const compliance_score = this.calculateComplianceScore();

    const solution: IGSSolution = {
      solution_id: crypto.randomUUID(),
      intent_id: this.intent.intent_id,
      solver_address: this.options.solver_address,
      submitted_at: Date.now(),

      tx_bytes: Array.from(txBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
      tx_hash: txHash,

      promised_outputs: this.promised_outputs,

      estimated_gas: this.estimated_gas,
      estimated_slippage_bps: this.estimated_slippage_bps,
      protocol_fees: this.protocol_fees,

      surplus_calculation: surplus,

      strategy_summary: this.strategy_summary,

      compliance_score,
      compliance_details: this.getComplianceDetails()
    };

    return { solution, txBytes };
  }

  /**
   * Calculate surplus vs expected outcome
   */
  private calculateSurplus(): {
    benchmark_value_usd: string;
    solution_value_usd: string;
    surplus_usd: string;
    surplus_percentage: string;
  } {
    // Get expected outcome from intent
    const expectedOutputs = this.intent.operation.expected_outcome.expected_outputs;
    
    if (expectedOutputs.length === 0 || this.promised_outputs.length === 0) {
      return {
        benchmark_value_usd: '0',
        solution_value_usd: '0',
        surplus_usd: '0',
        surplus_percentage: '0'
      };
    }

    // For MVP, assume 1:1 mapping and use first output
    // In production, you'd need proper price conversion
    const expectedAmount = parseFloat(expectedOutputs[0].amount);
    const solutionAmount = parseFloat(this.promised_outputs[0].amount);

    const surplus = solutionAmount - expectedAmount;
    const surplusPercentage = expectedAmount > 0 ? (surplus / expectedAmount) * 100 : 0;

    return {
      benchmark_value_usd: expectedAmount.toString(),
      solution_value_usd: solutionAmount.toString(),
      surplus_usd: surplus.toString(),
      surplus_percentage: surplusPercentage.toString()
    };
  }

  /**
   * Calculate IGS compliance score
   */
  private calculateComplianceScore(): number {
    let score = 100;

    // Check constraint compliance
    if (!this.checkConstraintCompliance()) {
      score -= 30;
    }

    // Check output compliance
    if (!this.checkOutputCompliance()) {
      score -= 25;
    }

    // Check timing compliance
    if (!this.checkTimingCompliance()) {
      score -= 20;
    }

    // Check gas reasonableness
    if (!this.checkGasReasonableness()) {
      score -= 15;
    }

    // Bonus for good practices
    if (this.strategy_summary.protocols_used.length > 0) {
      score += 5; // Strategy transparency
    }

    if (this.estimated_slippage_bps <= this.intent.constraints.max_slippage_bps) {
      score += 5; // Slippage compliance
    }

    return Math.max(0, Math.min(100, score));
  }

  private checkConstraintCompliance(): boolean {
    const constraints = this.intent.constraints;

    // Check slippage
    if (this.estimated_slippage_bps > constraints.max_slippage_bps) {
      return false;
    }

    // Check minimum outputs
    for (const minOutput of constraints.min_outputs) {
      const matchingOutput = this.promised_outputs.find(o => o.asset_id === minOutput.asset_id);
      if (!matchingOutput || BigInt(matchingOutput.amount) < BigInt(minOutput.amount)) {
        return false;
      }
    }

    // Check gas limit if specified
    if (constraints.max_gas_cost) {
      // This would need proper gas cost comparison in production
    }

    return true;
  }

  private checkOutputCompliance(): boolean {
    const expectedOutputs = this.intent.operation.expected_outcome.expected_outputs;
    
    // Check that we have outputs for all expected assets
    for (const expected of expectedOutputs) {
      const matching = this.promised_outputs.find(o => o.asset_id === expected.asset_id);
      if (!matching) {
        return false;
      }
    }

    return true;
  }

  private checkTimingCompliance(): boolean {
    const now = Date.now();
    const deadline = this.intent.timing.absolute_deadline;
    
    // Check if we're still within deadline
    return now < deadline;
  }

  private checkGasReasonableness(): boolean {
    // In production, you'd check against gas limits and market rates
    const gasAmount = parseFloat(this.estimated_gas);
    return gasAmount >= 0 && gasAmount < 1000; // Reasonable upper bound
  }

  private getComplianceDetails(): string[] {
    const details: string[] = [];

    if (!this.checkConstraintCompliance()) {
      details.push('Constraint compliance failed');
    }
    if (!this.checkOutputCompliance()) {
      details.push('Output compliance failed');
    }
    if (!this.checkTimingCompliance()) {
      details.push('Timing compliance failed');
    }
    if (!this.checkGasReasonableness()) {
      details.push('Gas estimate unreasonable');
    }

    return details;
  }

  private async hashTx(bytes: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

/**
 * Helper functions for IGS solution building
 */

/**
 * Create IGS solution builder from intent
 */
export function createIGSSolutionBuilder(
  intent: IGSIntent, 
  options: IGSSolutionBuilderOptions
): IGSSolutionBuilder {
  return new IGSSolutionBuilder(intent, options);
}

/**
 * Validate IGS solution compliance
 */
export function validateIGSSolution(
  intent: IGSIntent, 
  solution: IGSSolution
): {
  compliant: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Check basic fields
  if (solution.intent_id !== intent.intent_id) {
    issues.push('Intent ID mismatch');
    score -= 25;
  }

  // Check outputs vs constraints
  for (const minOutput of intent.constraints.min_outputs) {
    const matchingOutput = solution.promised_outputs.find(o => o.asset_id === minOutput.asset_id);
    if (!matchingOutput || BigInt(matchingOutput.amount) < BigInt(minOutput.amount)) {
      issues.push(`Output ${minOutput.asset_id} below minimum`);
      score -= 20;
    }
  }

  // Check slippage
  if (solution.estimated_slippage_bps > intent.constraints.max_slippage_bps) {
    issues.push('Slippage exceeds maximum');
    score -= 15;
  }

  // Check timing
  if (solution.submitted_at > intent.timing.absolute_deadline) {
    issues.push('Solution submitted after deadline');
    score -= 30;
  }

  return {
    compliant: issues.length === 0,
    score: Math.max(0, score),
    issues
  };
}

/**
 * Compare two IGS solutions for ranking
 */
export function compareIGSSolutions(
  intent: IGSIntent,
  solution1: IGSSolution,
  solution2: IGSSolution
): number {
  const weights = intent.preferences.ranking_weights;

  // Calculate scores for each solution
  const score1 = calculateSolutionScore(intent, solution1, weights);
  const score2 = calculateSolutionScore(intent, solution2, weights);

  return score2 - score1; // Higher score first
}

function calculateSolutionScore(
  intent: IGSIntent,
  solution: IGSSolution,
  weights: any
): number {
  let score = 0;

  // Surplus score (0-100)
  const surplusPercentage = parseFloat(solution.surplus_calculation.surplus_percentage);
  const surplusScore = Math.min(100, Math.max(0, surplusPercentage * 10)); // 10% surplus = 100 points
  score += (surplusScore * weights.surplus_weight) / 100;

  // Gas cost score (0-100, lower gas = higher score)
  const gasAmount = parseFloat(solution.estimated_gas);
  const gasScore = Math.max(0, 100 - gasAmount * 10); // Rough scoring
  score += (gasScore * weights.gas_cost_weight) / 100;

  // Execution speed score (based on complexity)
  const speedScore = Math.max(0, 100 - solution.strategy_summary.total_hops * 10);
  score += (speedScore * weights.execution_speed_weight) / 100;

  // Reputation score (based on compliance)
  const reputationScore = solution.compliance_score;
  score += (reputationScore * weights.reputation_weight) / 100;

  return score;
}
