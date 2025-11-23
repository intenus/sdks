# Encrypted Storage with Walrus + Seal

This guide demonstrates how to use the encrypted storage service that combines Walrus storage with Seal encryption.

## Overview

The `EncryptedStorageService` provides:
- **Encrypted Intent Storage**: Store intents with Seal encryption, then save to Walrus
- **Encrypted Solution Storage**: Store solver solutions privately
- **Generic Encrypted Storage**: Store any encrypted data
- **Decryption Methods**: Fetch and decrypt data with proper access control

## Quick Start

### 1. Initialize Clients

```typescript
import { IntenusWalrusClient } from '@intenus/walrus';
import { IntenusSealClient } from '@intenus/seal';

// Initialize Walrus client
const walrusClient = new IntenusWalrusClient({
  network: 'testnet'
});

// Initialize Seal client
const sealClient = new IntenusSealClient({
  network: 'testnet',
  defaultThreshold: 2
});

// Connect Seal to Walrus encrypted service
walrusClient.encrypted.initializeSeal(sealClient);
```

### 2. Store Encrypted Intent

```typescript
import type { IGSIntent } from '@intenus/common';
import type { IntentEncryptionConfig } from '@intenus/seal';

const intentData: IGSIntent = {
  // ... your intent data
};

const encryptionConfig: IntentEncryptionConfig = {
  packageId: sealClient.getPackageId(),
  policyId: 'your-policy-id',
  threshold: 2,
  batchId: 'batch-123',
  solverWindow: 5000,
  routerAccess: true,
  ttlMin: 10
};

// Store encrypted intent to Walrus
const result = await walrusClient.encrypted.storeEncryptedIntent(
  intentData,
  encryptionConfig,
  5, // epochs
  signer
);

console.log('Stored encrypted intent:', result.blob_id);
console.log('Encryption metadata:', result.encryption);
```

### 3. Store Encrypted Solution

```typescript
import type { IGSSolution } from '@intenus/common';
import type { SolutionEncryptionConfig } from '@intenus/seal';

const solutionData: IGSSolution = {
  // ... your solution data
};

const solutionConfig: SolutionEncryptionConfig = {
  packageId: sealClient.getPackageId(),
  policyId: 'solution-policy-id',
  threshold: 2,
  isPublic: false,
  ttlMin: 10
};

const result = await walrusClient.encrypted.storeEncryptedSolution(
  solutionData,
  solutionConfig,
  5, // epochs
  solverSigner
);

console.log('Stored encrypted solution:', result.blob_id);
```

### 4. Fetch and Decrypt Intent

```typescript
// Authorized solver can decrypt
const decryptedIntent = await walrusClient.encrypted.fetchDecryptedIntent(
  blobId,
  intentObjectId, // Intent object ID for access control
  solverSigner
);

console.log('Decrypted intent:', decryptedIntent);
```

### 5. Fetch and Decrypt Solution

```typescript
const decryptedSolution = await walrusClient.encrypted.fetchDecryptedSolution(
  blobId,
  solutionObjectId, // Solution object ID for access control
  authorizedSigner
);

console.log('Decrypted solution:', decryptedSolution);
```

### 6. Generic Encrypted Storage

For custom use cases where you handle encryption separately:

```typescript
// Encrypt data with Seal directly
const dataBytes = new TextEncoder().encode(JSON.stringify(customData));
const encryptionResult = await sealClient.encryptIntent(
  dataBytes,
  config,
  signer
);

// Store to Walrus
const storageResult = await walrusClient.encrypted.storeEncrypted(
  encryptionResult.encryptedData,
  5, // epochs
  signer,
  encryptionResult // metadata to include in result
);
```

### 7. Fetch Encrypted Data (Without Decryption)

Useful when you want to decrypt separately:

```typescript
const encryptedData = await walrusClient.encrypted.fetchEncrypted(blobId);

// Later decrypt with Seal
const decryptedBytes = await sealClient.decrypt({
  encryptedData,
  sessionKey,
  txBytes
});
```

## Architecture

```
┌─────────────────┐
│   Your Data     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Seal Client    │ ◄─── Encrypt with threshold encryption
│  (Encryption)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Walrus Client   │ ◄─── Store encrypted blob
│  (Storage)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Decentralized  │
│  Walrus Storage │
└─────────────────┘
```

## Error Handling

```typescript
import { WalrusStorageError } from '@intenus/walrus';

try {
  const result = await walrusClient.encrypted.storeEncryptedIntent(
    intentData,
    config,
    epochs,
    signer
  );
} catch (error) {
  if (error instanceof WalrusStorageError) {
    console.error('Storage error:', error.code, error.message);
  }
}
```

