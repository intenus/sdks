# @intenus/client-sdk

Client SDK for Intenus Protocol - AI infrastructure for intent-based DeFi on Sui.

## Features

- **Solver Registry** - Register, stake, and manage solver participation
- **Seal Policies** - Create and manage encryption policies for data privacy
- **Batch Management** - Monitor batch lifecycle and statistics
- **Slash Management** - Handle slashing and appeals system
- **Intent Builder** - Fluent API for building IGS intents
- **Type Safety** - Full TypeScript support with comprehensive types

## Installation

```bash
npm install @intenus/client-sdk
```

## Quick Start

```typescript
import { IntenusProtocolClient, IntentBuilder } from '@intenus/client-sdk';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

// Initialize client
const client = new IntenusProtocolClient({
  network: 'testnet'
});

const keypair = Ed25519Keypair.generate();

// Check if connected
const connected = await client.isConnected();
console.log('Connected:', connected);

// Get protocol statistics
const stats = await client.getProtocolStats();
console.log('Protocol Stats:', stats);
```

## Core Services

### Solver Registry

Manage solver registration and staking:

```typescript
// Register as a solver
const stakeAmount = '1000000000'; // 1 SUI in MIST
const result = await client.solvers.registerSolver(stakeAmount, keypair);

// Get solver profile
const profile = await client.solvers.getSolverProfile(keypair.toSuiAddress());

// Check if solver is active
const isActive = await client.solvers.isSolverActive(keypair.toSuiAddress());

// Increase stake
await client.solvers.increaseStake('500000000', keypair);

// Initiate withdrawal (7-day cooldown)
await client.solvers.initiateWithdrawal('100000000', keypair);

// Complete withdrawal after cooldown
await client.solvers.completeWithdrawal('100000000', keypair);
```

### Seal Policies

Create and manage encryption policies:

```typescript
// Create intent policy for batch encryption
const intentPolicy = {
  policy_id: 'intent_batch_123',
  batch_id: 123,
  solver_access_start_ms: Date.now(),
  solver_access_end_ms: Date.now() + 300000, // 5 minutes
  router_access_enabled: true,
  auto_revoke_time: Date.now() + 3600000, // 1 hour
  requires_solver_registration: true,
  min_solver_stake: '1000000000',
  requires_tee_attestation: false,
  expected_measurement: '',
  purpose: 'Intent batch encryption'
};

await client.policies.createIntentPolicy(intentPolicy, keypair);

// Create strategy policy for solver algorithms
const strategyPolicy = {
  policy_id: 'strategy_solver_001',
  router_can_access: false,
  admin_unlock_time: 0,
  is_public: false,
  requires_solver_registration: true,
  min_solver_stake: '1000000000',
  requires_tee_attestation: true,
  expected_measurement: 'abc123...',
  purpose: 'Solver strategy protection'
};

await client.policies.createStrategyPolicy(strategyPolicy, keypair);

// Create approval transactions for Seal SDK
const approvalTx = client.policies.createIntentApprovalTransaction('intent_batch_123');
```

### Batch Management

Monitor batch lifecycle:

```typescript
// Get current active batch
const currentBatch = await client.batches.getCurrentBatch();

// Get batch statistics for specific epoch
const batchStats = await client.batches.getBatchStats(12345);

// Get batch history
const history = await client.batches.getBatchHistory(12340, 12350);

// Get batch performance metrics
const metrics = await client.batches.getBatchMetrics('batch_123');
```

### Slash Management

Handle slashing and appeals:

```typescript
// Submit slash evidence (usually done by TEE services)
const evidence = {
  batch_id: 123,
  solution_id: 'solution_456',
  solver_address: '0x...',
  severity: SlashSeverity.SIGNIFICANT,
  reason_code: 1,
  reason_message: 'Invalid solution submitted',
  failure_context: 'Solution validation failed',
  attestation: 'tee_attestation_data',
  attestation_timestamp: Date.now(),
  tee_measurement: 'measurement_hash'
};

await client.slashing.submitSlash(evidence, teeKeypair);

// File an appeal (within 24 hours)
await client.slashing.fileAppeal(
  slashRecordId,
  'Appeal reason',
  'Counter evidence',
  solverKeypair
);

// Get solver's slash records
const slashRecords = await client.slashing.getSlashRecords(solverAddress);

// Check total slash percentage
const slashPercentage = await client.slashing.calculateTotalSlashPercentage(solverAddress);
```

