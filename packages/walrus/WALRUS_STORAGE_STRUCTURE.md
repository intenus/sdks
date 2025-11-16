# Walrus Storage Structure Specification

This document describes the storage patterns used in the Intenus Walrus SDK.

## Core Design Principles

1. **ID-based access**: All data accessed by `blob_id` or `quilt_id`, no path abstractions
2. **Blob for single objects**: IGS intents and solutions stored as individual JSON blobs
3. **Quilt for multi-file packages**: ML dataset versions bundled with multiple files
4. **Builder pattern**: Fluent API for constructing complex dataset packages
5. **Type safety**: Full TypeScript types aligned with IGS schema from `@intenus/common`

## Storage Patterns

### Pattern 1: Simple Blob Storage

**Use case**: Single JSON objects (intents, solutions)

**Method**: `writeBlob()` → returns `blob_id`

**Structure**:
```
blob_id → single JSON object
```

**Example - IGSIntent**:
```typescript
const intent: IGSIntent = {
  intent_id: 'intent_123',
  intent_type: 'spot_trade',
  user_address: '0x...',
  // ... other IGS fields
};

const result = await client.intents.store(intent, 1, signer);
// result.blob_id: "xyz..."
```

**Retrieval**:
```typescript
const intent = await client.intents.fetch(blob_id);
// Returns: full IGSIntent object
```

**Characteristics**:
- Fast write/read operations
- Direct JSON serialization/deserialization
- No file identifiers or tags
- Optimized for small-to-medium JSON objects (< 1MB)

### Pattern 2: Multi-File Quilt Storage

**Use case**: Dataset versions with multiple files

**Method**: `writeFiles([WalrusFile, ...])` → returns `quilt_id`

**Structure**:
```
quilt_id/
├── file1 (identifier: "metadata.json")
├── file2 (identifier: "weights.pkl")
├── file3 (identifier: "training_samples.jsonl")
└── file4 (identifier: "feedback.jsonl")
```

**Example - Dataset Version**:
```typescript
const builder = client.datasets.createVersion('v1.0.0')
  .withMetadata(metadata)      // → metadata.json
  .withWeights(weightsBuffer)  // → weights.pkl
  .withTrainingSamples(samples) // → training_samples.jsonl
  .withFeedback(feedback);     // → feedback.jsonl

const result = await client.datasets.storeVersion(builder, 5, signer);
// result.quilt_id: "abc..."
// result.files: ["metadata.json", "weights.pkl", "training_samples.jsonl", "feedback.jsonl"]
```

**Retrieval**:
```typescript
// Get blob wrapper
const blob = await client.walrusClient.getBlob({ blobId: quilt_id });

// Get specific file by identifier
const [metadataFile] = await blob.files({ identifiers: ['metadata.json'] });
const metadata = await metadataFile.json();

// Or use convenience methods
const metadata = await client.datasets.fetchMetadata(quilt_id);
const weights = await client.datasets.fetchWeights(quilt_id);
const samples = await client.datasets.fetchTrainingSamples(quilt_id);
```

**Characteristics**:
- Single `quilt_id` for entire package
- Files accessed by identifier within quilt
- Efficient bundling (single certification/storage operation)
- Supports binary files (weights) and text files (JSON/JSONL)

## Data Type Mappings

### IGSIntent → Simple Blob
```typescript
Service: IntentStorageService
Methods: store(intent, epochs, signer) → { blob_id, ... }
         fetch(blob_id) → IGSIntent
Storage: writeBlob() with JSON.stringify()
Format:  Single JSON object
Size:    ~1-10 KB typical
```

### IGSSolution → Simple Blob
```typescript
Service: SolutionStorageService
Methods: store(solution, epochs, signer) → { blob_id, ... }
         fetch(blob_id) → IGSSolution
Storage: writeBlob() with JSON.stringify()
Format:  Single JSON object
Size:    ~5-50 KB typical
```

### Dataset Version → Multi-File Quilt
```typescript
Service: DatasetStorageService
Methods: createVersion(version) → DatasetVersionBuilder
         storeVersion(builder, epochs, signer) → { quilt_id, files, ... }
         fetchMetadata(quilt_id) → ModelMetadata
         fetchWeights(quilt_id) → Buffer
         fetchTrainingSamples(quilt_id) → IntentClassificationTrainingData[]
         fetchFeedback(quilt_id) → ClassificationFeedback[]
         listFiles(quilt_id) → string[]
Storage: writeFiles([WalrusFile, ...])
Format:  4 files per version:
         - metadata.json (JSON)
         - weights.pkl (binary)
         - training_samples.jsonl (line-delimited JSON)
         - feedback.jsonl (line-delimited JSON)
Size:    ~1 MB - 100 MB typical
```

