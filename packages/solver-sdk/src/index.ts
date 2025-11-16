// Export main classes
export { SolverListener } from './listener.js';
export { P2PMatcher } from './matcher.js';
export { SolutionBuilder } from '@intenus/common';

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
  Intent,
  SolutionSubmission,
  IntentClassification,
  PreRankingResult,
  RankedSolution,
  RankingResult
} from '@intenus/common';

// Re-export IGS types for convenience
export type {
  IGSIntent,
  IGSIntentType,
  IGSObject,
  IGSOperation,
  IGSAssetFlow,
  IGSAmount,
  IGSExpectedOutcome,
  IGSConstraints,
  IGSPreferences,
  IGSMetadata,
  IGSSolution,
  IGSRankedSolution,
  IGSValidationResult,
  IGSValidationError,
} from '@intenus/common';
