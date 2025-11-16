# @intenus/common

Core TypeScript type definitions and JSON schemas for the Intenus Protocol.

## Installation

```bash
npm install @intenus/common
```

## Overview

This package provides:
- **TypeScript Types**: Complete type definitions for IGS (Intenus General Standard), intent classification, and ML datasets
- **JSON Schemas**: JSON Schema (Draft 07) definitions for cross-language compatibility
- **Zero Dependencies**: Lightweight and portable across all environments

## Type Definitions

### IGS (Intenus General Standard)

Core intent and solution types for DeFi operations.

```typescript
import type { IGSIntent, IGSSolution } from '@intenus/common';

const swapIntent: IGSIntent = {
  igs_version: '1.0.0',
  intent_id: 'intent_001',
  user_address: '0x...',
  created_at: Date.now(),
  intent_type: 'swap.exact_input',
  description: 'Swap 100 SUI to USDC',
  operation: {
    mode: 'exact_input',
    inputs: [{
      asset_id: '0x2::sui::SUI',
      asset_info: { symbol: 'SUI', decimals: 9 },
      amount: { type: 'exact', value: '100000000000' }
    }],
    outputs: [{
      asset_id: '0x...::usdc::USDC',
      asset_info: { symbol: 'USDC', decimals: 6 },
      amount: { type: 'exact', value: '300000000' }
    }],
    expected_outcome: { /* benchmark data */ }
  },
  constraints: {
    deadline: Date.now() + 300000,
    max_slippage_bps: 50,
    min_outputs: [{ asset_id: '0x...::usdc::USDC', amount: '298500000' }]
  },
  preferences: { /* optimization preferences */ },
  timing: { /* execution timing */ },
  metadata: { /* additional context */ }
};
```

**Available IGS Types:**
- `IGSIntent` - User intent specification
- `IGSIntentType` - Intent operation types (swap/limit)
- `IGSOperation` - Operation details (inputs/outputs)
- `IGSConstraints` - Hard constraints
- `IGSPreferences` - Soft preferences
- `IGSTiming` - Timing specifications
- `IGSSolution` - Solver-submitted solution
- `IGSValidationResult` - Validation results

### Core Types (PreRanking & Ranking)

Types for the intent classification and solution ranking engines.

```typescript
import type {
  IntentClassification,
  PreRankingResult,
  RankingResult
} from '@intenus/common';

// Intent classification (ML-based)
const classification: IntentClassification = {
  primary_category: 'swap',
  sub_category: 'urgent_swap',
  detected_priority: 'speed',
  complexity_level: 'simple',
  risk_level: 'low',
  confidence: 0.92,
  metadata: {
    method: 'ml_model',
    model_version: 'v1.0.0',
    features_used: ['timing', 'constraints', 'preferences']
  }
};

// PreRanking engine result
const preRanking: PreRankingResult = {
  intent_id: 'intent_001',
  intent_classification: classification,
  passed_solution_ids: ['sol_001', 'sol_002'],
  failed_solution_ids: [],
  feature_vectors: [/* extracted features */],
  dry_run_results: [/* simulation results */],
  stats: { total_submitted: 2, passed: 2, failed: 0 },
  processed_at: Date.now()
};

// Ranking engine result
const ranking: RankingResult = {
  intent_id: 'intent_001',
  ranked_solutions: [/* ranked solutions */],
  best_solution: {
    rank: 1,
    score: 88.5,
    solution_id: 'sol_001',
    solver_address: '0x...',
    score_breakdown: {
      surplus_score: 85,
      cost_score: 90,
      speed_score: 95,
      reputation_score: 85
    },
    reasoning: {
      primary_reason: 'Fastest execution with optimal gas cost',
      secondary_reasons: ['Single hop routing', 'High surplus'],
      risk_assessment: 'low',
      confidence_level: 0.95
    },
    personalization_applied: false,
    warnings: [],
    expires_at: Date.now() + 60000
  },
  metadata: {
    total_solutions: 2,
    average_score: 82.3,
    strategy: 'speed_optimized',
    strategy_version: 'v1.0',
    intent_category: 'swap'
  },
  ranked_at: Date.now(),
  expires_at: Date.now() + 60000
};
```

**Available Core Types:**
- `SolutionSubmission` - Solution reference
- `IntentClassification` - ML-based intent classification
- `PreRankingResult` - PreRanking engine output
- `RankedSolution` - Ranked solution with scores
- `RankingResult` - Final ranking result

### ML Dataset Types

Types for training ML models for intent classification.

