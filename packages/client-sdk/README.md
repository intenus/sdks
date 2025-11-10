# @intenus/client-sdk

**Optional utilities** for building Intenus client applications. Clients can use underlying SDKs directly for maximum control.

## 📦 Installation

```bash
npm install @intenus/client-sdk @mysten/sui @mysten/walrus @mysten/seal
```

## 🎯 Purpose

Provides **convenience utilities** for client developers. All utilities are **completely optional** - clients can construct intents and execute transactions manually using underlying SDKs.

## 🚀 Quick Start

### Option 1: Using SDK Utilities (Recommended for rapid development)

```typescript
import { IntentBuilder, PTBExecutor } from '@intenus/client-sdk';
import { SuiClient } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
import { SealClient } from '@mysten/seal';

const sui = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
const walrus = new WalrusClient({ url: 'https://walrus-testnet.mystenlabs.com' });
const seal = new SealClient({ network: 'testnet' });

// Build intent with fluent API
const intent = new IntentBuilder('0xclient_address')
  .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
  .private(true)
  .urgency('high')
  .deadline(Date.now() + 300_000)
  .minOutput('0x...::usdc::USDC', '950000')
  .build();

// Submit intent to protocol
await submitIntentToProtocol(intent, walrus, seal);

// Later, execute ranked solution
const executor = new PTBExecutor(sui);
const txDigest = await executor.execute(rankedPTB, wallet);
```

### Option 2: Manual Construction (Maximum flexibility)

```typescript
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { WalrusClient } from '@mysten/walrus';
import type { Intent, RankedPTB } from '@intenus/common';

const sui = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });
const walrus = new WalrusClient({ url: 'https://walrus-testnet.mystenlabs.com' });

// Manual intent construction
const intent: Intent = {
  intent_id: crypto.randomUUID(),
  user_address: '0xclient_address',
  timestamp: Date.now(),
  category: 'swap',
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

// Manual transaction execution
const ptbBytes = Buffer.from(rankedPTB.ptb_bytes, 'base64');
const txb = Transaction.from(ptbBytes);

const { signature } = await wallet.signTransactionBlock({
  transactionBlock: txb
});

const result = await sui.executeTransactionBlock({
  transactionBlock: txb,
  signature,
  options: { showEffects: true }
});
```

## 📚 API Reference

### IntentBuilder

**Optional fluent API** for constructing intents.

**Alternative**: Construct `Intent` objects manually for full control.

```typescript
class IntentBuilder {
  constructor(userAddress: string);
  
  // Asset operations
  swap(tokenIn: string, amountIn: string, tokenOut: string, slippageBps?: number): this;
  addLiquidity(tokenA: string, amountA: string, tokenB: string, amountB: string): this;
  removeLiquidity(lpToken: string, amount: string): this;
  
  // Execution preferences
  private(isPrivate?: boolean): this;
  urgency(level: 'low' | 'normal' | 'high'): this;
  deadline(deadlineMs: number): this;
  
  // Constraints
  minOutput(assetId: string, amount: string): this;
  maxSlippage(bps: number): this;
  
  // Metadata
  language(lang: string): this;
  confidence(score: number): this;
  
  // Build final intent
  build(): Intent;
}
```

**Usage Examples:**

```typescript
// Simple swap
const swapIntent = new IntentBuilder('0xuser_address')
  .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
  .build();

// Advanced swap with constraints
const advancedSwap = new IntentBuilder('0xuser_address')
  .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC', 30) // 0.3% slippage
  .private(true)
  .urgency('high')
  .deadline(Date.now() + 180_000) // 3 minutes
  .minOutput('0x...::usdc::USDC', '970000') // Minimum output
  .confidence(0.9)
  .build();

// Liquidity provision
const liquidityIntent = new IntentBuilder('0xuser_address')
  .addLiquidity('0x2::sui::SUI', '1000000', '0x...::usdc::USDC', '1000000')
  .urgency('normal')
  .build();
```

**Manual construction alternative:**
```typescript
import type { Intent } from '@intenus/common';

const intent: Intent = {
  intent_id: crypto.randomUUID(),
  user_address: '0xuser_address',
  timestamp: Date.now(),
  category: 'swap',
  action: {
    type: 'swap_exact_in',
    params: { slippageBps: 30 }
  },
  assets: {
    inputs: [{ asset_id: '0x2::sui::SUI', amount: '1000000' }],
    outputs: [{ asset_id: '0x...::usdc::USDC' }]
  },
  constraints: {
    max_slippage_bps: 30,
    deadline_ms: Date.now() + 180_000,
    min_output: [{ asset_id: '0x...::usdc::USDC', amount: '970000' }]
  },
  execution: {
    urgency: 'high',
    privacy_level: 'private'
  },
  metadata: {
    language: 'en',
    confidence: 0.9
  }
};
```

### PTBExecutor

**Optional utility** for executing ranked transactions.

**Alternative**: Use Sui SDK directly for transaction execution.

