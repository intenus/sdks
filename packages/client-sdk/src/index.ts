// Export main classes
export { IntentBuilder } from '@intenus/common';

// Main client
export { IntenusProtocolClient } from './client.js';

// Services
export {
  SolverRegistryService,
  SealPolicyService,
  SlashManagerService
} from './services/index.js';

// Types and interfaces
export type {
  IntenusClientConfig,
  SolverProfile,
  RankedTx,
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
  TEE_CONSTANTS,
  ERROR_CODES,
  DEFAULT_CONFIG
} from './constants.js';
export { TxExecutor } from './executor.js';