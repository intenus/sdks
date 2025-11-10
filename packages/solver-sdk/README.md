# @intenus/solver-sdk

**Optional utilities** for building Intenus solvers. Solvers can implement everything from scratch using underlying SDKs if preferred.

## 📦 Installation

```bash
npm install @intenus/solver-sdk @mysten/sui @mysten/walrus @mysten/seal ioredis
```

## 🎯 Purpose

Provides **convenience utilities** for solver developers. All utilities are **completely optional** - solvers can use underlying Walrus, Seal, and Sui SDKs directly for maximum control.

## 🚀 Quick Start

### Option 1: Using SDK Utilities (Recommended for rapid development)

```typescript
import { SolverListener, SolutionBuilder } from '@intenus/solver-sdk';
import { WalrusClient } from '@mysten/walrus';
import { SuiClient } from '@mysten/sui/client';

const listener = new SolverListener('redis://localhost:6379');
const walrus = new WalrusClient({ url: 'https://walrus-testnet.mystenlabs.com' });
const sui = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

listener.onNewBatch(async (batch) => {
  const builder = new SolutionBuilder(batch.batch_id, '0xsolver_address');
  
  // Fetch and process intents
  for (const intentId of batch.intents) {
    const intent = await fetchIntentFromWalrus(intentId);
    const outcome = await solveIntent(intent);
    builder.addOutcome(outcome);
  }
  
  const solution = await builder.build();
  await listener.submitSolution(solution);
});

await listener.start();
```

### Option 2: Direct SDK Usage (Maximum flexibility)

```typescript
import Redis from 'ioredis';
import { WalrusClient } from '@mysten/walrus';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import type { Batch, SolutionSubmission } from '@intenus/common';

const redis = new Redis('redis://localhost:6379');
const walrus = new WalrusClient({ url: 'https://walrus-testnet.mystenlabs.com' });
const sui = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

// Full control over implementation
await redis.subscribe('intenus:batches');
redis.on('message', async (channel, message) => {
  const batch: Batch = JSON.parse(message);
  
  // Custom solving logic
  const ptb = new Transaction();
  // Build transaction manually...
  
  const solution: SolutionSubmission = {
    solution_id: crypto.randomUUID(),
    batch_id: batch.batch_id,
    solver_address: '0xsolver_address',
    outcomes: [], // Your custom outcomes
    ptb_bytes: await ptb.build({ client: sui }),
    created_at: Date.now()
  };
  
  // Submit via your own mechanism
});
```

## 📚 API Reference

### SolverListener

**Optional utility** for Redis batch notifications.

**Alternative**: Use Redis client directly for full control.

```typescript
class SolverListener {
  constructor(redisUrl: string, options?: RedisOptions);
  
  // Event handlers
  onNewBatch(callback: (batch: Batch) => Promise<void>): void;
  onBatchUpdate(callback: (update: BatchUpdate) => Promise<void>): void;
  
  // Actions
  submitSolution(solution: SolutionSubmission): Promise<void>;
  sendHeartbeat(solverAddress: string): Promise<void>;
  
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

**Usage:**
```typescript
const listener = new SolverListener('redis://localhost:6379');

listener.onNewBatch(async (batch) => {
  console.log(`Processing batch ${batch.batch_id} with ${batch.intents.length} intents`);
  // Your solving logic here
});

await listener.start();
```

**Direct Redis alternative:**
```typescript
import Redis from 'ioredis';

const redis = new Redis('redis://localhost:6379');
await redis.subscribe('intenus:batches', 'intenus:updates');

redis.on('message', async (channel, message) => {
  if (channel === 'intenus:batches') {
    const batch: Batch = JSON.parse(message);
    // Handle new batch
  } else if (channel === 'intenus:updates') {
    const update = JSON.parse(message);
    // Handle batch update
  }
});
```

### SolutionBuilder

**Optional utility** for constructing solution submissions.

**Alternative**: Build `Transaction` objects directly with `@mysten/sui`.

```typescript
class SolutionBuilder {
  constructor(batchId: string, solverAddress: string);
  
  // Add solution outcomes
  addOutcome(outcome: SolutionOutcome): void;
  addSwapOutcome(intentId: string, executionPrice: string, gasEstimate: string): void;
  addFailedOutcome(intentId: string, reason: string): void;
  
