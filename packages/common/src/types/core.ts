/**
 * ============================================================================
 * CORE TYPES - Common types for Intenus system
 * ============================================================================
 */

import { IGSValidationError } from "./igs";
/**
 * ============================================================================
 * INTENT
 * ============================================================================
 */
export interface Intent {
  id: string;
  user_address: string;
  created_ms: number;
  blob_id: string;
  policy: {
    solver_access_window: {
      start_ms: number;
      end_ms: number;
    };
    auto_revoke_time: number;
    access_condition: {
      requires_solver_registration: boolean;
      min_solver_stake: number;
      requires_attestation: boolean;
      expected_measurement: string[];
      purpose: string[];
    };
  };
  status: number;
  best_solution_id: string;
  pending_solutions: string[];
}


/**
 * ============================================================================
 * SOLUTION SUBMISSION
 * ============================================================================
 */

/** Solution submitted by solver (on-chain reference) */
export interface SolutionSubmission {
  /** Unique solution ID (from on-chain object) */
  solution_id: string;
  /** Intent ID this solution is for */
  intent_id: string;
  /** Solver's address */
  solver_address: string;
  /** Submission timestamp */
  submitted_at: number;
  /** PTB transaction bytes reference (fetched from on-chain when needed) */
  blob_id?: string;
}

/**
 * ============================================================================
 * INTENT CLASSIFICATION
 * ============================================================================
 */

/**
 * Intent classifier result - deep analysis beyond intent.type
 */
export interface IntentClassification {
  /** Primary intent category detected */
  primary_category:
    | "swap"
    | "limit_order"
    | "complex_defi"
    | "arbitrage"
    | "other";
  /** Sub-category for fine-grained classification */
  sub_category?: string;
  /** User priority detected from constraints and preferences */
  detected_priority: "speed" | "cost" | "output" | "balanced";
  /** Complexity level based on constraints and routing */
  complexity_level: "simple" | "moderate" | "complex";
  /** Risk level assessment */
  risk_level: "low" | "medium" | "high";
  /** Confidence in classification (0-1) */
  confidence: number;
  /** Classification metadata */
  metadata: {
    /** Classification method used */
    method: "rule_based" | "ml_model" | "hybrid";
    /** Model version (if ML used) */
    model_version?: string;
    /** Features used in classification */
    features_used?: string[];
  };
}

/**
 * ============================================================================
 * PRE-RANKING ENGINE
 * ============================================================================
 */

/** PreRanking result - validation, classification, and feature extraction */
export interface PreRankingResult {
  /** Intent ID being processed */
  intent_id: string;

  /** Intent classification result */
  intent_classification: IntentClassification;

  /** Solution IDs that passed validation */
  passed_solution_ids: string[];

  /** Solution IDs that failed with reasons */
  failed_solution_ids: Array<{
    solution_id: string;
    failure_reason: string;
    errors: IGSValidationError[];
  }>;

  /** Feature vectors for passed solutions (for ranking) */
  feature_vectors: Array<{
    solution_id: string;
    features: {
      /** Surplus metrics */
      surplus_usd: number;
      surplus_percentage: number;
      /** Cost metrics */
      gas_cost: number;
      protocol_fees: number;
      total_cost: number;
      /** Complexity metrics */
      total_hops: number;
      protocols_count: number;
      /** Execution metrics */
      estimated_execution_time?: number;
      /** Solver reputation */
      solver_reputation_score?: number;
      solver_success_rate?: number;
    };
  }>;

  /** Dry-run simulation results (raw data from Sui simulation) */
  dry_run_results: Array<{
    solution_id: string;
    result: any; // Raw simulation result, structure TBD by simulation service
  }>;

  /** Processing statistics */
  stats: {
    total_submitted: number;
    passed: number;
    failed: number;
    dry_run_executed: number;
    dry_run_successful: number;
  };

  /** Processing timestamp */
  processed_at: number;
}

/**
 * ============================================================================
 * RANKING ENGINE
 * ============================================================================
 */

/** Ranked solution with scoring and explanation */
export interface RankedSolution {
  /** Ranking position (1 = best) */
  rank: number;
  /** Overall score (0-100) */
  score: number;
  /** Solution ID (reference to on-chain submission) */
  solution_id: string;
  /** Solver address */
  solver_address: string;
  /** Detailed scoring breakdown */
  score_breakdown: {
    surplus_score: number;
    cost_score: number;
    speed_score: number;
    reputation_score: number;
  };
  /** Explanation and reasoning */
  reasoning: {
    primary_reason: string;
    secondary_reasons: string[];
    risk_assessment: "low" | "medium" | "high";
    confidence_level: number;
  };
  /** Personalization applied */
  personalization_applied: boolean;
  user_fit_score?: number;
  /** Warnings about this solution */
  warnings: string[];
  /** Ranking expiration timestamp */
  expires_at: number;
}

/** Ranking engine result - final ranked solutions */
export interface RankingResult {
  /** Intent ID this ranking is for */
  intent_id: string;
  /** Ranked solutions (1 for best_solution, N for top_n_with_best_incentive) */
  ranked_solutions: RankedSolution[];
  /**
   * Best solution (always receives incentive/fee)
   * Even in top_n mode, only this solution gets the reward
   */
  best_solution: RankedSolution;
  /** Ranking metadata */
  metadata: {
    /** Total solutions considered */
    total_solutions: number;
    /** Average score across all solutions */
    average_score: number;
    /** Ranking strategy used (based on intent classification) */
    strategy: string;
    /** Strategy version/identifier */
    strategy_version: string;
    /** Intent classification that determined strategy */
    intent_category: string;
  };
  /** Ranking timestamp */
  ranked_at: number;
  /** Ranking expiration timestamp */
  expires_at: number;
}
