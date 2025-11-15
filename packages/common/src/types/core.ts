/**
 * ============================================================================
 * SOLUTION FORMAT — what solvers submit (PTBs with promised outcomes)
 * ============================================================================
 */

import { IGSExecutionMode, IGSValidationError } from "./igs";

/**
 * Solution ranked and scored by AI router
 * @interface RankedSolution
 */
export interface RankedSolution {
  /** Ranking position (1 = best) */
  rank: number;
  /** Confidence score (0-100) */
  score: number;
  /** The underlying solution */
  solution: SolutionSubmission;
  /** AI reasoning and explanation */
  reasoning: {
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
 * ============================================================================
 * PRE-RANKING ENGINE — validation + simulation + feature extraction
 * ============================================================================
 */

/**
 * PreRankingEngine result - validates and prepares solutions for ranking
 * @interface PreRankingResult
 */
export interface PreRankingResult {
  /** Solutions that passed pre-ranking validation */
  passed_solutions: SolutionSubmission[];
  /** Solutions that failed pre-ranking */
  failed_solutions: Array<{
    solution: SolutionSubmission;
    failure_reason: string;
    errors: IGSValidationError[];
  }>;
  /** Feature vectors for ranking (using ML) */
  feature_vectors: Array<{
    solution_id: string;
    features: {
      /** Surplus metrics */
      surplus_usd: number;
      surplus_percentage: number;
      /** Cost metrics */
      gas_cost: number;
      protocol_fees: number;
      /** Complexity metrics */
      total_hops: number;
      protocols_count: number;
      /** Simulation metrics (from dry run) */
      simulated_gas_used?: number;
      simulation_success: boolean;
      /** Solver reputation */
      solver_reputation_score?: number;
    };
  }>;
  /** Statistics */
  stats: {
    total_submitted: number;
    passed: number;
    failed: number;
    simulated: number;
  };
  /** Timestamp */
  processed_at: number;
}
/**
 * ============================================================================
 * RANKING ENGINE — AI-powered solution ranking with explanations
 * ============================================================================
 */

/**
 * RankingEngine result - final ranked solutions for user
 * @interface RankingResult
 */
export interface RankingResult {
  /** Intent ID this ranking is for */
  intent_id: string;
  /** Execution mode used */
  mode: IGSExecutionMode;
  /** Ranked solutions (1 for best_solution, N for top_n_with_best_incentive) */
  ranked_solutions: RankedSolution[];
  /**
   * Best solution (for incentive)
   * This solution always receives the fee, even in top_n mode
   */
  best_solution: RankedSolution;
  /** Ranking metadata */
  metadata: {
    /** Total solutions considered */
    total_solutions: number;
    /** Average AI score */
    avg_ai_score: number;
    /** Ranking model version */
    model_version: string;
    /** Ranking strategy used */
    strategy: string;
  };
  /** When this ranking was created */
  ranked_at: number;
  /** When this ranking expires */
  expires_at: number;
}

/**
 * Minimal simulation result placeholder.
 * Downstream projects can extend this interface as needed.
 */
export interface SimulationResult {
  success: boolean;
  gas_used?: number;
  logs?: string[];
}