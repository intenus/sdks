// Export main classes
export { IntentBuilder } from './intent-builder.js';

// Main client
export { IntenusProtocolClient } from './client.js';

// Services
export {
  SolverRegistryService,
  SealPolicyService,
  BatchManagerService,
  SlashManagerService
} from './services/index.js';

// Types and interfaces
export type {
  IntenusClientConfig,
  SolverProfile,
  BatchSummary,
  SlashEvidence,
  SlashRecord,
  Appeal,
  IntentPolicyConfig,
  StrategyPolicyConfig,
  HistoryPolicyConfig,
  RegistryStats,
  TransactionResult
} from './types.js';

export {
  SolverStatus,
  BatchStatus,
  SlashSeverity,
  AppealStatus,
  PolicyType,
  IntenusClientError
} from './types.js';

// Constants
export {
  INTENUS_PACKAGE_ID,
  SHARED_OBJECTS,
  MODULES,
  SOLVER_CONSTANTS,
  SLASH_CONSTANTS,
  BATCH_CONSTANTS,
  TEE_CONSTANTS,
  ERROR_CODES,
  DEFAULT_CONFIG
} from './constants.js';
export { PTBExecutor } from './executor.js';
export { WalrusIntentHelper } from './walrus-helper.js';

// Re-export common types for convenience
export type {
  Intent,
  RankedPTB,
  ExpectedOutcome,
  ExecutionSummary,
  Explanation,
  StorageResult,
} from '@intenus/common';