```typescript
import type {
  IntentClassificationTrainingData,
  RawFeatures,
  GroundTruthLabel,
  TrainingDatasetMetadata,
  ModelMetadata
} from '@intenus/common';

// Training sample
const trainingSample: IntentClassificationTrainingData = {
  sample_id: 'sample_001',
  intent_metadata: {
    intent_id: 'intent_001',
    intent_type: 'swap.exact_input',
    created_at: Date.now()
  },
  raw_features: {
    solver_window_ms: 5000,
    max_slippage_bps: 50,
    optimization_goal: 'maximize_output',
    surplus_weight: 50,
    gas_cost_weight: 25,
    // ... more features
  },
  ground_truth: {
    primary_category: 'swap',
    sub_category: 'standard_swap',
    detected_priority: 'output',
    complexity_level: 'simple',
    risk_level: 'low'
  },
  label_info: {
    labeling_method: 'expert_manual',
    labeled_by: 'expert_001',
    labeled_at: Date.now(),
    label_confidence: 0.95
  },
  execution_outcome: {
    executed: true,
    chosen_solution_rank: 1,
    actual_metrics: { /* execution metrics */ },
    user_satisfaction: 5
  },
  dataset_version: 'v1.0',
  created_at: Date.now()
};

// Dataset metadata
const datasetMeta: TrainingDatasetMetadata = {
  dataset_id: 'dataset_v1',
  version: 'v1.0',
  composition: {
    synthetic_samples: 5000,
    production_samples: 15000,
    expert_samples: 3000,
    total_samples: 23000
  },
  class_distribution: {
    swap: 15000,
    limit_order: 6000,
    complex_defi: 1500,
    arbitrage: 400,
    other: 100
  },
  // ... more metadata
};
```

**Available Dataset Types:**
- `RawFeatures` - Extracted features from intents
- `GroundTruthLabel` - Classification labels
- `LabelingMetadata` - Labeling information
- `ExecutionOutcome` - Execution feedback
- `IntentClassificationTrainingData` - Complete training sample
- `ClassificationFeedback` - Continuous learning feedback
- `TrainingDatasetMetadata` - Dataset composition
- `ModelMetadata` - ML model metadata
- `ClassificationInference` - Production inference result

## JSON Schemas

For Python, Rust, and other language implementations, JSON Schema definitions are provided:

### IGS Schema

```bash
# Located at: src/schemas/igs-intent-schema.json
# Validates IGSIntent structures
```

### Core Schema

```bash
# Located at: src/schemas/core-schema.json
# Validates IntentClassification, PreRankingResult, RankingResult
```

### Dataset Schema

```bash
# Located at: src/schemas/dataset-schema.json
# Validates ML training data structures
```

**Usage Example (Python):**

```python
import json
import jsonschema

# Load schema
with open('node_modules/@intenus/common/src/schemas/dataset-schema.json') as f:
    schema = json.load(f)

# Validate training sample
sample = {
    "sample_id": "sample_001",
    "intent_metadata": { ... },
    "raw_features": { ... },
    "ground_truth": { ... },
    # ...
}

jsonschema.validate(instance=sample, schema=schema['definitions']['IntentClassificationTrainingData'])
```

## Validation

TypeScript validation utilities for IGS intents:

```typescript
import {
  validateIGS,
  validateIGSIntent,
  isValidIGSIntent,
  parseIGSIntent
} from '@intenus/common';

// Basic validation
const result = validateIGS(intent);
console.log(result.valid); // true/false
console.log(result.errors); // validation errors

// With JSON Schema
const isValid = validateIGSIntent(intent);

// Parse and validate
const parsed = parseIGSIntent(jsonString);
```

## Package Philosophy

**Provides:**
- Complete TypeScript type definitions
- JSON Schema (Draft 07) for cross-language compatibility
- Comprehensive inline documentation
- Zero runtime dependencies

**Does NOT provide:**
- Runtime implementations or business logic
- Network communication or SDKs
- Database or storage abstractions

## Architecture Notes

### Intent Classification Strategy

**Primary:** ML-based classification (production)
- Trained on historical intent patterns
- Continuous learning from execution outcomes
- Fallback to rule-based when confidence < 0.7

**Fallback:** Rule-based classification
- Pattern matching on constraints and preferences
- Used during cold start and low-confidence cases

### ID-Based Architecture

All core types work with IDs (not full objects):
- `PreRankingResult` contains `passed_solution_ids` (not full solutions)
- `RankingResult` contains `solution_id` (not full solution data)
- Engines fetch full data from contracts as needed

This reduces data transfer and keeps results lightweight.

## Related Packages

- [`@intenus/solver-sdk`](../solver-sdk) - Solver development utilities
- [`@intenus/client-sdk`](../client-sdk) - Client application helpers

## License

See repository root for license information.