  // Access underlying transaction
  getPTB(): Transaction;
  
  // Build final solution
  build(options?: BuildOptions): Promise<{
    submission: SolutionSubmission;
    ptbBytes: Uint8Array;
  }>;
}
```

**Usage:**
```typescript
const builder = new SolutionBuilder(batch.batch_id, '0xsolver_address');

// Add successful swap outcome
builder.addSwapOutcome('intent-1', '0.95', '1000000');

// Add failed outcome
builder.addFailedOutcome('intent-2', 'Insufficient liquidity');

// Access underlying PTB for custom operations
const ptb = builder.getPTB();
ptb.moveCall({
  target: '0x...::custom::function',
  arguments: [/* custom args */]
});

const { submission, ptbBytes } = await builder.build();
```

**Direct Transaction alternative:**
```typescript
import { Transaction } from '@mysten/sui/transactions';

const ptb = new Transaction();

// Build transaction manually
ptb.moveCall({
  target: '0x...::swap::execute',
  arguments: [/* swap args */]
});

const ptbBytes = await ptb.build({ client: sui });

const solution: SolutionSubmission = {
  solution_id: crypto.randomUUID(),
  batch_id: batch.batch_id,
  solver_address: '0xsolver_address',
  outcomes: [
    {
      intent_id: 'intent-1',
      status: 'fulfilled',
      execution_price: '0.95',
      gas_estimate: '1000000'
    }
  ],
  ptb_bytes: Buffer.from(ptbBytes).toString('base64'),
  created_at: Date.now()
};
```

### P2PMatcher

**Optional reference implementation** for peer-to-peer intent matching.

**Note**: This is a basic implementation. Production solvers should implement optimized matching algorithms.

```typescript
class P2PMatcher {
  findMatches(intents: Intent[]): P2PMatch[];
  findSwapMatches(swapIntents: Intent[]): SwapMatch[];
  calculateMatchScore(intentA: Intent, intentB: Intent): number;
}

interface P2PMatch {
  intentA: string;
  intentB: string;
  matchType: 'direct_swap' | 'partial_fill';
  score: number;
  estimatedGas: string;
}
```

**Usage:**
```typescript
const matcher = new P2PMatcher();
const intents = await fetchIntentsFromBatch(batch);
const matches = matcher.findMatches(intents);

for (const match of matches) {
  if (match.score > 0.8) {
    // Execute high-quality match
    builder.addSwapOutcome(match.intentA, match.executionPrice, match.estimatedGas);
    builder.addSwapOutcome(match.intentB, match.executionPrice, match.estimatedGas);
  }
}
```

### Utility Functions

```typescript
// Transaction building utilities
import { 
  addP2PTransfer, 
  getSealPolicyForIntent, 
  hashBytes,
  validateIntentSignature
} from '@intenus/solver-sdk';

// Add peer-to-peer transfer to transaction
addP2PTransfer(ptb, fromAddress, toAddress, coinType, amount);

// Get Seal encryption policy for intent
const policyId = getSealPolicyForIntent(intentId);

// Hash data for verification
const hash = await hashBytes(data);

// Validate intent signature
const isValid = await validateIntentSignature(intent, signature);
```

## 📖 Complete Examples

### Production Solver (with SDK utilities)

```typescript
import { SolverListener, SolutionBuilder, P2PMatcher } from '@intenus/solver-sdk';
import { WalrusClient } from '@mysten/walrus';
import { SuiClient } from '@mysten/sui/client';
import { SealClient } from '@mysten/seal';

class ProductionSolver {
  private listener = new SolverListener(process.env.REDIS_URL!);
  private walrus = new WalrusClient({ 
    url: process.env.WALRUS_URL! 
  });
  private sui = new SuiClient({ 
    url: process.env.SUI_RPC_URL! 
  });
  private seal = new SealClient({
    network: 'testnet'
  });
  private matcher = new P2PMatcher();
  
  async start() {
    this.listener.onNewBatch(async (batch) => {
      try {
        await this.processBatch(batch);
      } catch (error) {
        console.error(`Failed to process batch ${batch.batch_id}:`, error);
      }
    });
    
    await this.listener.start();
    console.log('Solver started successfully');
  }
  
