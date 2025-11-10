# @intenus/walrus

**Walrus storage wrapper** for the Intenus Protocol. Provides structured storage utilities with AI infrastructure standards.

## 📦 Installation

```bash
npm install @intenus/walrus @mysten/walrus @mysten/sui
```

## 🎯 Purpose

Provides **structured storage services** for Intenus Protocol data on Walrus. Implements SOLID principles with design patterns (Strategy, Builder, Facade) for production-ready AI infrastructure.

## 🚀 Quick Start

### Basic Usage

```typescript
import { IntenusWalrusClient } from '@intenus/walrus';

const client = new IntenusWalrusClient({
  network: 'testnet',
});

// Store batch manifest
const manifest = {
  batch_id: 'batch_12345',
  epoch: 1000,
  intent_count: 100,
  intents: [/* ... */],
  categories: { swap: 80, lending: 20 },
  estimated_value_usd: 50000,
  solver_deadline: Date.now() + 5000,
  created_at: Date.now(),
  requirements: {
    min_tee_verification: true,
    min_stake_required: '1000000000000',
    max_solutions_per_solver: 1,
  },
};

const result = await client.batches.storeManifest(manifest);
console.log('Stored:', result.blob_id);

// Fetch batch manifest
const fetchedManifest = await client.batches.fetchManifest(1000);
```

### Advanced Usage

```typescript
// Archive operations
const archive = {
  batch_id: 'batch_12345',
  epoch: 1000,
  intent_manifest_ref: result.blob_id,
  solutions: [/* ... */],
  executions: [/* ... */],
  winning_solution_id: 'solution_abc',
  ml_features: {
    avg_surplus_claimed: 0.85,
    avg_surplus_actual: 0.82,
    accuracy_score: 0.96,
    solver_diversity: 5,
    category_distribution: { swap: 80, lending: 20 },
  },
  timestamp: Date.now(),
  version: '1.0.0',
};

await client.archives.storeArchive(archive);

// User history
const history = {
  user_address: '0x123...',
  preferred_protocols: ['FlowX', 'Scallop'],
  preferred_categories: ['swap'],
  avg_intent_value_usd: 1000,
  risk_tolerance: 0.3,
  total_intents: 50,
  execution_rate: 0.8,
  avg_time_to_execute_ms: 5000,
  avg_surplus_received_usd: 0.85,
  avg_gas_paid: 0.02,
  last_updated: Date.now(),
  version: '1.0.0',
};

await client.users.storeHistory(history);

// Training data
const features = Buffer.from(/* Parquet data */);
const labels = Buffer.from(/* Parquet data */);

await client.training.storeDataset('v1.0.0', features, labels, {
  batch_count: 1000,
  intent_count: 100000,
  execution_count: 80000,
  feature_columns: ['surplus', 'gas', 'slippage'],
  label_columns: ['quality_score'],
});

// ML models
const modelBuffer = Buffer.from(/* ONNX model */);

await client.training.storeModel('user_preference', 'v1.0.0', modelBuffer, {
  model_type: 'user_preference',
  framework: 'pytorch',
  training_dataset_version: 'v1.0.0',
  metrics: { accuracy: 0.92, precision: 0.89 },
  config: { input_shape: [128], output_shape: [1] },
});
```

## 🏗️ Architecture

### Storage Structure (AI Infra Standard)

```
/batches/{epoch}/
  └── batch_manifest.json        # BatchManifest (ALL intents inline)

/archives/{epoch}/
  └── batch_{batch_id}.json      # BatchArchive (outcomes + ML features)

/users/{address}/
  └── history_aggregated.json    # UserHistoryAggregated (preferences)

/training/
  ├── datasets/{version}/
  │   ├── dataset_metadata.json  # TrainingDataset metadata
  │   ├── features.parquet       # ML training features
  │   └── labels.parquet         # ML training labels
  └── models/{name}/{version}/
      ├── model.onnx             # Trained model
      └── model_metadata.json    # Model info (metrics, config)
```

### Services (Strategy Pattern)

- **BatchStorageService** - Batch manifest operations
- **ArchiveStorageService** - Historical batch archives
- **UserStorageService** - User behavior and preferences
- **TrainingStorageService** - ML datasets and models

### Path Builder (Builder Pattern)

