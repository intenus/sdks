/**
 * Core intent structure (canonical format from NLP parser)
 * This is the ONLY source of truth for intent types
 */
export interface Intent {
  intent_id: string;
  user_address: string;
  timestamp: number;
  category: string;
  action: {
    type: string;
    params: Record<string, unknown>;
  };
  assets: {
    inputs: AssetSpec[];
    outputs: AssetSpec[];
  };
  constraints: Constraints;
  execution: ExecutionPreferences;
  metadata: IntentMetadata;
}

export interface AssetSpec {
  asset_id: string;
  chain_id?: string;
  amount?: string;
  amount_range?: {
    min: string;
    max: string;
  };
}

export interface Constraints {
  max_slippage_bps?: number;
  max_price_impact_bps?: number;
  deadline_ms?: number;
  min_output?: Record<string, string>;
  max_input?: Record<string, string>;
  custom_constraints?: Record<string, unknown>;
}

export interface ExecutionPreferences {
  urgency: 'low' | 'normal' | 'high';
  privacy_level: 'public' | 'private';
  routing_hints?: string[];
  max_hops?: number;
}

export interface IntentMetadata {
  language: string;
  confidence: number;
  clarifications?: string[];
}
