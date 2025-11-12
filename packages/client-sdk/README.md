# @intenus/client-sdk

Optional utilities for building client applications on the Intenus Protocol. This package provides high-level helpers to simplify common tasks such as intent creation and transaction execution.

## Installation

```bash
npm install @intenus/client-sdk @mysten/sui @mysten/walrus @mysten/seal
```

## Purpose

This package is designed to accelerate client-side development by offering convenient, optional abstractions. Developers retain the flexibility to bypass these helpers and interact directly with the underlying Sui, Walrus, and Seal SDKs for maximum control.

## Core Utilities

### `IntentBuilder`

A fluent API for programmatic and type-safe construction of `Intent` objects.

**Example: Creating a Swap Intent**

```typescript
import { IntentBuilder } from '@intenus/client-sdk';

const userAddress = '0x...'; // The user's Sui address

// Construct a simple swap intent
const swapIntent = new IntentBuilder(userAddress)
  .swap(
    '0x2::sui::SUI',      // From asset
    '1000000000',         // 1 SUI (in MIST)
    '0x...::usdc::USDC'  // To asset
  )
  .build();

// Construct an advanced swap with constraints and preferences
const advancedSwapIntent = new IntentBuilder(userAddress)
  .swap('0x2::sui::SUI', '1000000000', '0x...::usdc::USDC')
  .constraints({ 
    max_slippage_bps: 50, // 0.5%
    deadline: Date.now() + 300000 // 5-minute deadline
  })
  .execution({
    auto_execute: true,
    show_top_n: 1
  })
  .private(true)
  .build();
```

### `PTBExecutor`

A utility for signing and submitting ranked Programmable Transaction Blocks (PTBs) received from the Intenus network. It simplifies simulation, gas estimation, and execution.

**Example: Executing a Solution**

```typescript
import { PTBExecutor } from '@intenus/client-sdk';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
const keypair = new Ed25519Keypair(); // User's keypair for signing

const executor = new PTBExecutor(suiClient);

// Assume rankedPTB is received from the Intenus network
const rankedPTB = { /* ... a ranked solution ... */ };

// 1. Simulate the transaction to ensure it will succeed
const simulationResult = await executor.simulate(rankedPTB);

if (simulationResult.effects?.status?.status !== 'success') {
  throw new Error(`Transaction simulation failed: ${simulationResult.effects?.status?.error}`);
}

// 2. Sign and execute the transaction
const transactionDigest = await executor.execute(rankedPTB, keypair);

console.log('Transaction executed successfully. Digest:', transactionDigest);
```

### `WalrusIntentHelper`

An optional helper for storing intents on Walrus, which can be useful for applications that manage intent lifecycle directly.

```typescript
import { WalrusIntentHelper } from '@intenus/client-sdk';
import { IntenusWalrusClient } from '@intenus/walrus';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const walrusClient = new IntenusWalrusClient({ network: 'testnet' });
const signer = new Ed25519Keypair();

const helper = new WalrusIntentHelper(walrusClient);
const intent = { /* ... an Intent object ... */ };

const result = await helper.storeIntent(intent, signer);
console.log('Intent stored on Walrus. Blob ID:', result.blob_id);
```

## Flexibility: Manual Implementation

While the SDK helpers are convenient, you always have the option to build and execute transactions manually for custom logic or deeper integration.

```typescript
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import type { Intent, RankedPTB } from '@intenus/common';

const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

// 1. Manually construct an Intent object
const manualIntent: Intent = {
  igs_version: '1.0.0',
  intent_id: crypto.randomUUID(),
  user_address: '0x...',
  created_at: Date.now(),
  intent_type: 'swap.exact_input',
  description: 'Manual swap',
  // ... other IGS properties
};

// 2. Manually execute a ranked PTB
async function executeManually(rankedPTB: RankedPTB, signer: Ed25519Keypair) {
  const txb = Transaction.from(rankedPTB.ptb_bytes);
  
  const { signature } = await signer.signTransactionBlock(await txb.build({ client: suiClient }));
  
  const result = await suiClient.executeTransactionBlock({
    transactionBlock: txb.serialize(),
    signature,
    options: { showEffects: true }
  });

  return result.digest;
}
```

## Related Packages

- [`@intenus/common`](../common): Provides the core type definitions like `Intent` and `RankedPTB`.
- [`@intenus/walrus`](../walrus): The underlying client for interacting with Walrus storage.
- **Sui SDK**: The official SDK for all core Sui blockchain interactions.
