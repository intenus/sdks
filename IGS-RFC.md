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

```typescript
interface IGSIntent {
  // IDENTITY
  igs_version: '1.0.0';
  intent_id: string;
  user_address: string;

  // CLASSIFICATION  
  intent_type: IGSIntentType;
  description: string;

  // CORE OPERATION (Heart of IGS)
  operation: IGSOperation;

  // CONSTRAINTS (MUST be satisfied)
  constraints: IGSConstraints;

  // PREFERENCES (SHOULD be optimized)
  preferences: IGSPreferences;

  // METADATA
  metadata: IGSMetadata;
}
```

**Design Philosophy:** IGS is protocol-agnostic. It describes **what** the user wants, not **how** it will be executed or enforced. Implementation details like timing windows, access control, and validation are handled by the execution layer.

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

### Example 1: Simple Swap

```json
{
  "igs_version": "1.0.0",
  "intent_id": "intent_swap_abc123",
  "user_address": "0x1234...abcd",
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
      "auto_execute": false,
      "show_top_n": 3,
      "require_simulation": true
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

### Example 2: Limit Order

```json
{
  "igs_version": "1.0.0",
  "intent_id": "intent_limit_xyz789",
  "user_address": "0x5678...efgh",
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
      "auto_execute": true,
      "show_top_n": 1,
      "require_simulation": false
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
  solution_id: string;
  intent_id: string;
  solver_address: string;
  submitted_at: number;
  
  // Execution details
  execution: {
    transaction_bytes: string;    // Serialized transaction
    transaction_hash: string;     // Hash for verification
    estimated_gas: string;        // Gas cost estimate
  };
  
  // Promised outcomes
  promised_outputs: Array<{
    asset_id: string;
    amount: string;
  }>;
  
  // Surplus calculation (the key metric)
  surplus_calculation: {
    benchmark_value_usd: string;  // From intent's expected_outcome
    solution_value_usd: string;   // Solver's promised value
    surplus_usd: string;          // Difference (solution - benchmark)
    surplus_percentage: string;   // Percentage improvement
  };
  
  // Strategy information
  strategy_summary: {
    protocols_used: string[];     // DEXs, aggregators used
    total_hops: number;           // Number of swaps
    execution_path: string;       // Human-readable path
  };
  
  // IGS compliance
  compliance_score: number;       // 0-100, how well it follows IGS
  compliance_details?: string[];  // Any warnings or issues
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

## Implementation Notes

### For Solvers

1. **Parse IGS Intent**: Understand the operation, constraints, and preferences.
2. **Generate Solution**: Create a PTB that satisfies the constraints.
3. **Calculate Surplus**: Compare the outcome against the `expected_outcome`.
4. **Submit IGS Solution**: Format the solution with a compliance score.

### For the AI Router

1. **Validate Intent**: Check for IGS compliance.
2. **Collect Solutions**: Aggregate solutions from multiple solvers.
3. **Rank Solutions**: Rank based on surplus, gas, speed, and reputation.
4. **Explain Ranking**: Provide AI-generated reasoning to the user.

### For the Frontend

1. **Display Intent**: Show a human-readable format of the intent.
2. **Show Rankings**: Display the top N solutions with explanations.
3. **User Choice**: Allow auto-execution or manual selection.

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
1. Adopt IGS as your intent format
2. Implement your own execution layer (timing, validation, settlement)
3. Benefit from ecosystem tools (AI routers, solvers, frontends)

**For Solvers**:
1. Parse IGS intents
2. Generate IGS-compliant solutions
3. Calculate and report surplus accurately

**For Frontends**:
1. Generate IGS intents from user input
2. Display solutions with standardized surplus metrics
3. Support multiple protocols with one format

**Next Steps:**

1. Implement IGS types ✅
2. Create JSON Schema validation ✅
3. Test with real use cases
4. Gather feedback from the community
5. Expand to v1.1 operations (lending, staking, etc.)
6. Cross-chain intent support

---

*IGS v1.0 - "Making Intent-based DeFi Measurable and Universal"*
