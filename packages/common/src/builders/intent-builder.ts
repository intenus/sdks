import { Intent, IGSIntentType } from "../types";

/**
 * Fluent API for building IGS intents
 * Provides a convenient way to construct Intent objects with proper validation
 *
 * @example
 * const intent = new IntentBuilder(userAddress)
 *   .swap('0x2::sui::SUI', '100000000', '0x...::usdc::USDC')
 *   .withSlippage(50)
 *   .withDeadline(5 * 60 * 1000) // 5 minutes
 *   .withOptimization('maximize_output')
 *   .private()
 *   .build();
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
   * Set intent type and description
   * @param type - Type of intent operation
   * @param description - Human-readable description
   */
  withType(type: IGSIntentType, description?: string): this {
    this.intent.intent_type = type;
    if (description) {
      this.intent.description = description;
    }
    return this;
  }

  /**
   * Set deadline (time from now in milliseconds)
   * @param durationMs - Duration from now in milliseconds (default: 5 minutes)
   */
  withDeadline(durationMs: number = 300000): this {
    const deadline = Date.now() + durationMs;
    this.intent.constraints.deadline = deadline;
    this.intent.timing.absolute_deadline = deadline;
    return this;
  }

  /**
   * Set maximum slippage tolerance
   * @param slippageBps - Maximum slippage in basis points (100 bps = 1%)
   */
  withSlippage(slippageBps: number): this {
    this.intent.constraints.max_slippage_bps = slippageBps;
    return this;
  }

  /**
   * Set optimization goal
   * @param goal - Primary optimization goal
   */
  withOptimization(goal: 'maximize_output' | 'minimize_gas' | 'fastest_execution' | 'balanced'): this {
    this.intent.preferences.optimization_goal = goal;
    return this;
  }

  /**
   * Set ranking weights for AI optimization
   * @param weights - Custom ranking weights (should sum to 100)
   */
  withRankingWeights(weights: Partial<typeof this.intent.preferences.ranking_weights>): this {
    this.intent.preferences.ranking_weights = {
      ...this.intent.preferences.ranking_weights,
      ...weights,
    };
    return this;
  }

  /**
   * Set routing constraints
   * @param routing - Routing preferences (max hops, protocol filters)
   */
  withRouting(routing: {
    maxHops?: number;
    blacklistProtocols?: string[];
    whitelistProtocols?: string[];
  }): this {
    this.intent.constraints.routing = {
      max_hops: routing.maxHops,
      blacklist_protocols: routing.blacklistProtocols,
      whitelist_protocols: routing.whitelistProtocols,
    };
    return this;
  }

  /**
   * Enable auto-execution of best solution
   * @param autoExecute - Whether to auto-execute (default: true)
   */
  withAutoExecute(autoExecute: boolean = true): this {
    this.intent.preferences.execution.auto_execute = autoExecute;
    return this;
  }

  /**
   * Set number of top solutions to show
   * @param count - Number of solutions to show (default: 3)
   */
  withTopN(count: number = 3): this {
    this.intent.preferences.execution.show_top_n = count;
    return this;
  }

  /**
   * Set solver window duration
   * @param windowMs - Time window for solvers to submit solutions in milliseconds
   */
  withSolverWindow(windowMs: number): this {
    this.intent.timing.solver_window_ms = windowMs;
    return this;
  }

  /**
   * Set user decision timeout
   * @param timeoutMs - Time for user to decide on solutions in milliseconds
   */
  withDecisionTimeout(timeoutMs: number): this {
    this.intent.timing.user_decision_timeout_ms = timeoutMs;
    return this;
  }

  /**
   * Add metadata tags for categorization
   * @param tags - Array of tags for this intent
   */
  withTags(tags: string[]): this {
    this.intent.metadata.tags = tags;
    return this;
  }

  /**
   * Set original user input metadata
   * @param text - Original text input
   * @param language - Language of the input (default: 'en')
   * @param confidence - NLP parsing confidence (default: 0.95)
   */
  withOriginalInput(text: string, language: string = 'en', confidence: number = 0.95): this {
    this.intent.metadata.original_input = {
      text,
      language,
      confidence,
    };
    return this;
  }

  /**
   * Set client information
   * @param client - Client application information
   */
  withClient(client: { name: string; version: string; platform: string }): this {
    this.intent.metadata.client = client;
    return this;
  }

  /**
   * Add warnings to the intent
   * @param warnings - Array of warning messages
   */
  withWarnings(warnings: string[]): this {
    this.intent.metadata.warnings = warnings;
    return this;
  }

  /**
   * Set limit order configuration
   * @param tokenIn - Input token asset ID
   * @param amountIn - Input amount in base units
   * @param tokenOut - Output token asset ID
   * @param limitPrice - Limit price value
   * @param comparison - Price comparison ('gte' for sell, 'lte' for buy)
   */
  limitOrder(
    tokenIn: string,
    amountIn: string,
    tokenOut: string,
    limitPrice: string,
    comparison: 'gte' | 'lte' = 'gte'
  ): this {
    this.intent.intent_type = comparison === 'gte' ? 'limit.sell' : 'limit.buy';
    this.intent.description = `${comparison === 'gte' ? 'Sell' : 'Buy'} ${amountIn} ${tokenIn} at ${limitPrice} limit`;

    this.intent.operation = {
      mode: 'limit_order',
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
          confidence: 1.0,
        },
      },
    };

    this.intent.constraints.limit_price = {
      price: limitPrice,
      comparison,
      price_asset: tokenOut,
    };

    return this;
  }

  /**
   * Set exact output swap configuration
   * @param tokenIn - Input token asset ID
   * @param tokenOut - Output token asset ID
   * @param amountOut - Exact output amount desired
   * @param maxAmountIn - Maximum input amount willing to pay
   */
  swapExactOutput(
    tokenIn: string,
    tokenOut: string,
    amountOut: string,
    maxAmountIn: string
  ): this {
    this.intent.intent_type = 'swap.exact_output';
    this.intent.description = `Swap up to ${maxAmountIn} ${tokenIn} for exactly ${amountOut} ${tokenOut}`;

    this.intent.operation = {
      mode: 'exact_output',
      inputs: [{
        asset_id: tokenIn,
        asset_info: {
          symbol: tokenIn.split('::').pop() || 'UNKNOWN',
          decimals: 9,
        },
        amount: { type: 'range', min: '0', max: maxAmountIn },
      }],
      outputs: [{
        asset_id: tokenOut,
        asset_info: {
          symbol: tokenOut.split('::').pop() || 'UNKNOWN',
          decimals: 6,
        },
        amount: { type: 'exact', value: amountOut },
      }],
      expected_outcome: {
        expected_outputs: [{
          asset_id: tokenOut,
          amount: amountOut,
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