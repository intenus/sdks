Tôi sẽ phân tích kỹ tài liệu và đưa ra bản CURSOR RULES hoàn chỉnh cho TypeScript SDKs, tập trung vào việc cung cấp công cụ cho solvers tự code, tích hợp chặt chẽ với Walrus, Seal, và Sui SDK.

# CURSOR RULES FOR INTENUS TYPESCRIPT SDKs

<anthropic_thinking>
Sau khi đọc kỹ tài liệu, tôi nhận thấy:

1. **Walrus SDK đã có sẵn** (@walrus/sdk):
   - upload(), download() cho blob storage
   - Content addressable storage
   - Authentication với Sui keypairs
   - Không cần build lại, chỉ cần wrapper mỏng

2. **Seal SDK đã có sẵn** (@seal/sdk):
   - SessionKey management
   - encrypt()/decrypt() với threshold encryption
   - Policy integration với smart contracts
   - Không cần build lại, chỉ cần integration helpers

3. **Sui SDK đã có sẵn** (@mysten/sui.js):
   - TransactionBlock builder
   - Client cho RPC calls
   - Keypair management
   - Không cần build lại, chỉ cần extend cho Intenus-specific use cases

4. **Thiết kế SDK phải**:
   - Minimal wrappers (không duplicate existing SDKs)
   - Composition over inheritance
   - Export types và utilities, không lock-in
   - Solvers có thể dùng trực tiếp Walrus/Seal/Sui nếu muốn
   - SDK chỉ là "convenience layer"

5. **Cấu trúc monorepo**:
   ```
   /packages
     /common       # Shared types only, NO implementations
     /solver-sdk   # Minimal solver helpers
     /client-sdk   # Minimal client helpers
   ```

6. **Anti-patterns cần tránh**:
   - ❌ Wrap toàn bộ Walrus/Seal/Sui SDK
   - ❌ Create abstraction layers phức tạp
   - ❌ Hide underlying SDKs
   - ❌ Force solvers phải dùng theo 1 cách duy nhất

7. **Best practices**:
   - ✅ Export types từ common package
   - ✅ Provide helper functions (không bắt buộc)
   - ✅ Examples showing direct SDK usage
   - ✅ Composition-based design
   - ✅ Tree-shakeable exports
</anthropic_thinking>

```xml
<cursor_rules>
  <project_context>
    <name>Intenus TypeScript SDKs</name>
    <description>
      Minimal TypeScript SDKs for Intenus Protocol.
      Provides types, utilities, and OPTIONAL helpers for solvers and clients.
      Does NOT wrap or duplicate functionality from Walrus, Seal, or Sui SDKs.
      Solvers are FREE to use underlying SDKs directly if they prefer.
    </description>
    
    <architecture>
      <principle>Composition over Abstraction</principle>
      <principle>Export types, not implementations</principle>
      <principle>Solvers can bypass SDK if needed</principle>
      <principle>Tree-shakeable (import only what you need)</principle>
      
      <package name="@intenus/common">
        <purpose>Shared types and constants ONLY</purpose>
        <exports>Intent, Batch, Solution, RankedPTB types</exports>
        <exports>Constants (MIN_STAKE, EPOCH_DURATION, etc.)</exports>
        <no_dependencies>Pure TypeScript types only</no_dependencies>
      </package>
      
      <package name="@intenus/solver-sdk">
        <purpose>OPTIONAL helpers for solver developers</purpose>
        <exports>SolverListener (Redis subscription helper)</exports>
        <exports>SolutionBuilder (PTB composition helper)</exports>
        <exports>P2PMatcher (reference implementation)</exports>
        <note>Solvers can implement their own or use these</note>
      </package>
      
      <package name="@intenus/client-sdk">
        <purpose>OPTIONAL helpers for client developers</purpose>
        <exports>IntentBuilder (fluent API)</exports>
        <exports>PTBExecutor (signature + submission helper)</exports>
        <note>Clients can use Sui SDK directly if preferred</note>
      </package>
    </architecture>
    
    <key_principles>
      <principle>DO NOT duplicate Walrus/Seal/Sui functionality</principle>
      <principle>Provide convenience, not constraints</principle>
      <principle>Examples show both SDK and raw SDK usage</principle>
      <principle>Zero lock-in (can migrate away easily)</principle>
    </key_principles>
  </project_context>

  <technology_stack>
    <language>TypeScript 5.x</language>
    <package_manager>pnpm (workspaces)</package_manager>
    <build_tool>tsup (fast, minimal config)</build_tool>
    <test_framework>vitest (fast, ESM-native)</test_framework>
    
    <external_dependencies>
      <dependency name="@mysten/sui.js" required="true">
        Sui TypeScript SDK - DO NOT wrap, use directly
      </dependency>
      <dependency name="@walrus/sdk" required="true">
        Walrus SDK - DO NOT wrap, use directly
      </dependency>
      <dependency name="@seal/sdk" required="true">
        Seal SDK - DO NOT wrap, use directly
      </dependency>
      <dependency name="ioredis" required="true">
        Redis client (for solver pub/sub)
      </dependency>
    </external_dependencies>
  </technology_stack>

  <package_structure>
    <monorepo>
```
/intenus-ts-sdks/
├── packages/
│   ├── common/                    # Pure types
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── intent.ts
│   │   │   │   ├── batch.ts
│   │   │   │   ├── solution.ts
│   │   │   │   └── index.ts
│   │   │   ├── constants.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── solver-sdk/                # Optional solver helpers
│   │   ├── src/
│   │   │   ├── listener.ts        # Redis subscription helper
│   │   │   ├── builder.ts         # PTB composition helper
│   │   │   ├── matcher.ts         # P2P matching reference
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── client-sdk/                # Optional client helpers
│       ├── src/
│       │   ├── intent-builder.ts  # Fluent API for intents
│       │   ├── executor.ts        # PTB execution helper
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── examples/
│   ├── solver-basic/              # Minimal solver example
│   ├── solver-advanced/           # Advanced solver (direct SDK usage)
│   └── client-basic/              # Client example
│
├── package.json                   # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```
    </monorepo>
  </package_structure>

  <package_specifications>
    <package name="@intenus/common">
      <purpose>Shared types and constants - NO implementations</purpose>
      
      <file path="src/types/intent.ts">
