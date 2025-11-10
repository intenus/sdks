# @intenus/common

**Pure TypeScript types** cho Intenus Protocol. Package này chỉ chứa types và constants - KHÔNG có runtime dependencies.

## 📦 Installation

```bash
pnpm add @intenus/common
```

## 🎯 Purpose

Cung cấp shared types và constants cho toàn bộ Intenus ecosystem. Đây là **single source of truth** cho tất cả type definitions.

## 📚 Exported Types

### Intent Types
```typescript
import type { Intent, AssetSpec, Constraints } from '@intenus/common';

const intent: Intent = {
  intent_id: '...',
  user_address: '0x...',
  category: 'swap',
  // ...
};
```

### Batch Types
```typescript
import type { Batch, BatchManifest, BatchStatus } from '@intenus/common';

const batch: Batch = {
  batch_id: '...',
  epoch: 123,
  status: BatchStatus.OPEN,
  // ...
};
```

### Solution Types
```typescript
import type { SolutionSubmission, RankedPTB } from '@intenus/common';

const solution: SolutionSubmission = {
  solution_id: '...',
  batch_id: '...',
  solver_address: '0x...',
  // ...
};
```

### Constants
```typescript
import { PROTOCOL_CONSTANTS, NETWORKS } from '@intenus/common';

console.log(PROTOCOL_CONSTANTS.MIN_SOLVER_STAKE); // '1000000000000'
console.log(NETWORKS.TESTNET.sui); // 'https://fullnode.testnet.sui.io:443'
```

### Walrus Path Types
```typescript
import type { WalrusPath } from '@intenus/common';

const intentPath: WalrusPath['intents'] = `/intents/123/intent-id.json`;
const batchPath: WalrusPath['batches'] = `/batches/123/manifest.json`;
```

## ✅ What this package provides

- ✅ TypeScript interfaces và types
- ✅ Protocol constants
- ✅ Enum definitions
- ✅ Type-safe Walrus paths

## ❌ What this package does NOT provide

- ❌ Runtime implementations
- ❌ SDK wrappers
- ❌ Business logic
- ❌ External dependencies

## 🔧 Usage in other packages

```typescript
// In solver
import type { Batch, Intent, SolutionSubmission } from '@intenus/common';

// In client  
import type { Intent, RankedPTB } from '@intenus/common';

// Constants
import { PROTOCOL_CONSTANTS } from '@intenus/common';
```

## 📄 License

MIT