```typescript
import { StoragePathBuilder } from '@intenus/walrus';

// Type-safe path construction
const batchPath = StoragePathBuilder.build('batchManifest', 123);
const archivePath = StoragePathBuilder.build('batchArchive', 123, 'batch_id');
const userPath = StoragePathBuilder.build('userHistory', '0x123...');
```

## 📚 API Reference

### IntenusWalrusClient

```typescript
class IntenusWalrusClient {
  constructor(config: IntenusWalrusConfig);
  
  // Services
  readonly batches: BatchStorageService;
  readonly archives: ArchiveStorageService;
  readonly users: UserStorageService;
  readonly training: TrainingStorageService;
  
  // Low-level methods
  storeRaw(path: string, data: Buffer, epochs: number): Promise<StorageResult>;
  fetchRaw(path: string): Promise<Buffer>;
  exists(path: string): Promise<boolean>;
  
  // Direct access
  getWalrusClient(): WalrusClient;
  reset(): void;
}
```

### Configuration

```typescript
interface IntenusWalrusConfig {
  network: 'mainnet' | 'testnet' | 'devnet';
  publisherUrl?: string;      // Optional custom publisher
  aggregatorUrl?: string;     // Optional custom aggregator
  defaultEpochs?: number;     // Default storage epochs
}
```

### Storage Result

```typescript
interface StorageResult {
  blob_id: string;           // Walrus blob ID
  path: string;              // Storage path
  size_bytes: number;        // Data size
  created_at: number;        // Timestamp
  epochs: number;            // Storage duration
}
```

## 🔧 Direct Walrus Access

When you need functionality not provided by the wrapper:

```typescript
// Get underlying Walrus client
const walrusClient = client.getWalrusClient();

// Use Walrus SDK directly
const blob = await walrusClient.writeBlob({
  blob: new Uint8Array(data),
  deletable: true,
  epochs: 5,
  signer: mySigner,
});

// Read blob directly
const data = await walrusClient.readBlob({ blobId: 'blob_id' });
```

## 📊 Data Types

### Batch Types

```typescript
interface BatchManifest {
  batch_id: string;
  epoch: number;
  intent_count: number;
  intents: BatchIntent[];           // All intents inline
  categories: Record<string, number>;
  estimated_value_usd: number;
  solver_deadline: number;
  created_at: number;
  requirements: {
    min_tee_verification: boolean;
    min_stake_required: string;
    max_solutions_per_solver: number;
  };
}
```

### Archive Types

```typescript
interface BatchArchive {
  batch_id: string;
  epoch: number;
  intent_manifest_ref: string;      // Reference to BatchManifest
  solutions: ArchivedSolution[];
  executions: ExecutionOutcome[];
  winning_solution_id: string | null;
  ml_features: MLFeatures;          // For AI training
  timestamp: number;
  version: string;
}
```

### Training Types

```typescript
interface TrainingDatasetMetadata {
  version: string;
  created_at: number;
  batch_count: number;
  intent_count: number;
  execution_count: number;
  features_blob_id: string;         // Parquet data
  labels_blob_id: string;           // Parquet data
  schema_version: string;
  feature_columns: string[];
  label_columns: string[];
}

interface ModelMetadata {
  name: string;
  version: string;
  model_type: string;               // "user_preference", "solution_ranker"
  framework: string;                // "pytorch", "tensorflow"
  model_blob_id: string;            // ONNX model file
  training_dataset_version: string;
  metrics: Record<string, number>;  // accuracy, precision, etc.
  config: {
    input_shape: number[];
    output_shape: number[];
    hyperparameters?: Record<string, any>;
  };
}
```

## ⚠️ Important Notes

1. **Direct Walrus integration** - No SDK wrapping, uses `@mysten/walrus` directly
2. **SOLID principles** - Strategy pattern for services, Builder for paths, Facade for client
3. **AI infrastructure standard** - Structured storage for ML training and inference
4. **Production ready** - Comprehensive error handling and type safety
5. **Flexible architecture** - Can bypass wrapper for direct Walrus access

## 🔗 Related Packages

- [`@intenus/common`](../common) - Shared type definitions
- [`@intenus/solver-sdk`](../solver-sdk) - Solver development utilities
- [`@intenus/client-sdk`](../client-sdk) - Client application helpers

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
