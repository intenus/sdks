# Intenus Walrus SDK

TypeScript SDK for decentralized storage on Walrus, designed for Intenus Protocol (IGS intents, solutions, and ML datasets).

## Features

- **Simple Blob Storage**: IGS intents and solutions stored as single JSON blobs
- **Multi-File Quilt Storage**: ML dataset versions with metadata, weights, samples, and feedback
- **Builder Pattern**: Fluent API for constructing dataset version packages
- **Type Safety**: Full TypeScript support with IGS schema types from `@intenus/common`
- **Automatic Retry**: Built-in fetch retry logic with exponential backoff
- **Official Walrus SDK**: Uses `@mysten/walrus` WalrusFile API for optimal efficiency

## Installation

```bash
npm install @intenus/walrus @mysten/walrus @mysten/sui
```

## Quick Start

```typescript
import { IntenusWalrusClient } from '@intenus/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new IntenusWalrusClient({
  network: 'testnet'
});

const signer = Ed25519Keypair.generate();
```

## Intent Storage

Store and fetch IGS intents as simple blobs.

```typescript
import type { Intent as IGSIntent } from '@intenus/common';

// Store intent
const intent: IGSIntent = {
  intent_id: 'intent_123',
  intent_type: 'spot_trade',
  // ... other IGS fields
};

const result = await client.intents.store(intent, 1, signer);
console.log('Stored:', result.blob_id);
// Returns: { blob_id: "xyz...", size_bytes: 1234, created_at: 1234567890, epochs: 1 }

// Fetch intent
const fetchedIntent = await client.intents.fetch(result.blob_id);
```

## Solution Storage

Store and fetch IGS solutions as simple blobs.

```typescript
import type { IGSSolution } from '@intenus/common';

// Store solution
const solution: IGSSolution = {
  solution_id: 'sol_456',
  intent_id: 'intent_123',
  // ... other IGS fields
};

const result = await client.solutions.store(solution, 1, signer);

// Fetch solution
const fetchedSolution = await client.solutions.fetch(result.blob_id);
```

## Dataset Storage (ML Training Data)

Store ML dataset versions as multi-file quilts using the builder pattern.

### Creating a Dataset Version

```typescript
import type { ModelMetadata, IntentClassificationTrainingData, ClassificationFeedback } from '@intenus/common';

// Create builder
const builder = client.datasets.createVersion('v1.0.0');

// Add metadata
const metadata: ModelMetadata = {
  model_id: 'intent_classifier_v1',
  model_version: 'v1.0.0',
  architecture: {
    type: 'gradient_boosting',
    hyperparameters: { n_estimators: 100, max_depth: 6 }
  },
  training: {
    dataset_version: 'v1.0.0',
    total_samples: 1000,
    training_samples: 800,
    validation_samples: 200,
    trained_at: Date.now()
  },
  metrics: {
    accuracy: 0.92,
    precision: 0.91,
    recall: 0.93,
    f1_score: 0.92,
    per_class_metrics: []
  },
  feature_importance: [],
  artifacts: {
    model_weights_ref: 'weights.pkl',
    scaler_ref: null,
    encoder_ref: null
  },
  status: 'deployed'
};

builder.withMetadata(metadata);

// Add model weights (pickle binary)
const weightsBuffer = Buffer.from(/* ... model weights ... */);
builder.withWeights(weightsBuffer);

// Add training samples (JSONL)
const samples: IntentClassificationTrainingData[] = [
  {
    sample_id: 'sample_1',
    intent_metadata: { intent_id: 'intent_1', intent_type: 'spot_trade', created_at: 1234567890 },
    raw_features: {
      solver_window_ms: 5000,
      max_slippage_bps: 50,
      optimization_goal: 'maximize_output',
      // ... other features
    },
    ground_truth: {
      label_value: 'spot_trade',
      confidence: 1.0,
      labeling_method: 'ground_truth',
      labeled_at: 1234567890
    },
    label_info: {
      labeling_method: 'ground_truth',
      labeled_by: 'system',
      labeled_at: 1234567890
    },
    dataset_version: 'v1.0.0'
  }
];
builder.withTrainingSamples(samples);

// Add feedback data (JSONL)
const feedback: ClassificationFeedback[] = [
  {
    feedback_id: 'fb_1',
    intent_id: 'intent_1',
    predicted_type: 'spot_trade',
    actual_type: 'spot_trade',
    confidence: 0.95,
    correct: true,
    feedback_source: 'execution_outcome',
    timestamp: 1234567890
  }
];
builder.withFeedback(feedback);

// Store as quilt (multi-file package)
const result = await client.datasets.storeVersion(builder, 5, signer);
console.log('Stored:', result.quilt_id, 'Files:', result.files);
// Returns: {
//   blob_id: "xyz...",
//   quilt_id: "xyz...",
//   size_bytes: 50000,
//   files: ["metadata.json", "weights.pkl", "training_samples.jsonl", "feedback.jsonl"],
//   created_at: 1234567890,
//   epochs: 5
// }
```

