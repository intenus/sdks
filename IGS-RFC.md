# RFC: Intenus General Standard (IGS) v1.0

**Status:** Draft  
**Version:** 1.0.0  
**Date:** November 2024  
**Authors:** Intenus Team  

## Summary

The **Intenus General Standard (IGS)** is an open standard for describing intents in DeFi in a measurable and comparable way. IGS provides a universal format for expressing user intents, calculating surplus, and enabling AI-powered solution ranking.

The IGS v1.0 MVP focuses on swaps and limit orders with standardized surplus calculation and AI ranking methodology.

## Motivation

### Current Problems

1. **No Common Standard**: Each protocol uses its own proprietary intent format.
2. **Not Measurable**: It's impossible to compare surplus across different solvers.
3. **Difficult for AI**: Lack of context makes effective AI ranking challenging.
4. **Lack of Transparency**: Users don't understand why one solution is better than another.

### The IGS Solution

- **Self-describing**: Intents are fully self-contained and descriptive.
- **Deterministic**: The same intent yields the same expected outcome.
- **Measurable**: Surplus and outcomes can be calculated precisely.
- **AI-friendly**: Provides sufficient context for AI reasoning and ranking.

## Philosophy

> **"Be Liberal in What You Accept, Be Conservative in What You Send"**

- **Liberal Input**: NLP can generate flexible intents from user input.
- **Conservative Output**: Solvers MUST adhere strictly to the IGS standard.
- **AI Router**: Normalizes and validates all intents against the standard.

## Core Design

### 1. Intent Structure

**Two forms of IGS:**

1. **IGSIntent** (Off-chain submission): What the user wants
2. **IGSObject** (On-chain Sui Object): Stored on Sui blockchain

```typescript
// Off-chain intent submission (no blockchain-specific fields)
interface IGSIntent {
  // IDENTITY
  igs_version: '1.0.0';
  created_at: number;

  // CLASSIFICATION  
  intent_type: IGSIntentType;
  description: string;

  // CORE OPERATION (Heart of IGS)
  operation: IGSOperation;

  // CONSTRAINTS (MUST be satisfied)
  constraints: IGSConstraints;

  // PREFERENCES (SHOULD be optimized)
  preferences: IGSPreferences;

  // TIMING
  timing: IGSTiming;

  // METADATA
  metadata: IGSMetadata;
}

// On-chain Sui Object (directly represents what's stored on Sui)
interface IGSObject {
  // Sui Object Fields (from blockchain)
  id: string;                // UID from Sui - serves as intent_id
  user_address: string;      // owner address from Sui
  created_ts: number;        // timestamp when object was created
  
  // IGS Content Reference (stored in Walrus)
  blob_id: string;           // Reference to full IGS intent in Walrus
  
  // On-chain Policy Enforcement
  policy: {
    solver_access_window: {
      start_ms: number;
      end_ms: number;
    };
    router_access_enabled: boolean;
    auto_revoke_time: number;
    access_condition: {
      requires_solver_registration: boolean;
      min_solver_stake: string;
      requires_tee_attestation: boolean;
      expected_measurement: string;
      purpose: string;
    };
  };
}
```

**Key Separation:**
- **IGSIntent**: Pure intent specification (what user wants) - stored in Walrus
- **IGSObject**: On-chain reference object on Sui - stores pointer + policy
- `id` from Sui object serves as `intent_id`
- `user_address` from Sui object owner
- Full intent content (operation, constraints, etc.) stored off-chain in Walrus
- On-chain only stores: reference (blob_id) and policy enforcement parameters

**Storage Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│                     User Submission                       │
│                                                           │
│  IGSIntent (JSON)                                        │
│  ├─ operation: { inputs, outputs, expected_outcome }     │
│  ├─ constraints: { max_slippage, min_outputs }          │
│  ├─ preferences: { optimization_goal, ranking_weights }  │
│  └─ metadata: { client, original_input }                │
└──────────────────────────────────────────────────────────┘
                           │
                           │ Store in Walrus
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    Walrus Storage                         │
│  blob_id: "0xabc123..."                                  │
│  content: <full IGS intent JSON>                         │
└──────────────────────────────────────────────────────────┘
                           │
                           │ Create on-chain reference
                           ▼