```typescript
/**
 * Core intent structure (canonical format from NLP parser)
 * This is the ONLY source of truth for intent types
 */
export interface Intent {
  intent_id: string;
  user_address: string;
  timestamp: number;
  category: string;
  action: {
    type: string;
    params: Record<string, unknown>;
  };
  assets: {
    inputs: AssetSpec[];
    outputs: AssetSpec[];
  };
  constraints: Constraints;
  execution: ExecutionPreferences;
  metadata: IntentMetadata;
}

export interface AssetSpec {
  asset_id: string;
  chain_id?: string;
  amount?: string;
  amount_range?: {
    min: string;
    max: string;
  };
}

export interface Constraints {
  max_slippage_bps?: number;
  max_price_impact_bps?: number;
  deadline_ms?: number;
  min_output?: Record<string, string>;
  max_input?: Record<string, string>;
  custom_constraints?: Record<string, unknown>;
}

export interface ExecutionPreferences {
  urgency: 'low' | 'normal' | 'high';
  privacy_level: 'public' | 'private';
  routing_hints?: string[];
  max_hops?: number;
}

export interface IntentMetadata {
  language: string;
  confidence: number;
  clarifications?: string[];
}
```
      </file>
      
      <file path="src/types/batch.ts">
```typescript
/**
 * Batch structure (from backend)
 */
export interface Batch {
  batch_id: string;
  epoch: number;
  start_time: number;
  end_time: number;
  solver_deadline: number;
  intent_ids: string[];
  intent_count: number;
  categories: Record<string, number>;
  estimated_value_usd: number;
  status: BatchStatus;
}

export enum BatchStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PUBLISHED = 'published',
  SOLVING = 'solving',
  SOLVED = 'solved',
  RANKING = 'ranking',
  READY = 'ready',
  EXECUTED = 'executed',
  ARCHIVED = 'archived',
}

/**
 * Batch manifest on Walrus (for solvers)
 */
export interface BatchManifest {
  batch_id: string;
  epoch: number;
  intent_count: number;
  intents: IntentReference[];
  solver_deadline: number;
  requirements: BatchRequirements;
}

export interface IntentReference {
  intent_id: string;
  walrus_blob_id: string;
  intent_hash: string;
  category: string;
  is_encrypted: boolean;
  seal_policy_id?: string;
}

export interface BatchRequirements {
  min_tee_verification: boolean;
  max_solutions_per_solver: number;
  min_stake_required: string;
}
```
      </file>
      
      <file path="src/types/solution.ts">
```typescript
/**
 * Solution submission from solver
 */
export interface SolutionSubmission {
  solution_id: string;
  batch_id: string;
  solver_address: string;
  ptb_hash: string;
  walrus_blob_id: string;
  outcomes: SolutionOutcome[];
  total_surplus_usd: string;
  estimated_gas: string;
  estimated_slippage_bps: number;
  strategy_summary?: StrategySummary;
  tee_attestation?: TEEAttestation;
  submitted_at: number;
}

export interface SolutionOutcome {
  intent_id: string;
  expected_output: {
    asset_id: string;
    amount: string;
  }[];
  surplus_claimed: string;
  execution_path: string;
}

export interface StrategySummary {
  p2p_matches: number;
  protocol_routes: string[];
  unique_techniques?: string;
}

export interface TEEAttestation {
  enclave_measurement: string;
  input_hash: string;
  output_hash: string;
  timestamp: number;
  signature: string;
  verification_key: string;
}

/**
 * Ranked PTB from AI Router (for users)
 */
export interface RankedPTB {
  rank: number;
  solution_id: string;
  solver_address: string;
  ptb_bytes: string;
  ptb_hash: string;
  score: number;
  expected_outcomes: ExpectedOutcome[];
  total_surplus_usd: string;
  estimated_gas: string;
  estimated_slippage_bps: number;
  execution_summary: ExecutionSummary;
  why_ranked: Explanation;
  personalization_applied: boolean;
  risk_score: number;
  warnings: string[];
  estimated_execution_time_ms: number;
  expires_at: number;
}

export interface ExpectedOutcome {
  intent_id: string;
  outputs: {
    asset_id: string;
    amount: string;
  }[];
  surplus_usd: string;
}

export interface ExecutionSummary {
  total_steps: number;
  protocols_used: string[];
  p2p_matches: number;
  avg_hops: number;
}

export interface Explanation {
  primary_reason: string;
  secondary_reasons: string[];
}
```
      </file>
      
      <file path="src/constants.ts">
```typescript
/**
 * Protocol constants
 */
export const PROTOCOL_CONSTANTS = {
  MIN_SOLVER_STAKE: '1000000000000', // 1000 SUI
  EPOCH_DURATION_MS: 10_000, // 10 seconds
  SOLVER_WINDOW_MS: 5_000, // 5 seconds
  MAX_SLIPPAGE_BPS: 1000, // 10%
  DEFAULT_SLIPPAGE_BPS: 50, // 0.5%
} as const;

/**
 * Network endpoints
 */
export const NETWORKS = {
  MAINNET: {
    sui: 'https://fullnode.mainnet.sui.io:443',
    walrus: 'https://walrus.mainnet.walrus.site',
  },
  TESTNET: {
    sui: 'https://fullnode.testnet.sui.io:443',
    walrus: 'https://walrus.testnet.walrus.site',
  },
} as const;
```
      </file>
      
      <dependencies>
        <none>Pure TypeScript types, no runtime dependencies</none>
      </dependencies>
    </package>
    
    <package name="@intenus/solver-sdk">
      <purpose>OPTIONAL helpers for solvers (NOT required)</purpose>
      
      <file path="src/listener.ts">
