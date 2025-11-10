# @intenus/solver-sdk

**OPTIONAL helpers** cho building Intenus solvers. Solvers có thể implement everything từ scratch nếu muốn.

## 📦 Installation

```bash
pnpm add @intenus/solver-sdk @mysten/sui.js @walrus/sdk @seal/sdk
```

## 🎯 Purpose

Cung cấp **convenience helpers** cho solver developers. Tất cả helpers đều là **OPTIONAL** - solvers có thể sử dụng underlying SDKs trực tiếp.

## 🚀 Quick Start

### Option 1: Using SDK Helpers (Recommended cho beginners)

```typescript
import { SolverListener, SolutionBuilder } from '@intenus/solver-sdk';

const listener = new SolverListener('redis://localhost');
listener.onNewBatch(async (batch) => {
  const builder = new SolutionBuilder(batch.batch_id, '0x...');
  // Build solution...
  await listener.submitSolution(solution);
});
```

### Option 2: Direct SDK Usage (Maximum flexibility)

```typescript
import Redis from 'ioredis';
import { WalrusClient } from '@walrus/sdk';
import { SuiClient } from '@mysten/sui.js/client';

const redis = new Redis('redis://localhost');
const walrus = new WalrusClient({ url: '...' });
const sui = new SuiClient({ url: '...' });

// Full control over implementation
```

## 📚 API Reference

### SolverListener

**OPTIONAL helper** cho Redis subscriptions.

**Bạn có thể thay thế bằng Redis client riêng.**

```typescript
class SolverListener {
  constructor(redisUrl: string);
  
  onNewBatch(callback: (batch: Batch) => Promise<void>): void;
  submitSolution(solution: SolutionSubmission): Promise<void>;
  sendHeartbeat(solverAddress: string): Promise<void>;
  close(): Promise<void>;
}
```

**Alternative (direct Redis usage):**
```typescript
import Redis from 'ioredis';

const redis = new Redis('redis://localhost');
await redis.subscribe('solver:batch:new');
redis.on('message', (channel, message) => {
  // Handle batch
});
```

### SolutionBuilder

**OPTIONAL helper** cho building PTBs.

**Bạn có thể build PTBs trực tiếp với @mysten/sui.js.**

```typescript
class SolutionBuilder {
  constructor(batchId: string, solverAddress: string);
  
  addOutcome(outcome: SolutionOutcome): void;
  getPTB(): TransactionBlock; // Access underlying PTB
  build(): Promise<{ submission, ptbBytes }>;
}
```

**Alternative (direct PTB building):**
```typescript
import { TransactionBlock } from '@mysten/sui.js/transactions';

const ptb = new TransactionBlock();
// Build PTB manually
const ptbBytes = await ptb.build();
```

### P2PMatcher

**OPTIONAL reference implementation.**

**Bạn nên implement optimized matcher riêng.**

```typescript
class P2PMatcher {
  findMatches(intents: Intent[]): P2PMatch[];
}
```

### Utility Functions

```typescript
// OPTIONAL helpers
import { addP2PTransfer, getSealPolicyForIntent, hashBytes } from '@intenus/solver-sdk';

// Add P2P transfer to PTB
addP2PTransfer(ptb, from, to, coinType, amount);

// Get Seal policy ID
const policyId = getSealPolicyForIntent(intentId);

// Hash bytes
const hash = await hashBytes(data);
```

## 📖 Examples

### Basic Solver (với SDK)
```typescript
import { SolverListener, SolutionBuilder, P2PMatcher } from '@intenus/solver-sdk';
import { WalrusClient } from '@walrus/sdk';

class BasicSolver {
  private listener = new SolverListener(redisUrl);
  private walrus = new WalrusClient({ url });
  private matcher = new P2PMatcher();
  
  async start() {
    this.listener.onNewBatch(async (batch) => {
      const intents = await this.fetchIntents(batch);
      const matches = this.matcher.findMatches(intents);
      
      const builder = new SolutionBuilder(batch.batch_id, solverAddress);
      // Add outcomes...
      
      const { submission, ptbBytes } = await builder.build();
      await this.listener.submitSolution(submission);
    });
  }
}
```

### Advanced Solver (KHÔNG dùng SDK)
```typescript
import Redis from 'ioredis';
import { WalrusClient } from '@walrus/sdk';
import { TransactionBlock } from '@mysten/sui.js/transactions';

class AdvancedSolver {
  private redis = new Redis(redisUrl);
  private walrus = new WalrusClient({ url });
  
  async start() {
    await this.redis.subscribe('solver:batch:new');
    this.redis.on('message', async (channel, message) => {
      // Custom implementation
      const ptb = new TransactionBlock();
      // Build PTB manually
    });
  }
}
```

## ⚠️ Important Notes

1. **Tất cả helpers đều OPTIONAL** - Sử dụng nếu convenient, skip nếu cần flexibility
2. **Không wrap underlying SDKs** - Walrus, Seal, Sui SDKs được sử dụng trực tiếp
3. **Reference implementations** - P2PMatcher chỉ là example, solvers nên optimize
4. **Maximum freedom** - Solvers có full control, có thể bypass SDK hoàn toàn

## 🔗 See Also

- [Examples](../../examples/solver-basic) - Full solver implementations
- [Advanced Example](../../examples/solver-advanced) - Direct SDK usage
- [@intenus/common](../common) - Shared types

## 📄 License

MIT
