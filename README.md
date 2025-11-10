# Intenus TypeScript SDKs

Minimal TypeScript SDKs cho Intenus Protocol. Cung cấp types, utilities, và **OPTIONAL** helpers cho solvers và clients.

## 🎯 Thiết kế nguyên tắc

- **Composition over Abstraction**: Không wrap Walrus, Seal, Sui SDKs
- **Export types, not implementations**: Tập trung vào type safety
- **Zero lock-in**: Solvers có thể bypass SDK nếu muốn
- **Tree-shakeable**: Import chỉ những gì cần thiết

## 📦 Packages

### [@intenus/common](./packages/common)
**Pure TypeScript types** - KHÔNG có runtime dependencies
- `Intent`, `Batch`, `Solution` types
- Protocol constants
- Walrus path types

### [@intenus/solver-sdk](./packages/solver-sdk) 
**OPTIONAL helpers** cho solver developers
- `SolverListener` - Redis subscription helper
- `SolutionBuilder` - PTB composition helper  
- `P2PMatcher` - Reference implementation

### [@intenus/client-sdk](./packages/client-sdk)
**OPTIONAL helpers** cho client developers
- `IntentBuilder` - Fluent API
- `PTBExecutor` - Signature + submission helper

## 🚀 Quick Start

### Installation

```bash
pnpm install
pnpm build
```

### Solver Example (với SDK helpers)

```typescript
import { SolverListener, SolutionBuilder } from '@intenus/solver-sdk';
import { WalrusClient } from '@walrus/sdk';
import { SuiClient } from '@mysten/sui.js/client';

const listener = new SolverListener('redis://localhost');
const walrus = new WalrusClient({ url: '...' });
const sui = new SuiClient({ url: '...' });

listener.onNewBatch(async (batch) => {
  const builder = new SolutionBuilder(batch.batch_id, '0x...');
  // Build solution...
  await listener.submitSolution(solution);
});
```

### Solver Example (KHÔNG dùng SDK helpers)

```typescript
import Redis from 'ioredis';
import { WalrusClient } from '@walrus/sdk';
import { SuiClient } from '@mysten/sui.js/client';
import type { Batch, SolutionSubmission } from '@intenus/common';

const redis = new Redis('redis://localhost');
const walrus = new WalrusClient({ url: '...' });
const sui = new SuiClient({ url: '...' });

// Full control - implement everything yourself
```

### Client Example

```typescript
import { IntentBuilder, PTBExecutor } from '@intenus/client-sdk';
import { SuiClient } from '@mysten/sui.js/client';

const intent = new IntentBuilder('0x...')
  .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
  .private(true)
  .build();

const executor = new PTBExecutor(new SuiClient({ url: '...' }));
await executor.execute(rankedPTB, wallet);
```

## 📚 Examples

- [Basic Solver](./examples/solver-basic) - Sử dụng SDK helpers
- [Advanced Solver](./examples/solver-advanced) - Direct SDK usage  
- [Basic Client](./examples/client-basic) - Client implementation

## 🔧 Development

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## 📖 Documentation

Mỗi package có README riêng với API documentation chi tiết:

- [Common Types](./packages/common/README.md)
- [Solver SDK](./packages/solver-sdk/README.md)  
- [Client SDK](./packages/client-sdk/README.md)

## ⚠️ Important Notes

1. **SDK helpers là OPTIONAL** - Solvers/clients có thể dùng underlying SDKs trực tiếp
2. **Không wrap existing SDKs** - Sử dụng Walrus, Seal, Sui SDKs trực tiếp
3. **Types-first approach** - @intenus/common chỉ export types, không có implementations
4. **Maximum flexibility** - Solvers có full control over implementation

## 📄 License

MIT
