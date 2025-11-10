# @intenus/common

The `@intenus/common` package is the foundational module for the Intenus SDK ecosystem. It provides a comprehensive set of shared TypeScript type definitions, protocol constants, and essential utilities. This package has zero runtime dependencies, ensuring it can be used in any environment without adding bloat.

## Installation
```bash
npm install @intenus/common
```

## Purpose

This package serves as the single source of truth for all data structures within the Intenus Protocol. By centralizing these core definitions, it ensures consistency and type safety across all client, solver, and backend implementations.

## Core Exports

### Type Definitions

The package exports a rich set of types covering the entire protocol lifecycle.

**Example: Core `Intent` Structure**
```typescript
import type { Intent } from '@intenus/common';

const swapIntent: Intent = {
  intent_id: 'd8f8a8-....',
  user_address: '0x...',
  category: 'swap',
  timestamp: Date.now(),
  action: {
    type: 'swap_exact_in',
    params: { slippageBps: 50 } // 0.5%
  },
  assets: {
    inputs: [{ asset_id: '0x2::sui::SUI', amount: '1000000' }], // 1 SUI
    outputs: [{ asset_id: '0x...::usdc::USDC' }]
  },
  constraints: {
    max_slippage_bps: 50,
    deadline_ms: Date.now() + 300_000 // 5 minutes
  },
  // ... and other properties
};
```

Other key types include:
- `Batch` & `BatchManifest`: Structures for grouping and describing batches of intents.
- `SolutionSubmission` & `RankedPTB`: Data formats for solvers to submit solutions.
- **Walrus AI Types**: A complete set of types for AI/ML data infrastructure on Walrus, including `BatchArchive`, `UserHistoryAggregated`, `TrainingDatasetMetadata`, and `ModelMetadata`.

### Protocol Constants & Configuration

Provides access to critical protocol parameters and network configurations, configurable via environment variables.

```typescript
import { PROTOCOL_CONSTANTS, NETWORKS, REDIS_CONFIG } from '@intenus/common';

// Access protocol parameters
console.log(`Minimum solver stake: ${PROTOCOL_CONSTANTS.MIN_SOLVER_STAKE}`);

// Access network endpoints
console.log(`Sui Testnet RPC: ${NETWORKS.TESTNET.sui}`);
console.log(`Walrus Testnet Publisher: ${NETWORKS.TESTNET.walrus.publisher}`);

// Access Redis configuration
console.log(`Redis URL: ${REDIS_CONFIG.url}`);
```

### Environment Utilities

A set of safe utility functions for accessing environment variables in both Node.js and browser contexts.

```typescript
import { getEnv, getRequiredEnv, getEnvNumber } from '@intenus/common';

// Get an optional variable with a fallback
const redisUrl = getEnv('REDIS_URL', 'redis://localhost:6379');

// Get a required variable, which throws if not set
const suiRpcUrl = getRequiredEnv('SUI_RPC_URL');

// Get a variable as a number
const batchSize = getEnvNumber('MAX_BATCH_SIZE', 100);
```

## Usage

This package is intended to be used as a dependency in any project interacting with the Intenus Protocol.

### Solver Application
```typescript
import type { Batch, SolutionSubmission, SolutionOutcome } from '@intenus/common';

class MySolver {
  processBatch(batch: Batch): SolutionSubmission {
    // Implement solver logic with guaranteed type safety
    const outcomes: SolutionOutcome[] = [];
    // ...
    return { /* ... solution submission object ... */ };
  }
}
```

### Client Application
```typescript
import type { Intent } from '@intenus/common';

class MyClient {
  createSwapIntent(/* ... */): Intent {
    // Construct a type-safe intent object
    return { /* ... intent object ... */ };
  }
}
```

## Package Philosophy

- **What it provides**:
  - A complete set of TypeScript type definitions for the Intenus Protocol.
  - Centralized protocol constants and network configurations.
  - Type-safe utilities for environment variables and Walrus storage paths.
  - Comprehensive JSDoc annotations for all types and constants.

- **What it does NOT provide**:
  - Runtime implementations or business logic.
  - Abstractions over other SDKs.
  - Network communication or external service integrations.

By adhering to this philosophy, `@intenus/common` remains a lightweight, portable, and essential foundation for the ecosystem.

## Related Packages

- [`@intenus/solver-sdk`](../solver-sdk): Optional utilities for solver development.
- [`@intenus/client-sdk`](../client-sdk): Optional helpers for building client applications.
- [`@intenus/walrus`](../walrus): A structured storage client for Walrus.