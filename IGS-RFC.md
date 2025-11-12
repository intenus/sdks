# RFC: Intenus General Standard (IGS) v1.0

**Status:** Draft  
**Version:** 1.0.0  
**Date:** November 2024  
**Authors:** Intenus Team  

## Summary

The **Intenus General Standard (IGS)** is an open standard for describing intents in DeFi in a measurable and comparable way. The IGS v1.0 MVP focuses on swaps and limit orders with AI-powered ranking.

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
```

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
      "benchmark": {"source": "dex_aggregator", "confidence": 0.95}
    }
  },
  "constraints": {
    "deadline": 1699123456789,
    "max_slippage_bps": 50,
    "min_outputs": [{"asset_id": "0x...::usdc::USDC", "amount": "298500000"}]
  }
}
```

### Example 2: Limit Order

```json
{
  "igs_version": "1.0.0", 
  "intent_type": "limit.sell",
  "description": "Sell 1000 SUI at a $3.50 limit",
  "operation": {
    "mode": "limit_order",
    "inputs": [{
      "asset_id": "0x2::sui::SUI",
      "amount": {"type": "exact", "value": "1000000000000"}
    }],
    "outputs": [{
      "asset_id": "0x...::usdc::USDC",
      "amount": {"type": "range", "min": "3500000000", "max": "3600000000"}
    }],
    "expected_outcome": {
      "market_price": {"price": "3.20", "price_asset": "0x...::usdc::USDC"}
    }
  },
  "constraints": {
    "limit_price": {"price": "3.50", "comparison": "gte", "price_asset": "0x...::usdc::USDC"}
  },
  "timing": {
    "execution": {"time_in_force": "good_til_cancel"}
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
  
  // Execution
  ptb_bytes: string;
  ptb_hash: string;
  
  // Outcomes
  promised_outputs: Array<{asset_id: string, amount: string}>;
  estimated_gas: string;
  
  // Surplus calculation
  surplus_calculation: {
    benchmark_value_usd: string;
    solution_value_usd: string; 
    surplus_usd: string;
    surplus_percentage: string;
  };
  
  compliance_score: number;
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

## Security Considerations

### Intent Privacy

- **Public**: For basic swap intents.
- **Encrypted**: For large orders or sensitive strategies.
- **Anonymous**: For privacy-focused execution.

### Solution Verification

- **Simulation**: Test the PTB before execution.
- **TEE Attestation**: Use a trusted execution environment.
- **Compliance Check**: Perform IGS validation.

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

✅ **Standardized**: A common format for the entire ecosystem.
✅ **Measurable**: Accurate surplus calculation.
✅ **AI-friendly**: Rich context for ranking.
✅ **Extensible**: Easy to extend for future features.
✅ **Hackathon-ready**: Simple enough for rapid implementation.

**Next Steps:**

1. Implement IGS types ✅
2. Create JSON Schema validation ✅
3. Update solver-sdk support ✅
4. Test with real use cases
5. Gather feedback from the community

---

*IGS v1.0 - "Making Intent-based DeFi Measurable and Transparent"*
