/**
 * ML Training Dataset Types for Intent Classification
 *
 * Purpose: Store and manage training data for ML-based intent classification
 * Storage: Walrus (off-chain) + Database (metadata/indexing)
 *
 * Flow:
 * - Production intents → RawFeatures extraction → Label (auto/manual) → Training sample
 * - Continuous learning: Execution outcomes → Feedback → Dataset updates → Model retraining
 */

/**
 * Raw features extracted from IGSIntent for ML training
 * Covers spot trading (swap) and limit order scenarios
 */
export interface RawFeatures {
  // === Timing Features ===
  /** Solver submission window (ms) */
  solver_window_ms: number;
  /** User decision timeout (ms) */
  user_decision_timeout_ms: number;
  /** Time until absolute deadline (ms) */
  time_to_deadline_ms: number;
  /** Execution time constraint */
  time_in_force?: 'immediate' | 'good_til_cancel' | 'fill_or_kill';

  // === Constraint Features ===
  /** Maximum slippage tolerance (bps) */
  max_slippage_bps: number;
  /** Maximum gas cost willing to pay (USD equivalent) */
  max_gas_cost_usd?: number;
  /** Maximum routing hops allowed */
  max_hops?: number;
  /** Has protocol whitelist */
  has_whitelist: boolean;
  /** Has protocol blacklist */
  has_blacklist: boolean;
  /** Has limit price constraint */
  has_limit_price: boolean;

  // === Preference Features ===
  /** Primary optimization goal */
  optimization_goal: 'maximize_output' | 'minimize_gas' | 'fastest_execution' | 'balanced';
  /** Surplus optimization weight (0-100) */
  surplus_weight: number;
  /** Gas cost optimization weight (0-100) */
  gas_cost_weight: number;
  /** Execution speed weight (0-100) */
  execution_speed_weight: number;
  /** Solver reputation weight (0-100) */
  reputation_weight: number;
  /** Auto-execute best solution */
  auto_execute: boolean;
  /** Require simulation before execution */
  require_simulation: boolean;

  // === Operation Features ===
  /** Number of input assets */
  input_count: number;
  /** Number of output assets */
  output_count: number;
  /** Input asset types (native/stable/volatile) */
  input_asset_types: Array<'native' | 'stable' | 'volatile'>;
  /** Output asset types */
  output_asset_types: Array<'native' | 'stable' | 'volatile'>;
  /** Total input value (USD) */
  input_value_usd: number;
  /** Expected output value (USD) */
  expected_output_value_usd: number;

  // === Benchmark Features ===
  /** Benchmark source (dex_aggregator/oracle/manual) */
  benchmark_source: string;
  /** Benchmark confidence (0-1) */
  benchmark_confidence: number;
  /** Expected gas estimate (USD) */
  expected_gas_usd: number;
  /** Expected slippage estimate (bps) */
  expected_slippage_bps?: number;

  // === Metadata Features ===
  /** Has NLP-parsed input */
  has_nlp_input: boolean;
  /** NLP parsing confidence (0-1) */
  nlp_confidence?: number;
  /** Client platform (web/mobile/api) */
  client_platform: string;
  /** Number of user-defined tags */
  tag_count: number;
}

/**
 * Ground truth classification labels
 */
export interface GroundTruthLabel {
  /** Primary category */
  primary_category: 'swap' | 'limit_order' | 'complex_defi' | 'arbitrage' | 'other';
  /** Fine-grained sub-category */
  /** Detected user priority */
  detected_priority: 'speed' | 'cost' | 'output' | 'balanced';
  /** Intent complexity level */
  complexity_level: 'simple' | 'moderate' | 'complex';
  /** Risk level */
  risk_level: 'low' | 'medium' | 'high';
}

/**
 * Labeling metadata
 */
export interface LabelingMetadata {
  /** How was this sample labeled */
  labeling_method: 'expert_manual' | 'rule_based' | 'outcome_based' | 'user_feedback' | 'synthetic';
  /** Who/what labeled it (expert ID, rule version, etc) */
  labeled_by: string;
  /** Labeling timestamp */
  labeled_at: number;
  /** Confidence in this label (0-1) */
  label_confidence: number;
  /** Additional notes from labeler */
  notes?: string;
}

/**
 * Execution outcome for feedback loop
 */
export interface ExecutionOutcome {
  /** Was intent successfully executed */
  executed: boolean;
  /** Which solution was chosen (rank) */
  chosen_solution_rank?: number;
  /** Chosen solution ID */
  chosen_solution_id?: string;
  /** Actual execution metrics */
  actual_metrics?: {
    /** Actual output received (USD) */
    actual_output_usd: number;
    /** Actual gas cost (USD) */
    actual_gas_cost_usd: number;
    /** Actual execution time (ms) */
    actual_execution_time_ms: number;
    /** Actual slippage (bps) */
    actual_slippage_bps: number;
  };
  /** User satisfaction rating (1-5) */
  user_satisfaction?: 1 | 2 | 3 | 4 | 5;
  /** Execution timestamp */
  executed_at?: number;
}

/**
 * Complete training sample for intent classification
 */
export interface IntentClassificationTrainingData {
  /** Unique training sample ID */
  sample_id: string;

