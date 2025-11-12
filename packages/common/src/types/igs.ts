/**
 * Intenus General Standard (IGS) v1.0
 * Universal standard for DeFi intents with AI ranking and surplus measurement
 */

/**
 * Core IGS Intent structure - the universal standard for DeFi intents
 * @interface IGSIntent
 */
export interface IGSIntent {
  /** IGS version - must be '1.0.0' for this schema */
  igs_version: '1.0.0';
  /** Unique intent identifier */
  intent_id: string;
  /** User's blockchain address */
  user_address: string;
  /** Intent creation timestamp (Unix milliseconds) */
  created_at: number;
  /** Type of intent operation */
  intent_type: IGSIntentType;
  /** Human-readable description of the intent */
  description: string;
  /** Core operation specification */
  operation: IGSOperation;
  /** Hard constraints that must be satisfied */
  constraints: IGSConstraints;
  /** Soft preferences for optimization */
  preferences: IGSPreferences;
  /** Timing and deadline specifications */
  timing: IGSTiming;
  /** Additional metadata and context */
  metadata: IGSMetadata;
}

/**
 * Types of supported intent operations
 * @typedef {string} IGSIntentType
 */
export type IGSIntentType = 
  | 'swap.exact_input'   /** Swap exact input amount for maximum output */
  | 'swap.exact_output'  /** Swap minimum input for exact output amount */
  | 'limit.sell'         /** Sell when price reaches or exceeds limit */
  | 'limit.buy';         /** Buy when price reaches or falls below limit */

/**
 * Core operation specification - defines what the user wants to achieve
 * @interface IGSOperation
 */
export interface IGSOperation {
  /** Operation mode determining execution strategy */
  mode: 'exact_input' | 'exact_output' | 'limit_order';
  /** Assets that the user provides as input */
  inputs: IGSAssetFlow[];
  /** Assets that the user wants to receive as output */
  outputs: IGSAssetFlow[];
  /** Expected outcome used as benchmark for surplus calculation */
  expected_outcome: IGSExpectedOutcome;
}

/**
 * Specification for an asset flow (input or output)
 * @interface IGSAssetFlow
 */
export interface IGSAssetFlow {
  /** Asset identifier (e.g., "0x2::sui::SUI" for Sui format) */
  asset_id: string;
  /** Asset metadata for display and validation */
  asset_info: {
    /** Asset symbol (e.g., "SUI", "USDC") */
    symbol: string;
    /** Number of decimal places for the asset */
    decimals: number;
    /** Optional human-readable asset name */
    name?: string;
  };
  /** Amount specification (exact, range, or all available) */
  amount: IGSAmount;
  /** Minimum amount for slippage protection */
  min_amount?: string;
}

/**
 * Amount specification for asset flows
 * @typedef {Object} IGSAmount
 */
export type IGSAmount = 
  | { /** Exact amount in base units */ type: 'exact'; value: string }
  | { /** Range with minimum and maximum amounts */ type: 'range'; min: string; max: string }
  | { /** Use all available balance */ type: 'all' };

/**
 * Expected outcome used as benchmark for surplus calculation
 * @interface IGSExpectedOutcome
 */
export interface IGSExpectedOutcome {
  /** Expected output amounts for each asset */
  expected_outputs: Array<{
    /** Asset identifier */
    asset_id: string;
    /** Expected amount in base units */
    amount: string;
  }>;
  /** Expected transaction costs */
  expected_costs: {
    /** Estimated gas cost */
    gas_estimate: string;
    /** Optional protocol fees */
    protocol_fees?: string;
    /** Optional slippage estimate */
    slippage_estimate?: string;
  };
  /** Benchmark source information */
  benchmark: {
    /** Source of the benchmark (e.g., "dex_aggregator", "oracle") */
    source: string;
    /** Timestamp when benchmark was created */
    timestamp: number;
    /** Confidence level (0-1) */
    confidence: number;
  };
  /** Current market price for limit orders */
  market_price?: {
    /** Current market price */
    price: string;
    /** Quote asset for the price */
    price_asset: string;
  };
}

/**
 * Hard constraints that must be satisfied by any solution
 * @interface IGSConstraints
 */
export interface IGSConstraints {
  /** Absolute deadline timestamp (Unix milliseconds) */
  deadline: number;
  /** Maximum allowed slippage in basis points (100 bps = 1%) */
  max_slippage_bps: number;
  /** Maximum gas cost willing to pay */
  max_gas_cost?: {
    /** Asset to pay gas in */
    asset_id: string;
    /** Maximum amount in base units */
    amount: string;
  };
  /** Minimum required outputs for safety */
  min_outputs: Array<{
    /** Asset identifier */
    asset_id: string;
    /** Minimum amount in base units */
    amount: string;
  }>;
  /** Optional routing constraints */
  routing?: {
    /** Maximum number of hops allowed */
    max_hops?: number;
    /** Protocols to avoid */
    blacklist_protocols?: string[];
    /** Only use these protocols */
    whitelist_protocols?: string[];
  };
  /** Limit price for limit orders */
  limit_price?: {
    /** Limit price value */
    price: string;
    /** Price comparison (>= or <=) */
    comparison: 'gte' | 'lte';
    /** Quote asset for price */
    price_asset: string;
  };
}