┌──────────────────────────────────────────────────────────┐
│                   Sui Blockchain                          │
│                                                           │
│  IGSObject (On-chain Sui Object)                         │
│  ├─ id: "0xdef456..."           (from Sui UID)          │
│  ├─ user_address: "0x789..."    (from Sui owner)        │
│  ├─ created_ts: 1699123456000   (from Clock)            │
│  ├─ blob_id: "0xabc123..."      (→ Walrus)              │
│  └─ policy: { ... }              (enforcement params)    │
└──────────────────────────────────────────────────────────┘
```

**Design Philosophy:** 
- **IGSIntent** = Pure intent specification (protocol-agnostic)
- **IGSObject** = On-chain execution tracking (protocol-specific)
- Separation of concerns: content vs. enforcement

### 2. Operation - The Heart of IGS

Every DeFi action can be modeled as:

- **Inputs**: Assets the user provides.
- **Outputs**: Assets the user wants to receive.
- **Expected Outcome**: The benchmark for calculating surplus.

```typescript
interface IGSOperation {
  mode: 'exact_input' | 'exact_output' | 'limit_order';
  inputs: IGSAssetFlow[];
  outputs: IGSAssetFlow[];
  expected_outcome: IGSExpectedOutcome; // KEY: The benchmark for surplus
}
```

### 3. Surplus Calculation

```
Surplus = Solution Value - Expected Value
Surplus % = (Surplus / Expected Value) * 100
```

The **Expected Value** is derived from:

- DEX aggregator quotes
- Oracle prices
- Manual calculations
- Historical data

## MVP Scope (v1.0)

### Supported Intent Types

1. **`swap.exact_input`**: Swap X amount of A for the maximum amount of B.
2. **`swap.exact_output`**: Swap the minimum amount of A for exactly X amount of B.
3. **`limit.sell`**: Sell asset A when its price is >= X.
4. **`limit.buy`**: Buy asset A when its price is <= X.

### AI Ranking Factors

1. **Surplus** (50%): The actual value delivered versus the expected value.
2. **Gas Cost** (25%): The cost to execute the transaction.
3. **Speed** (15%): The execution speed.
4. **Reputation** (10%): The solver's reliability and track record.

## Examples

### Example 1: Simple Swap (IGSIntent - User Submission)

This is what the user submits (pure intent, no on-chain fields):

```json
{
  "igs_version": "1.0.0",
  "created_at": 1699123456000,
  "intent_type": "swap.exact_input",
  "description": "Swap 100 SUI to USDC",
  "operation": {
    "mode": "exact_input",
    "inputs": [{
      "asset_id": "0x2::sui::SUI",
      "asset_info": {"symbol": "SUI", "decimals": 9},
      "amount": {"type": "exact", "value": "100000000000"}
    }],
    "outputs": [{
      "asset_id": "0x...::usdc::USDC", 
      "asset_info": {"symbol": "USDC", "decimals": 6},
      "amount": {"type": "range", "min": "298500000", "max": "300000000"},
      "min_amount": "298500000"
    }],
    "expected_outcome": {
      "expected_outputs": [{"asset_id": "0x...::usdc::USDC", "amount": "300000000"}],
      "expected_costs": {"gas_estimate": "0.01", "slippage_estimate": "1.50"},
      "benchmark": {"source": "dex_aggregator", "timestamp": 1699123456000, "confidence": 0.95}
    }
  },
  "constraints": {
    "max_slippage_bps": 50,
    "min_outputs": [{"asset_id": "0x...::usdc::USDC", "amount": "298500000"}]
  },
  "preferences": {
    "optimization_goal": "balanced",
    "ranking_weights": {
      "surplus_weight": 50,
      "gas_cost_weight": 25,
      "execution_speed_weight": 15,
      "reputation_weight": 10
    },
    "execution": {
      "mode": "top_n_with_best_incentive",
      "show_top_n": 3
    }
  },
  "metadata": {
    "client": {
      "name": "Intenus Web",
      "version": "1.0.0",
      "platform": "browser"
    }
  }
}
```

**Corresponding IGSObject (On-chain Sui Object):**

After submission, this is what exists on Sui blockchain:

```json
{
  "id": "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
  "user_address": "0x789abc123def456789abc123def456789abc123def456789abc123def456789a",
  "created_ts": 1699123456000,
  "blob_id": "0xabc123def456789012345678901234567890123456789012345678901234",
  "policy": {
    "solver_access_window": {
      "start_ms": 1699123456000,
      "end_ms": 1699123461000
    },
    "router_access_enabled": true,
    "auto_revoke_time": 1699127056000,
    "access_condition": {
      "requires_solver_registration": true,
      "min_solver_stake": "1000000000",
      "requires_tee_attestation": false,
      "expected_measurement": "",
      "purpose": "Swap intent for batch processing"
    }
  }
}
```

**Note:** Full intent content is in Walrus at `blob_id`. IGSObject only stores reference + policy enforcement.

### Example 2: Limit Order (IGSIntent)

```json
{
  "igs_version": "1.0.0", 
  "created_at": 1699123456000,
  "intent_type": "limit.sell",
  "description": "Sell 1000 SUI at $3.50 limit",
  "operation": {
    "mode": "limit_order",
    "inputs": [{
      "asset_id": "0x2::sui::SUI",
      "asset_info": {"symbol": "SUI", "decimals": 9},
      "amount": {"type": "exact", "value": "1000000000000"}
    }],
    "outputs": [{
      "asset_id": "0x...::usdc::USDC",
      "asset_info": {"symbol": "USDC", "decimals": 6},
      "amount": {"type": "range", "min": "3500000000", "max": "3600000000"}
    }],
    "expected_outcome": {
      "expected_outputs": [{"asset_id": "0x...::usdc::USDC", "amount": "3500000000"}],
      "expected_costs": {"gas_estimate": "0.02"},
      "benchmark": {"source": "manual", "timestamp": 1699123456000, "confidence": 1.0},
      "market_price": {"price": "3.20", "price_asset": "0x...::usdc::USDC"}
    }
  },
  "constraints": {
    "max_slippage_bps": 100,
    "min_outputs": [{"asset_id": "0x...::usdc::USDC", "amount": "3500000000"}],
    "limit_price": {"price": "3.50", "comparison": "gte", "price_asset": "0x...::usdc::USDC"}
  },
  "preferences": {
    "optimization_goal": "maximize_output",
    "ranking_weights": {
      "surplus_weight": 60,
      "gas_cost_weight": 20,
      "execution_speed_weight": 10,
      "reputation_weight": 10
    },
    "execution": {
      "mode": "best_solution"
    }
  },
  "metadata": {
    "client": {
      "name": "Intenus Mobile",
      "version": "1.0.0",
      "platform": "ios"
    }
  }
}
```

## Validation & Compliance

### IGS Validator

```typescript
function validateIGS(intent: IGSIntent): IGSValidationResult {
  // Check version, timing, constraints, and operation logic
  return {
    valid: boolean,
    compliance_score: number, // 0-100
    errors: IGSValidationError[],
    warnings: string[]
  };
}
```

### Compliance Score

- **100**: Perfect IGS compliance.
- **80-99**: Good compliance with minor warnings.
- **60-79**: Acceptable, but with some issues.
- **<60**: Poor compliance with major issues.

## Solution Format

### IGS Solution (From Solvers)

```typescript
interface IGSSolution {
  solver_address: string;
  transaction_bytes: string;
}
```

### IGS Ranked Solution (From AI)

```typescript
interface IGSRankedSolution {
  rank: number;
  ai_score: number; // 0-100
  solution: IGSSolution;
  