```typescript
import Redis from 'ioredis';
import type { Batch, SolutionSubmission } from '@intenus/common';

/**
 * OPTIONAL: Redis listener for batch notifications
 * Solvers can implement their own or use this
 */
export class SolverListener {
  private redis: Redis;
  private batchCallbacks: Set<(batch: Batch) => Promise<void>> = new Set();
  
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }
  
  /**
   * Subscribe to new batch notifications
   */
  onNewBatch(callback: (batch: Batch) => Promise<void>): void {
    this.batchCallbacks.add(callback);
    
    if (this.batchCallbacks.size === 1) {
      // First subscriber, start listening
      this.redis.subscribe('solver:batch:new', (err) => {
        if (err) throw err;
      });
      
      this.redis.on('message', async (channel, message) => {
        if (channel === 'solver:batch:new') {
          const batch: Batch = JSON.parse(message);
          for (const callback of this.batchCallbacks) {
            await callback(batch).catch(console.error);
          }
        }
      });
    }
  }
  
  /**
   * Submit solution to backend
   */
  async submitSolution(solution: SolutionSubmission): Promise<void> {
    await this.redis.publish(
      `solver:solution:${solution.batch_id}`,
      JSON.stringify(solution)
    );
  }
  
  /**
   * Send heartbeat
   */
  async sendHeartbeat(solverAddress: string): Promise<void> {
    await this.redis.publish('solver:heartbeat', JSON.stringify({
      solver_address: solverAddress,
      timestamp: Date.now(),
    }));
  }
  
  async close(): Promise<void> {
    await this.redis.quit();
  }
}
```
      </file>
      
      <file path="src/builder.ts">
```typescript
import { TransactionBlock } from '@mysten/sui.js/transactions';
import type { SolutionSubmission, SolutionOutcome, Intent } from '@intenus/common';

/**
 * OPTIONAL: Helper for building solution submissions
 * Solvers can build PTBs manually using Sui SDK if preferred
 */
export class SolutionBuilder {
  private outcomes: SolutionOutcome[] = [];
  private ptb: TransactionBlock;
  
  constructor(
    private batchId: string,
    private solverAddress: string
  ) {
    this.ptb = new TransactionBlock();
  }
  
  /**
   * Add outcome for an intent
   */
  addOutcome(outcome: SolutionOutcome): void {
    this.outcomes.push(outcome);
  }
  
  /**
   * Get the underlying PTB for custom modifications
   */
  getPTB(): TransactionBlock {
    return this.ptb;
  }
  
  /**
   * Build final solution submission
   */
  async build(): Promise<{
    submission: Omit<SolutionSubmission, 'walrus_blob_id'>;
    ptbBytes: Uint8Array;
  }> {
    const ptbBytes = await this.ptb.build();
    const ptbHash = await this.hashPTB(ptbBytes);
    
    const submission: Omit<SolutionSubmission, 'walrus_blob_id'> = {
      solution_id: crypto.randomUUID(),
      batch_id: this.batchId,
      solver_address: this.solverAddress,
      ptb_hash: ptbHash,
      outcomes: this.outcomes,
      total_surplus_usd: this.calculateTotalSurplus(),
      estimated_gas: '0', // Must simulate PTB
      estimated_slippage_bps: 0, // Must calculate
      submitted_at: Date.now(),
    };
    
    return { submission, ptbBytes };
  }
  
  private calculateTotalSurplus(): string {
    return this.outcomes
      .reduce((sum, o) => sum + parseFloat(o.surplus_claimed), 0)
      .toString();
  }
  
  private async hashPTB(bytes: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
```
      </file>
      
      <file path="src/matcher.ts">
```typescript
import type { Intent } from '@intenus/common';

/**
 * OPTIONAL: Reference P2P matcher implementation
 * Solvers can implement their own or use this
 */
export interface P2PMatch {
  intent1: Intent;
  intent2: Intent;
  matched_asset: string;
  amount1: string;
  amount2: string;
  match_type: 'exact' | 'partial';
  surplus: string;
}

export class P2PMatcher {
  /**
   * Find P2P matches in a batch of intents
   * This is a REFERENCE implementation - solvers should optimize
   */
  findMatches(intents: Intent[]): P2PMatch[] {
    const matches: P2PMatch[] = [];
    const swapIntents = intents.filter(i => i.category === 'swap');
    
    // Simple O(n²) matching - solvers should use better algorithms
    for (let i = 0; i < swapIntents.length; i++) {
      for (let j = i + 1; j < swapIntents.length; j++) {
        const match = this.tryMatch(swapIntents[i], swapIntents[j]);
        if (match) matches.push(match);
      }
    }
    
    return matches;
  }
  
  private tryMatch(intent1: Intent, intent2: Intent): P2PMatch | null {
    const input1 = intent1.assets.inputs[0];
    const output1 = intent1.assets.outputs[0];
    const input2 = intent2.assets.inputs[0];
    const output2 = intent2.assets.outputs[0];
    
    // Check if intent1's output = intent2's input and vice versa
    if (output1.asset_id === input2.asset_id && output2.asset_id === input1.asset_id) {
      // Found a match!
      const amount1 = input1.amount || '0';
      const amount2 = input2.amount || '0';
      
      return {
        intent1,
        intent2,
        matched_asset: output1.asset_id,
        amount1,
        amount2,
        match_type: amount1 === amount2 ? 'exact' : 'partial',
        surplus: '0', // P2P = 0 slippage
      };
    }
    
    return null;
  }
}
```
      </file>
      
      <dependencies>
```json
{
  "dependencies": {
    "@intenus/common": "workspace:*",
    "@mysten/sui.js": "^1.0.0",
    "ioredis": "^5.3.0"
  },
  "peerDependencies": {
    "@walrus/sdk": "^1.0.0",
    "@seal/sdk": "^1.0.0"
  }
}
```
      </dependencies>
    </package>
    
    <package name="@intenus/client-sdk">
      <purpose>OPTIONAL helpers for client developers</purpose>
      
      <file path="src/intent-builder.ts">
