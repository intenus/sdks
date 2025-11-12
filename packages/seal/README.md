# @intenus/seal

Seal encryption/decryption wrapper for Intenus Protocol - AI infrastructure standard.

## Features

- **Intent Encryption** - Secure intent data for solver processing
- **Strategy Encryption** - Protect solver algorithms and parameters
- **History Encryption** - Encrypt user interaction history for analytics
- **Session Management** - Automatic session key caching and lifecycle
- **Policy-Based Access** - Smart contract-enforced access control
- **Simple API** - Straightforward integration for developers

## Installation

```bash
npm install @intenus/seal
```

## Quick Start

```typescript
import { IntenusSealClient, encryptIntentData, decryptIntentData } from '@intenus/seal';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// Initialize client
const client = new IntenusSealClient({
  network: 'testnet'
});

const keypair = Ed25519Keypair.generate();

// Encrypt intent data
const intentData = {
  action: 'swap',
  tokenIn: 'SUI',
  tokenOut: 'USDC',
  amountIn: '1000000'
};

const encrypted = await encryptIntentData(
  client,
  intentData,
  'batch_123',
  keypair
);

// Decrypt for authorized solver
const solverCredentials = {
  solverId: 'solver_001',
  privateKey: 'solver_private_key',
  registryId: 'registry_id'
};

const decrypted = await decryptIntentData(
  client,
  encrypted.encryptedData,
  encrypted.policyId,
  solverCredentials,
  keypair
);
```

## Core API

### Direct Encryption/Decryption

```typescript
// Intent encryption for solvers
const intentResult = await client.encryptIntent(data, {
  packageId: protocolPackageId,
  policyId: 'intent_policy_123',
  threshold: 2,
  batchId: 'batch_456',
  solverWindow: 5000,
  routerAccess: true
}, signer);

// Strategy encryption for solver algorithms
const strategyResult = await client.encryptStrategy(data, {
  packageId: protocolPackageId,
  policyId: 'strategy_policy_789',
  threshold: 2,
  routerAccess: false,
  isPublic: false
}, signer);

// History encryption for user data
const historyResult = await client.encryptHistory(data, {
  packageId: protocolPackageId,
  policyId: 'history_policy_101',
  threshold: 2,
  routerAccessLevel: 1,
  userCanRevoke: true
}, signer);
```

### Smart Contract Integration

```typescript
// Create approval transactions
const intentTx = client.createIntentApprovalTx(
  policyId,
  solverCredentials,
  batchId
);

const strategyTx = client.createStrategyApprovalTx(
  policyId,
  solverCredentials
);

const historyTx = client.createHistoryApprovalTx(
  policyId,
  userAddress,
  accessLevel
);
```

## Configuration

### Basic Configuration

```typescript
const client = new IntenusSealClient({
  network: 'testnet',
  defaultThreshold: 2,
  verifyKeyServers: false
});
```

### Advanced Configuration

```typescript
const client = new IntenusSealClient({
  network: 'mainnet',
  suiClient: customSuiClient,
  keyServers: [
    {
      objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
      weight: 2,
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

## Use Cases

### For Solvers

```typescript
import { IntenusSealClient, createSolverCredentials } from '@intenus/seal';

// Setup solver credentials
const credentials = createSolverCredentials(
  'solver_001',
  'private_key_hex',
  'registry_object_id'
);

// Decrypt intent data
const intentData = await client.decryptIntent(
  encryptedBytes,
  policyId,
  credentials,
  solverKeypair,
  batchId
);

// Decrypt strategy data
const strategyData = await client.decryptStrategy(
  encryptedBytes,
  policyId,
  credentials,
  solverKeypair
);
```

### For Backend Services

```typescript
// Encrypt user history
const historyEncrypted = await encryptHistoryData(
  client,
  userHistoryData,
  userAddress,
  backendKeypair,
  {
    routerAccessLevel: 2,
    userCanRevoke: true
  }
);

// Decrypt for analytics
const historyData = await decryptHistoryData(
  client,
  encryptedBytes,
  policyId,
  userAddress,
  analyticsKeypair,
  2 // access level
);
```

### For AI Services

```typescript
// Encrypt ML model data
const modelEncrypted = await encryptStrategyData(
  client,
  modelData,
  'ai_service_001',
  aiKeypair,
  {
    isPublic: false,
    routerAccess: false,
    adminUnlockTime: Date.now() + 86400000 // 24 hours
  }
);
```

## Helpers

### Policy Management

```typescript
import { generatePolicyId, parsePolicyId } from '@intenus/seal';

// Generate policy ID
const policyId = generatePolicyId('intent', 'batch_123');

// Parse policy ID
const info = parsePolicyId(policyId);
console.log(info); // { type: 'intent', identifier: 'batch_123', timestamp: 1699123456 }
```

### Data Preparation

```typescript
import { prepareDataForEncryption, parseDecryptedData } from '@intenus/seal';

// Prepare data for encryption
const data = prepareDataForEncryption({ key: 'value' });

// Parse decrypted data
const parsed = parseDecryptedData(decryptedBytes, 'json');
```

## Error Handling

```typescript
import { IntenusSealError, ERROR_CODES } from '@intenus/seal';

try {
  const result = await client.encryptIntent(data, config, signer);
} catch (error) {
  if (error instanceof IntenusSealError) {
    switch (error.code) {
      case ERROR_CODES.ENCRYPTION_FAILED:
        console.log('Encryption failed:', error.message);
        break;
      case ERROR_CODES.UNAUTHORIZED:
        console.log('Access denied:', error.message);
        break;
      default:
        console.log('Seal error:', error.message);
    }
  }
}
```

## Networks

| Network | Intenus Package ID |
|---------|-------------------|
| Mainnet | TBD (chưa deploy) |
| Testnet | TBD (chưa deploy) |
| Devnet  | TBD (chưa deploy) |

**Lưu ý:** Khi deploy Intenus Protocol smart contracts lên Sui, update `INTENUS_PACKAGE_ID` trong `src/constants.ts`

## License

MIT