```typescript
class PTBExecutor {
  constructor(suiClient: SuiClient, options?: ExecutorOptions);
  
  // Execute ranked transaction
  execute(rankedPTB: RankedPTB, signer: Signer): Promise<string>;
  
  // Simulation and estimation
  simulate(rankedPTB: RankedPTB): Promise<DryRunTransactionBlockResponse>;
  estimateGas(rankedPTB: RankedPTB): Promise<string>;
  
  // Batch operations
  executeBatch(rankedPTBs: RankedPTB[], signer: Signer): Promise<string[]>;
}

interface ExecutorOptions {
  gasPrice?: string;
  gasBudget?: string;
  showEffects?: boolean;
}
```

**Usage:**
```typescript
const executor = new PTBExecutor(sui, {
  gasPrice: '1000',
  gasBudget: '10000000',
  showEffects: true
});

// Execute single transaction
const txDigest = await executor.execute(rankedPTB, wallet);
console.log(`Transaction executed: ${txDigest}`);

// Simulate before execution
const simulation = await executor.simulate(rankedPTB);
if (simulation.effects?.status?.status === 'success') {
  const txDigest = await executor.execute(rankedPTB, wallet);
}

// Estimate gas costs
const gasEstimate = await executor.estimateGas(rankedPTB);
console.log(`Estimated gas: ${gasEstimate}`);

// Execute multiple transactions
const txDigests = await executor.executeBatch([ptb1, ptb2, ptb3], wallet);
```

**Direct Sui SDK alternative:**
```typescript
import { Transaction } from '@mysten/sui/transactions';

// Manual execution
const ptbBytes = Buffer.from(rankedPTB.ptb_bytes, 'base64');
const txb = Transaction.from(ptbBytes);

// Simulate first
const simulation = await sui.dryRunTransactionBlock({
  transactionBlock: await txb.build({ client: sui })
});

if (simulation.effects.status.status === 'success') {
  // Sign and execute
  const { signature } = await wallet.signTransactionBlock({
    transactionBlock: txb
  });
  
  const result = await sui.executeTransactionBlock({
    transactionBlock: txb,
    signature,
    options: {
      showEffects: true,
      showEvents: true
    }
  });
  
  console.log(`Transaction executed: ${result.digest}`);
}
```

## 📖 Complete Examples

### Full Client Application (with SDK utilities)

```typescript
import { IntentBuilder, PTBExecutor } from '@intenus/client-sdk';
import { SuiClient } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
import { SealClient } from '@mysten/seal';
import type { RankedPTB } from '@intenus/common';

class IntenusClient {
  private sui = new SuiClient({ 
    url: process.env.SUI_RPC_URL! 
  });
  private walrus = new WalrusClient({ 
    url: process.env.WALRUS_URL! 
  });
  private seal = new SealClient({
    network: process.env.NETWORK as 'testnet' | 'mainnet'
  });
  private executor = new PTBExecutor(this.sui);
  
  async submitSwapIntent(
    userAddress: string,
    tokenIn: string,
    amountIn: string,
    tokenOut: string,
    options: {
      private?: boolean;
      urgency?: 'low' | 'normal' | 'high';
      maxSlippageBps?: number;
      deadlineMs?: number;
    } = {}
  ): Promise<string> {
    // 1. Build intent using SDK utility
    const intent = new IntentBuilder(userAddress)
      .swap(tokenIn, amountIn, tokenOut, options.maxSlippageBps)
      .private(options.private ?? false)
      .urgency(options.urgency ?? 'normal')
      .deadline(options.deadlineMs ?? Date.now() + 300_000)
      .build();
    
    // 2. Encrypt if private
    let intentData = JSON.stringify(intent);
    if (options.private) {
      const { encryptedData } = await this.seal.encrypt({
        data: intentData,
        // Seal encryption options
      });
      intentData = encryptedData;
    }
    
    // 3. Store on Walrus
    const { blobId } = await this.walrus.store({
      data: Buffer.from(intentData),
      epochs: 5 // Store for 5 epochs
    });
    
    // 4. Submit to Intenus protocol
    await this.submitToProtocol({
      intent_id: intent.intent_id,
      user_address: userAddress,
      walrus_blob_id: blobId,
      is_private: options.private ?? false
    });
    
    return intent.intent_id;
  }
  
  async executeSolution(
    rankedPTB: RankedPTB,
    wallet: any
  ): Promise<string> {
    // Simulate first to check for errors
    const simulation = await this.executor.simulate(rankedPTB);
    
    if (simulation.effects?.status?.status !== 'success') {
      throw new Error(`Simulation failed: ${simulation.effects?.status?.error}`);
    }
    
    // Execute the transaction
    const txDigest = await this.executor.execute(rankedPTB, wallet);
    
    // Wait for confirmation
    await this.sui.waitForTransactionBlock({
      digest: txDigest,
      options: { showEffects: true }
    });
    
    return txDigest;
  }
  
  async getIntentStatus(intentId: string): Promise<{
    status: 'pending' | 'matched' | 'executed' | 'failed';
    solutions?: RankedPTB[];
    executionTx?: string;
  }> {
    // Query protocol for intent status
    const response = await fetch(`/api/intents/${intentId}/status`);
    return response.json();
  }
  
  private async submitToProtocol(data: any): Promise<void> {
    await fetch('/api/intents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}

// Usage
const client = new IntenusClient();

// Submit a private swap intent
const intentId = await client.submitSwapIntent(
  '0xuser_address',
  '0x2::sui::SUI',
  '1000000',
  '0x...::usdc::USDC',
  {
    private: true,
    urgency: 'high',
    maxSlippageBps: 50,
    deadlineMs: Date.now() + 180_000
  }
);

// Check status periodically
const status = await client.getIntentStatus(intentId);
if (status.status === 'matched' && status.solutions) {
  // Execute best solution
  const bestSolution = status.solutions[0];
  const txDigest = await client.executeSolution(bestSolution, wallet);
  console.log(`Intent executed: ${txDigest}`);
}
```