### Fetching Dataset Components

```typescript
// Fetch metadata
const metadata = await client.datasets.fetchMetadata(quilt_id);

// Fetch model weights
const weights = await client.datasets.fetchWeights(quilt_id);

// Fetch training samples
const samples = await client.datasets.fetchTrainingSamples(quilt_id);

// Fetch feedback
const feedback = await client.datasets.fetchFeedback(quilt_id);

// List all files in dataset version
const files = await client.datasets.listFiles(quilt_id);
// Returns: ["metadata.json", "weights.pkl", "training_samples.jsonl", "feedback.jsonl"]
```

## Storage Architecture

### Blob Storage (Intents & Solutions)
- Single JSON object per blob
- Direct access via `blob_id`
- Fast write/read operations
- Used for: IGSIntent, IGSSolution

### Quilt Storage (Dataset Versions)
- Multiple files bundled into one quilt
- Single `quilt_id` for entire package
- Files accessed by identifier within quilt
- Used for: ML dataset versions

**Dataset Version Structure:**
```
quilt_id/
├── metadata.json           # ModelMetadata
├── weights.pkl            # Model weights (binary)
├── training_samples.jsonl # Training data (line-delimited JSON)
└── feedback.jsonl         # Feedback data (line-delimited JSON)
```

## Raw Storage (Advanced)

For custom use cases, use raw blob storage:

```typescript
// Store raw data
const data = Buffer.from('custom data');
const result = await client.storeRaw(data, 1, signer);

// Fetch raw data
const fetched = await client.fetchRaw(result.blob_id);

// Check if blob exists
const exists = await client.exists(result.blob_id);
```

## Configuration

```typescript
const client = new IntenusWalrusClient({
  network: 'testnet', // or 'mainnet'
  walrusConfig: {
    // Optional: custom Walrus client configuration
    uploadRelay: {
      host: 'https://custom-relay.example.com',
      timeout: 60_000
    }
  }
});
```

## Error Handling

```typescript
import { WalrusStorageError, WalrusFetchError } from '@intenus/walrus';

try {
  await client.intents.store(intent, 1, signer);
} catch (error) {
  if (error instanceof WalrusStorageError) {
    console.error('Storage failed:', error.code, error.message);
  } else if (error instanceof WalrusFetchError) {
    console.error('Fetch failed for blob:', error.blobId, error.message);
  }
}
```

## Type Exports

```typescript
// Services
import type {
  IntentStorageService,
  SolutionStorageService,
  DatasetStorageService,
  DatasetVersionBuilder
} from '@intenus/walrus';

// Types
import type {
  IntenusWalrusConfig,
  StorageResult,
  DatasetVersionResult
} from '@intenus/walrus';

// IGS types (re-exported from @intenus/common)
import type {
  IGSIntent,
  IGSSolution,
  ModelMetadata,
  IntentClassificationTrainingData,
  ClassificationFeedback
} from '@intenus/walrus';
```

## Constants

```typescript
import { DEFAULT_EPOCHS, WALRUS_NETWORKS } from '@intenus/walrus';

console.log(DEFAULT_EPOCHS.INTENT);          // 1 epoch
console.log(DEFAULT_EPOCHS.SOLUTION);        // 1 epoch
console.log(DEFAULT_EPOCHS.DATASET_VERSION); // 5 epochs
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## License

MIT
