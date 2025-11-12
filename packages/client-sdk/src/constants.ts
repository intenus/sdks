/**
 * Constants for Intenus Protocol
 */

/**
 * Package IDs for different networks
 */
export const INTENUS_PACKAGE_ID = {
  mainnet: '',
  testnet: '0x83b321c90dcbc37ab51c65f577b01d88fdd640ce8bd79fe205cfb169fadd381a',
  devnet: ''
} as const;

/**
 * Shared object IDs for protocol contracts
 */
export const SHARED_OBJECTS = {
  mainnet: {
    solverRegistry: '',
    slashManager: '',
    batchManager: '',
    teeVerifier: '',
    policyRegistry: '',
    clock: '0x6'
  },
  testnet: {
    solverRegistry: '0x8322967aa080cafdac99c5e2de42611c066aeb7f55458d6f415826fd00721c52',
    slashManager: '0xd2364ea78617f496fe02dc439b365f12a961317768156cc1ba24e54eaeaf378e',
    batchManager: '0x2c510fc0e8aa21b1f8112242ba74b817f5092dc5a7e23bc480fa6eb477695bd4',
    teeVerifier: '0x861871ec1bd7ac5e3559f68723ba2c76bf4ce6f2f88e3bf0ba131715e0397ae6',
    policyRegistry: '0x44f14a883d639302e7708535525a79a847be9a5b0a6ba39e886bbb9ab06d4f7f',
    clock: '0x6'
  },
  devnet: {
    solverRegistry: '',
    slashManager: '',
    batchManager: '',
    teeVerifier: '',
    policyRegistry: '',
    clock: '0x6'
  }
} as const;

/**
 * Module names within the package
 */
export const MODULES = {
  SOLVER_REGISTRY: 'solver_registry',
  SLASH_MANAGER: 'slash_manager',
  BATCH_MANAGER: 'batch_manager',
  TEE_VERIFIER: 'tee_verifier',
  SEAL_POLICY_COORDINATOR: 'seal_policy_coordinator'
} as const;

/**
 * Solver registry constants
 */
export const SOLVER_CONSTANTS = {
  MIN_STAKE_AMOUNT: '1000000000', // 1 SUI
  WITHDRAWAL_COOLDOWN_MS: 604800000, // 7 days
  SLASH_PERCENTAGE: 20, // 20%
  REWARD_PERCENTAGE: 10, // 10%
  MAX_REPUTATION: 10000
} as const;

/**
 * Slash severity constants
 */
export const SLASH_CONSTANTS = {
  MINOR_SLASH_BPS: 500,     // 5%
  SIGNIFICANT_SLASH_BPS: 2000, // 20%
  MALICIOUS_SLASH_BPS: 10000,  // 100%
  APPEAL_WINDOW_MS: 86400000   // 24 hours
} as const;

/**
 * Batch constants
 */
export const BATCH_CONSTANTS = {
  DEFAULT_BATCH_DURATION_MS: 10000, // 10 seconds
  DEFAULT_SOLVER_WINDOW_MS: 5000    // 5 seconds
} as const;

/**
 * TEE verifier constants
 */
export const TEE_CONSTANTS = {
  MAX_TIMESTAMP_DRIFT_MS: 300000 // 5 minutes
} as const;

/**
 * Error codes mapping
 */
export const ERROR_CODES = {
  // Solver Registry (1xxx)
  E_INSUFFICIENT_STAKE: 1001,
  E_SOLVER_NOT_REGISTERED: 1002,
  E_SOLVER_ALREADY_REGISTERED: 1003,
  E_COOLDOWN_NOT_COMPLETE: 1007,
  E_INVALID_STATUS: 1009,
  E_INSUFFICIENT_BALANCE: 1011,
  E_NO_PENDING_WITHDRAWAL: 1012,

  // Seal Policy Coordinator (3xxx)
  E_POLICY_EXISTS: 3001,
  E_POLICY_NOT_FOUND: 3002,
  E_INVALID_TIME_WINDOW: 3003,
  E_UNAUTHORIZED: 3004,
  E_POLICY_REVOKED: 3005,

  // TEE Verifier (4xxx)
  E_NOT_CONFIGURED: 4001,
  E_INVALID_ATTESTATION: 4002,
  E_MEASUREMENT_MISMATCH: 4003,
  E_STALE_TIMESTAMP: 4004,
  E_DUPLICATE_RECORD: 4005,

  // Batch Manager (5xxx)
  E_BATCH_EXISTS: 5002,
  E_BATCH_NOT_FOUND: 5003,
  E_INVALID_BATCH_STATUS: 5004,

  // Slash Manager (6xxx)
  E_SLASH_UNAUTHORIZED: 6001,
  E_INVALID_SEVERITY: 6003,
  E_APPEAL_ALREADY_FILED: 6004,
  E_APPEAL_NOT_FOUND: 6005,
  E_APPEAL_WINDOW_EXPIRED: 6006,
  E_INVALID_TEE_ATTESTATION: 6009,
  E_TRANSFER_REJECTED: 6010
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  GAS_BUDGET: '10000000', // 0.01 SUI
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3
} as const;
