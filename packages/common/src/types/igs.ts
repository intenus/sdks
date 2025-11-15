/**
 * Intenus General Standard (IGS) v1.0
 * Universal standard for DeFi intents with AI ranking and surplus measurement
 *
 * ARCHITECTURE:
 * - IGSIntent: Off-chain intent submission (what user wants) - stored in Walrus
 * - IGSObject: On-chain Sui object - stores reference (blob_id) + policy enforcement
 * - Separation: Content (off-chain) vs Tracking (on-chain)
 * - PreRankingEngine: Validates schema, constraints, converts to features vector
 * - Dry Run: Simulates solutions on Sui
 * - RankingEngine: Ranks solutions based on simulation results
 * 
 * FILE STRUCTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 1. INTENT SPECIFICATION                                     │
 * │    - IGSIntent, IGSOperation, IGSConstraints, etc.         │
 * │    - What user wants (stored in Walrus)                    │
 * ├─────────────────────────────────────────────────────────────┤
 * │ 2. ON-CHAIN OBJECT                                          │
 * │    - IGSObject (Sui object with blob_id + policy)          │
 * │    - Minimal on-chain footprint                            │
 * ├─────────────────────────────────────────────────────────────┤
 * │ 3. SOLUTION FORMAT                                          │
 * │    - IGSSolution (what solvers submit)                     │
 * │    - IGSRankedSolution (with AI scores)                    │
 * ├─────────────────────────────────────────────────────────────┤
 * │ 4. VALIDATION                                               │
 * │    - IGSValidationResult, IGSValidationError               │
 * │    - Schema and constraint checking                        │
 * ├─────────────────────────────────────────────────────────────┤
 * │ 5. PRE-RANKING ENGINE                                       │
 * │    - IGSPreRankingResult                                   │
 * │    - Validation + Simulation + Feature extraction          │
 * ├─────────────────────────────────────────────────────────────┤
 * │ 6. RANKING ENGINE                                           │
 * │    - IGSRankingResult                                      │
 * │    - AI-powered ranking with explanations                  │
 * ├─────────────────────────────────────────────────────────────┤
 * │ 7. EXAMPLES                                                 │
 * │    - Sample intents for reference                          │
 * ├─────────────────────────────────────────────────────────────┤
 * │ 8. UTILITIES                                                │
 * │    - Helper functions (validate, migrate, calculate)       │
 * └─────────────────────────────────────────────────────────────┘
 */

/**
 * ============================================================================
 * INTENT SPECIFICATION — what the user wants (stored off-chain in Walrus)
 * ============================================================================
 */

/**
 * Core IGS Intent structure - for off-chain intent submission
 * This represents the user's desired intent without blockchain-specific fields
 * @interface IGSIntent
 */
export interface IGSIntent {
  /** IGS version - must be '1.0.0' for this schema */
  igs_version: '1.0.0';
  /** On-chain IGS object metadata */
  object: IGSObject;
  /** User's blockchain address */
  user_address: string;
  /** Type of intent operation */
  intent_type: IGSIntentType;
  /** Human-readable description of the intent */
  description?: string;
  /** Core operation specification */
  operation: IGSOperation;
  /** Optional hard constraints that must be satisfied */
  constraints?: IGSConstraints;
  /** Soft preferences for optimization */
  preferences?: IGSPreferences;
  /** Additional metadata and context */
  metadata?: IGSMetadata;
}

/**
 * ============================================================================
 * ON-CHAIN OBJECT — reference wrapper stored on Sui
 * ============================================================================
 */

/**
 * IGS Object - On-chain Sui Object that references IGS Intent
 * Stores pointer to Walrus blob + policy enforcement parameters
 * Full intent content stored off-chain in Walrus
 * @interface IGSObject
 */
export interface IGSObject {
  /** Owner address from Sui object (serves as user_address) */
  user_address: string;
  /** Timestamp when object was created (from Clock) */
  created_ts: number;
  
  /** On-chain policy enforcement parameters */
  policy: {
    solver_access_window: {
      start_ms: number;
      end_ms: number;
    };
    auto_revoke_time: number;
    access_condition: {
      requires_solver_registration: boolean;
      min_solver_stake: string;
      requires_tee_attestation: boolean;
      expected_measurement: string;
      purpose: string;
    };
  };
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
  expected_outcome?: IGSExpectedOutcome;
}