## Dataset Version File Specifications

### 1. metadata.json

**Type**: `ModelMetadata`

**Purpose**: ML model configuration, metrics, and references

**Schema**:
```typescript
{
  model_id: string;                    // Unique model identifier
  model_version: string;               // Semantic version (e.g., "v1.0.0")
  architecture: {
    type: string;                      // e.g., "gradient_boosting"
    hyperparameters: Record<string, any>;
  };
  training: {
    dataset_version: string;           // References this dataset version
    total_samples: number;
    training_samples: number;
    validation_samples: number;
    trained_at: number;                // Unix timestamp (ms)
  };
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    per_class_metrics: Array<{
      class_name: string;
      precision: number;
      recall: number;
      f1_score: number;
      support: number;
    }>;
  };
  feature_importance: Array<{
    feature_name: string;
    importance: number;
    rank: number;
  }>;
  artifacts: {
    model_weights_ref: string | null;  // Reference to weights file
    scaler_ref: string | null;
    encoder_ref: string | null;
  };
  status: 'training' | 'testing' | 'deployed' | 'deprecated';
}
```

**Size**: ~5-20 KB

### 2. weights.pkl

**Type**: Binary (Python pickle format)

**Purpose**: Serialized ML model weights

**Format**: Pickle binary (Python scikit-learn, XGBoost, etc.)

**Size**: ~100 KB - 10 MB (depends on model complexity)

### 3. training_samples.jsonl

**Type**: `IntentClassificationTrainingData[]` (JSONL format)

**Purpose**: Training data with features and ground truth labels

**Format**: Line-delimited JSON (one sample per line)

**Schema per line**:
```typescript
{
  sample_id: string;
  intent_metadata: {
    intent_id: string;
    intent_type: string;
    created_at: number;
  };
  raw_features: RawFeatures;          // Feature vector for ML
  ground_truth: GroundTruthLabel;     // True label
  label_info: LabelingMetadata;       // Who/when labeled
  execution_outcome?: ExecutionOutcome;
  dataset_version: string;
}
```

**Size**: ~1 MB - 50 MB (depends on sample count)

### 4. feedback.jsonl

**Type**: `ClassificationFeedback[]` (JSONL format)

**Purpose**: Prediction feedback for model evaluation

**Format**: Line-delimited JSON (one feedback entry per line)

**Schema per line**:
```typescript
{
  feedback_id: string;
  intent_id: string;
  predicted_type: string;
  actual_type: string;
  confidence: number;
  correct: boolean;
  feedback_source: 'user_correction' | 'execution_outcome' | 'solver_feedback';
  timestamp: number;
}
```

**Size**: ~100 KB - 10 MB (depends on feedback count)

## ID-Based Architecture

### No Path Abstractions

**Previous (path-based)**:
```typescript
// ❌ Old approach (removed)
const path = `/training/datasets/${version}/metadata.json`;
const data = await client.fetch(path);
```

**Current (ID-based)**:
```typescript
// ✅ New approach (current)
const quilt_id = "xyz...";  // From storeVersion() result
const metadata = await client.datasets.fetchMetadata(quilt_id);
```

### Why ID-Based?

1. **Direct Walrus API mapping**: Walrus uses `blob_id` and `quilt_id` natively
2. **No path resolution overhead**: Direct blob/quilt access
3. **Simpler contract integration**: Smart contracts store blob_id/quilt_id directly
4. **Type safety**: TypeScript enforces blob_id/quilt_id strings, not arbitrary paths
5. **Cross-language compatibility**: IDs work in Python, Rust, Move without path parsing

## Storage Result Types

### StorageResult (Blob)
```typescript
{
  blob_id: string;        // Walrus blob identifier
  size_bytes: number;     // Total size in bytes
  created_at: number;     // Unix timestamp (ms)
  epochs: number;         // Storage duration
}
```

### DatasetVersionResult (Quilt)
```typescript
{
  blob_id: string;        // Same as quilt_id
  quilt_id: string;       // Walrus quilt identifier
  size_bytes: number;     // Total size of all files
  files: string[];        // File identifiers in quilt
  created_at: number;     // Unix timestamp (ms)
  epochs: number;         // Storage duration
}
```

