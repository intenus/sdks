// IGS (Intenus General Standard) - Primary Intent Types
export type {
  IGSIntent as Intent, // Alias for backward compatibility
  IGSIntentType,
  IGSOperation,
  IGSAssetFlow as AssetSpec, // Alias for backward compatibility
  IGSAmount,
  IGSExpectedOutcome,
  IGSConstraints as Constraints, // Alias for backward compatibility
  IGSPreferences as ExecutionPreferences, // Alias for backward compatibility
  IGSTiming,
  IGSMetadata as IntentMetadata, // Alias for backward compatibility
  IGSSolution,
  IGSRankedSolution,
  IGSValidationResult,
  IGSValidationError,
} from './igs.js';

// Batch types
export type {
  Batch,
  BatchManifest,
  IntentReference,
  BatchRequirements,
} from './batch.js';
export { BatchStatus } from './batch.js';

// Solution types
export type {
  SolutionSubmission,
  SolutionOutcome,
  StrategySummary,
  TEEAttestation,
  RankedPTB,
  ExpectedOutcome,
  ExecutionSummary,
  Explanation,
} from './solution.js';

// Walrus storage types
export type {
  BatchIntent,
  BatchManifest as WalrusBatchManifest,
  ArchivedSolution,
  ExecutionOutcome,
  MLFeatures,
  BatchArchive,
  UserHistoryAggregated,
  TrainingDatasetMetadata,
  ModelMetadata,
  StorageResult,
} from './walrus.js';

// Export IGS utilities and examples
export {
  EXAMPLE_SIMPLE_SWAP,
  EXAMPLE_LIMIT_ORDER,
  migrateToIGS,
  validateIGS,
  calculateSurplus,
} from './igs.js';

// IGS Validation
export {
  IGSSchemaValidator,
  validateIGSIntent,
  isValidIGSIntent,
  assertValidIGSIntent,
  validateIGSJSON,
  parseIGSIntent,
  getAJVValidator,
  getAJVInstance,
} from '../validation/igs-validator.js';
