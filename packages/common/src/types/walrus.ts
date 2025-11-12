/**
 * Walrus storage types for Intenus Protocol
 * These align with @intenus/walrus SDK data structures
 */

// ===== BATCH MANIFEST =====

export interface BatchIntent {
  intent_id: string;
  user_address: string;
  intent_data: string;              // JSON string (encrypted or plain)
  is_encrypted: boolean;
  seal_policy_id: string | null;
  category: string;
  timestamp: number;
}

export interface BatchManifest {
  batch_id: string;
  epoch: number;
  intent_count: number;
  
  // All intents inline (no separate files)
  intents: BatchIntent[];
  
  // Aggregated metadata
  categories: Record<string, number>;
  estimated_value_usd: number;
  solver_deadline: number;
  created_at: number;
  
  // Solver requirements
  requirements: {
    min_tee_verification: boolean;
    min_stake_required: string;
    max_solutions_per_solver: number;
  };
  
  // Optional reference to a Quilt blob
  quilt_reference?: {
    blob_id: string;
    patches: {
      patchId: string;
      identifier: string;
    }[];
  };
}

// ===== BATCH ARCHIVE =====

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

// ===== USER HISTORY =====

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

// ===== TRAINING DATASET =====

export interface TrainingDatasetMetadata {
  version: string;                  // Semantic version (v1.0.0)
  created_at: number;
  
  // Dataset statistics
  batch_count: number;
  intent_count: number;
  execution_count: number;
  
  // Data references (Parquet files)
  features_blob_id: string;
  labels_blob_id: string;
  
  // Schema info
  schema_version: string;
  feature_columns: string[];
  label_columns: string[];
  
  // Quality metrics
  data_quality_score?: number;
  completeness?: number;
}

// ===== ML MODEL METADATA =====

export interface ModelMetadata {
  name: string;
  version: string;
  created_at: number;
  
  // Model info
  model_type: string;               // "user_preference", "solution_ranker", etc.
  framework: string;                // "pytorch", "tensorflow", etc.
  model_blob_id: string;            // Walrus blob ID of ONNX file
  
  // Training info
  training_dataset_version: string;
  training_duration_ms: number;
  
  // Performance metrics
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    custom_metrics?: Record<string, number>;
  };
  
  // Model config
  config: {
    input_shape: number[];
    output_shape: number[];
    hyperparameters?: Record<string, any>;
  };
}

// ===== STORAGE RESULT =====

export interface StorageResult {
  blob_id: string;
  path: string;
  size_bytes: number;
  created_at: number;
  epochs: number;
}