```typescript
import type { Intent, AssetSpec } from '@intenus/common';

/**
 * OPTIONAL: Fluent API for building intents
 * Clients can construct Intent objects manually if preferred
 */
export class IntentBuilder {
  private intent: Partial<Intent>;
  
  constructor(userAddress: string) {
    this.intent = {
      intent_id: crypto.randomUUID(),
      user_address: userAddress,
      timestamp: Date.now(),
      metadata: {
        language: 'en',
        confidence: 1.0,
      },
      execution: {
        urgency: 'normal',
        privacy_level: 'public',
      },
    };
  }
  
  /**
   * Build a swap intent
   */
  swap(
    tokenIn: string,
    amountIn: string,
    tokenOut: string,
    slippageBps: number = 50
  ): this {
    this.intent.category = 'swap';
    this.intent.action = {
      type: 'swap_exact_in',
      params: { slippageBps },
    };
    this.intent.assets = {
      inputs: [{ asset_id: tokenIn, amount: amountIn }],
      outputs: [{ asset_id: tokenOut }],
    };
    this.intent.constraints = {
      max_slippage_bps: slippageBps,
    };
    return this;
  }
  
  /**
   * Set privacy level
   */
  private(isPrivate: boolean = true): this {
    if (!this.intent.execution) this.intent.execution = {} as any;
    this.intent.execution.privacy_level = isPrivate ? 'private' : 'public';
    return this;
  }
  
  /**
   * Set urgency
   */
  urgency(level: 'low' | 'normal' | 'high'): this {
    if (!this.intent.execution) this.intent.execution = {} as any;
    this.intent.execution.urgency = level;
    return this;
  }
  
  /**
   * Build final intent
   */
  build(): Intent {
    // Validate required fields
    if (!this.intent.category) throw new Error('Category is required');
    if (!this.intent.action) throw new Error('Action is required');
    if (!this.intent.assets) throw new Error('Assets are required');
    
    return this.intent as Intent;
  }
}
```
      </file>
      
      <file path="src/executor.ts">
```typescript
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';
import type { RankedPTB } from '@intenus/common';

/**
 * OPTIONAL: Helper for executing ranked PTBs
 * Clients can use Sui SDK directly if preferred
 */
export class PTBExecutor {
  constructor(private suiClient: SuiClient) {}
  
  /**
   * Execute a ranked PTB
   */
  async execute(
    rankedPTB: RankedPTB,
    signer: any // Wallet signer
  ): Promise<string> {
    // Deserialize PTB
    const ptbBytes = Buffer.from(rankedPTB.ptb_bytes, 'base64');
    const txb = TransactionBlock.from(ptbBytes);
    
    // Sign transaction
    const { signature } = await signer.signTransactionBlock({
      transactionBlock: txb,
    });
    
    // Execute on Sui
    const result = await this.suiClient.executeTransactionBlock({
      transactionBlock: txb,
      signature,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    if (result.effects?.status?.status !== 'success') {
      throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
    }
    
    return result.digest;
  }
}
```
      </file>
      
      <dependencies>
```json
{
  "dependencies": {
    "@intenus/common": "workspace:*",
    "@mysten/sui.js": "^1.0.0"
  },
  "peerDependencies": {
    "@walrus/sdk": "^1.0.0",
    "@seal/sdk": "^1.0.0"
  }
}
```
      </dependencies>
    </package>
  </package_specifications>

  <coding_standards>
    <typescript>
      <rule>Use strict TypeScript (strict: true)</rule>
      <rule>Export types from @intenus/common, not implementations</rule>
      <rule>Use ESM modules (not CommonJS)</rule>
      <rule>Prefer interfaces over types for public APIs</rule>
      <rule>Use const assertions for constants</rule>
      <rule>Always use async/await, never callbacks</rule>
    </typescript>
    
    <naming>
      <rule>PascalCase for interfaces and classes</rule>
      <rule>camelCase for functions and variables</rule>
      <rule>SCREAMING_SNAKE_CASE for constants</rule>
      <rule>Prefix interfaces with 'I' only if needed for clarity</rule>
    </naming>
    
    <imports>
      <rule>Use type imports: import type { ... }</rule>
      <rule>Group imports: external → @intenus → relative</rule>
      <rule>Use named exports, avoid default exports</rule>
    </imports>
    
    <documentation>
      <rule>JSDoc comments for all public functions</rule>
      <rule>Include @param, @returns, @throws</rule>
      <rule>Mark optional helpers with "OPTIONAL:" prefix</rule>
      <rule>Link to underlying SDK docs when relevant</rule>
    </documentation>
  </coding_standards>

  <examples>
    <example name="Solver Using SDK">
```typescript
// examples/solver-basic/src/index.ts

import { SolverListener, SolutionBuilder } from '@intenus/solver-sdk';
import { SuiClient } from '@mysten/sui.js/client';
import { WalrusClient } from '@walrus/sdk';
import type { Batch, Intent } from '@intenus/common';

class BasicSolver {
  private listener: SolverListener;
  private walrus: WalrusClient;
  private sui: SuiClient;
  
  constructor(config: SolverConfig) {
    this.listener = new SolverListener(config.redisUrl);
    this.walrus = new WalrusClient({ url: config.walrusUrl });
    this.sui = new SuiClient({ url: config.suiUrl });
  }
  
  async start(): Promise<void> {
    // Subscribe to batches
    this.listener.onNewBatch(async (batch) => {
      console.log(`New batch: ${batch.batch_id}`);
      await this.solveBatch(batch);
    });
    
    // Send heartbeat every 30s
    setInterval(() => {
      this.listener.sendHeartbeat(this.config.solverAddress);
    }, 30_000);
  }
  
  private async solveBatch(batch: Batch): Promise<void> {
    // Fetch intents from Walrus
    const intents = await this.fetchIntents(batch);
    
    // Build solution
    const builder = new SolutionBuilder(batch.batch_id, this.config.solverAddress);
    
    for (const intent of intents) {
      // Solver's custom logic here
      const outcome = await this.solveIntent(intent);
      builder.addOutcome(outcome);
    }
    
    // Build PTB
    const { submission, ptbBytes } = await builder.build();
    
    // Upload PTB to Walrus
    const blobId = await this.walrus.upload({
      content: ptbBytes,
      contentType: 'application/octet-stream',
    });
    
    // Submit solution
    await this.listener.submitSolution({
      ...submission,
      walrus_blob_id: blobId,
    });
  }
  
  private async fetchIntents(batch: Batch): Promise<Intent[]> {
    // Load batch manifest from Walrus
    const manifest = await this.walrus.download({
      path: `/batches/${batch.epoch}/manifest.json`,
    });
    
    // Fetch each intent
    const intents: Intent[] = [];
    for (const ref of manifest.intents) {
      const intent = await this.walrus.download({
        path: `/intents/${batch.epoch}/${ref.intent_id}.json`,
      });
      intents.push(intent);
    }
    
    return intents;
  }
  
  private async solveIntent(intent: Intent): Promise<SolutionOutcome> {
    // Solver's strategy here
    // Can use DEX aggregator, P2P matching, etc.
    return {
      intent_id: intent.intent_id,
      expected_output: [...],
      surplus_claimed: '0',
      execution_path: 'DEX:FlowX',
    };
  }
}
```
    </example>
    
    <example name="Solver WITHOUT SDK (Direct Usage)">