## Common Error Codes

- `SEAL_NOT_INITIALIZED`: Seal client not initialized. Call `initializeSeal()` first
- `ENCRYPTED_INTENT_STORE_ERROR`: Failed to store encrypted intent
- `ENCRYPTED_SOLUTION_STORE_ERROR`: Failed to store encrypted solution
- `ENCRYPTED_INTENT_FETCH_ERROR`: Failed to fetch/decrypt intent
- `ENCRYPTED_SOLUTION_FETCH_ERROR`: Failed to fetch/decrypt solution
- `ENCRYPTED_STORE_ERROR`: Generic encrypted storage error
- `ENCRYPTED_FETCH_ERROR`: Failed to fetch encrypted data

## Best Practices

1. **Always initialize Seal client** before using encrypted storage:
   ```typescript
   walrusClient.encrypted.initializeSeal(sealClient);
   ```

2. **Store encryption metadata** from the result for later reference:
   ```typescript
   const result = await walrusClient.encrypted.storeEncryptedIntent(...);
   // Save result.encryption.policyId, result.encryption.threshold, etc.
   ```

3. **Use proper access control** - Only authorized parties with correct object IDs can decrypt

4. **Handle errors gracefully** - Network issues can occur with both Seal key servers and Walrus storage nodes

5. **Consider storage epochs** - Walrus storage requires payment for each epoch (typically ~1 day)

## Security Considerations

- **Threshold Encryption**: Data is encrypted using threshold cryptography with multiple key servers
- **Access Control**: Decryption requires both the correct object ID and authorized signer
- **No Client-Side Keys**: Encryption keys are distributed across multiple Seal servers
- **Decentralized Storage**: Encrypted data is stored on decentralized Walrus network

## Integration Example

Complete example integrating with Intent/Solution workflow:

```typescript
// 1. User submits intent
const walrusClient = new IntenusWalrusClient({ network: 'testnet' });
const sealClient = new IntenusSealClient({ network: 'testnet' });
walrusClient.encrypted.initializeSeal(sealClient);

// 2. Encrypt and store intent
const encryptedIntentResult = await walrusClient.encrypted.storeEncryptedIntent(
  intentData,
  intentEncryptionConfig,
  5,
  userSigner
);

// Store blob_id on-chain
const intentObjectId = await submitIntentOnChain({
  encrypted_data_blob_id: encryptedIntentResult.blob_id,
  policy_id: encryptedIntentResult.encryption.policyId,
  // ... other fields
});

// 3. Solver decrypts intent
const decryptedIntent = await walrusClient.encrypted.fetchDecryptedIntent(
  encryptedIntentResult.blob_id,
  intentObjectId,
  solverSigner
);

// 4. Solver creates and encrypts solution
const encryptedSolutionResult = await walrusClient.encrypted.storeEncryptedSolution(
  solutionData,
  solutionEncryptionConfig,
  5,
  solverSigner
);

// 5. Submit solution on-chain with encrypted blob_id
await submitSolutionOnChain({
  intent_id: intentObjectId,
  encrypted_solution_blob_id: encryptedSolutionResult.blob_id,
  // ... other fields
});
```

## API Reference

### EncryptedStorageService

#### Methods

- `initializeSeal(sealClient: IntenusSealClient): void`
  - Initialize Seal client for encryption operations

- `storeEncryptedIntent(data, config, epochs, signer): Promise<EncryptedStorageResult>`
  - Encrypt intent and store to Walrus

- `storeEncryptedSolution(data, config, epochs, signer): Promise<EncryptedStorageResult>`
  - Encrypt solution and store to Walrus

- `storeEncrypted(encryptedData, epochs, signer, metadata): Promise<EncryptedStorageResult>`
  - Store pre-encrypted data to Walrus

- `fetchDecryptedIntent(blobId, intentObjectId, signer): Promise<any>`
  - Fetch and decrypt intent data

- `fetchDecryptedSolution(blobId, solutionObjectId, signer): Promise<any>`
  - Fetch and decrypt solution data

- `fetchEncrypted(blobId): Promise<Uint8Array>`
  - Fetch encrypted data without decryption

#### Types

```typescript
interface EncryptedStorageResult extends StorageResult {
  encryption: EncryptionResult;
}

interface EncryptionResult {
  encryptedData: Uint8Array;
  backupKey?: Uint8Array;
  policyId: string;
  packageId: string;
  threshold: number;
}
```
