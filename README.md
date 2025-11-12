# Intenus TypeScript SDK

Official TypeScript SDK for the Intenus Protocol. It provides a comprehensive set of types, utilities, and optional helpers for building applications and services on the Intenus network.

## Overview

The Intenus TypeScript SDK is designed to streamline development for both clients and solvers. It offers a type-safe, modular, and flexible architecture that integrates directly with the Sui, Walrus, and Seal SDKs.

### Core Principles

- **Modular Architecture**: A clear separation of concerns between shared types, client utilities, solver tools, and storage management.
- **Type Safety**: Strongly typed to ensure a robust and predictable development experience.
- **Flexibility**: Provides optional, high-level abstractions without preventing direct access to the underlying Sui, Walrus, and Seal SDKs.
- **Performance**: Optimized for tree-shaking to ensure minimal bundle sizes in production applications.

## Packages

This monorepo contains the following public packages:

| Package | Version | Description |
|---|---|---|
| [`@intenus/common`](./packages/common) | [![npm version](https://badge.fury.io/js/@intenus%2Fcommon.svg)](https://badge.fury.io/js/@intenus%2Fcommon) | Shared types, constants, and utilities. Zero runtime dependencies. |
| [`@intenus/client-sdk`](./packages/client-sdk) | [![npm version](https://badge.fury.io/js/@intenus%2Fclient-sdk.svg)](https://badge.fury.io/js/@intenus%2Fclient-sdk) | Optional helpers for building client-side applications. |
| [`@intenus/solver-sdk`](./packages/solver-sdk) | [![npm version](https://badge.fury.io/js/@intenus%2Fsolver-sdk.svg)](https://badge.fury.io/js/@intenus%2Fsolver-sdk) | Optional utilities for solver development. |
| [`@intenus/walrus`](./packages/walrus) | [![npm version](https://badge.fury.io/js/@intenus%2Fwalrus.svg)](https://badge.fury.io/js/@intenus%2Fwalrus) | Structured storage services for Walrus, aligned with AI infrastructure standards. |

## Quick Start

### Installation

Install the desired packages for your use case.

**For Solver Development:**

```bash
npm install @intenus/solver-sdk @mysten/sui @mysten/walrus @mysten/seal ioredis
```

**For Client Applications:**

```bash
npm install @intenus/client-sdk @mysten/sui @mysten/walrus @mysten/seal
```

**For Walrus Storage Only:**

```bash
npm install @intenus/walrus @mysten/walrus @mysten/sui
```

**For Type Definitions Only:**

```bash
npm install @intenus/common
```

## Usage Examples

### Solver Implementation

This example demonstrates a basic solver using `SolverListener` to subscribe to new batches and `SolutionBuilder` to construct a response.

```typescript
import { SolverListener, SolutionBuilder } from '@intenus/solver-sdk';
import { IntenusWalrusClient } from '@intenus/walrus';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// 1. Initialize Clients
const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
const walrusClient = new IntenusWalrusClient({ network: 'testnet' });
const listener = new SolverListener('redis://localhost:6379', walrusClient);
const signer = new Ed25519Keypair(); // Your solver's keypair

// 2. Subscribe to New Batches
listener.onNewBatch(async (batch, manifest) => {
  if (!manifest) {
    console.error(`Manifest for epoch ${batch.epoch} not found.`);
    return;
  }
  
  console.log(`Received batch for epoch ${batch.epoch} with ${manifest.intents.length} intents.`);
  
  // 3. Implement Solving Logic
  const solutionBuilder = new SolutionBuilder(batch.batch_id, signer.getPublicKey().toSuiAddress());
  
  // Your custom logic to find optimal solutions for intents in the manifest
  // For example, finding P2P matches or routing through DEXs
  
  // 4. Build and Submit Solution
  const solution = await solutionBuilder.build({ client: suiClient });
  await listener.submitSolution(solution);
  console.log(`Submitted solution for batch ${batch.batch_id}`);
});
```

### Client Application

This example shows how to use `IntentBuilder` to create an intent and `PTBExecutor` to sign and execute a transaction.

```typescript
import { IntentBuilder, PTBExecutor } from '@intenus/client-sdk';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// 1. Initialize Client and Executor
const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
const executor = new PTBExecutor(suiClient);
const userAddress = '0x...'; // User's Sui address
const keypair = new Ed25519Keypair(); // User's keypair for signing

// 2. Build an Intent
const intent = new IntentBuilder(userAddress)
  .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
  .constraints({ maxSlippageBps: 50 }) // 0.5% slippage
  .build();

// 3. Submit Intent to the protocol (via your backend)
// ...

// 4. Execute a Ranked Programmable Transaction Block (PTB)
// (Assuming you received a rankedPTB from the Intenus network)
const rankedPTB = { /* ... received from Intenus ... */ };
const result = await executor.execute(rankedPTB, keypair);

console.log('Execution successful, digest:', result.digest);
```

### Walrus Storage with Quilt Optimization

This example demonstrates storing multiple intents efficiently using Walrus Quilt.

```typescript
import { IntenusWalrusClient } from '@intenus/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new IntenusWalrusClient({ network: 'testnet' });
const signer = new Ed25519Keypair();

// A batch of intents to be stored
const intents = [
  { intent_id: 'intent_1', data: { /* ... */ }, category: 'swap' },
  { intent_id: 'intent_2', data: { /* ... */ }, category: 'lend' },
];

// 1. Analyze if Quilt is beneficial
const analysis = client.batches.calculateQuiltBenefit(intents.length, 512); // Assuming avg 512 bytes per intent
if (analysis.recommended) {
  console.log(`Quilt is recommended. Estimated savings: ${analysis.estimatedSavings?.toFixed(2)}%`);

  // 2. Store intents as a Quilt for cost efficiency
  const quiltResult = await client.batches.storeIntentsQuilt(intents, 'batch_abc', signer);
  console.log('Stored intents in quilt with Blob ID:', quiltResult.blobId);

  // 3. Fetch an individual intent from the Quilt
  const firstIntentPatchId = quiltResult.patches[0].patchId;
  const fetchedIntent = await client.batches.fetchIntentFromQuilt(firstIntentPatchId);
  console.log('Fetched individual intent:', fetchedIntent);
}
```

## Development

### Prerequisites

- Node.js (v18 or later)
- pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/intenus/sdks.git
cd sdks

# Install dependencies
pnpm install
```

### Common Commands

```bash
# Build all packages
pnpm build

# Run all tests
pnpm test

# Run type checking across the monorepo
pnpm typecheck

# Lint all packages
pnpm lint
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