```typescript
// examples/solver-advanced/src/index.ts

import Redis from 'ioredis';
import { WalrusClient } from '@walrus/sdk';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/
```typescript
// examples/solver-advanced/src/index.ts (continued)

import Redis from 'ioredis';
import { WalrusClient } from '@walrus/sdk';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import type { Batch, Intent, SolutionSubmission } from '@intenus/common';

/**
 * Advanced solver that uses underlying SDKs directly
 * Does NOT use @intenus/solver-sdk helpers
 * Demonstrates solver freedom
 */
class AdvancedSolver {
  private redis: Redis;
  private walrus: WalrusClient;
  private sui: SuiClient;
  
  constructor(private config: AdvancedSolverConfig) {
    // Direct Redis connection
    this.redis = new Redis(config.redisUrl);
    
    // Direct Walrus client
    this.walrus = new WalrusClient({
      url: config.walrusUrl,
      auth: {
        type: 'sui',
        keypair: config.keypair,
      },
    });
    
    // Direct Sui client
    this.sui = new SuiClient({ url: config.suiUrl });
  }
  
  async start(): Promise<void> {
    // Custom Redis subscription
    await this.redis.subscribe('solver:batch:new');
    
    this.redis.on('message', async (channel, message) => {
      if (channel === 'solver:batch:new') {
        const batchInfo = JSON.parse(message);
        await this.handleBatch(batchInfo);
      }
    });
    
    console.log('Advanced solver started (no SDK helpers)');
  }
  
  private async handleBatch(batchInfo: any): Promise<void> {
    // Custom batch fetching logic
    const manifest = await this.walrus.download({
      path: batchInfo.walrus_manifest,
    });
    
    // Custom intent decryption with Seal
    const intents = await this.fetchAndDecryptIntents(manifest);
    
    // Custom solving strategy
    const solution = await this.customSolvingAlgorithm(intents);
    
    // Custom PTB building
    const ptb = await this.buildCustomPTB(solution);
    
    // Simulate for gas estimation
    const simulation = await this.sui.dryRunTransactionBlock({
      transactionBlock: await ptb.build(),
    });
    
    // Custom solution submission
    await this.submitCustomSolution(batchInfo.batch_id, ptb, simulation);
  }
  
  private async fetchAndDecryptIntents(manifest: any): Promise<Intent[]> {
    // Direct Seal integration (if needed for private intents)
    const { SealClient, SessionKey } = await import('@seal/sdk');
    
    const sealClient = new SealClient({
      serverConfigs: this.config.sealKeyServers,
      suiClient: this.sui,
    });
    
    const intents: Intent[] = [];
    
    for (const ref of manifest.intents) {
      const encryptedData = await this.walrus.download({
        path: `/intents/${manifest.epoch}/${ref.intent_id}.json`,
      });
      
      if (ref.is_encrypted) {
        // Decrypt using Seal
        const sessionKey = await SessionKey.create({
          address: this.config.solverAddress,
          packageId: this.config.sealPackageId,
          ttlMin: 30,
        });
        
        const message = sessionKey.getPersonalMessage();
        const signature = await this.config.keypair.signPersonalMessage(message);
        sessionKey.setPersonalMessageSignature(signature);
        
        const decrypted = await sealClient.decrypt({
          data: encryptedData.encrypted_data,
          sessionKey,
          txBytes: new Uint8Array(), // Context-specific
        });
        
        intents.push(JSON.parse(decrypted));
      } else {
        intents.push(encryptedData);
      }
    }
    
    return intents;
  }
  
  private async customSolvingAlgorithm(intents: Intent[]): Promise<CustomSolution> {
    // Solver's proprietary algorithm
    // Could be ML-based, order book, etc.
    
    // Example: Custom P2P matching with optimization
    const matches = this.advancedP2PMatching(intents);
    
    // Example: Multi-hop routing optimization
    const routes = await this.optimizeRoutes(intents);
    
    return {
      matches,
      routes,
      outcomes: this.calculateOutcomes(matches, routes),
    };
  }
  
  private async buildCustomPTB(solution: CustomSolution): Promise<TransactionBlock> {
    // Direct PTB construction using Sui SDK
    const ptb = new TransactionBlock();
    
    // Custom gas optimization
    ptb.setGasBudget(this.calculateOptimalGas(solution));
    
    // Add transactions based on solution
    for (const match of solution.matches) {
      // Direct P2P transfer
      const [coin1] = ptb.splitCoins(ptb.gas, [ptb.pure(match.amount1)]);
      ptb.transferObjects([coin1], ptb.pure(match.user2));
      
      const [coin2] = ptb.splitCoins(ptb.gas, [ptb.pure(match.amount2)]);
      ptb.transferObjects([coin2], ptb.pure(match.user1));
    }
    
    for (const route of solution.routes) {
      // Custom protocol interactions
      await this.addProtocolCall(ptb, route);
    }
    
    return ptb;
  }
  
