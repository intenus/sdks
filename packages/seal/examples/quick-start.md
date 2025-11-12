# Quick Start Guide - @intenus/seal

Guide nhanh để bắt đầu với Seal encryption/decryption trong Intenus Protocol.

## Installation

```bash
npm install @intenus/seal
# or
pnpm add @intenus/seal
```

## Basic Usage

### 1. Initialize Client

```typescript
import { IntenusSealClient } from '@intenus/seal';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// Initialize Seal client
const client = new IntenusSealClient({
  network: 'testnet',
  defaultThreshold: 2,
  verifyKeyServers: false
});

// Setup keypair
const keypair = Ed25519Keypair.generate();
```

### 2. Encrypt Intent Data (User → Solver)

```typescript
import { encryptIntentData } from '@intenus/seal';

// User's intent
const intentData = {
  action: 'swap',
  tokenIn: 'SUI',
  tokenOut: 'USDC',
  amountIn: '1000000',
  slippage: 0.01,
  deadline: Date.now() + 300000
};

// Encrypt for batch
const batchId = 'batch_123';
const encrypted = await encryptIntentData(
  client,
  intentData,
  batchId,
  keypair,
  {
    threshold: 2,
    solverWindow: 5000,
    routerAccess: true
  }
);

console.log('Encrypted:', encrypted.policyId);
// Store encrypted.encryptedData to Walrus
// Store encrypted.policyId for access control
```

### 3. Decrypt Intent Data (Solver)

```typescript
import { decryptIntentData, createSolverCredentials } from '@intenus/seal';

// Solver setup
const solverKeypair = Ed25519Keypair.generate();
const solverCredentials = createSolverCredentials(
  'solver_001',
  solverKeypair.getPublicKey().toSuiAddress(),
  'registry_object_id'
);

// Decrypt intent
const decrypted = await decryptIntentData(
  client,
  encrypted.encryptedData,
  encrypted.policyId,
  solverCredentials,
  solverKeypair,
  batchId
);

console.log('Intent:', decrypted.action, decrypted.amountIn);
```

### 4. Encrypt Solver Strategy (Private)

```typescript
import { encryptStrategyData } from '@intenus/seal';

const strategyData = {
  algorithm: 'intent_routing_v2',
  version: '2.1.0',
  parameters: {
    max_gas_price: '1000000000',
    min_surplus_threshold: '100000',
    preferred_protocols: ['deepbook', 'turbos']
  },
  weights: {
    gas_weight: 0.3,
    surplus_weight: 0.5,
    reputation_weight: 0.2
  }
};

const encrypted = await encryptStrategyData(
  client,
  strategyData,
  'solver_001',
  solverKeypair,
  {
    threshold: 2,
    routerAccess: false,  // Router không truy cập được
    isPublic: false       // Private strategy
  }
);
```

### 5. Encrypt User History (Analytics)

```typescript
import { encryptHistoryData } from '@intenus/seal';

const historyData = {
  user_address: userKeypair.getPublicKey().toSuiAddress(),
  total_intents: 150,
  successful_executions: 142,
  total_volume_usd: 125000,
  preferred_categories: { swap: 85, lending: 40, staking: 25 },
  reputation_score: 0.95
};

const encrypted = await encryptHistoryData(
  client,
  historyData,
  userAddress,
  userKeypair,
  {
    threshold: 2,
    routerAccessLevel: 1,  // Router có thể đọc aggregate data
    userCanRevoke: true    // User có thể revoke access
  }
);
```

## Advanced Usage

### Custom Key Servers

```typescript
const client = new IntenusSealClient({
  network: 'mainnet',
  keyServers: [
    {
      objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
      weight: 2,  // Higher weight for trusted server
      apiKeyName: 'x-api-key',
      apiKey: 'your-api-key'
    },
    {
      objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
      weight: 1
    }
  ],
  defaultThreshold: 2,
  verifyKeyServers: true
});
```

### Session Key Management

```typescript
// Create session key with TTL
const sessionKey = await client.getSessionKey(
  packageId,
  signer,
  10  // 10 minutes TTL
);

// Session key is cached for reuse
const cachedKey = await client.getSessionKey(packageId, signer, 10);
console.log(sessionKey === cachedKey); // true

// Clear specific session key
client.removeSessionKey(packageId, signerAddress);

// Clear all session keys
client.clearSessionKeys();
```

### Direct Encryption/Decryption