/**
 * Soft preferences for solution optimization
 * @interface IGSPreferences
 */
export interface IGSPreferences {
  /** Primary optimization goal */
  optimization_goal: 'maximize_output' | 'minimize_gas' | 'fastest_execution' | 'balanced';
  /** Ranking weights for AI (should sum to 100) */
  ranking_weights: {
    /** Weight for surplus optimization (default: 50) */
    surplus_weight: number;
    /** Weight for gas cost optimization (default: 25) */
    gas_cost_weight: number;
    /** Weight for execution speed (default: 15) */
    execution_speed_weight: number;
    /** Weight for solver reputation (default: 10) */
    reputation_weight: number;
  };
  /** Execution preferences */
  execution: {
    /** Whether to auto-execute the best solution */
    auto_execute: boolean;
    /** Number of top solutions to show user */
    show_top_n: number;
    /** Whether to require simulation before execution */
    require_simulation: boolean;
  };
  /** Privacy preferences */
  privacy?: {
    /** Whether to encrypt the intent */
    encrypt_intent: boolean;
    /** Whether to execute anonymously */
    anonymous_execution: boolean;
  };
}

/**
 * Timing specifications and deadlines
 * @interface IGSTiming
 */
export interface IGSTiming {
  /** Absolute deadline for intent execution */
  absolute_deadline: number;
  /** Time window for solvers to submit solutions (ms) */
  solver_window_ms: number;
  /** Time for user to decide on solutions (ms) */
  user_decision_timeout_ms: number;
  /** Batch assignment information */
  batch: {
    /** Unique batch identifier */
    batch_id: string;
    /** Batch epoch number */
    batch_epoch: number;
    /** When this batch closes for new intents */
    batch_closes_at: number;
  };
  /** Execution timing constraints */
  execution?: {
    /** Time-in-force specification */
    time_in_force: 'immediate' | 'good_til_cancel' | 'fill_or_kill';
    /** Earliest allowed execution time */
    earliest_execution?: number;
    /** Latest allowed execution time */
    latest_execution?: number;
  };
}

/**
 * Additional metadata and context information
 * @interface IGSMetadata
 */
export interface IGSMetadata {
  /** Original user input from NLP parsing */
  original_input?: {
    /** Original text input */
    text: string;
    /** Language of the input */
    language: string;
    /** NLP parsing confidence (0-1) */
    confidence: number;
  };
  /** Client application information */
  client: {
    /** Client application name */
    name: string;
    /** Client version */
    version: string;
    /** Platform (web, mobile, etc.) */
    platform: string;
  };
  /** Warnings about the intent */
  warnings?: string[];
  /** Clarifications needed from user */
  clarifications?: string[];
  /** Tags for categorization and analytics */
  tags?: string[];
}

/**
 * Solution submitted by a solver for an IGS intent
 * @interface IGSSolution
 */
export interface IGSSolution {
  /** Unique solution identifier */
  solution_id: string;
  /** Intent this solution addresses */
  intent_id: string;
  /** Solver's blockchain address */
  solver_address: string;
  /** When solution was submitted (Unix ms) */
  submitted_at: number;
  /** Serialized transaction bytes (hex string) */
  ptb_bytes: string;
  /** Hash of the transaction */
  ptb_hash: string;
  /** Promised output amounts */
  promised_outputs: Array<{
    /** Asset identifier */
    asset_id: string;
    /** Promised amount in base units */
    amount: string;
  }>;
  /** Estimated gas cost */
  estimated_gas: string;
  /** Estimated slippage in basis points */
  estimated_slippage_bps: number;
  /** Optional protocol fees */
  protocol_fees?: string;
  /** Surplus calculation vs benchmark */
  surplus_calculation: {
    /** Expected value from intent benchmark */
    benchmark_value_usd: string;
    /** Actual value from this solution */
    solution_value_usd: string;
    /** Surplus amount (solution - benchmark) */
    surplus_usd: string;
    /** Surplus as percentage of benchmark */
    surplus_percentage: string;
  };
  /** Strategy and execution details */
  strategy_summary: {
    /** Protocols used in the solution */
    protocols_used: string[];
    /** Total number of hops */
    total_hops: number;
    /** Human-readable execution path */
    execution_path: string;
    /** Unique techniques or optimizations */
    unique_techniques?: string;
  };
  /** IGS compliance score (0-100) */
  compliance_score: number;
  /** Details about compliance issues */
  compliance_details?: string[];
}