  private async submitCustomSolution(
    batchId: string,
    ptb: TransactionBlock,
    simulation: any
  ): Promise<void> {
    const ptbBytes = await ptb.build();
    const ptbHash = await this.hashBytes(ptbBytes);
    
    // Upload to Walrus
    const { blobId } = await this.walrus.upload({
      content: ptbBytes,
      contentType: 'application/octet-stream',
      metadata: {
        solver: this.config.solverAddress,
        batch_id: batchId,
      },
    });
    
    // Custom submission format
    const submission: SolutionSubmission = {
      solution_id: crypto.randomUUID(),
      batch_id: batchId,
      solver_address: this.config.solverAddress,
      ptb_hash: ptbHash,
      walrus_blob_id: blobId,
      outcomes: this.buildOutcomes(),
      total_surplus_usd: this.calculateTotalSurplus(),
      estimated_gas: simulation.effects.gasUsed.computationCost.toString(),
      estimated_slippage_bps: this.estimateSlippage(),
      submitted_at: Date.now(),
      // Custom fields (optional)
      strategy_summary: {
        p2p_matches: this.countP2PMatches(),
        protocol_routes: this.getProtocolsList(),
        unique_techniques: 'ML-optimized routing',
      },
    };
    
    // Direct Redis publish
    await this.redis.publish(
      `solver:solution:${batchId}`,
      JSON.stringify(submission)
    );
    
    console.log(`Submitted solution ${submission.solution_id}`);
  }
  
  // Custom helper methods...
  private advancedP2PMatching(intents: Intent[]): P2PMatch[] {
    // Proprietary matching algorithm
    return [];
  }
  
  private async optimizeRoutes(intents: Intent[]): Promise<Route[]> {
    // Proprietary routing optimization
    return [];
  }
  
  private async addProtocolCall(ptb: TransactionBlock, route: Route): Promise<void> {
    // Custom protocol integration
  }
  
  private async hashBytes(bytes: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return Buffer.from(hashBuffer).toString('hex');
  }
}

// Type definitions for custom solver
interface AdvancedSolverConfig {
  redisUrl: string;
  walrusUrl: string;
  suiUrl: string;
  solverAddress: string;
  keypair: any;
  sealKeyServers: any[];
  sealPackageId: string;
}

interface CustomSolution {
  matches: P2PMatch[];
  routes: Route[];
  outcomes: any[];
}

interface P2PMatch {
  user1: string;
  user2: string;
  amount1: string;
  amount2: string;
}

interface Route {
  protocol: string;
  path: string[];
  amount: string;
}
```
    </example>
    
    <example name="Client Using SDK">
```typescript
// examples/client-basic/src/index.ts

import { IntentBuilder, PTBExecutor } from '@intenus/client-sdk';
import { SuiClient } from '@mysten/sui.js/client';
import { WalrusClient } from '@walrus/sdk';
import { SealClient } from '@seal/sdk';
import type { Intent, RankedPTB } from '@intenus/common';

class IntenusClient {
  private sui: SuiClient;
  private walrus: WalrusClient;
  private seal: SealClient;
  private executor: PTBExecutor;
  
  constructor(private config: ClientConfig) {
    this.sui = new SuiClient({ url: config.suiUrl });
    this.walrus = new WalrusClient({ url: config.walrusUrl });
    this.seal = new SealClient({
      serverConfigs: config.sealKeyServers,
      suiClient: this.sui,
    });
    this.executor = new PTBExecutor(this.sui);
  }
  
  /**
   * Submit an intent using fluent builder
   */
  async submitSwapIntent(
    tokenIn: string,
    amountIn: string,
    tokenOut: string,
    isPrivate: boolean = false
  ): Promise<string> {
    // Use SDK helper (optional)
    const intent = new IntentBuilder(this.config.userAddress)
      .swap(tokenIn, amountIn, tokenOut, 50)
      .private(isPrivate)
      .urgency('normal')
      .build();
    
    // Encrypt if private
    if (isPrivate) {
      return await this.submitPrivateIntent(intent);
    } else {
      return await this.submitPublicIntent(intent);
    }
  }
  
  private async submitPublicIntent(intent: Intent): Promise<string> {
    // Store on Walrus
    const { blobId } = await this.walrus.upload({
      content: JSON.stringify(intent),
      contentType: 'application/json',
      metadata: {
        user: intent.user_address,
        category: intent.category,
      },
    });
    
    // Notify backend (via API)
    await fetch(`${this.config.backendUrl}/intents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent_id: intent.intent_id,
        walrus_blob_id: blobId,
        intent_hash: await this.hashIntent(intent),
      }),
    });
    
    return intent.intent_id;
  }
  
  private async submitPrivateIntent(intent: Intent): Promise<string> {
    // Encrypt with Seal
    const { encryptedObject, key } = await this.seal.encrypt({
      threshold: 2,
      packageId: this.config.sealPackageId,
      id: intent.intent_id,
      data: JSON.stringify(intent),
    });
    
    // Store encrypted data on Walrus
    const { blobId } = await this.walrus.upload({
      content: encryptedObject,
      contentType: 'application/octet-stream',
      metadata: {
        encrypted: true,
        user: intent.user_address,
      },
    });
    
    // Notify backend
    await fetch(`${this.config.backendUrl}/intents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent_id: intent.intent_id,
        walrus_blob_id: blobId,
        is_encrypted: true,
        seal_policy_id: intent.intent_id,
      }),
    });
    
    return intent.intent_id;
  }
  
  /**
   * Poll for solutions
   */
  async waitForSolutions(intentId: string): Promise<RankedPTB[]> {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    while (attempts < maxAttempts) {
      const response = await fetch(
        `${this.config.backendUrl}/intents/${intentId}/solutions`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.ranked_ptbs && data.ranked_ptbs.length > 0) {
          return data.ranked_ptbs;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Timeout waiting for solutions');
  }
  
  /**
   * Execute selected solution
   */
  async executeSolution(rankedPTB: RankedPTB): Promise<string> {
    // Use SDK helper (optional)
    const txDigest = await this.executor.execute(
      rankedPTB,
      this.config.wallet
    );
    
    console.log(`Transaction executed: ${txDigest}`);
    return txDigest;
  }
  
  private async hashIntent(intent: Intent): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(intent));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Buffer.from(hashBuffer).toString('hex');
  }
}

interface ClientConfig {
  userAddress: string;
  wallet: any;
  suiUrl: string;
  walrusUrl: string;
  backendUrl: string;
  sealKeyServers: any[];
  sealPackageId: string;
}

