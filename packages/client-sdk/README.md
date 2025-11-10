# @intenus/client-sdk

**OPTIONAL helpers** cho building Intenus clients. Clients có thể sử dụng underlying SDKs trực tiếp nếu muốn.

## 📦 Installation

```bash
pnpm add @intenus/client-sdk @mysten/sui.js @walrus/sdk @seal/sdk
```

## 🎯 Purpose

Cung cấp **convenience helpers** cho client developers. Tất cả helpers đều là **OPTIONAL** - clients có thể construct intents và execute PTBs manually.

## 🚀 Quick Start

### Option 1: Using SDK Helpers

```typescript
import { IntentBuilder, PTBExecutor } from '@intenus/client-sdk';
import { SuiClient } from '@mysten/sui.js/client';

const intent = new IntentBuilder('0x...')
  .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
  .private(true)
  .urgency('high')
  .build();

const executor = new PTBExecutor(new SuiClient({ url: '...' }));
await executor.execute(rankedPTB, wallet);
```

### Option 2: Manual Construction

```typescript
import type { Intent } from '@intenus/common';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Manual intent construction
const intent: Intent = {
  intent_id: crypto.randomUUID(),
  user_address: '0x...',
  category: 'swap',
  // ... all fields manually
};

// Manual PTB execution
const ptbBytes = Buffer.from(rankedPTB.ptb_bytes, 'base64');
const txb = TransactionBlock.from(ptbBytes);
const result = await suiClient.executeTransactionBlock({ ... });
```

## 📚 API Reference

### IntentBuilder

**OPTIONAL fluent API** cho building intents.

**Bạn có thể construct Intent objects manually.**

```typescript
class IntentBuilder {
  constructor(userAddress: string);
  
  // Fluent methods
  swap(tokenIn: string, amountIn: string, tokenOut: string, slippageBps?: number): this;
  private(isPrivate?: boolean): this;
  urgency(level: 'low' | 'normal' | 'high'): this;
  deadline(deadlineMs: number): this;
  minOutput(assetId: string, amount: string): this;
  
  build(): Intent;
}
```

**Usage:**
```typescript
const intent = new IntentBuilder('0x...')
  .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC', 50)
  .private(true)
  .urgency('high')
  .deadline(Date.now() + 300_000)
  .minOutput('0x...::usdc::USDC', '900000')
  .build();
```

**Alternative (manual construction):**
```typescript
import type { Intent } from '@intenus/common';

const intent: Intent = {
  intent_id: crypto.randomUUID(),
  user_address: '0x...',
  timestamp: Date.now(),
  category: 'swap',
  action: {
    type: 'swap_exact_in',
    params: { slippageBps: 50 },
  },
  assets: {
    inputs: [{ asset_id: '0x2::sui::SUI', amount: '1000000' }],
    outputs: [{ asset_id: '0x...::usdc::USDC' }],
  },
  constraints: {
    max_slippage_bps: 50,
    deadline_ms: Date.now() + 300_000,
  },
  execution: {
    urgency: 'high',
    privacy_level: 'private',
  },
  metadata: {
    language: 'en',
    confidence: 1.0,
  },
};
```

### PTBExecutor

**OPTIONAL helper** cho executing ranked PTBs.

**Bạn có thể sử dụng Sui SDK trực tiếp.**

```typescript
class PTBExecutor {
  constructor(suiClient: SuiClient);
  
  execute(rankedPTB: RankedPTB, signer: any): Promise<string>;
  simulate(rankedPTB: RankedPTB): Promise<any>;
  estimateGas(rankedPTB: RankedPTB): Promise<string>;
}
```

**Usage:**
```typescript
const executor = new PTBExecutor(suiClient);
const txDigest = await executor.execute(rankedPTB, wallet);
```

**Alternative (manual execution):**
```typescript
import { TransactionBlock } from '@mysten/sui.js/transactions';

const ptbBytes = Buffer.from(rankedPTB.ptb_bytes, 'base64');
const txb = TransactionBlock.from(ptbBytes);

const { signature } = await wallet.signTransactionBlock({
  transactionBlock: txb,
});

const result = await suiClient.executeTransactionBlock({
  transactionBlock: txb,
  signature,
  options: { showEffects: true },
});
```

