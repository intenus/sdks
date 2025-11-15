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

// Core types (PreRanking and Ranking)
export type {
  SolutionSubmission,
  IntentClassification,
  PreRankingResult,
  RankedSolution,
  RankingResult,
} from './core.js';

// Solution types
export type {
  SolutionOutcome,
  StrategySummary,
  TEEAttestation,
  RankedPTB,
  ExpectedOutcome,
  ExecutionSummary,
  Explanation,
} from './solution.js';

// ML Dataset types
export type {
  RawFeatures,
  GroundTruthLabel,
  LabelingMetadata,
  ExecutionOutcome,
  IntentClassificationTrainingData,
  ClassificationFeedback,
  TrainingDatasetMetadata,
  ModelMetadata,
  ClassificationInference,
} from './dataset.js';

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
