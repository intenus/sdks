# @intenus/solver-sdk

Optional utilities for building solvers on the Intenus Protocol. This package provides high-level helpers for common solver tasks, such as subscribing to batches and constructing solutions.

## Installation

```bash
npm install @intenus/solver-sdk @mysten/sui @mysten/walrus @mysten/seal ioredis
```

## Purpose

This package is designed to accelerate solver development by offering convenient, optional abstractions. Developers retain the flexibility to bypass these helpers and implement their own logic using the underlying Sui, Walrus, and Seal SDKs directly.

## Core Utilities

### `SolverListener`

A utility for managing Redis subscriptions to receive new batch notifications from the Intenus network. It can be integrated with `@intenus/walrus` to automatically fetch the full `BatchManifest` from Walrus.

**Example: Subscribing to New Batches**

```typescript
import { SolverListener } from '@intenus/solver-sdk';
import { IntenusWalrusClient } from '@intenus/walrus';

const walrusClient = new IntenusWalrusClient({ network: 'testnet' });

// Initialize listener with optional Walrus client for manifest fetching
const listener = new SolverListener('redis://localhost:6379', walrusClient);

listener.onNewBatch(async (batch, manifest) => {
  // The manifest is automatically fetched from Walrus if the client is provided
  if (!manifest) {
    console.warn(`Could not fetch manifest for epoch ${batch.epoch}`);
    return;
  }

  console.log(`Processing batch ${batch.batch_id} with ${manifest.intents.length} intents.`);
  // ... implement your solving logic here ...
});
```

### `IGSSolutionBuilder`

A helper for programmatically constructing an `IGSSolution` and its associated Programmable Transaction Block (PTB) from an `Intent`.

**Example: Building a Solution**

```typescript
import { IGSSolutionBuilder } from '@intenus/solver-sdk';
import { SuiClient } from '@mysten/sui/client';
import type { Intent } from '@intenus/common';

const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
const solverAddress = '0x...';
const intent: Intent = { /* ... received from the network ... */ };

const builder = new IGSSolutionBuilder(intent, { solver_address: solverAddress });

// Add promised outputs for the solution
builder.addPromisedOutput({
  asset_id: '0x...::usdc::USDC',
  amount: '100500000', // 100.5 USDC, representing a surplus
});

// Access the underlying Transaction object for custom PTB modifications
const txb = builder.getPTB();
txb.moveCall({
  target: '0x...::dex::swap_exact_in',
  arguments: [/* ... */],
});

// Build the final, signed solution ready for submission
const { solution } = await builder.build({ client: suiClient });

await listener.submitSolution(solution);
```

### `WalrusBatchFetcher`

An optional utility for fetching and decrypting batch data and intents from Walrus. This is used internally by `SolverListener` but can also be used standalone.

**Example: Manually Fetching Intents**

```typescript
import { WalrusBatchFetcher } from '@intenus/solver-sdk';
import { IntenusWalrusClient } from '@intenus/walrus';
import { SealClient } from '@mysten/seal';

const walrusClient = new IntenusWalrusClient({ network: 'testnet' });
const sealClient = new SealClient({ network: 'testnet' }); // For decryption

const fetcher = new WalrusBatchFetcher(walrusClient);

// 1. Fetch the manifest for a given epoch
const manifest = await fetcher.fetchBatchManifest(1234);

// 2. Fetch and automatically decrypt all intents in the manifest
const intents = await fetcher.fetchIntents(manifest, sealClient);

console.log(`Fetched ${intents.length} intents.`);
```

## Flexibility: Manual Implementation

For maximum control, you can bypass all helpers and interact with the underlying libraries directly.

```typescript
import Redis from 'ioredis';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import type { Batch, IGSSolution, Intent } from '@intenus/common';

const redis = new Redis('redis://localhost:6379');
const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

redis.subscribe('intenus:batches:new');

redis.on('message', async (channel, message) => {
  const batch: Batch = JSON.parse(message);
  
  // 1. Manually fetch and decrypt intents from Walrus
  // ...
  
  // 2. Custom solving logic
  const txb = new Transaction();
  // ... manually build your PTB ...
  
  // 3. Manually construct the solution submission
  const solution: IGSSolution = {
    solution_id: crypto.randomUUID(),
    intent_id: 'intent_abc',
    solver_address: '0x...',
    promised_outputs: [ /* ... */ ],
    ptb_bytes: Buffer.from(await txb.build({ client: suiClient })).toString('hex'),
    // ... other IGS solution properties
  };
  
  // 4. Submit through your own Redis channel or API
  await redis.publish('intenus:solutions', JSON.stringify(solution));
});
```

## Related Packages

- [`@intenus/common`](../common): Provides the core type definitions like `Batch`, `Intent` (IGS), and `IGSSolution`.
- [`@intenus/walrus`](../walrus): The underlying client for interacting with Walrus storage.
- **Sui SDK**: The official SDK for all core Sui blockchain interactions.
- **ioredis**: The Redis client used for pub/sub messaging.
