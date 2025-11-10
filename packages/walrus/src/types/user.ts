/**
 * User storage types for Intenus Protocol
 */

export interface UserHistoryAggregated {
  user_address: string;
  
  // Preferences (inferred)
  preferred_protocols: string[];
  preferred_categories: string[];
  avg_intent_value_usd: number;
  risk_tolerance: number;           // 0-1
  
  // Behavior metrics
  total_intents: number;
  execution_rate: number;
  avg_time_to_execute_ms: number;
  
  // Performance metrics
  avg_surplus_received_usd: number;
  avg_gas_paid: number;
  
  // Metadata
  last_updated: number;
  version: string;
}