## Builder Pattern Implementation

### Why Builder Pattern for Datasets?

1. **Fluent API**: Clear, readable construction of complex packages
2. **Type safety**: Each method enforces correct types
3. **Flexibility**: Optional files (e.g., can skip feedback if not available)
4. **Encapsulation**: Hides WalrusFile creation complexity

### Builder Usage
```typescript
const builder = client.datasets.createVersion('v1.0.0');

// Required
builder.withMetadata(metadata);

// Optional
builder.withWeights(weightsBuffer);
builder.withTrainingSamples(samples);
builder.withFeedback(feedback);

// Build returns WalrusFile[] ready for upload
const walrusFiles = builder.build();
```

### Builder Internals
```typescript
class DatasetVersionBuilder {
  private files: Map<string, Uint8Array> = new Map();

  withMetadata(metadata: ModelMetadata): this {
    const json = JSON.stringify(metadata);
    this.files.set('metadata.json', new Uint8Array(Buffer.from(json)));
    return this;
  }

  build(): WalrusFile[] {
    return Array.from(this.files.entries()).map(([filename, content]) =>
      WalrusFile.from({
        contents: content,
        identifier: filename
      })
    );
  }
}
```

## Retry Logic

### Fetch Retry (Built-in)

Intent and solution fetching includes automatic retry with exponential backoff:

```typescript
async fetchRaw(blobId: string): Promise<Buffer> {
  const maxRetries = 5;
  const baseDelay = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await this.walrusClient.readBlob({ blobId });
      return Buffer.from(data);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = baseDelay * attempt;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Retry schedule**: 5s, 10s, 15s, 20s, 25s (total: 75s max)

### No Retry for Writes

Write operations (`store()`, `storeVersion()`) do NOT automatically retry. Let the application decide retry strategy based on:
- Network conditions
- Cost constraints (storage fees)
- Transaction timeout requirements

## Error Handling

### WalrusStorageError

Thrown on storage failures (write operations):

```typescript
class WalrusStorageError extends Error {
  code: string;  // Error code (e.g., "RAW_STORE_ERROR")
}
```

### WalrusFetchError

Thrown on fetch failures after all retries exhausted:

```typescript
class WalrusFetchError extends Error {
  blobId: string;  // The blob_id that failed to fetch
}
```

## Performance Considerations

### Blob vs Quilt Trade-offs

**Blob (Intents/Solutions)**:
- ✅ Fast single-object access
- ✅ Minimal overhead
- ✅ Simple JSON serialization
- ❌ Not suitable for multiple files

**Quilt (Dataset Versions)**:
- ✅ Single storage/certification cost for multiple files
- ✅ Atomic versioning (all files together)
- ✅ Supports mixed file types (JSON, binary, JSONL)
- ⚠️ Slightly higher read overhead (must access quilt wrapper first)

### Recommended Epochs

```typescript
DEFAULT_EPOCHS = {
  INTENT: 1,           // Short-term (intents processed quickly)
  SOLUTION: 1,         // Short-term (solutions ephemeral)
  DATASET_VERSION: 5,  // Long-term (ML models reused)
}
```

Adjust based on:
- Data importance
- Storage cost budget
- Access frequency
- Regulatory requirements

## Integration with IGS Contracts

### Storing Intent Reference

```move
// Sui Move contract
public struct IntentRecord {
    intent_id: ID,
    walrus_blob_id: String,  // Store blob_id here
    created_at: u64,
    status: u8
}
```

### Storing Dataset Version Reference

```move
// Sui Move contract
public struct ModelDeployment {
    model_id: ID,
    version: String,
    walrus_quilt_id: String,  // Store quilt_id here
    deployed_at: u64,
    status: u8
}
```

## Future Considerations

### Compression

Consider adding gzip compression for JSONL files:
- `training_samples.jsonl.gz`
- `feedback.jsonl.gz`

Trade-off: CPU time vs storage cost

### Encryption

For private training data, consider client-side encryption:
- Encrypt before `builder.withTrainingSamples()`
- Store encryption metadata in `metadata.json`
- Decrypt after `client.datasets.fetchTrainingSamples()`

### Sharding

For very large datasets (>100 MB), consider sharding:
- Multiple quilt versions: `v1.0.0-shard-0`, `v1.0.0-shard-1`, etc.
- Store shard references in `metadata.json`
- Application-level reassembly

---

**Last updated**: 2025-11-16
**Version**: 1.0.0
**Status**: Current specification
