/**
 * Archive storage types for Intenus Protocol
 */

export interface ArchivedSolution {
  solution_id: string;
  solver_address: string;
  claimed_surplus_usd: string;
  estimated_gas: string;
  estimated_slippage_bps: number;
  strategy_summary?: {
    p2p_matches: number;
    protocol_routes: string[];
  };
}

export interface ExecutionOutcome {
  solution_id: string;
  tx_digest: string;
  actual_surplus_usd: string;
  actual_gas_used: string;
  actual_slippage_bps: number;
  success: boolean;
  user_rating?: number;
  execution_time_ms: number;
}

export interface MLFeatures {
  avg_surplus_claimed: number;
  avg_surplus_actual: number;
  accuracy_score: number;
  solver_diversity: number;
  category_distribution: Record<string, number>;
}

export interface BatchArchive {
  batch_id: string;
  epoch: number;
  
  // Reference to original manifest
  intent_manifest_ref: string;      // Walrus blob ID
  
  // Solutions submitted
  solutions: ArchivedSolution[];
  
  // Actual execution outcomes
  executions: ExecutionOutcome[];
  
  // Winner info
  winning_solution_id: string | null;
  
  // ML features for training
  ml_features: MLFeatures;
  
  // Metadata
  timestamp: number;
  version: string;                  // Schema version
}
