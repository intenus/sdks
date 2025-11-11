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

Walrus Quilt batches multiple small blobs into a single storage object, reducing gas fees.

### Important: Quilt Reading Pattern

**Quilt does NOT support direct patch reading.** You must:

1. Store the `QuiltResult` returned from `storeQuilt()`
2. Use the stored index to extract individual patches

### Example: Correct Quilt Usage

```typescript
import { IntenusWalrusClient } from '@intenus/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new IntenusWalrusClient({ network: 'testnet' });
const signer = new Ed25519Keypair();

// Prepare intents
const intents = [
  { intent_id: 'intent_1', data: { action: 'swap' }, category: 'swap' },
  { intent_id: 'intent_2', data: { action: 'lend' }, category: 'lending' }
];

// Step 1: Store intents as Quilt
const quiltResult = await client.batches.storeIntentsQuilt(
  intents,
  'batch_12345',
  signer
);

console.log('Quilt stored:', quiltResult.blobId);
console.log('Patches:', quiltResult.patches.length);

// IMPORTANT: Store quiltResult.patches for later use
// You'll need patch.identifier to fetch individual intents

// Step 2a: Fetch individual intent (requires identifier)
const firstIntentIdentifier = quiltResult.patches[0].identifier;
const intent = await client.batches.fetchIntentFromQuilt(
  quiltResult.blobId,
  firstIntentIdentifier
);

// Step 2b: Fetch all intents at once (more efficient)
const allIntents = await client.batches.fetchAllIntentsFromQuilt(
  quiltResult.blobId
);

console.log('Fetched all intents:', allIntents.length);
```

### Storing QuiltResult Metadata

You **must** persist `QuiltResult` to enable future reads:

```typescript
// Option 1: Store in database
await db.storeQuiltMetadata({
  batch_id: 'batch_12345',
  quilt_blob_id: quiltResult.blobId,
  patches: quiltResult.patches
});

// Option 2: Store in BatchManifest
const manifest = {
  batch_id: 'batch_12345',
  epoch: 1000,
  intents: [], // Empty - actual intents in quilt
  quilt_reference: {
    blob_id: quiltResult.blobId,
    patches: quiltResult.patches
  },
  // ... other fields
};

await client.batches.storeManifest(manifest, signer);

// Later: Fetch intents using stored metadata
const storedManifest = await client.batches.fetchManifest(1000);

if (storedManifest.quilt_reference) {
  // Cache the index
  client.cacheQuiltIndex({
    blobId: storedManifest.quilt_reference.blob_id,
    patches: storedManifest.quilt_reference.patches,
    // ... other fields
  });
  
  // Now you can fetch individual intents
  const intents = await client.batches.fetchAllIntentsFromQuilt(
    storedManifest.quilt_reference.blob_id
  );
}
```

### Cost Analysis

```typescript
// Check if Quilt is worth it
const analysis = client.batches.calculateQuiltBenefit(100, 512);

if (analysis.recommended) {
  console.log(`Use Quilt: ${analysis.estimatedSavings?.toFixed(1)}% savings`);
  // Use Quilt
} else {
  console.log(`Skip Quilt: ${analysis.reason}`);
  // Use individual blobs
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
