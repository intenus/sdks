// Export main classes
export { SolverListener } from './listener.js';
export { SolutionBuilder } from './builder.js';
export { P2PMatcher } from './matcher.js';

// Export types
export type { P2PMatch } from './matcher.js';

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
} from '@intenus/common';
