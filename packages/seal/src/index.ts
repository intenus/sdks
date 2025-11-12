/**
 * Intenus Seal SDK - Encryption/Decryption for Protocol
 */

export { IntenusSealClient } from './client.js';

export type {
  IntenusSealConfig,
  KeyServerConfig,
  SealPolicyConfig,
  IntentEncryptionConfig,
  StrategyEncryptionConfig,
  HistoryEncryptionConfig,
  EncryptionResult,
  DecryptionRequest,
  SolverCredentials,
  PolicyType,
  PolicyTypeValue,
  SealError
} from './types.js';

export { IntenusSealError, POLICY_TYPES } from './types.js';

export {
  INTENUS_PACKAGE_ID,
  SHARED_OBJECTS,
  DEFAULT_KEY_SERVERS,
  DEFAULT_CONFIG,
  POLICY_MODULES,
  SEAL_APPROVE_FUNCTIONS,
  ERROR_CODES
} from './constants.js';

export {
  encryptIntentData,
  encryptStrategyData,
  encryptHistoryData,
  decryptIntentData,
  decryptStrategyData,
  decryptHistoryData,
  generatePolicyId,
  parsePolicyId,
  createSolverCredentials,
  validateEncryptionConfig,
  prepareDataForEncryption,
  parseDecryptedData
} from './helpers.js';
