# Walrus Storage Structure

This document describes the Walrus storage organization for the Intenus Protocol.

## Overview

Walrus is used to store three types of data:
1. **Intents** - User intent submissions (IGSIntent)
2. **Solutions** - Solver solutions (IGSSolution)  
3. **ML Data** - Training data, models, and feedback for intent classification

All data is stored as **blobs** identified by `blob_id`. The path structure is logical and used for organization only.

## Storage Folders

### 1. Intents

**Path Pattern:** `/intents/{intent_id}.json`

**Content:** IGSIntent JSON

**Example:**
```
/intents/intent_001.json
/intents/intent_002.json
```

**Usage:**
```typescript
// Store intent
const result = await client.intents.store(intent, epochs, signer);
// Returns: { blob_id: "abc123...", path: "/intents/intent_001.json", ... }

// Fetch intent by blob_id
const intent = await client.intents.fetch("abc123...");
```

---

### 2. Solutions

**Path Pattern:** `/solutions/{solution_id}.json`

**Content:** IGSSolution JSON

**Example:**
```
/solutions/sol_001.json
/solutions/sol_002.json
```

**Usage:**
```typescript
// Store solution
const result = await client.solutions.store(solution, epochs, signer);
// Returns: { blob_id: "def456...", path: "/solutions/sol_001.json", ... }

// Fetch solution by blob_id
const solution = await client.solutions.fetch("def456...");
```

---

### 3. ML Data

#### 3.1 Feedback

**Path Pattern:** `/feedback/{feedback_id}.json`

**Content:** ClassificationFeedback JSON

**Example:**
```
/feedback/fb_001.json
/feedback/fb_002.json
```

**Usage:**
```typescript
// Store feedback
const result = await client.ml.storeFeedback(feedback, epochs, signer);

// Fetch feedback by blob_id
const feedback = await client.ml.fetchFeedback("ghi789...");
```

---

#### 3.2 Training Data

**Path Pattern:** `/training_data/{version}/{sample_id}.json`

**Content:** IntentClassificationTrainingData JSON

**Versioned:** Yes (grouped by dataset version)

**Example:**
```
/training_data/v1.0/sample_001.json
/training_data/v1.0/sample_002.json
/training_data/v1.1/sample_001.json
```

**Usage:**
```typescript
// Store training sample
const result = await client.ml.storeTrainingSample(sample, epochs, signer);

// Fetch sample by blob_id
const sample = await client.ml.fetchTrainingSample("jkl012...");
```

---

#### 3.3 Models

**Folder:** `/models`

**Structure:**
```
/models
  ├─ {version}/
  │   ├─ metadata.json      (ModelMetadata)
  │   └─ weights.pkl        (Binary model weights)
  └─ latest.json            (Reference to latest model version)
```

**Example:**
```
/models/v1.0.0/metadata.json
/models/v1.0.0/weights.pkl
/models/v1.1.0/metadata.json
/models/v1.1.0/weights.pkl
/models/latest.json
```

**Usage:**
```typescript
// Store model metadata
const metaResult = await client.ml.storeModelMetadata(metadata, epochs, signer);
// Returns blob_id for metadata

// Store model weights (binary)
const weightsResult = await client.ml.storeModelWeights(
  "v1.0.0",
  weightsBuffer,
  epochs,
  signer
);
// Returns blob_id for weights

// Fetch model metadata
const metadata = await client.ml.fetchModelMetadata("mno345...");

// Fetch model weights
const weightsBuffer = await client.ml.fetchModelWeights("pqr678...");
```

---

## Storage Notes

1. **Blob IDs**: All storage operations return a `blob_id` which is used for fetching
2. **Paths**: Paths are logical identifiers; actual storage uses blob IDs
3. **Epochs**: Storage duration is specified in Walrus epochs
4. **Deletable**: All blobs are created as deletable
5. **Retry Logic**: Fetch operations include automatic retry with exponential backoff

## Reference

For more details on Walrus operations, see:
- [Walrus Documentation](https://docs.wal.app/)
- [WALRUS.md](./WALRUS.md)
- [WALRUS_PUBLISHER_API.md](./WALRUS_PUBLISHER_API.md)
