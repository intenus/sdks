# @intenus/walrus

A structured storage client for the Intenus Protocol, built on top of Mysten Labs' Walrus. It provides high-level services for managing AI/ML-related data, such as batch manifests, training datasets, and user models, while offering cost optimization through Walrus Quilt.

## Installation
```bash
npm install @intenus/walrus @mysten/walrus @mysten/sui
```

## Purpose

This package provides a production-ready storage layer for the Intenus AI infrastructure. It implements a standardized, hierarchical storage structure on Walrus and offers a convenient, object-oriented API for interacting with it. The design follows SOLID principles, utilizing Strategy, Builder, and Facade patterns.

## Core Features

- **Structured Services**: High-level services for managing `batches`, `archives`, `users`, and `training` data.
- **AI Infrastructure Standard**: Enforces a consistent storage layout for all protocol-related data, crucial for AI/ML model training and data analysis.
- **Quilt Integration**: Built-in support for Walrus Quilt to optimize storage costs by batching small blobs.
- **Type Safety**: Fully typed API for all storage operations and data structures.

## Quick Start

### Initializing the Client
```typescript
import { IntenusWalrusClient } from '@intenus/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new IntenusWalrusClient({ network: 'testnet' });
const signer = new Ed25519Keypair(); // A Sui signer is required for write operations
```

### Storing a Batch Manifest
```typescript
const manifest = {
  batch_id: 'batch_12345',
  epoch: 1000,
  intents: [/* ... array of BatchIntent objects ... */],
  // ... other manifest properties
};

const result = await client.batches.storeManifest(manifest, signer);
console.log('Batch manifest stored. Blob ID:', result.blob_id);

// Fetch the manifest later by its epoch
const fetchedManifest = await client.batches.fetchManifest(1000);
```

## Quilt for Cost Optimization

Walrus Quilt is a feature for batching multiple small blobs into a single storage object, significantly reducing on-chain gas fees and storage costs. The SDK provides helpers to simplify its usage.

### When to Use Quilt
- **Recommended**: For storing many small, related blobs (e.g., a batch of intents, individual training data points).
- **Not Recommended**: For single blobs or very large files (>10MB).

### Example: Storing Intents with Quilt

```typescript
const intents = [
  { intent_id: 'intent_1', data: { /* ... */ }, category: 'swap' },
  { intent_id: 'intent_2', data: { /* ... */ }, category: 'lend' },
  // ... up to 666 intents
];

// 1. Analyze if Quilt is beneficial
const analysis = client.batches.calculateQuiltBenefit(intents.length, 512); // Assuming 512 bytes avg. size

if (analysis.recommended) {
  console.log(`Quilt is recommended with estimated savings of ${analysis.estimatedSavings?.toFixed(1)}%`);

  // 2. Store the batch of intents as a single Quilt
  const quiltResult = await client.batches.storeIntentsQuilt(intents, 'batch_12345', signer);
  console.log('Intents stored in Quilt. Blob ID:', quiltResult.blobId);

  // 3. You can still fetch individual intents from the Quilt
  const firstIntentPatchId = quiltResult.patches[0].patchId;
  const fetchedIntent = await client.batches.fetchIntentFromQuilt(firstIntentPatchId);
  console.log('Fetched individual intent:', fetchedIntent);
}
```

## AI Infrastructure Services

The client is organized into services that map to the AI data lifecycle.

### `client.batches`
Manages the storage of `BatchManifest` objects.

### `client.archives`
Manages `BatchArchive` objects, which contain the results and ML features of a completed batch.
```typescript
const archive = {
  batch_id: 'batch_12345',
  epoch: 1000,
  solutions: [/* ... */],
  executions: [/* ... */],
  ml_features: { /* ... */ },
  // ... other archive properties
};
await client.archives.storeArchive(archive, signer);
```

### `client.users`
Stores aggregated user history and preferences.
```typescript
const userHistory = {
  user_address: '0x...',
  preferred_protocols: ['FlowX', 'Scallop'],
  avg_intent_value_usd: 1200,
  // ... other user properties
};
await client.users.storeHistory(userHistory, signer);
```

### `client.training`
Manages ML training datasets and model artifacts. It supports storing large feature/label files (e.g., in Parquet format) and model files (e.g., ONNX).

```typescript
// Storing a training dataset
const features = Buffer.from(/* .parquet file buffer */);
const labels = Buffer.from(/* .parquet file buffer */);
await client.training.storeDataset('v1.0.0', features, labels, { /* metadata */ }, signer);

// Storing a trained model
const modelBuffer = Buffer.from(/* .onnx file buffer */);
await client.training.storeModel('solution-ranker', 'v1.2.0', modelBuffer, { /* metadata */ }, signer);
```

## Direct Walrus Access

For advanced use cases, you can access the underlying `@mysten/walrus` client directly.

```typescript
// Get the raw Walrus client
const rawWalrusClient = client.getWalrusClient();

// Use the Walrus SDK directly
const blob = await rawWalrusClient.writeBlob({
  blob: new Uint8Array(data),
  deletable: true,
  epochs: 1,
  signer: mySigner,
});
```

## Related Packages

- [`@intenus/common`](../common): Provides the core type definitions used by this package.
- [`@intenus/client-sdk`](../client-sdk): Client-side helpers that may use this package for storage.
- [`@intenus/solver-sdk`](../solver-sdk): Solver-side helpers that may use this package for data retrieval.