  ai_reasoning: {
    primary_reason: string;
    risk_assessment: 'low' | 'medium' | 'high';
    confidence_level: number;
  };
  
  warnings: string[];
}
```

## Migration Strategy

### Phase 1: Parallel Support

- Support both legacy and IGS intent formats.
- Provide a migration function: `migrateToIGS(legacyIntent)`.
- Ensure backward compatibility.

### Phase 2: IGS First

- NLP outputs the IGS format by default.
- Maintain legacy support for existing integrations.

### Phase 3: IGS Only

- Deprecate legacy formats.
- Transition to a full IGS ecosystem.

## Solution Flow Architecture

### New Flow (MVP)

```
1. User submits IGSIntent (JSON)
   ↓
2. Protocol stores IGSIntent in Walrus
   ↓
3. Protocol creates IGSObject on Sui:
   - Gets id (UID) from Sui
   - Sets user_address from tx sender
   - Sets created_ts from Clock
   - Stores blob_id (reference to Walrus)
   - Initializes policy, status, pending_solutions
   ↓
4. Solvers fetch IGSIntent from Walrus (via blob_id)
   ↓
5. Solvers create and submit solutions (PTBs):
   - Reference IGSObject.id
   - Submit to Intent.pending_solutions
   ↓
6. PreRankingEngine processes solutions:
   - Fetches IGSIntent from Walrus
   - Validates schema compliance
   - Checks constraints satisfaction
   - Converts to feature vectors
   - Runs Sui Dry Run simulation
   ↓