## Intent Builder

Build IGS-compliant intents:

```typescript
import { IntentBuilder } from '@intenus/client-sdk';

const intent = new IntentBuilder(userAddress)
  .swap(
    '0x2::sui::SUI',           // Token in
    '1000000000',              // Amount in (1 SUI)
    '0x...::usdc::USDC',       // Token out
    50                         // Max slippage (0.5%)
  )
  .private(true)               // Enable encryption
  .constraints({
    deadline: Date.now() + 300000,
    max_slippage_bps: 50
  })
  .execution({
    auto_execute: false,
    show_top_n: 3,
    require_simulation: true
  })
  .build();

console.log('Intent:', intent);
```

## Advanced Usage

### Solver Dashboard

Get comprehensive solver information:

```typescript
const dashboard = await client.getSolverDashboard(solverAddress);

console.log('Profile:', dashboard.profile);
console.log('Eligibility:', dashboard.eligibility);
console.log('Slash Records:', dashboard.slash_records);
console.log('Recent Batches:', dashboard.recent_batches);
```

### Solver Eligibility Validation

```typescript
const eligibility = await client.validateSolverEligibility(solverAddress);

if (eligibility.can_participate) {
  console.log('Solver can participate in batches');
} else {
  console.log('Reasons:', eligibility.reasons);
}
```

### Error Handling

```typescript
import { IntenusClientError, ERROR_CODES } from '@intenus/client-sdk';

try {
  await client.solvers.registerSolver(stakeAmount, keypair);
} catch (error) {
  if (error instanceof IntenusClientError) {
    switch (error.code) {
      case ERROR_CODES.E_INSUFFICIENT_STAKE.toString():
        console.log('Insufficient stake amount');
        break;
      case ERROR_CODES.E_SOLVER_ALREADY_REGISTERED.toString():
        console.log('Solver already registered');
        break;
      default:
        console.log('Unknown error:', error.message);
    }
  }
}
```

## Networks

| Network | Package ID | Status |
|---------|------------|--------|
| Mainnet | TBD | Coming Soon |
| Testnet | `0x83b321c90dcbc37ab51c65f577b01d88fdd640ce8bd79fe205cfb169fadd381a` | Active |
| Devnet | TBD | Coming Soon |

## Configuration

### Custom Sui Client

```typescript
import { SuiClient } from '@mysten/sui/client';

const customSuiClient = new SuiClient({
  url: 'https://your-custom-rpc.com',
  network: 'testnet'
});

const client = new IntenusProtocolClient({
  network: 'testnet',
  suiClient: customSuiClient
});
```

### Custom Package ID

```typescript
const client = new IntenusProtocolClient({
  network: 'testnet',
  packageId: '0x...' // Custom package ID
});
```

## Types Reference

### Core Types

```typescript
interface SolverProfile {
  solver_address: string;
  stake_amount: string;
  reputation_score: number;
  total_batches_participated: number;
  batches_won: number;
  total_surplus_generated: string;
  accuracy_score: number;
  last_submission_epoch: number;
  registration_timestamp: number;
  status: SolverStatus;
  pending_withdrawal?: string;
}

interface BatchSummary {
  batch_id: string;
  epoch: number;
  intent_count: number;
  total_value_usd: string;
  solver_count: number;
  winning_solver?: string;
  winning_solution_id?: string;
  total_surplus_generated: string;
  status: BatchStatus;
  created_at: number;
  executed_at?: number;
}
```

### Enums

```typescript
enum SolverStatus {
  ACTIVE = 0,
  SLASHED = 1,
  UNSTAKING = 3
}

enum SlashSeverity {
  MINOR = 1,      // 5% slash
  SIGNIFICANT = 2, // 20% slash
  MALICIOUS = 3   // 100% slash
}
```

## Best Practices

1. **Error Handling**: Always wrap SDK calls in try-catch blocks
2. **Gas Management**: Monitor gas costs for transaction-heavy operations
3. **Stake Management**: Maintain adequate stake for solver participation
4. **Policy Lifecycle**: Set appropriate expiration times for encryption policies
5. **Appeal Timing**: File appeals within 24-hour window
6. **Batch Monitoring**: Check batch status before solver participation

## Examples

See the `/examples` directory for complete usage examples:

- Basic solver registration
- Policy management workflows
- Batch monitoring dashboard
- Slash handling and appeals

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT