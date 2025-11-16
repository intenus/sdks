// Export main classes
export { SolverListener } from './listener.js';
// Note: P2PMatcher removed - solvers implement their own matching logic
// export { P2PMatcher } from './matcher.js';
export { SolutionBuilder } from '@intenus/common';

// Export IGS classes - Removed: solvers implement their own solution building
// export {
//   IGSSolutionBuilder,
//   createIGSSolutionBuilder,
//   validateIGSSolution,
//   compareIGSSolutions
// } from './igs-builder.js';

// Export types
// Note: P2PMatch removed - solvers implement their own matching logic
// export type { P2PMatch } from './matcher.js';
// Note: IGSSolutionBuilderOptions removed - solvers implement their own solution building
// export type { IGSSolutionBuilderOptions } from './igs-builder.js';

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