## 📖 Examples

### Complete Client Flow (với SDK)

```typescript
import { IntentBuilder, PTBExecutor } from '@intenus/client-sdk';
import { SuiClient } from '@mysten/sui.js/client';
import { WalrusClient } from '@walrus/sdk';
import { SealClient } from '@seal/sdk';

class IntenusClient {
  private sui = new SuiClient({ url: '...' });
  private walrus = new WalrusClient({ url: '...' });
  private seal = new SealClient({ ... });
  private executor = new PTBExecutor(this.sui);
  
  async submitSwapIntent(tokenIn: string, amountIn: string, tokenOut: string) {
    // 1. Build intent using SDK helper
    const intent = new IntentBuilder(userAddress)
      .swap(tokenIn, amountIn, tokenOut)
      .private(true)
      .build();
    
    // 2. Encrypt with Seal (direct SDK)
    const { encryptedObject } = await this.seal.encrypt({
      data: JSON.stringify(intent),
      // ...
    });
    
    // 3. Store on Walrus (direct SDK)
    const { blobId } = await this.walrus.upload({
      content: encryptedObject,
      // ...
    });
    
    // 4. Submit to backend
    await fetch('/api/intents', {
      method: 'POST',
      body: JSON.stringify({ intent_id: intent.intent_id, walrus_blob_id: blobId }),
    });
    
    return intent.intent_id;
  }
  
  async executeSolution(rankedPTB: RankedPTB) {
    // Execute using SDK helper
    return await this.executor.execute(rankedPTB, wallet);
  }
}
```

### Manual Client (KHÔNG dùng SDK helpers)

```typescript
import { SuiClient } from '@mysten/sui.js/client';
import { WalrusClient } from '@walrus/sdk';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import type { Intent, RankedPTB } from '@intenus/common';

class ManualClient {
  private sui = new SuiClient({ url: '...' });
  private walrus = new WalrusClient({ url: '...' });
  
  async submitIntent(tokenIn: string, amountIn: string, tokenOut: string) {
    // Manual intent construction
    const intent: Intent = {
      intent_id: crypto.randomUUID(),
      user_address: userAddress,
      timestamp: Date.now(),
      category: 'swap',
      action: { type: 'swap_exact_in', params: {} },
      assets: {
        inputs: [{ asset_id: tokenIn, amount: amountIn }],
        outputs: [{ asset_id: tokenOut }],
      },
      constraints: { max_slippage_bps: 50 },
      execution: { urgency: 'normal', privacy_level: 'public' },
      metadata: { language: 'en', confidence: 1.0 },
    };
    
    // Store on Walrus
    const { blobId } = await this.walrus.upload({
      content: JSON.stringify(intent),
    });
    
    return intent.intent_id;
  }
  
  async executeManually(rankedPTB: RankedPTB) {
    // Manual execution
    const ptbBytes = Buffer.from(rankedPTB.ptb_bytes, 'base64');
    const txb = TransactionBlock.from(ptbBytes);
    
    const { signature } = await wallet.signTransactionBlock({
      transactionBlock: txb,
    });
    
    const result = await this.sui.executeTransactionBlock({
      transactionBlock: txb,
      signature,
    });
    
    return result.digest;
  }
}
```

## ⚠️ Important Notes

1. **Tất cả helpers đều OPTIONAL** - Sử dụng nếu convenient, skip nếu cần control
2. **Không wrap underlying SDKs** - Walrus, Seal, Sui SDKs được sử dụng trực tiếp  
3. **Fluent API** - IntentBuilder chỉ là convenience, có thể construct Intent manually
4. **Maximum flexibility** - Clients có full control over implementation

## 🔗 See Also

- [Examples](../../examples/client-basic) - Full client implementation
- [@intenus/common](../common) - Shared types
- [Sui SDK Docs](https://sdk.mystenlabs.com/typescript) - Direct Sui usage
- [Walrus SDK Docs](https://docs.walrus.site) - Direct Walrus usage

## 📄 License

MIT
