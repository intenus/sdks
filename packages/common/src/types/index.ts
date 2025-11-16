export type {
  IGSIntent,
  IGSIntentType,
  IGSObject,
  IGSOperation,
  IGSConstraints,
  IGSPreferences,
  IGSMetadata,
  IGSAssetFlow,
  IGSAmount,
  IGSExpectedOutcome,
  IGSRankingWeights,
  IGSExecutionPreferences,
  IGSPrivacyPreferences,
  IGSRouting,
  IGSLimitPrice,
  IGSPolicy,
  IGSSolution,
} from './igs.js';

// Export Zod schemas for validation
export { IGSIntentSchema, IGSSolutionSchema, validateIGSIntent as validateIGSIntentZod, validateIGSSolution as validateIGSSolutionZod } from './igs.js';

// Core types (PreRanking and Ranking)
export type {
  Intent,
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