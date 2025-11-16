# @intenus/solver-sdk

SDK for building solvers on Intenus Protocol - utilities for batch notifications, solution building, and IGS integration.

## Installation

```bash
npm install @intenus/solver-sdk @mysten/sui @intenus/common
```

## Features

- **Batch Listener** - Redis subscriptions for batch notifications
- **Solution Builder** - Helper for building PTB-based solutions
- **IGS Builder** - Construct IGS solutions from intents
- **P2P Matcher** - Match peer-to-peer swaps
- **Type Safety** - Full TypeScript support with IGS types

## Usage

### Listen for Batches

```typescript
import { SolverListener } from '@intenus/solver-sdk';

const listener = new SolverListener('redis://localhost:6379');

listener.onNewBatch(async (batch) => {
  console.log(`New batch: ${batch.batch_id}`);
  console.log(`Intents: ${batch.intent_ids.length}`);

  // Fetch intents and build solutions
  const solution = await buildSolution(batch);

  // Submit solution
  await listener.submitSolution(solution, batch.batch_id);
});

// Send heartbeat
await listener.sendHeartbeat(solverAddress);
```

### Build Solutions

```typescript
import { SolutionBuilder } from '@intenus/solver-sdk';
import { SuiClient } from '@mysten/sui/client';

const client = new SuiClient({ url: 'https://testnet.sui.io' });
const builder = new SolutionBuilder(intentId, solverAddress);

// Add PTB operations
builder.getPTB().moveCall({
  target: '0x2::sui::split',
  arguments: [/* ... */]
});

// Build submission
const { submission, ptbBytes } = await builder.build({ client });

// Submit to chain or backend
```

### Build IGS Solutions

```typescript
import { IGSSolutionBuilder } from '@intenus/solver-sdk';
import type { Intent as IGSIntent } from '@intenus/common';

const intent: IGSIntent = { /* ... */ };

const builder = createIGSSolutionBuilder({
  solverId: 'solver_123',
  confidenceScore: 0.95
});

const solution = builder
  .setIntent(intent)
  .addRoute({ dex: 'cetus', pool_id: '0x...' })
  .setExpectedOutput({ amount: '1000000', slippage_bps: 50 })
  .build();

// Validate solution
const isValid = validateIGSSolution(solution);
```

## Types

```typescript
import type {
  BatchNotification,
  IGSSolutionBuilder,
  P2PMatch,
  Intent as IGSIntent,
  IGSSolution,
  SolutionSubmission
} from '@intenus/solver-sdk';
```

## Development

```bash
npm run build
npm test
npm run lint
```

## License

MIT
