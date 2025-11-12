import type { Intent } from '@intenus/common';

/**
 * Fluent API for building IGS intents
 * Provides a convenient way to construct Intent objects with proper validation
 */
export class IntentBuilder {
  private intent: Intent;
  
  constructor(userAddress: string) {
    this.intent = {
      igs_version: '1.0.0',
      intent_id: crypto.randomUUID(),
      user_address: userAddress,
      created_at: Date.now(),
      intent_type: 'swap.exact_input',
      description: '',
      operation: {
        mode: 'exact_input',
        inputs: [],
        outputs: [],
        expected_outcome: {
          expected_outputs: [],
          expected_costs: {
            gas_estimate: '0.01',
          },
          benchmark: {
            source: 'client_sdk',
      timestamp: Date.now(),
            confidence: 0.8,
          },
        },
      },
      constraints: {
        deadline: Date.now() + 300000,
        max_slippage_bps: 50,
        min_outputs: [],
      },
      preferences: {
        optimization_goal: 'balanced',
        ranking_weights: {
          surplus_weight: 50,
          gas_cost_weight: 25,
          execution_speed_weight: 15,
          reputation_weight: 10,
        },
        execution: {
          auto_execute: false,
          show_top_n: 3,
          require_simulation: true,
        },
      },
      timing: {
        absolute_deadline: Date.now() + 300000,
        solver_window_ms: 5000,
        user_decision_timeout_ms: 60000,
        batch: {
          batch_id: 'batch_' + Date.now(),
          batch_epoch: Math.floor(Date.now() / 10000),
          batch_closes_at: Date.now() + 10000,
        },
      },
      metadata: {
        client: {
          name: 'Intenus Client SDK',
          version: '1.0.0',
          platform: 'web',
        },
      },
    };
  }
  
  /**
   * Build a swap intent
   * @param tokenIn - Input token asset ID
   * @param amountIn - Input amount in base units
   * @param tokenOut - Output token asset ID
   * @param slippageBps - Maximum slippage in basis points (default: 50 = 0.5%)
   */
  swap(
    tokenIn: string,
    amountIn: string,
    tokenOut: string,
    slippageBps: number = 50
  ): this {
    
    this.intent.intent_type = 'swap.exact_input';
    this.intent.description = `Swap ${amountIn} ${tokenIn} to ${tokenOut}`;
    
    this.intent.operation = {
      mode: 'exact_input',
      inputs: [{
        asset_id: tokenIn,
        asset_info: {
          symbol: tokenIn.split('::').pop() || 'UNKNOWN',
          decimals: 9,
        },
        amount: { type: 'exact', value: amountIn },
      }],
      outputs: [{
        asset_id: tokenOut,
        asset_info: {
          symbol: tokenOut.split('::').pop() || 'UNKNOWN',
          decimals: 6,
        },
        amount: { type: 'range', min: '0', max: '999999999999' },
      }],
      expected_outcome: {
        expected_outputs: [{
          asset_id: tokenOut,
          amount: '0',
        }],
        expected_costs: {
          gas_estimate: '0.01',
        },
        benchmark: {
          source: 'client_sdk',
          timestamp: Date.now(),
          confidence: 0.8,
        },
      },
    };
    
    this.intent.constraints = {
      deadline: Date.now() + 300000,
      max_slippage_bps: slippageBps,
      min_outputs: [{
        asset_id: tokenOut,
        amount: '0',
      }],
    };
    
    return this;
  }
  
  /**
   * Set privacy preferences
   * @param isPrivate - Whether to encrypt the intent
   */
  private(isPrivate: boolean = true): this {
    this.intent.preferences.privacy = {
      encrypt_intent: isPrivate,
      anonymous_execution: isPrivate,
    };
    return this;
  }
  
  /**
   * Set constraints
   * @param constraints - Constraints to merge
   */
  constraints(constraints: Partial<typeof this.intent.constraints>): this {
    this.intent.constraints = { ...this.intent.constraints, ...constraints };
    return this;
  }
  
  /**
   * Set execution preferences
   * @param execution - Execution preferences to merge
   */
  execution(execution: Partial<typeof this.intent.preferences.execution>): this {
    this.intent.preferences.execution = { ...this.intent.preferences.execution, ...execution };
    return this;
  }
  
  /**
   * Build the final IGS intent
   * @returns Complete IGS intent ready for submission
   */
  build(): Intent {
    return this.intent;
  }
}