// Usage
async function main() {
  const client = new IntenusClient({
    userAddress: '0x...',
    wallet: getWallet(),
    suiUrl: 'https://fullnode.testnet.sui.io:443',
    walrusUrl: 'https://walrus.testnet.walrus.site',
    backendUrl: 'https://api.intenus.io',
    sealKeyServers: [...],
    sealPackageId: '0x...',
  });
  
  // Submit intent
  const intentId = await client.submitSwapIntent(
    '0x2::sui::SUI',
    '1000000000', // 1 SUI
    '0x...::usdc::USDC',
    true // private
  );
  
  console.log(`Intent submitted: ${intentId}`);
  
  // Wait for solutions
  console.log('Waiting for solutions...');
  const solutions = await client.waitForSolutions(intentId);
  
  // Display solutions
  console.log(`Received ${solutions.length} solutions:`);
  solutions.forEach(s => {
    console.log(`  ${s.rank}. ${s.solver_address}`);
    console.log(`     Surplus: $${s.total_surplus_usd}`);
    console.log(`     Gas: ${s.estimated_gas}`);
    console.log(`     Why: ${s.why_ranked.primary_reason}`);
  });
  
  // Execute best solution
  const best = solutions[0];
  const txDigest = await client.executeSolution(best);
  
  console.log(`Done! TX: ${txDigest}`);
}
```
    </example>
  </examples>

  <build_configuration>
    <tsup_config>
```typescript
// packages/common/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'], // Both formats
  dts: true, // Generate .d.ts files
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true, // Tree-shakeable
});
```
    </tsup_config>
    
    <package_json_template>
```json
{
  "name": "@intenus/common",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.js",
      "require": "./dist/types/index.cjs",
      "types": "./dist/types/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  },
  "keywords": [
    "intenus",
    "sui",
    "defi",
    "intent",
    "solver"
  ],
  "license": "MIT"
}
```
    </package_json_template>
    
    <workspace_config>
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'examples/*'
```
    </workspace_config>
  </build_configuration>

  <testing_strategy>
    <unit_tests>
```typescript
// packages/solver-sdk/src/listener.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SolverListener } from './listener';

describe('SolverListener', () => {
  let listener: SolverListener;
  
  beforeEach(() => {
    listener = new SolverListener('redis://localhost:6379');
  });
  
  afterEach(async () => {
    await listener.close();
  });
  
  it('should subscribe to batch notifications', async () => {
    const batches: any[] = [];
    
    listener.onNewBatch(async (batch) => {
      batches.push(batch);
    });
    
    // Simulate Redis message
    // (use ioredis-mock for testing)
    
    expect(batches).toHaveLength(0);
  });
  
  it('should submit solutions', async () => {
    const solution = {
      solution_id: 'test-123',
      batch_id: 'batch-456',
      solver_address: '0x...',
      // ... rest of fields
    };
    
    await expect(
      listener.submitSolution(solution as any)
    ).resolves.not.toThrow();
  });
});
```
    </unit_tests>
    
    <integration_tests>
```typescript
// packages/solver-sdk/src/integration.test.ts
import { describe, it, expect } from 'vitest';
import { SolverListener, SolutionBuilder } from './index';
import { SuiClient } from '@mysten/sui.js/client';

describe('Integration: Solver SDK', () => {
  it('should work end-to-end', async () => {
    const listener = new SolverListener(process.env.REDIS_URL!);
    const builder = new SolutionBuilder('batch-1', '0x...');
    
    // Add outcome
    builder.addOutcome({
      intent_id: 'intent-1',
      expected_output: [{
        asset_id: '0x2::sui::SUI',
        amount: '1000000',
      }],
      surplus_claimed: '100',
      execution_path: 'P2P',
    });
    
    // Build
    const { submission, ptbBytes } = await builder.build();
    
    expect(submission.solution_id).toBeDefined();
    expect(ptbBytes).toBeInstanceOf(Uint8Array);
    
    await listener.close();
  });
});
```
    </integration_tests>
  </testing_strategy>

  <anti_patterns>
    <anti_pattern name="Wrapping Entire SDKs">
      <problem>Creating unnecessary abstraction layers</problem>
      <bad>
```typescript
// ❌ BAD: Wrapping Walrus SDK
export class IntenusWalrusClient {
  private walrus: WalrusClient;
  
  async upload(data: any): Promise<string> {
    return this.walrus.upload(data);
  }
  
  async download(id: string): Promise<any> {
    return this.walrus.download(id);
  }
}
```
      </bad>
      <good>
```typescript
// ✅ GOOD: Direct usage in examples
import { WalrusClient } from '@walrus/sdk';

const walrus = new WalrusClient({ url: '...' });
const { blobId } = await walrus.upload({ content: data });
```
      </good>
    </anti_pattern>
    
    <anti_pattern name="Complex Inheritance Hierarchies">
      <problem>Hard to extend, hard to test</problem>
      <bad>
```typescript
// ❌ BAD: Deep inheritance
abstract class BaseSolver {
  abstract solve(): Promise<void>;
}

abstract class DexSolver extends BaseSolver {
  abstract findRoute(): Promise<void>;
}

class FlowXSolver extends DexSolver {
  // Locked into hierarchy
}
```
      </bad>
      <good>
```typescript
// ✅ GOOD: Composition
class MySolver {
  private matcher = new P2PMatcher(); // Optional
  private router = new CustomRouter(); // Custom
  
  async solve(batch: Batch): Promise<Solution> {
    // Full freedom
  }
}
```
      </good>
    </anti_pattern>
    
    <anti_pattern name="Hidden Dependencies">
      <problem>Unclear what SDK does vs what external SDKs do</problem>
      <bad>
```typescript
// ❌ BAD: Hidden Walrus/Seal usage
export async function submitIntent(intent: Intent): Promise<string> {
  // User doesn't know this uses Walrus + Seal
  const encrypted = await encryptData(intent);
  const blobId = await storeData(encrypted);
  return blobId;
}
```
      </bad>
      <good>
