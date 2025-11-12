// Export main classes
export { SolverListener } from './listener.js';
export { SolutionBuilder } from './builder.js';
export { P2PMatcher } from './matcher.js';

// Export IGS classes
export { 
  IGSSolutionBuilder,
  createIGSSolutionBuilder,
  validateIGSSolution,
  compareIGSSolutions
} from './igs-builder.js';

// Export types
export type { P2PMatch } from './matcher.js';
export type { IGSSolutionBuilderOptions } from './igs-builder.js';

// Export utilities
export { addP2PTransfer, getSealPolicyForIntent, hashBytes } from './utils.js';

// Re-export common types for convenience
export type {
  Batch,
  Intent,
  SolutionSubmission,
  SolutionOutcome,
  BatchManifest,
  IntentReference,
  WalrusBatchManifest,
  StorageResult,
} from '@intenus/common';

// Re-export IGS types for convenience
export type {
  Intent as IGSIntent,
  IGSIntentType,
  IGSOperation,
  AssetSpec as IGSAssetFlow,
  IGSAmount,
  IGSExpectedOutcome,
  Constraints as IGSConstraints,
  ExecutionPreferences as IGSPreferences,
  IGSTiming,
  IntentMetadata as IGSMetadata,
  IGSSolution,
  IGSRankedSolution,
  IGSValidationResult,
  IGSValidationError,
} from '@intenus/common';
