# @intenus/client-sdk

Client SDK for Intenus Protocol - interact with solver registry, batch management, slashing, and seal policies on Sui.

## Installation

```bash
npm install @intenus/client-sdk
```

## Features

- **Solver Registry** - Register, stake, manage solver participation
- **Batch Management** - Monitor batch lifecycle and statistics
- **Seal Policies** - Create encryption policies for data privacy
- **Slash Management** - Handle slashing evidence and appeals
- **Intent Builder** - Build IGS-compliant intents
- **Type Safety** - Full TypeScript support

## Quick Start

```typescript
import { IntenusProtocolClient, IntentBuilder } from '@intenus/client-sdk';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const client = new IntenusProtocolClient({
  network: 'testnet'
});

const keypair = Ed25519Keypair.generate();

// Get protocol stats
const stats = await client.getProtocolStats();
console.log('Registered solvers:', stats.registry.total_solvers);
console.log('Current batch:', stats.current_batch?.batch_id);
```

## Solver Registry

```typescript
// Register as solver
const stake = '1000000000'; // 1 SUI
const result = await client.solvers.register(stake, keypair);

// Get solver profile
const profile = await client.solvers.getProfile(keypair.toSuiAddress());
console.log('Stake:', profile.stake_amount);
console.log('Reputation:', profile.reputation_score);

// Update stake
await client.solvers.increaseStake('500000000', keypair);

// Unstake
await client.solvers.unstake(keypair);
```

## Batch Management

```typescript
// Get current batch
const batch = await client.batches.getCurrentBatch();

// Get batch stats for specific epoch
const epochStats = await client.batches.getBatchStats(12345);

// Get batch history
const history = await client.batches.getBatchHistory(100, 200);

// Get batch metrics
const metrics = await client.batches.getBatchMetrics(batchId);
console.log('Total intents:', metrics.total_intents);
console.log('Solver participation:', metrics.solver_participation);
```

## Seal Policies

```typescript
// Create intent policy
await client.policies.createIntentPolicy({
  policyId: 'policy_001',
  batchId: 1,
  solverWindowMs: 5000,
  routerAccessEnabled: true,
  requiresSolverRegistration: true,
  minSolverStake: '1000000000'
}, keypair);

// Create strategy policy
await client.policies.createStrategyPolicy({
  policyId: 'strat_001',
  routerAccess: false,
  isPublic: false,
  adminUnlockTime: Date.now() + 86400000
}, keypair);

// Revoke policy
await client.policies.revokePolicy('intent', policyId, keypair);
```

## Slash Management

```typescript
// Submit slash evidence
const evidence = {
  batch_id: 1,
  solution_id: 'sol_123',
  solver_address: '0x...',
  severity: SlashSeverity.SIGNIFICANT,
  reason_code: 2001,
  reason_message: 'MEV extraction detected',
  failure_context: JSON.stringify({ details }),
  attestation: '0x...',
  attestation_timestamp: Date.now(),
  tee_measurement: '0x...'
};

await client.slashing.submitEvidence(evidence, keypair);

// Appeal slash
await client.slashing.appeal(recordId, justification, keypair);

// Get slash records
const records = await client.slashing.getRecords(solverAddress);
```

## Intent Builder

```typescript
import { IntentBuilder } from '@intenus/client-sdk';

const intent = new IntentBuilder()
  .setType('spot_trade')
  .addAssetFlow({
    asset_id: '0x2::sui::SUI',
    direction: 'in',
    amount: { exact: '1000000000' }
  })
  .addAssetFlow({
    asset_id: '0x...::usdc::USDC',
    direction: 'out',
    amount: { minimum: '900000' }
  })
  .setConstraints({
    max_slippage_bps: 50,
    min_output_amount: '900000'
  })
  .setPreferences({
    optimization_goal: 'maximize_output'
  })
  .build();
```

## Types

```typescript
import type {
  IntenusClientConfig,
  SolverProfile,
  RankedPTB,
  BatchSummary,
  SlashEvidence,
  SlashRecord,
  Appeal,
  IntentPolicyConfig,
  StrategyPolicyConfig,
  HistoryPolicyConfig
} from '@intenus/client-sdk';

import {
  SolverStatus,
  BatchStatus,
  SlashSeverity,
  AppealStatus,
  PolicyType
} from '@intenus/client-sdk';
```

## Development

```bash
npm run build
npm test
npm run lint
```

## License

MIT