/**
 * Solution ranked and scored by AI router
 * @interface IGSRankedSolution
 */
export interface IGSRankedSolution {
  /** Ranking position (1 = best) */
  rank: number;
  /** AI confidence score (0-100) */
  ai_score: number;
  /** The underlying solution */
  solution: IGSSolution;
  /** AI reasoning and explanation */
  ai_reasoning: {
    /** Primary reason for this ranking */
    primary_reason: string;
    /** Additional supporting reasons */
    secondary_reasons: string[];
    /** Risk level assessment */
    risk_assessment: 'low' | 'medium' | 'high';
    /** AI confidence in this ranking (0-1) */
    confidence_level: number;
  };
  /** Whether personalization was applied */
  personalization_applied: boolean;
  /** How well this fits user's history */
  user_fit_score?: number;
  /** Warnings about this solution */
  warnings: string[];
  /** When this ranking expires */
  expires_at: number;
}

/**
 * Result of IGS intent validation
 * @interface IGSValidationResult
 */
export interface IGSValidationResult {
  /** Whether the intent is valid */
  valid: boolean;
  /** Compliance score (0-100) */
  compliance_score: number;
  /** Validation errors found */
  errors: IGSValidationError[];
  /** Validation warnings */
  warnings: string[];
}

/**
 * Individual validation error or warning
 * @interface IGSValidationError
 */
export interface IGSValidationError {
  /** Error code for programmatic handling */
  code: string;
  /** Field path where error occurred */
  field: string;
  /** Human-readable error message */
  message: string;
  /** Severity level */
  severity: 'error' | 'warning';
}

// Examples
export const EXAMPLE_SIMPLE_SWAP: IGSIntent = {
  igs_version: '1.0.0',
  intent_id: 'intent_swap_001',
  user_address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  created_at: Date.now(),

  intent_type: 'swap.exact_input',
  description: 'Swap 100 SUI to USDC',

  operation: {
    mode: 'exact_input',
    inputs: [{
      asset_id: '0x2::sui::SUI',
      asset_info: {
        symbol: 'SUI',
        decimals: 9,
        name: 'Sui Token'
      },
      amount: {
        type: 'exact',
        value: '100000000000'
      }
    }],
    outputs: [{
      asset_id: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC',
      asset_info: {
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin'
      },
      amount: {
        type: 'range',
        min: '298500000',
        max: '300000000'
      },
      min_amount: '298500000'
    }],
    expected_outcome: {
      expected_outputs: [{
        asset_id: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC',
        amount: '300000000'
      }],
      expected_costs: {
        gas_estimate: '0.01',
        protocol_fees: '0.30',
        slippage_estimate: '1.50'
      },
      benchmark: {
        source: 'dex_aggregator',
        timestamp: Date.now(),
        confidence: 0.95
      }
    }
  },

  constraints: {
    deadline: Date.now() + 300000,
    max_slippage_bps: 50,
    min_outputs: [{
      asset_id: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC',
      amount: '298500000'
    }]
  },

  preferences: {
    optimization_goal: 'maximize_output',
    ranking_weights: {
      surplus_weight: 50,
      gas_cost_weight: 25,
      execution_speed_weight: 15,
      reputation_weight: 10
    },
    execution: {
      auto_execute: false,
      show_top_n: 3,
      require_simulation: true
    }
  },

  timing: {
    absolute_deadline: Date.now() + 300000,
    solver_window_ms: 5000,
    user_decision_timeout_ms: 60000,
    batch: {
      batch_id: 'batch_001',
      batch_epoch: 1234,
      batch_closes_at: Date.now() + 10000
    }
  },

  metadata: {
    original_input: {
      text: 'Swap 100 SUI to USDC',
      language: 'en',
      confidence: 0.98
    },
    client: {
      name: 'Intenus Web',
      version: '1.0.0',
      platform: 'browser'
    },
    tags: ['swap', 'simple']
  }
};