  private async processBatch(batch: Batch) {
    // Fetch intents from Walrus
    const intents = await Promise.all(
      batch.intents.map(id => this.fetchIntent(id))
    );
    
    // Find P2P matches
    const matches = this.matcher.findMatches(intents);
    
    // Build solution
    const builder = new SolutionBuilder(batch.batch_id, this.solverAddress);
    
    for (const match of matches) {
      if (match.score > 0.8) {
        // Execute high-quality matches
        await this.executeP2PMatch(match, builder);
      }
    }
    
    // Handle remaining intents via DEX
    const unmatched = intents.filter(intent => 
      !matches.some(m => m.intentA === intent.intent_id || m.intentB === intent.intent_id)
    );
    
    for (const intent of unmatched) {
      await this.executeDEXSwap(intent, builder);
    }
    
    // Submit solution
    const solution = await builder.build();
    await this.listener.submitSolution(solution.submission);
  }
  
  private async fetchIntent(intentId: string): Promise<Intent> {
    const blobId = await this.getBlobIdForIntent(intentId);
    const encrypted = await this.walrus.download(blobId);
    const decrypted = await this.seal.decrypt(encrypted);
    return JSON.parse(decrypted);
  }
}
```

### Custom Solver (direct SDK usage)

```typescript
import Redis from 'ioredis';
import { WalrusClient } from '@mysten/walrus';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import type { Batch, Intent, SolutionSubmission } from '@intenus/common';

class CustomSolver {
  private redis = new Redis(process.env.REDIS_URL!);
  private walrus = new WalrusClient({ url: process.env.WALRUS_URL! });
  private sui = new SuiClient({ url: process.env.SUI_RPC_URL! });
  
  async start() {
    await this.redis.subscribe('intenus:batches');
    
    this.redis.on('message', async (channel, message) => {
      if (channel === 'intenus:batches') {
        const batch: Batch = JSON.parse(message);
        await this.processCustomBatch(batch);
      }
    });
  }
  
  private async processCustomBatch(batch: Batch) {
    // Custom solving algorithm
    const ptb = new Transaction();
    const outcomes = [];
    
    for (const intentId of batch.intents) {
      const intent = await this.fetchIntent(intentId);
      
      // Custom matching and execution logic
      if (await this.canSolveIntent(intent)) {
        this.addCustomSolution(ptb, intent);
        outcomes.push({
          intent_id: intentId,
          status: 'fulfilled' as const,
          execution_price: await this.calculatePrice(intent),
          gas_estimate: '1000000'
        });
      } else {
        outcomes.push({
          intent_id: intentId,
          status: 'failed' as const,
          failure_reason: 'Custom solver cannot handle this intent'
        });
      }
    }
    
    // Build and submit solution
    const ptbBytes = await ptb.build({ client: this.sui });
    
    const solution: SolutionSubmission = {
      solution_id: crypto.randomUUID(),
      batch_id: batch.batch_id,
      solver_address: this.solverAddress,
      outcomes,
      ptb_bytes: Buffer.from(ptbBytes).toString('base64'),
      created_at: Date.now()
    };
    
    // Submit via custom mechanism
    await this.submitSolutionCustom(solution);
  }
}
```

## ⚠️ Important Notes

1. **All utilities are optional** - Use when convenient, skip when you need full control
2. **No SDK wrapping** - Direct integration with Walrus, Seal, and Sui SDKs
3. **Reference implementations** - P2PMatcher is basic; implement optimized algorithms for production
4. **Maximum flexibility** - Solvers have complete freedom to bypass utilities entirely
5. **Production ready** - Utilities are battle-tested but can be replaced with custom implementations

## 🔗 Related Resources

- [Complete Examples](../../examples/solver-basic) - Full solver implementations
- [Advanced Patterns](../../examples/solver-advanced) - Direct SDK usage patterns
- [@intenus/common](../common) - Shared type definitions
- [Sui SDK Documentation](https://sdk.mystenlabs.com/typescript) - Direct Sui integration
- [Walrus Documentation](https://docs.walrus.site) - Direct Walrus integration

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.