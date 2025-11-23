# Quick Start - @intenus/seal

Quick guide for Seal encryption/decryption in Intenus Protocol.

## Installation

```bash
npm install @intenus/seal
```

## Basic Usage

### 1. Initialize Client

```typescript
import { IntenusSealClient } from '@intenus/seal';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new IntenusSealClient({
  network: 'testnet',
  defaultThreshold: 2
});

const keypair = Ed25519Keypair.generate();
```

### 2. Encrypt Intent Data

```typescript
import { encryptIntentData } from '@intenus/seal';

const intentData = {
  action: 'swap',
  tokenIn: 'SUI',
  tokenOut: 'USDC',
  amountIn: '1000000',
  slippage: 0.01
};

const context = 'user_batch_123';
const encrypted = await encryptIntentData(
  client,
  intentData,
  context,  // Context for policy ID generation
  {
    threshold: 2
  }
);

console.log('Encrypted:', encrypted.policyId);
// Store encrypted.encryptedData to Walrus
```

### 3. Decrypt Intent Data

```typescript
import { decryptIntentData } from '@intenus/seal';

// Requires Intent object ID from chain
const decrypted = await decryptIntentData(
  client,
  encrypted.encryptedData,
  intentObjectId,
  solverKeypair  // Solver's keypair
);

console.log('Intent:', decrypted);
```

### 4. Encrypt Solution Data

```typescript
import { encryptSolutionData } from '@intenus/seal';

const solutionData = {
  solver_id: 'solver_001',
  routes: [{ dex: 'cetus', pool_id: '0x...' }],
  expected_output: '950000'
};

const encrypted = await encryptSolutionData(
  client,
  solutionData,
  'solver_001',  // Solver context
  {
    threshold: 2,
    isPublic: false
  }
);
```

### 5. Decrypt Solution Data

```typescript
import { decryptSolutionData } from '@intenus/seal';

// Requires Solution object ID from chain
const decrypted = await decryptSolutionData(
  client,
  encrypted.encryptedData,
  solutionObjectId,
  authorizedKeypair  // Authorized keypair
);
```

## Advanced Usage

### Custom Key Servers

```typescript
const client = new IntenusSealClient({
  network: 'mainnet',
  keyServers: [
    {
      objectId: '0x73d05d62...',
      weight: 2,
      apiKeyName: 'x-api-key',
      apiKey: 'your-key'
    }
  ],
  defaultThreshold: 2,
  verifyKeyServers: true
});
```

### Session Key Management

```typescript
// Session keys are cached automatically
const sessionKey = await client.getSessionKey(packageId, signer, 10);

// Clear when needed
client.clearSessionKeys();
```

### Direct Encryption/Decryption

```typescript
import { prepareDataForEncryption, parseDecryptedData } from '@intenus/seal';

const data = prepareDataForEncryption({ key: 'value' });

const result = await client.encryptIntent(data, {
  packageId: protocolPackageId,
  policyId: 'policy_123',
  threshold: 2,
  context: 'user_batch_456'  // Optional context
});

const decryptedBytes = await client.decryptIntent(
  result.encryptedData,
  intentObjectId,
  solverKeypair
);

const parsed = parseDecryptedData(decryptedBytes, 'json');
```

### Error Handling

```typescript
import { IntenusSealError, ERROR_CODES } from '@intenus/seal';

try {
  const result = await encryptIntentData(client, data, 'context_123');
} catch (error) {
  if (error instanceof IntenusSealError) {
    switch (error.code) {
      case ERROR_CODES.ENCRYPTION_FAILED:
        console.log('Encryption failed');
        break;
      case ERROR_CODES.UNAUTHORIZED:
        console.log('Access denied');
        break;
    }
  }
}
```

## Integration with Walrus

```typescript
import { IntenusWalrusClient } from '@intenus/walrus';
import { IntenusSealClient, encryptIntentData } from '@intenus/seal';

const walrusClient = new IntenusWalrusClient({ network: 'testnet' });
const sealClient = new IntenusSealClient({ network: 'testnet' });

// Encrypt intent
const encrypted = await encryptIntentData(
  sealClient,
  intentData,
  'user_context_123'
);

// Store to Walrus
const storeResult = await walrusClient.storeRaw(
  encrypted.encryptedData,
  5, // 5 epochs
  signer
);

console.log('Stored blob ID:', storeResult.blob_id);

// Later: Fetch and decrypt
const encryptedData = await walrusClient.fetchRaw(storeResult.blob_id);
const decrypted = await decryptIntentData(
  sealClient,
  encryptedData,
  intentObjectId,
  solverKeypair
);
```

## Best Practices

### 1. Use Appropriate Thresholds

```typescript
// High-value intents: Higher threshold
const encrypted = await encryptIntentData(
  client, intent, 'context_123', { threshold: 3 }
);

// Low-value: Lower threshold for speed
const encrypted = await encryptIntentData(
  client, intent, 'context_123', { threshold: 2 }
);
```

### 2. Reuse Session Keys

```typescript
const sessionKey = await client.getSessionKey(packageId, signer, 30);

// Reuse for multiple decryptions
for (const encrypted of encryptedIntents) {
  const decrypted = await client.decrypt({
    data: encrypted.data,
    sessionKey,
    txBytes: createApprovalTx(encrypted.policyId)
  });
}
```

## Next Steps

- Read [README.md](../README.md) for full API
- Check [tests/integration.test.ts](../tests/integration.test.ts) for examples
- Review smart contract integration patterns
