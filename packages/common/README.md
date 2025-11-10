# @intenus/common

**Pure TypeScript types** for the Intenus Protocol. This package contains only type definitions and constants - **zero runtime dependencies**.

## 📦 Installation

```bash
npm install @intenus/common
```

## 🎯 Purpose

Provides shared types and constants for the entire Intenus ecosystem. This is the **single source of truth** for all type definitions across solver and client implementations.

## 📚 Exported Types

### Intent Types
```typescript
import type { Intent, AssetSpec, Constraints } from '@intenus/common';

const intent: Intent = {
  intent_id: 'uuid-v4-string',
  user_address: '0x...',
  category: 'swap',
  timestamp: Date.now(),
  action: {
    type: 'swap_exact_in',
    params: { slippageBps: 50 }
  },
  assets: {
    inputs: [{ asset_id: '0x2::sui::SUI', amount: '1000000' }],
    outputs: [{ asset_id: '0x...::usdc::USDC' }]
  },
  constraints: {
    max_slippage_bps: 50,
    deadline_ms: Date.now() + 300_000
  },
  execution: {
    urgency: 'high',
    privacy_level: 'private'
  },
  metadata: {
    language: 'en',
    confidence: 1.0
  }
};
```

### Batch Types
```typescript
import type { Batch, BatchManifest, BatchStatus } from '@intenus/common';

const batch: Batch = {
  batch_id: 'batch-uuid',
  epoch: 123,
  status: BatchStatus.OPEN,
  created_at: Date.now(),
  intents: ['intent-id-1', 'intent-id-2'],
  manifest: {
    total_intents: 2,
    categories: ['swap'],
    privacy_levels: ['public', 'private']
  }
};
```

### Solution Types
```typescript
import type { SolutionSubmission, RankedPTB, SolutionOutcome } from '@intenus/common';

const solution: SolutionSubmission = {
  solution_id: 'solution-uuid',
  batch_id: 'batch-uuid',
  solver_address: '0xsolver...',
  outcomes: [
    {
      intent_id: 'intent-uuid',
      status: 'fulfilled',
      execution_price: '0.95',
      gas_estimate: '1000000'
    }
  ],
  ptb_bytes: 'base64-encoded-transaction',
  created_at: Date.now()
};

const rankedPTB: RankedPTB = {
  ptb_bytes: 'base64-encoded-transaction',
  rank: 1,
  solver_address: '0xsolver...',
  estimated_gas: '1000000',
  execution_score: 0.95
};
```

### Protocol Constants
```typescript
import { PROTOCOL_CONSTANTS, NETWORKS } from '@intenus/common';

// Protocol configuration
console.log(PROTOCOL_CONSTANTS.MIN_SOLVER_STAKE); // '1000000000000'
console.log(PROTOCOL_CONSTANTS.BATCH_TIMEOUT_MS); // 30000
console.log(PROTOCOL_CONSTANTS.MAX_INTENTS_PER_BATCH); // 100

// Network endpoints
console.log(NETWORKS.TESTNET.sui); // 'https://fullnode.testnet.sui.io'
console.log(NETWORKS.TESTNET.walrus); // 'https://walrus-testnet.mystenlabs.com'
console.log(NETWORKS.MAINNET.sui); // 'https://fullnode.mainnet.sui.io'
```

### Walrus Storage Path Types
```typescript
import type { WalrusPath } from '@intenus/common';

// Type-safe path construction
const intentPath: WalrusPath['intents'] = `/intents/123/intent-${intentId}.json`;
const batchPath: WalrusPath['batches'] = `/batches/123/manifest.json`;
const solutionPath: WalrusPath['solutions'] = `/solutions/123/solution-${solutionId}.json`;
```

## 🔧 Usage Patterns

### In Solver Applications
```typescript
import type { 
  Batch, 
  Intent, 
  SolutionSubmission, 
  SolutionOutcome 
} from '@intenus/common';
import { PROTOCOL_CONSTANTS } from '@intenus/common';

class MySolver {
  async processBatch(batch: Batch): Promise<SolutionSubmission> {
    const outcomes: SolutionOutcome[] = [];
    
    for (const intentId of batch.intents) {
      const intent = await this.fetchIntent(intentId);
      const outcome = await this.solveIntent(intent);
      outcomes.push(outcome);
    }
    
    return {
      solution_id: crypto.randomUUID(),
      batch_id: batch.batch_id,
      solver_address: this.address,
      outcomes,
      ptb_bytes: await this.buildPTB(outcomes),
      created_at: Date.now()
    };
  }
}
```

### In Client Applications  
```typescript
import type { Intent, RankedPTB } from '@intenus/common';
import { NETWORKS } from '@intenus/common';

class MyClient {
  async createSwapIntent(
    tokenIn: string, 
    amountIn: string, 
    tokenOut: string
  ): Promise<Intent> {
    return {
      intent_id: crypto.randomUUID(),
      user_address: this.userAddress,
      timestamp: Date.now(),
      category: 'swap',
      action: {
        type: 'swap_exact_in',
        params: { slippageBps: 50 }
      },
      assets: {
        inputs: [{ asset_id: tokenIn, amount: amountIn }],
        outputs: [{ asset_id: tokenOut }]
      },
      constraints: {
        max_slippage_bps: 50,
        deadline_ms: Date.now() + 300_000
      },
      execution: {
        urgency: 'normal',
        privacy_level: 'public'
      },
      metadata: {
        language: 'en',
        confidence: 1.0
      }
    };
  }
}
```

## ✅ What this package provides

- ✅ Complete TypeScript type definitions
- ✅ Protocol constants and configuration
- ✅ Enum definitions for all categories
- ✅ Type-safe Walrus storage paths
- ✅ Comprehensive JSDoc documentation
- ✅ Zero runtime dependencies

## ❌ What this package does NOT provide

- ❌ Runtime implementations or business logic
- ❌ SDK wrappers or abstractions
- ❌ Network communication utilities
- ❌ External service integrations

## 🏗️ Type Safety Benefits

Using `@intenus/common` ensures:

1. **Compile-time validation** - Catch type errors before runtime
2. **IntelliSense support** - Full autocomplete in your IDE
3. **Refactoring safety** - Changes propagate across your codebase
4. **Documentation** - Types serve as living documentation
5. **Version compatibility** - Ensure all packages use consistent types

## 🔗 Related Packages

- [`@intenus/solver-sdk`](../solver-sdk) - Optional solver development utilities
- [`@intenus/client-sdk`](../client-sdk) - Optional client application helpers

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.