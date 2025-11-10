# Intenus TypeScript SDKs

Minimal TypeScript SDKs for the Intenus Protocol. Provides types, utilities, and **optional** helpers for solvers and clients.

## 🎯 Design Principles

- **Composition over Abstraction**: Direct integration with Walrus, Seal, and Sui SDKs
- **Type-first Architecture**: Focus on type safety and developer experience
- **Zero Vendor Lock-in**: Solvers can bypass SDK helpers when needed
- **Tree-shakeable**: Import only what you need

## 📦 Packages

### [@intenus/common](./packages/common)

**Pure TypeScript types** - Zero runtime dependencies

- `Intent`, `Batch`, `Solution` type definitions
- Protocol constants and configuration
- Walrus storage path types

### [@intenus/solver-sdk](./packages/solver-sdk)

**Optional utilities** for solver developers

- `SolverListener` - Redis subscription management
- `SolutionBuilder` - Transaction composition utilities  
- `P2PMatcher` - Reference matching implementation

### [@intenus/client-sdk](./packages/client-sdk)

**Optional utilities** for client applications

- `IntentBuilder` - Fluent intent construction API
- `PTBExecutor` - Transaction signing and submission utilities

### [@intenus/walrus](./packages/walrus)

**Walrus storage wrapper** with AI infrastructure standards

- `IntenusWalrusClient` - Structured storage services (batches, archives, users, training)
- `StoragePathBuilder` - Type-safe path construction
- SOLID principles with Strategy, Builder, and Facade patterns

## 🚀 Quick Start

### Installation

For solver development:

```bash
npm install @intenus/solver-sdk @mysten/sui @mysten/walrus @mysten/seal ioredis
```

For client applications:

```bash
npm install @intenus/client-sdk @mysten/sui @mysten/walrus @mysten/seal
```

For Walrus storage:

```bash
npm install @intenus/walrus @mysten/walrus @mysten/sui
```

For type definitions only:

```bash
npm install @intenus/common
```

### Solver Implementation (with SDK utilities)

```typescript
import { SolverListener, SolutionBuilder } from '@intenus/solver-sdk';
import { WalrusClient } from '@mysten/walrus';
import { SuiClient } from '@mysten/sui/client';

const listener = new SolverListener('redis://localhost:6379');
const walrus = new WalrusClient({ url: 'https://walrus-testnet.mystenlabs.com' });
const sui = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

listener.onNewBatch(async (batch) => {
  const builder = new SolutionBuilder(batch.batch_id, '0xsolver_address');
  
  // Implement your solving logic
  for (const intent of batch.intents) {
    // Add solution outcomes
    builder.addOutcome(intent.intent_id, { /* solution data */ });
  }
  
  const solution = await builder.build();
  await listener.submitSolution(solution);
});

await listener.start();
```

### Solver Implementation (direct SDK usage)

```typescript
import Redis from 'ioredis';
import { WalrusClient } from '@mysten/walrus';
import { SuiClient } from '@mysten/sui/client';
import type { Batch, SolutionSubmission } from '@intenus/common';

const redis = new Redis('redis://localhost:6379');
const walrus = new WalrusClient({ url: 'https://walrus-testnet.mystenlabs.com' });
const sui = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

// Full control - implement custom solving logic
redis.subscribe('intenus:batches');
redis.on('message', async (channel, message) => {
  const batch: Batch = JSON.parse(message);
  // Custom implementation
});
```

### Client Application

```typescript
import { IntentBuilder, PTBExecutor } from '@intenus/client-sdk';
import { SuiClient } from '@mysten/sui/client';

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

// Build intent with fluent API
const intent = new IntentBuilder('0xclient_address')
  .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
  .private(true)
  .urgency('high')
  .build();

// Execute ranked transaction
const executor = new PTBExecutor(client);
const result = await executor.execute(rankedPTB, wallet);
```

## 📚 Examples

### Walrus Storage

```typescript
import { IntenusWalrusClient } from '@intenus/walrus';

const client = new IntenusWalrusClient({
  network: 'testnet',
});

// Store batch manifest
const manifest = {
  batch_id: 'batch_12345',
  epoch: 1000,
  intent_count: 100,
  intents: [/* ... */],
  categories: { swap: 80, lending: 20 },
  estimated_value_usd: 50000,
  solver_deadline: Date.now() + 5000,
  created_at: Date.now(),
  requirements: {
    min_tee_verification: true,
    min_stake_required: '1000000000000',
    max_solutions_per_solver: 1,
  },
};

const result = await client.batches.storeManifest(manifest, signer);
console.log('Stored:', result.blob_id);

// Fetch batch manifest
const fetchedManifest = await client.batches.fetchManifest(1000);
```

### Additional Examples

- [Basic Solver](./examples/solver-basic) - Getting started with solver development
- [Advanced Solver](./examples/solver-advanced) - Custom implementation patterns  
- [Client Application](./examples/client-basic) - Intent creation and execution

## 🔧 Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run test suite
pnpm test

# Type checking
pnpm typecheck

# Code linting
pnpm lint
```

## 📖 Documentation

Each package includes comprehensive API documentation:

- [Common Types](./packages/common/README.md) - Type definitions and constants
- [Solver SDK](./packages/solver-sdk/README.md) - Solver development utilities
- [Client SDK](./packages/client-sdk/README.md) - Client application helpers

## 🏗️ Architecture

The Intenus SDKs follow a modular architecture:

1. **@intenus/common** - Shared type definitions (zero dependencies)
2. **@intenus/solver-sdk** - Optional solver utilities (depends on common)
3. **@intenus/client-sdk** - Optional client utilities (depends on common)

This design ensures maximum flexibility while providing helpful abstractions when needed.

## ⚠️ Important Notes

1. **SDK utilities are optional** - Use underlying Walrus, Seal, and Sui SDKs directly when needed
2. **No SDK wrapping** - Direct integration with existing Mysten Labs SDKs
3. **Type-first approach** - Comprehensive TypeScript support throughout
4. **Production ready** - Battle-tested in live trading environments

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.
