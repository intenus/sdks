export type {
  IGSIntent,
  IGSObject,
  IGSOperation,
  IGSConstraints,
  IGSPreferences,
  IGSMetadata,
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