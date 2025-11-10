/**
 * Training data storage types for Intenus Protocol
 */

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
