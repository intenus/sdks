// Export main classes
export { IntentBuilder } from '@intenus/common';

// Main client
export { IntenusProtocolClient } from './client.js';

// Services
export {
  SolverRegistryService,
  SealPolicyCoordinatorService,
  SlashManagerService,
  RegistryService
} from './services/index.js';

// Types and interfaces
export type {
  IntenusClientConfig,
  SolverProfile,
  SlashEvidence,
  SlashRecord,
  Appeal,
  RegistryStats,
  TransactionResult
} from './types.js';

// Registry service types
export type { IntentPolicyParams } from './services/registry.js';
export { INTENT_STATUS, SOLUTION_STATUS } from './services/registry.js';

export {
  SolverStatus,
  SlashSeverity,
  AppealStatus,
  IntenusClientError
} from './types.js';

// Constants
export {
  INTENUS_PACKAGE_ID,
  SHARED_OBJECTS,
  MODULES,
  REGISTRY_CONSTANTS,
  SOLVER_CONSTANTS,
  SLASH_CONSTANTS,
  TEE_CONSTANTS,
  ERROR_CODES,
  DEFAULT_CONFIG
} from './constants.js';
export { TxExecutor } from './executor.js';