### Manual Client Implementation (direct SDK usage)

```typescript
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { WalrusClient } from '@mysten/walrus';
import { SealClient } from '@mysten/seal';
import type { Intent, RankedPTB } from '@intenus/common';

class ManualClient {
  private sui = new SuiClient({ url: process.env.SUI_RPC_URL! });
  private walrus = new WalrusClient({ url: process.env.WALRUS_URL! });
  private seal = new SealClient({ network: 'testnet' });
  
  async createAndSubmitIntent(
    userAddress: string,
    tokenIn: string,
    amountIn: string,
    tokenOut: string
  ): Promise<string> {
    // Manual intent construction
    const intent: Intent = {
      intent_id: crypto.randomUUID(),
      user_address: userAddress,
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
    
    // Store on Walrus
    const intentJson = JSON.stringify(intent);
    const { blobId } = await this.walrus.store({
      data: Buffer.from(intentJson)
    });
    
    // Submit to protocol
    await fetch('/api/intents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent_id: intent.intent_id,
        user_address: userAddress,
        walrus_blob_id: blobId
      })
    });
    
    return intent.intent_id;
  }
  
  async executeManually(
    rankedPTB: RankedPTB,
    wallet: any
  ): Promise<string> {
    // Deserialize transaction
    const ptbBytes = Buffer.from(rankedPTB.ptb_bytes, 'base64');
    const txb = Transaction.from(ptbBytes);
    
    // Build transaction for simulation
    const builtTxb = await txb.build({ client: this.sui });
    
    // Simulate execution
    const simulation = await this.sui.dryRunTransactionBlock({
      transactionBlock: builtTxb
    });
    
    if (simulation.effects.status.status !== 'success') {
      throw new Error(`Transaction would fail: ${simulation.effects.status.error}`);
    }
    
    // Sign transaction
    const { signature } = await wallet.signTransactionBlock({
      transactionBlock: txb
    });
    
    // Execute transaction
    const result = await this.sui.executeTransactionBlock({
      transactionBlock: txb,
      signature,
      options: {
        showEffects: true,
        showEvents: true,
        showInput: true,
        showRawInput: true
      }
    });
    
    if (result.effects?.status?.status !== 'success') {
      throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
    }
    
    return result.digest;
  }
}
```

## 🔧 Advanced Usage Patterns

### Intent Validation

```typescript
import { validateIntent } from '@intenus/client-sdk';

const intent = new IntentBuilder('0xuser')
  .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
  .build();

// Validate before submission
const validation = validateIntent(intent);
if (!validation.isValid) {
  console.error('Intent validation failed:', validation.errors);
  return;
}
```

### Batch Intent Submission

```typescript
class BatchClient extends IntenusClient {
  async submitBatchIntents(
    intents: Array<{
      tokenIn: string;
      amountIn: string;
      tokenOut: string;
      options?: IntentOptions;
    }>
  ): Promise<string[]> {
    const intentIds = await Promise.all(
      intents.map(({ tokenIn, amountIn, tokenOut, options }) =>
        this.submitSwapIntent(this.userAddress, tokenIn, amountIn, tokenOut, options)
      )
    );
    
    return intentIds;
  }
  
  async executeBatchSolutions(
    solutions: RankedPTB[],
    wallet: any
  ): Promise<string[]> {
    return this.executor.executeBatch(solutions, wallet);
  }
}
```

## ⚠️ Important Notes

1. **All utilities are optional** - Use when convenient, implement manually when you need full control
2. **No SDK wrapping** - Direct integration with Walrus, Seal, and Sui SDKs
3. **Fluent API convenience** - IntentBuilder provides ergonomic intent construction
4. **Production ready** - Utilities handle edge cases and provide proper error handling
5. **Maximum flexibility** - Clients can bypass utilities entirely for custom implementations

## 🔗 Related Resources

- [Complete Examples](../../examples/client-basic) - Full client application examples
- [@intenus/common](../common) - Shared type definitions
- [Sui SDK Documentation](https://sdk.mystenlabs.com/typescript) - Direct Sui integration
- [Walrus Documentation](https://docs.walrus.site) - Direct Walrus integration
- [Seal Documentation](https://seal-docs.wal.app) - Direct Seal integration

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.