/**
 * Specification for an asset flow (input or output)
 * @interface IGSAssetFlow
 */
export interface IGSAssetFlow {
  /** Asset identifier (e.g., "0x2::sui::SUI" for Sui format) */
  asset_id: string;
  /** Asset metadata for display and validation */
  asset_info?: {
    /** Asset symbol (e.g., "SUI", "USDC") */
    symbol?: string;
    /** Number of decimal places for the asset */
    decimals?: number;
    /** Optional human-readable asset name */
    name?: string;
  };
  /** Amount specification (exact, range, or all available) */
  amount: IGSAmount;
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
  expected_costs?: {
    /** Estimated gas cost */
    gas_estimate?: string;
    /** Optional protocol fees */
    protocol_fees?: string;
    /** Optional slippage estimate */
    slippage_estimate?: string;
  };
  /** Benchmark source information */
  benchmark?: {
    /** Source of the benchmark (e.g., "dex_aggregator", "oracle") */
    source?: 'dex_aggregator' | 'oracle' | 'manual' | 'calculated';
    /** Timestamp when benchmark was created */
    timestamp?: number;
    /** Confidence level (0-1) */
    confidence?: number;
  };
  /** Current market price for limit orders */
  market_price?: {
    /** Current market price */
    price?: string;
    /** Quote asset for the price */
    price_asset?: string;
  };
}

/**
 * Hard constraints that must be satisfied by any solution
 * @interface IGSConstraints
 */
