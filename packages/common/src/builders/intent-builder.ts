import { IGSIntent, IGSIntentType, IGSIntentSchema, type IGSObject } from '../types/igs.js';

/**
 * Fluent API for building IGS intents
 * Provides a convenient way to construct IGSIntent objects with proper validation
 *
 * @example
 * const intent = new IntentBuilder({
 *   user_address: '0x123...',
 *   object: {
 *     user_address: '0x123...',
 *     created_ts: Date.now(),
 *     policy: {...}
 *   }
 * })
 *   .swap('0x2::sui::SUI', '100000000', '0x...::usdc::USDC')
 *   .withSlippage(50)
 *   .build();
 */
export class IntentBuilder {
  private intent: Partial<IGSIntent>;

  constructor(init?: Partial<IGSIntent> & { user_address: string; object: IGSObject }) {
    if (init) {
      this.intent = {
        ...init,
        igs_version: '1.0.0',
      };
    } else {
      // Minimal defaults - user must provide required fields
      this.intent = {
        igs_version: '1.0.0',
      };
    }
  }

  /**
   * Set user address and object
   */
  withUser(user_address: string, object: IGSObject): this {
    this.intent.user_address = user_address;
    this.intent.object = object;
    return this;
  }

  /**
   * Set intent type
   */
  withType(type: IGSIntentType, description?: string): this {
    this.intent.intent_type = type;
    if (description) {
      this.intent.description = description;
    }
    return this;
  }

  /**
   * Build a swap intent operation
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
          symbol: tokenIn.split('::').pop()?.toUpperCase() || 'UNKNOWN',
          decimals: 9,
        },
        amount: { type: 'exact', value: amountIn },
      }],
      outputs: [{
        asset_id: tokenOut,
        asset_info: {
          symbol: tokenOut.split('::').pop()?.toUpperCase() || 'UNKNOWN',
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
      },
    };

    // Set constraints with slippage
    this.intent.constraints = {
      max_slippage_bps: slippageBps,
      deadline_ms: Date.now() + 300000, // 5 minutes
      min_outputs: [{
        asset_id: tokenOut,
        amount: '0',
      }],
    };

    return this;
  }

  /**
   * Set constraints
   */
  withConstraints(constraints: NonNullable<IGSIntent['constraints']>): this {
    this.intent.constraints = { ...this.intent.constraints, ...constraints };
    return this;
  }

  /**
   * Set preferences
   */
  withPreferences(preferences: NonNullable<IGSIntent['preferences']>): this {
    this.intent.preferences = { ...this.intent.preferences, ...preferences };
    return this;
  }

  /**
   * Set metadata
   */
  withMetadata(metadata: NonNullable<IGSIntent['metadata']>): this {
    this.intent.metadata = { ...this.intent.metadata, ...metadata };
    return this;
  }

  /**
   * Set max slippage
   */
  withSlippage(slippageBps: number): this {
    if (!this.intent.constraints) {
      this.intent.constraints = {};
    }
    this.intent.constraints.max_slippage_bps = slippageBps;
    return this;
  }

  /**
   * Set optimization goal
   */
  withOptimization(goal: 'maximize_output' | 'minimize_gas' | 'fastest_execution' | 'balanced'): this {
    if (!this.intent.preferences) {
      this.intent.preferences = {};
    }
    this.intent.preferences.optimization_goal = goal;
    return this;
  }

  /**
   * Build the final IGS intent with validation
   * @returns Complete validated IGS intent
   */
  build(): IGSIntent {
    // Validate with Zod schema
    const result = IGSIntentSchema.safeParse(this.intent);
    if (!result.success) {
      throw new Error(`Invalid IGS Intent: ${JSON.stringify(result.error.issues, null, 2)}`);
    }
    return result.data;
  }
}
