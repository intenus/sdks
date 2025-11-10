/**
 * Solution submission from solver
 */
export interface SolutionSubmission {
  solution_id: string;
  batch_id: string;
  solver_address: string;
  ptb_hash: string;
  walrus_blob_id: string;
  outcomes: SolutionOutcome[];
  total_surplus_usd: string;
  estimated_gas: string;
  estimated_slippage_bps: number;
  strategy_summary?: StrategySummary;
  tee_attestation?: TEEAttestation;
  submitted_at: number;
}

export interface SolutionOutcome {
  intent_id: string;
  expected_output: {
    asset_id: string;
    amount: string;
  }[];
  surplus_claimed: string;
  execution_path: string;
}

export interface StrategySummary {
  p2p_matches: number;
  protocol_routes: string[];
  unique_techniques?: string;
}

export interface TEEAttestation {
  enclave_measurement: string;
  input_hash: string;
  output_hash: string;
  timestamp: number;
  signature: string;
  verification_key: string;
}

/**
 * Ranked PTB from AI Router (for users)
 */
export interface RankedPTB {
  rank: number;
  solution_id: string;
  solver_address: string;
  ptb_bytes: string;
  ptb_hash: string;
  score: number;
  expected_outcomes: ExpectedOutcome[];
  total_surplus_usd: string;
  estimated_gas: string;
  estimated_slippage_bps: number;
  execution_summary: ExecutionSummary;
  why_ranked: Explanation;
  personalization_applied: boolean;
  risk_score: number;
  warnings: string[];
  estimated_execution_time_ms: number;
  expires_at: number;
}

export interface ExpectedOutcome {
  intent_id: string;
  outputs: {
    asset_id: string;
    amount: string;
  }[];
  surplus_usd: string;
}

export interface ExecutionSummary {
  total_steps: number;
  protocols_used: string[];
  p2p_matches: number;
  avg_hops: number;
}

export interface Explanation {
  primary_reason: string;
  secondary_reasons: string[];
}
