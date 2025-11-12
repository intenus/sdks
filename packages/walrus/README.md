# Intenus Walrus SDK

A TypeScript SDK for efficient decentralized storage on Walrus, optimized for Intenus protocol data structures.

## Features

- **WalrusFile API**: Uses official Walrus SDK for optimal storage efficiency
- **Automatic Optimization**: Walrus automatically chooses between single blobs and Quilts
- **Structured Storage**: Organized paths for batches, archives, users, and ML training data
- **Automatic Retry**: Built-in certification retry logic with exponential backoff
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Multi-Service**: Dedicated services for different data types

## Installation

```bash
npm install @intenus/walrus
```

## Quick Start

```typescript
import { IntenusWalrusClient } from '@intenus/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new IntenusWalrusClient({
  network: 'testnet', // or 'mainnet'
  defaultEpochs: 1
});

const signer = Ed25519Keypair.generate();

const manifest = {
  batch_id: 'batch_001',
  epoch: Math.floor(Date.now() / 1000),
  intent_count: 2,
  intents: [/* ... */],
};

const result = await client.batches.storeManifest(manifest, signer);
console.log('Stored:', result.blob_id);
```

## Storage Structure

The SDK organizes data in a structured hierarchy:

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

## 🚀 Query Builder API (Recommended)

The **WalrusQueryBuilder** provides the most flexible and efficient way to access data:

```typescript
// ===== DIRECT ACCESS BY BLOB_ID/QUILT_ID =====

// Get any data type by blob_id (fastest method)
const batch = await client.query.getBatchById("E7_nNXvFU_3qZVu3OH1yycRG7LZlyn1-UxEDCDDqGGU");
const dataset = await client.query.getTrainingDatasetById("rkcHpHQrornOymttgvSq3zvcmQEsMqzmeUM1HSY4ShU");

// ===== OPTIMIZED QUILT ACCESS =====

// Get specific files from quilts by identifier
const features = await client.query.getTrainingFeatures(quiltId, "v1.0.123");
const model = await client.query.getModelFile(quiltId, "user_ranker", "v2.1");

// Get files by tags (multiple results)
const swapIntents = await client.query.getIntentsByCategory(quiltId, "swap");
const jsonFiles = await client.query.getFromQuiltByTags(quiltId, { 
  'content-type': 'application/json' 
});

// List all files in a quilt
const contents = await client.query.listQuiltContents(quiltId);

// ===== FILTERED QUERIES (requires index) =====

// First, add data to index when storing
const result = await client.batches.storeManifest(manifest, signer);
client.query.addBatchToIndex(manifest, result.blob_id);

// Then query by filters
const batches = await client.query.getBatchesBy({
  epoch: 12345,
  intent_count_min: 10,
  categories: ['swap', 'lending']
});

const datasets = await client.query.getTrainingDatasetsBy({
  data_quality_score_min: 0.9,
  batch_count_min: 100
});
```

## Legacy Services

### Batch Service

```typescript
// Store batch manifest
await client.batches.storeManifest(manifest, signer);

// Fetch batch manifest by epoch
const manifest = await client.batches.fetchManifest(epoch);

// Store intents efficiently (Walrus chooses optimal method)
const result = await client.batches.storeIntents(
  intents,
  batchId, 
  signer
);

// Fetch intents by epoch (from manifest structure)
const intentsByEpoch = await client.batches.fetchIntentsByEpoch(epoch);

// Fetch intents by blob ID (direct access)
const intents = await client.batches.fetchIntents(result.blobId);

// Fetch single intent by epoch and ID
const intent = await client.batches.fetchIntentByEpoch(epoch, 'intent_1');

// Fetch single intent by blob ID and ID
const singleIntent = await client.batches.fetchIntent(result.blobId, 'intent_1');
```

### Archive Service

```typescript
await client.archives.storeArchive(archive, signer);

const archive = await client.archives.fetchArchive(epoch, batchId);
```

### User Service

```typescript
await client.users.storeHistory(history, signer);

const history = await client.users.fetchHistory(userAddress);
```

### Training Service

```typescript
await client.training.storeDataset(dataset, version, signer);

// Store ML model
await client.training.storeModel(modelData, name, version, signer);

// Fetch model metadata
const metadata = await client.training.fetchModelMetadata(name, version);
```

## Storage Optimization

Walrus automatically optimizes storage based on file size and count:

- **Single Files**: Stored as individual blobs for optimal access
- **Multiple Small Files**: Automatically batched into Quilts for cost savings
- **Large Files**: Stored individually to avoid Quilt overhead
- **Mixed Sizes**: Intelligently grouped for optimal efficiency

Cost savings can reach **400x** for small files when Quilts are used automatically.

## Configuration

```typescript
const client = new IntenusWalrusClient({
  network: 'testnet',
  defaultEpochs: 1,
  publisherUrl: 'https://publisher.walrus.space',
  aggregatorUrl: 'https://aggregator.walrus.space',
  uploadRelayUrl: 'https://upload-relay.testnet.walrus.space'
});
```

## Error Handling

```typescript
import { WalrusStorageError, WalrusFetchError } from '@intenus/walrus';

try {
  await client.batches.storeManifest(manifest, signer);
} catch (error) {
  if (error instanceof WalrusStorageError) {
    console.error('Storage failed:', error.message);
  } else if (error instanceof WalrusFetchError) {
    console.error('Fetch failed:', error.message);
  }
}
```

## Types

```typescript
import type { 
  BatchManifest,
  BatchArchive,
  UserHistoryAggregated,
  TrainingDatasetMetadata,
  ModelMetadata,
  QuiltResult
} from '@intenus/walrus';
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
