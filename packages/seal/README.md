# @intenus/seal

Seal encryption/decryption wrapper for Intenus Protocol - secure intent and solution data.

## Features

- **Intent Encryption** - Secure intent data for solver processing
- **Solution Encryption** - Protect solver solutions with privacy
- **Session Management** - Automatic session key caching and lifecycle
- **Object-Based Access** - Smart contract-enforced access via Intent/Solution objects
- **Type Safety** - Full TypeScript support

## Installation

```bash
npm install @intenus/seal
```

## Quick Start

```typescript
import { IntenusSealClient, encryptIntentData, decryptIntentData } from '@intenus/seal';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

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

// Decrypt with intent object ID
const decrypted = await decryptIntentData(
  client,
  encrypted.encryptedData,
  intentObjectId,
  keypair
);
```

## Core API

### Helper Functions

```typescript
// Encrypt intent with defaults
const result = await encryptIntentData(
  client,
  intentData,
  batchId,
  signer,
  {
    threshold: 2,
    solverWindow: 5000,
    routerAccess: true
  }
);

// Decrypt intent (requires Intent object ID)
const decrypted = await decryptIntentData(
  client,
  encryptedData,
  intentObjectId,
  signer
);

// Encrypt solution
const solutionResult = await encryptSolutionData(
  client,
  solutionData,
  solverId,
  signer,
  {
    threshold: 2,
    isPublic: false
  }
);

// Decrypt solution (requires Solution object ID)
const decryptedSolution = await decryptSolutionData(
  client,
  encryptedData,
  solutionObjectId,
  signer
);
```

### Direct Client API

```typescript
// Encrypt intent
const intentResult = await client.encryptIntent(data, {
  packageId: protocolPackageId,
  policyId: 'policy_123',
  threshold: 2,
  batchId: 'batch_456',
  solverWindow: 5000,
  routerAccess: true
}, signer);

// Encrypt solution
const solutionResult = await client.encryptSolution(data, {
  packageId: protocolPackageId,
  policyId: 'policy_789',
  threshold: 2,
  isPublic: false
}, signer);

// Decrypt intent (requires Intent object ID from chain)
const decryptedIntent = await client.decryptIntent(
  encryptedData,
  intentObjectId,
  signer
);

// Decrypt solution (requires Solution object ID from chain)
const decryptedSolution = await client.decryptSolution(
  encryptedData,
  solutionObjectId,
  signer
);
```

## Configuration

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
    }
  ],
  defaultThreshold: 2,
  verifyKeyServers: true
});
```

## Utilities

```typescript
import {
  generatePolicyId,
  prepareDataForEncryption,
  parseDecryptedData,
  validateEncryptionConfig
} from '@intenus/seal';

// Generate policy ID
const policyId = generatePolicyId('intent', 'batch_123');

// Prepare data
const data = prepareDataForEncryption({ key: 'value' });

// Parse decrypted data
const parsed = parseDecryptedData(decryptedBytes, 'json');

// Validate config
const isValid = validateEncryptionConfig(config);
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
    }
  }
}
```

## Types

```typescript
import type {
  IntenusSealConfig,
  SealPolicyConfig,
  IntentEncryptionConfig,
  SolutionEncryptionConfig,
  EncryptionResult
} from '@intenus/seal';

import { POLICY_TYPES } from '@intenus/seal';
```

## License

MIT