export interface IGSConstraints {
  /** Maximum allowed slippage in basis points (100 bps = 1%) */
  max_slippage_bps?: number;
  /** Expiration timestamp for the intent (ms) */
  deadline_ms?: number;
  /** Optional maximum input amounts (spending ceiling) */
  max_inputs?: Array<{
    asset_id: string;
    amount: string;
  }>;
  /** Optional minimum outputs for safety */
  min_outputs?: Array<{
    asset_id: string;
    amount: string;
  }>;
  /** Optional maximum gas cost willing to pay */
  max_gas_cost?: {
    asset_id: string;
    amount: string;
  };
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
 * Execution mode for RankingEngine output
 * @typedef {string} IGSExecutionMode
 */
export type IGSExecutionMode =
  | 'best_solution'                 /** Return only the best solution (default for MVP) */
  | 'top_n_with_best_incentive';    /** Show top N solutions, but fee always goes to best solver */

/**
 * Soft preferences for solution optimization
 * @interface IGSPreferences
 */
export interface IGSPreferences {
  /** Primary optimization goal */
  optimization_goal?: 'maximize_output' | 'minimize_gas' | 'fastest_execution' | 'balanced';
  /** Ranking weights for AI (should sum to 100) */
  ranking_weights?: {
    /** Weight for surplus optimization (default: 60) */
    surplus_weight?: number;
    /** Weight for gas cost optimization (default: 20) */
    gas_cost_weight?: number;
    /** Weight for execution speed (default: 10) */
    execution_speed_weight?: number;
    /** Weight for solver reputation (default: 10) */
    reputation_weight?: number;
  };
  /** Execution preferences */
  execution?: {
    /**
     * Execution mode - determines what RankingEngine returns
     * Note: Solvers never auto-execute. They only submit PTBs for ranking.
     * User must execute the returned PTB themselves.
     */
    mode?: IGSExecutionMode;
    /**
     * Number of top solutions to show user (only for top_n_with_best_incentive mode)
     * For best_solution mode, this is always 1
     */
    show_top_n?: number;
  };
  /** Privacy preferences */
  privacy?: {
    /** Whether to encrypt the intent */
    encrypt_intent?: boolean;
    /** Whether to execute anonymously */
    anonymous_execution?: boolean;
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
    text?: string;
    /** Language of the input */
    language?: string;
    /** NLP parsing confidence (0-1) */
    confidence?: number;
  };
  /** Client application information */
  client?: {
    /** Client application name */
    name?: string;
    /** Client version */
    version?: string;
    /** Platform (web, mobile, etc.) */
    platform?: string;
  };
  /** Warnings about the intent */
  warnings?: string[];
  /** Clarifications needed from user */
  clarifications?: string[];
  /** Tags for categorization and analytics */
  tags?: string[];
}

/**
 * ============================================================================
 * So
 * ============================================================================
 */

/**
 * Minimal IGS solution payload submitted by solvers.
 * Only identifies the solver and provides serialized PTB bytes.
 */
export interface IGSSolution {
  /** Sui address of the solver submitting this PTB */
  solver_address: string;
  /** Serialized PTB bytes (base64 or hex encoded string) */
  transaction_bytes: string;
}

/**
 * ============================================================================
 * VALIDATION — schema and constraint validation types
 * ============================================================================
 */

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

/**
 * ============================================================================
 * EXAMPLES — sample IGS intents for reference
 * ============================================================================
 */

export const EXAMPLE_SIMPLE_SWAP: IGSIntent = {
  igs_version: '1.0.0',
  object: {
    user_address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    created_ts: Date.now(),
    policy: {
      solver_access_window: {
        start_ms: Date.now(),
        end_ms: Date.now() + 60_000
      },
      auto_revoke_time: Date.now() + 3_600_000,
      access_condition: {
        requires_solver_registration: true,
        min_solver_stake: '1000000000',
        requires_tee_attestation: true,
        expected_measurement: '0xtee123',
        purpose: 'swap_routing'
      }
    }
  },
  user_address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',

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
        type: 'exact',
        value: '300000000'
      }
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
    max_slippage_bps: 50,
    deadline_ms: Date.now() + 300_000,
    max_inputs: [{
      asset_id: '0x2::sui::SUI',
      amount: '100000000000'
    }],
    min_outputs: [{
      asset_id: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC',
      amount: '298500000'
    }],
    max_gas_cost: {
      asset_id: '0x2::sui::SUI',
      amount: '1000000'
    }
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
      mode: 'top_n_with_best_incentive',
      show_top_n: 3
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
  object: {
    user_address: '0x456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012',
    created_ts: Date.now(),
    policy: {
      solver_access_window: {
        start_ms: Date.now(),
        end_ms: Date.now() + 120_000
      },
      auto_revoke_time: Date.now() + 7_200_000,
      access_condition: {
        requires_solver_registration: true,
        min_solver_stake: '5000000000',
        requires_tee_attestation: true,
        expected_measurement: '0xtee456',
        purpose: 'limit_order_execution'
      }
    }
  },
  user_address: '0x456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012',

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
        type: 'exact',
        value: '3500000000'
      }
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
    max_slippage_bps: 100,
    max_inputs: [{
      asset_id: '0x2::sui::SUI',
      amount: '1000000000000'
    }],
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
      mode: 'best_solution'
    },
    privacy: {
      encrypt_intent: true,
      anonymous_execution: false
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

/**
 * ============================================================================
 * UTILITIES — helper functions for IGS validation and processing
 * ============================================================================
 */

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

  if (!intent.user_address) {
    errors.push({
      code: 'MISSING_USER_ADDRESS',
      field: 'user_address',
      message: 'User address is required',
      severity: 'error'
    });
  }

  if (!intent.object) {
    errors.push({
      code: 'MISSING_OBJECT',
      field: 'object',
      message: 'On-chain IGS object metadata is required',
      severity: 'error'
    });
  }

  const now = Date.now();
  if (intent.constraints?.deadline_ms && intent.constraints.deadline_ms <= now) {
    errors.push({
      code: 'EXPIRED_DEADLINE',
      field: 'constraints.deadline_ms',
      message: 'Intent deadline has already passed',
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

  if (intent.constraints?.max_slippage_bps && intent.constraints.max_slippage_bps > 10000) {
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
 * @param {{ promised_outputs: Array<{ amount: string }> }} solution - Solution-like object to calculate surplus for
 * @returns {Object} Surplus calculation result
 * @returns {string} returns.surplus_usd - Surplus amount in USD
 * @returns {string} returns.surplus_percentage - Surplus as percentage
 */
export function calculateSurplus(
  intent: IGSIntent,
  solution: { promised_outputs: Array<{ amount: string }> }
): {
  surplus_usd: string;
  surplus_percentage: string;
} {
  const benchmarkValue = parseFloat(
    intent.operation.expected_outcome?.expected_outputs?.[0]?.amount ?? '0'
  );
  const solutionValue = parseFloat(solution.promised_outputs?.[0]?.amount ?? '0');
  
  const surplus = solutionValue - benchmarkValue;
  const surplusPercentage = (surplus / benchmarkValue) * 100;

  return {
    surplus_usd: surplus.toString(),
    surplus_percentage: surplusPercentage.toString()
  };
}