export const EXAMPLE_LIMIT_ORDER: IGSIntent = {
  igs_version: '1.0.0',
  intent_id: 'intent_limit_001',
  user_address: '0x456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012',
  created_at: Date.now(),

  intent_type: 'limit.sell',
  description: 'Sell 1000 SUI at $3.50 limit',

  operation: {
    mode: 'limit_order',
    inputs: [{
      asset_id: '0x2::sui::SUI',
      asset_info: {
        symbol: 'SUI',
        decimals: 9
      },
      amount: {
        type: 'exact',
        value: '1000000000000'
      }
    }],
    outputs: [{
      asset_id: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC',
      asset_info: {
        symbol: 'USDC',
        decimals: 6
      },
      amount: {
        type: 'range',
        min: '3500000000',
        max: '3600000000'
      },
      min_amount: '3500000000'
    }],
    expected_outcome: {
      expected_outputs: [{
        asset_id: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC',
        amount: '3500000000'
      }],
      expected_costs: {
        gas_estimate: '0.02'
      },
      benchmark: {
        source: 'manual',
        timestamp: Date.now(),
        confidence: 1.0
      },
      market_price: {
        price: '3.20',
        price_asset: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC'
      }
    }
  },

  constraints: {
    deadline: Date.now() + 86400000,
    max_slippage_bps: 100,
    min_outputs: [{
      asset_id: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC',
      amount: '3500000000'
    }],
    limit_price: {
      price: '3.50',
      comparison: 'gte',
      price_asset: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC'
    }
  },

  preferences: {
    optimization_goal: 'maximize_output',
    ranking_weights: {
      surplus_weight: 60,
      gas_cost_weight: 20,
      execution_speed_weight: 10,
      reputation_weight: 10
    },
    execution: {
      auto_execute: true,
      show_top_n: 1,
      require_simulation: false
    },
    privacy: {
      encrypt_intent: true,
      anonymous_execution: false
    }
  },

  timing: {
    absolute_deadline: Date.now() + 86400000,
    solver_window_ms: 30000,
    user_decision_timeout_ms: 300000,
    batch: {
      batch_id: 'batch_limit_001',
      batch_epoch: 1235,
      batch_closes_at: Date.now() + 30000
    },
    execution: {
      time_in_force: 'good_til_cancel'
    }
  },

  metadata: {
    original_input: {
      text: 'Sell 1000 SUI when price reaches $3.50',
      language: 'en',
      confidence: 0.96
    },
    client: {
      name: 'Intenus Web',
      version: '1.0.0',
      platform: 'browser'
    },
    tags: ['limit_order', 'large_trade']
  }
};

// Utilities

/**
 * Migrate legacy intent format to IGS format
 * @param {any} legacyIntent - Legacy intent object
 * @returns {IGSIntent} Converted IGS intent
 * @throws {Error} Not yet implemented
 */
export function migrateToIGS(legacyIntent: any): IGSIntent {
  throw new Error('Not implemented yet');
}

/**
 * Validate an IGS intent for compliance and correctness
 * @param {IGSIntent} intent - Intent to validate
 * @returns {IGSValidationResult} Validation result with errors and score
 */
export function validateIGS(intent: IGSIntent): IGSValidationResult {
  const errors: IGSValidationError[] = [];
  const warnings: string[] = [];

  if (!intent.igs_version || intent.igs_version !== '1.0.0') {
    errors.push({
      code: 'INVALID_VERSION',
      field: 'igs_version',
      message: 'IGS version must be 1.0.0',
      severity: 'error'
    });
  }

  if (!intent.intent_id) {
    errors.push({
      code: 'MISSING_INTENT_ID',
      field: 'intent_id',
      message: 'Intent ID is required',
      severity: 'error'
    });
  }

  if (intent.timing.absolute_deadline <= Date.now()) {
    errors.push({
      code: 'EXPIRED_DEADLINE',
      field: 'timing.absolute_deadline',
      message: 'Intent deadline has passed',
      severity: 'error'
    });
  }

  if (intent.operation.inputs.length === 0) {
    errors.push({
      code: 'NO_INPUTS',
      field: 'operation.inputs',
      message: 'At least one input is required',
      severity: 'error'
    });
  }

  if (intent.operation.outputs.length === 0) {
    errors.push({
      code: 'NO_OUTPUTS',
      field: 'operation.outputs',
      message: 'At least one output is required',
      severity: 'error'
    });
  }

  if (intent.constraints.max_slippage_bps > 10000) {
    warnings.push('Slippage > 100% is unusual');
  }

  const valid = errors.length === 0;
  const compliance_score = Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5));

  return {
    valid,
    compliance_score,
    errors,
    warnings
  };
}

/**
 * Calculate surplus of a solution compared to intent benchmark
 * @param {IGSIntent} intent - Original intent with benchmark
 * @param {IGSSolution} solution - Solution to calculate surplus for
 * @returns {Object} Surplus calculation result
 * @returns {string} returns.surplus_usd - Surplus amount in USD
 * @returns {string} returns.surplus_percentage - Surplus as percentage
 */
export function calculateSurplus(
  intent: IGSIntent,
  solution: IGSSolution
): {
  surplus_usd: string;
  surplus_percentage: string;
} {
  const benchmarkValue = parseFloat(intent.operation.expected_outcome.expected_outputs[0].amount);
  const solutionValue = parseFloat(solution.promised_outputs[0].amount);
  
  const surplus = solutionValue - benchmarkValue;
  const surplusPercentage = (surplus / benchmarkValue) * 100;

  return {
    surplus_usd: surplus.toString(),
    surplus_percentage: surplusPercentage.toString()
  };
}