7. RankingEngine ranks validated solutions:
   - Applies AI ranking based on features
   - Considers: surplus, gas, speed, reputation
   - Outputs based on execution mode
   ↓
8. Best solution stored in IGSObject.best_solution_id
   ↓
9. Returns result to user:
   - best_solution: Single best PTB
   - top_n_with_best_incentive: Top N PTBs (fee goes to best)
   ↓
10. User executes chosen PTB
    ↓
11. IGSObject.status updated to EXECUTED
```

### Key Differences from Legacy

1. **No Auto-Execute**: Solvers never execute. They only submit PTBs.
2. **Dry Run Required**: All solutions simulated before ranking (in PreRanking).
3. **Two-Stage Ranking**:
   - PreRankingEngine: Validation + Simulation
   - RankingEngine: AI-based ranking
4. **Mode-Based Output**:
   - `best_solution`: Return only #1 (default MVP)
   - `top_n_with_best_incentive`: Show top N, but fee always goes to best solver

### Execution Modes

```typescript
type IGSExecutionMode =
  | 'best_solution'                 // Return only best (MVP default)
  | 'top_n_with_best_incentive';    // Show top N, fee to best
```

**Why no auto_execute?**
- Solvers don't hold user funds
- Solutions are PTBs (transaction bytes)
- User must sign and execute themselves
- Maintains security and non-custodial nature

**Fee Incentive Design:**
- In `top_n_with_best_incentive` mode, user can choose any solution
- BUT: Fee/reward ALWAYS goes to the #1 ranked solver
- This ensures solvers compete for quality, not just visibility
- Users get optionality without destroying incentive alignment

## Implementation Notes

### For Solvers

1. **Parse IGSIntent**: Understand the operation, constraints, and preferences.
2. **Generate Solution**: Create a PTB that satisfies the constraints.
3. **Calculate Surplus**: Compare the outcome against the `expected_outcome`.
4. **Submit IGS Solution**: Format the solution with compliance score and promised outputs.
5. **No Execution**: Solvers never execute transactions, only submit PTBs.

### For the PreRankingEngine

1. **Validate Schema**: Check IGS compliance and schema correctness.
2. **Validate Constraints**: Ensure all hard constraints are satisfied.
3. **Convert Features**: Extract features for AI ranking (surplus, gas, hops, etc.).
4. **Dry Run Simulation**: Simulate each solution on Sui to verify execution.
5. **Filter Failed**: Remove solutions that fail simulation or validation.
6. **Pass to Ranking**: Send validated solutions with feature vectors to RankingEngine.

### For the RankingEngine

1. **Receive Validated Solutions**: Get solutions that passed PreRanking.
2. **Apply AI Model**: Rank based on feature vectors and weights.
3. **Consider Reputation**: Factor in solver historical performance.
4. **Apply Mode**:
   - `best_solution`: Return only rank #1
   - `top_n_with_best_incentive`: Return top N with best marked for fee
5. **Generate Explanations**: Provide AI reasoning for rankings.

### For the Frontend

1. **Submit Intent**: 
   - User creates IGSIntent (no intent_id/user_address)
   - Frontend sends to protocol
   - Receives back IGSObject.id for tracking
2. **Display Intent**: 
   - Show human-readable format of what user wants
   - Display IGSObject status (pending, best_selected, etc.)
3. **Show Rankings**: 
   - Display solutions from RankingEngine with explanations
   - Show surplus, gas, execution path for each solution
4. **User Choice**: 
   - Allow user to select and sign PTB
   - Chosen solution updates IGSObject.status
5. **Track Execution**: 
   - Monitor IGSObject for status updates
   - Display final execution result

## IGS Ecosystem Integration

IGS is designed to be protocol-agnostic and can be integrated with various execution layers:

### Storage and Privacy

- **Storage**: IGS intents can be stored on-chain, off-chain (e.g., Walrus), or in private databases
- **Privacy**: Support for encryption (e.g., Seal) when handling sensitive intents
- **Compression**: JSON format allows for easy compression and efficient transmission

### Execution Layer Integration

The execution layer (protocol-specific) handles:
- **Timing**: Deadlines, solver windows, batch coordination
- **Access Control**: Who can see/solve which intents
- **Validation**: Transaction simulation and verification
- **Settlement**: Actual execution on blockchain

IGS provides the **data format**, execution layers provide the **enforcement**.

### Multi-Protocol Support

```typescript
// IGS intent can target any blockchain
interface IGSIntent {
  // ... standard IGS fields ...
  target_chain?: string;      // Optional: 'sui', 'ethereum', 'solana'
  cross_chain?: {             // Optional: for cross-chain intents
    source_chain: string;
    dest_chain: string;
    bridge_preferences: string[];
  };
}
```

## Future Extensions (Post-MVP)

### v1.1: Advanced Operations

- Multi-asset rebalancing
- Lending/borrowing
- Staking/unstaking
- Cross-chain bridges

### v1.2: Advanced Features

- Conditional execution
- Time-based strategies
- Portfolio optimization
- Risk management

### v1.3: Ecosystem Integration

- Protocol-specific extensions
- Custom constraint types
- Advanced AI models
- MEV protection

## Conclusion

IGS v1.0 provides a solid foundation for intent-based DeFi:

✅ **Universal**: A common format that works across any protocol or blockchain
✅ **Measurable**: Standardized surplus calculation for comparing solutions
✅ **AI-friendly**: Rich context enables intelligent solution ranking
✅ **Self-describing**: All information needed to understand and solve the intent
✅ **Extensible**: Easy to add new intent types and features
✅ **Protocol-agnostic**: Separates intent description from execution enforcement

### Core Principles

1. **Format, not enforcement**: IGS describes intents; execution layers enforce them
2. **Surplus-driven**: Everything revolves around measurable value creation
3. **AI-first**: Designed for machine learning and automated reasoning
4. **Human-readable**: JSON format that both humans and machines understand
5. **Composable**: Intents can be combined, split, or transformed

### Adoption Path

**For Protocols**:
1. Adopt IGSIntent as your intent format
2. Design your IGSObject on-chain structure (like Sui's Intent object)
3. Implement execution layer (timing, validation, settlement)
4. Benefit from ecosystem tools (AI routers, solvers, frontends)

**For Solvers**:
1. Fetch IGSIntent from storage (e.g., Walrus via blob_id)
2. Parse intent: operation, constraints, preferences
3. Generate IGS-compliant solutions (PTBs)
4. Calculate and report surplus accurately
5. Submit solutions referencing IGSObject.id

**For Frontends**:
1. Generate IGSIntent from user input (no need for intent_id/user_address)
2. Submit to protocol (gets IGSObject.id back)
3. Display solutions with standardized surplus metrics
4. Support multiple protocols with one format

**Key Insight:**
- Users submit **IGSIntent** (pure intent JSON)
- Protocol creates **IGSObject** (on-chain tracking)
- Solvers fetch IGSIntent via blob_id, solve, submit to IGSObject
- Clear separation: content (off-chain) vs tracking (on-chain)

**Next Steps:**

1. Implement IGS types ✅
2. Create JSON Schema validation ✅
3. Test with real use cases
4. Gather feedback from the community
5. Expand to v1.1 operations (lending, staking, etc.)
6. Cross-chain intent support

---

*IGS v1.0 - "Making Intent-based DeFi Measurable and Universal"*