  /** Intent metadata */
  intent_metadata: {
    /** Original intent ID */
    intent_id: string;
    /** Intent type from schema */
    intent_type: string;
    /** Intent creation timestamp */
    created_at: number;
  };

  /** Extracted features for ML */
  raw_features: RawFeatures;

  /** Ground truth labels */
  ground_truth: GroundTruthLabel;

  /** Labeling information */
  label_info: LabelingMetadata;

  /** Execution outcome (if available) */
  execution_outcome?: ExecutionOutcome;

  /** Dataset version this belongs to */
  dataset_version: string;

  /** Sample creation timestamp */
  created_at: number;

  /** Full intent reference (Walrus blob ID) */
  full_intent_ref?: string;
}

/**
 * Feedback for continuous learning
 */
export interface ClassificationFeedback {
  /** Unique feedback ID */
  feedback_id: string;
  /** Intent ID */
  intent_id: string;

  /** Predicted classification from model */
  predicted_classification: {
    primary_category: string;
    sub_category?: string;
    detected_priority: string;
    complexity_level: string;
    risk_level: string;
    confidence: number;
    model_version: string;
  };

  /** Actual execution outcome */
  actual_outcome: ExecutionOutcome;

  /** Which ranking strategy performed best */
  best_strategy?: string;

  /** Corrected classification (if prediction was wrong) */
  corrected_classification?: GroundTruthLabel;

  /** Feedback source */
  feedback_source: 'execution_outcome' | 'user_explicit' | 'expert_review';

  /** Feedback timestamp */
  created_at: number;
}

/**
 * Training dataset composition and metadata
 */
export interface TrainingDatasetMetadata {
  /** Unique dataset ID */
  dataset_id: string;
  /** Dataset version (e.g., "v1.0", "v1.1") */
  version: string;

  /** Dataset composition */
  composition: {
    /** Synthetic samples count */
    synthetic_samples: number;
    /** Production samples count */
    production_samples: number;
    /** Expert-labeled samples count */
    expert_samples: number;
    /** Total samples */
    total_samples: number;
  };

  /** Data freshness */
  freshness: {
    /** Samples from last 7 days */
    samples_last_7_days: number;
    /** Samples from last 30 days */
    samples_last_30_days: number;
    /** Samples from last 90 days */
    samples_last_90_days: number;
  };

  /** Quality distribution */
  quality: {
    /** High confidence labels (>=0.9) */
    high_confidence: number;
    /** Medium confidence labels (0.7-0.9) */
    medium_confidence: number;
    /** Low confidence labels (<0.7) */
    low_confidence: number;
  };

  /** Class distribution */
  class_distribution: {
    swap: number;
    limit_order: number;
    complex_defi: number;
    arbitrage: number;
    other: number;
  };

  /** Dataset creation timestamp */
  created_at: number;
  /** Last updated timestamp */
  updated_at: number;

  /** Walrus storage reference */
  walrus_blob_id?: string;
}

/**
 * ML model metadata
 */
export interface ModelMetadata {
  /** Unique model ID */
  model_id: string;
  /** Model version (e.g., "v1.0.0") */
  model_version: string;

  /** Model architecture */
  architecture: {
    /** Model type */
    type: 'random_forest' | 'xgboost' | 'neural_network' | 'ensemble';
    /** Hyperparameters */
    hyperparameters: Record<string, any>;
  };

  /** Training information */
  training: {
    /** Dataset version used */
    dataset_version: string;
    /** Training samples count */
    training_samples: number;
    /** Validation samples count */
    validation_samples: number;
    /** Test samples count */
    test_samples: number;
    /** Training start timestamp */
    trained_at: number;
    /** Training duration (ms) */
    training_duration_ms: number;
  };

  /** Performance metrics */
  metrics: {
    /** Overall accuracy */
    accuracy: number;
    /** Precision */
    precision: number;
    /** Recall */
    recall: number;
    /** F1 score */
    f1_score: number;
    /** Per-class metrics */
    per_class_metrics: Record<string, {
      precision: number;
      recall: number;
      f1: number;
      support: number;
    }>;
  };

  /** Feature importance rankings */
  feature_importance: Array<{
    feature_name: string;
    importance: number;
    rank: number;
  }>;

  /** Model artifacts storage */
  artifacts: {
    /** Model weights reference (Walrus/S3) */
    model_weights_ref: string;
    /** Feature scaler reference */
    scaler_ref: string;
    /** Label encoder reference */
    encoder_ref: string;
  };

  /** Deployment status */
  status: 'training' | 'testing' | 'deployed' | 'deprecated';
  /** Deployment timestamp */
  deployed_at?: number;
  /** Deprecation timestamp */
  deprecated_at?: number;
}

/**
 * Model inference result (production usage)
 */
export interface ClassificationInference {
  /** Intent ID */
  intent_id: string;
  /** Model used */
  model_version: string;
  /** Predicted classification */
  prediction: GroundTruthLabel;
  /** Prediction confidence (0-1) */
  confidence: number;
  /** Feature vector used */
  features: RawFeatures;
  /** Inference timestamp */
  inferred_at: number;
  /** Inference latency (ms) */
  latency_ms: number;
}