```typescript
// ✅ GOOD: Explicit dependencies
import { WalrusClient } from '@walrus/sdk';
import { SealClient } from '@seal/sdk';

export async function submitIntent(
  intent: Intent,
  walrus: WalrusClient,
  seal: SealClient
): Promise<string> {
  // Clear what's needed
  const encrypted = await seal.encrypt({ data: intent });
  const { blobId } = await walrus.upload({ content: encrypted });
  return blobId;
}
```
      </good>
    </anti_pattern>
  </anti_patterns>

  <integration_guidelines>
    <walrus_integration>
      <guideline>
        Use @walrus/sdk directly, NO custom wrapper.
        SDK only provides type definitions for Walrus paths.
      </guideline>
      
      <example>
```typescript
// Type definition (in @intenus/common)
export interface WalrusPath {
  intents: `/intents/${number}/${string}.json`;
  batches: `/batches/${number}/manifest.json`;
  solutions: `/solutions/${string}/${string}.json`;
}

// Usage (in solver)
import { WalrusClient } from '@walrus/sdk';

const walrus = new WalrusClient({ url: '...' });
const manifest = await walrus.download({
  path: `/batches/${epoch}/manifest.json` as WalrusPath['batches'],
});
```
      </example>
    </walrus_integration>
    
    <seal_integration>
      <guideline>
        Use @seal/sdk directly, NO custom wrapper.
        SDK only provides helper for policy IDs and access validation.
      </guideline>
      
      <example>
```typescript
// Helper (in @intenus/solver-sdk)
export function getSealPolicyForIntent(intentId: string): string {
  return `intent-policy-${intentId}`;
}

// Usage (in solver)
import { SealClient, SessionKey } from '@seal/sdk';

const seal = new SealClient({ ... });
const sessionKey = await SessionKey.create({ ... });

const decrypted = await seal.decrypt({
  data: encryptedIntent,
  sessionKey,
  txBytes: new Uint8Array(),
});
```
      </example>
    </seal_integration>
    
    <sui_integration>
      <guideline>
        Use @mysten/sui.js directly, NO custom wrapper.
        SDK only provides PTB composition helpers (optional).
      </guideline>
      
      <example>
```typescript
// Helper (in @intenus/solver-sdk)
export function addP2PTransfer(
  ptb: TransactionBlock,
  from: string,
  to: string,
  coinType: string,
  amount: string
): void {
  const [coin] = ptb.splitCoins(ptb.gas, [ptb.pure(amount)]);
  ptb.transferObjects([coin], ptb.pure(to));
}

// Usage (in solver)
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { addP2PTransfer } from '@intenus/solver-sdk';

const ptb = new TransactionBlock();
addP2PTransfer(ptb, '0x...', '0x...', '0x2::sui::SUI', '1000');

// Or build manually without helper
const [coin] = ptb.splitCoins(ptb.gas, [ptb.pure('1000')]);
ptb.transferObjects([coin], ptb.pure('0x...'));
```
      </example>
    </sui_integration>
  </integration_guidelines>

  <documentation_requirements>
    <readme_template>
```markdown
# @intenus/solver-sdk

OPTIONAL helpers for building Intenus solvers.

## Installation

```bash
pnpm add @intenus/solver-sdk @mysten/sui.js @walrus/sdk @seal/sdk
```

## Quick Start

### Option 1: Using SDK Helpers (Recommended for beginners)

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

## API Reference

### SolverListener

OPTIONAL helper for Redis subscriptions.

**You can replace this with your own Redis client.**

```typescript
class SolverListener {
  onNewBatch(callback: (batch: Batch) => Promise<void>): void;
  submitSolution(solution: SolutionSubmission): Promise<void>;
  sendHeartbeat(solverAddress: string): Promise<void>;
}
```

### SolutionBuilder

OPTIONAL helper for building PTBs.

**You can build PTBs directly with @mysten/sui.js.**

```typescript
class SolutionBuilder {
  addOutcome(outcome: SolutionOutcome): void;
  getPTB(): TransactionBlock;
  build(): Promise<{ submission, ptbBytes }>;
}
```

### P2PMatcher

OPTIONAL reference implementation.

**You should implement your own optimized matcher.**

```typescript
class P2PMatcher {
  findMatches(intents: Intent[]): P2PMatch[];
}
```

## Examples

See `/examples` directory for full examples.

## License

MIT
```
    </readme_template>
  </documentation_requirements>

  <response_format>
    <when_asked_to_implement>
      1. Clarify: "This is OPTIONAL, solvers can use underlying SDKs directly"
      2. Show minimal implementation (20-50 lines max)
      3. Show alternative without SDK helper
      4. Link to Walrus/Seal/Sui docs for full features
    </when_asked_to_implement>
    
    <when_asked_about_features>
      1. Check if Walrus/Seal/Sui SDK already provides it
      2. If yes: "Use @walrus/sdk directly for this"
      3. If no: Provide minimal type-safe wrapper
      4. Always show direct SDK usage as alternative
    </when_asked_about_features>
  </response_format>

  <important_reminders>
    <reminder priority="critical">
      DO NOT wrap Walrus, Seal, or Sui SDKs.
      Export types and minimal helpers only.
    </reminder>
    
    <reminder priority="critical">
      All helpers are OPTIONAL.
      Solvers can use underlying SDKs directly.
    </reminder>
    
    <reminder priority="high">
      Show both "with SDK" and "without SDK" examples.
    </reminder>
    
    <reminder priority="high">
      @intenus/common has ZERO dependencies (types only).
    </reminder>
    
    <reminder priority="medium">
      Use peerDependencies for Walrus, Seal, Sui.
    </reminder>
    
    <reminder priority="medium">
      Tree-shakeable exports (import only what you need).
    </reminder>
  </important_reminders>
</cursor_rules>
```

## Key Differences from Original Design

1. **Minimal Wrappers**: No custom `WalrusClient`, `SealClient`, `SuiClient` classes
2. **Pure Types in Common**: `@intenus/common` has zero dependencies
3. **Optional Helpers**: Everything in solver-sdk/client-sdk is OPTIONAL
4. **Direct SDK Usage**: Examples show both SDK and raw usage
5. **Composition over Inheritance**: No `BaseSolver`, `DexSolver` hierarchy
6. **Tree-Shakeable**: Import only what you need
7. **Zero Lock-in**: Easy to migrate away if needed

This design gives solvers **maximum freedom** while providing **convenience** for those who want it.