```typescript
import { prepareDataForEncryption, parseDecryptedData } from '@intenus/seal';

// Prepare data
const data = prepareDataForEncryption({ key: 'value' });

// Encrypt directly
const result = await client.encryptIntent(data, {
  packageId: protocolPackageId,
  policyId: 'intent_policy_123',
  threshold: 2,
  batchId: 'batch_456',
  solverWindow: 5000,
  routerAccess: true
}, signer);

// Decrypt directly
const decryptedBytes = await client.decryptIntent(
  result.encryptedData,
  'intent_policy_123',
  solverCredentials,
  signer,
  'batch_456'
);

// Parse result
const parsed = parseDecryptedData(decryptedBytes, 'json');
```

### Policy Management

```typescript
import { generatePolicyId, parsePolicyId } from '@intenus/seal';

// Generate policy ID
const policyId = generatePolicyId('intent', 'batch_123', Date.now());

// Parse policy ID
const info = parsePolicyId(policyId);
console.log(info);
// { type: 'intent', identifier: 'batch_123', timestamp: 1699123456 }
```

### Error Handling

```typescript
import { IntenusSealError, ERROR_CODES } from '@intenus/seal';

try {
  const result = await encryptIntentData(client, data, batchId, signer);
} catch (error) {
  if (error instanceof IntenusSealError) {
    switch (error.code) {
      case ERROR_CODES.ENCRYPTION_FAILED:
        console.log('Encryption failed:', error.message);
        break;
      case ERROR_CODES.UNAUTHORIZED:
        console.log('Access denied:', error.message);
        break;
      case ERROR_CODES.KEY_SERVER_ERROR:
        console.log('Key server error:', error.message);
        break;
      default:
        console.log('Seal error:', error.message);
    }
  }
}
```

## Integration with Walrus

```typescript
import { IntenusWalrusClient } from '@intenus/walrus';
import { IntenusSealClient, encryptIntentData } from '@intenus/seal';

// Initialize clients
const walrusClient = new IntenusWalrusClient({ network: 'testnet' });
const sealClient = new IntenusSealClient({ network: 'testnet' });

// Encrypt intent
const encrypted = await encryptIntentData(
  sealClient,
  intentData,
  batchId,
  signer
);

// Store encrypted data to Walrus
const storeResult = await walrusClient.storeRaw(
  `/intents/${batchId}/${encrypted.policyId}`,
  encrypted.encryptedData,
  5, // 5 epochs
  signer
);

console.log('Stored to Walrus:', storeResult.blob_id);
console.log('Policy ID:', encrypted.policyId);

// Later: Fetch from Walrus and decrypt
const encryptedData = await walrusClient.fetchRaw(storeResult.blob_id);
const decrypted = await decryptIntentData(
  sealClient,
  encryptedData,
  encrypted.policyId,
  solverCredentials,
  solverSigner,
  batchId
);
```

## Best Practices

### 1. Always Store Backup Keys
```typescript
const encrypted = await encryptIntentData(client, data, batchId, signer);

// Store backup key for disaster recovery
if (encrypted.backupKey) {
  await storeBackupKey(encrypted.policyId, encrypted.backupKey);
}
```

### 2. Use Appropriate Thresholds
```typescript
// High-value intents: Higher threshold
const highValueEncrypted = await encryptIntentData(
  client,
  highValueIntent,
  batchId,
  signer,
  { threshold: 3 }
);

// Low-value intents: Lower threshold for speed
const lowValueEncrypted = await encryptIntentData(
  client,
  lowValueIntent,
  batchId,
  signer,
  { threshold: 2 }
);
```

### 3. Reuse Session Keys
```typescript
// Create once
const sessionKey = await client.getSessionKey(packageId, signer, 30);

// Reuse for multiple decryptions
for (const encrypted of encryptedIntents) {
  const decrypted = await client.decrypt({
    data: encrypted.data,
    sessionKey,  // Reuse
    txBytes: createApprovalTx(encrypted.policyId)
  });
}
```

### 4. Handle Network Errors Gracefully
```typescript
async function decryptWithRetry(
  client: IntenusSealClient,
  encryptedData: Uint8Array,
  policyId: string,
  credentials: SolverCredentials,
  signer: Ed25519Keypair,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await decryptIntentData(
        client,
        encryptedData,
        policyId,
        credentials,
        signer
      );
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Next Steps

- 📚 Read [README.md](../README.md) for full API documentation
- 🧪 Check [tests/integration.test.ts](../tests/integration.test.ts) for examples
- 🔐 Review [SEAL.md](../SEAL.md) for Seal architecture
- 🏗️ Study smart contract integration patterns

## Support

- GitHub Issues: https://github.com/intenus/sdks/issues
- Documentation: https://docs.intenus.xyz
- Discord: https://discord.gg/intenus

