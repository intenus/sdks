/**
 * Constants for Intenus Protocol
 */

/**
 * Package IDs for different networks
 */
export const INTENUS_PACKAGE_ID = {
  mainnet: '',
  testnet: '0xb9d9333ca0cb165c6337696bc02bc66a308291b6b8a104810e57a66a2ac24f76',
  devnet: ''
} as const;

/**
 * Shared object IDs for protocol contracts
 */
export const SHARED_OBJECTS = {
  mainnet: {
    solverRegistry: '',
    slashManager: '',
    teeVerifier: '',
    enclaveConfig: '',
    treasury: '',
    clock: '0x6'
  },
  testnet: {
    solverRegistry: '0xa5955d70c88f90a87b81a4c9493a9eb53ac1d7f392b60c528194c092f94d652e',
    slashManager: '0x6e561036e166f362ffe7b1defccae1bc120c0dead05de2ad75174fe1b5c5e330',
    teeVerifier: '0x9bf41dc9d81c0d2ac8c78a25eb60ecc12ab46b513304e0e9edb0e5ede8f310af',
    enclaveConfig: '', // Need to update after deployment
    treasury: '', // Need to update after deployment
    clock: '0x6'
  },
  devnet: {
    solverRegistry: '',
    slashManager: '',
    teeVerifier: '',
    enclaveConfig: '',
    treasury: '',
    clock: '0x6'
  }
} as const;

/**
 * Admin capabilities and package-level objects
 */
export const ADMIN_CAPS = {
  mainnet: {
    solverRegistryAdminCap: '',
    slashManagerAdminCap: '',
    teeVerifierAdminCap: '',
    packageUpgradeCap: '',
    packagePublisher: ''
  },
  testnet: {
    solverRegistryAdminCap: '0xec1adbd61ba4f6c7615d13539c7491cfb9d5ca00d65995680151a937dc895549',
    slashManagerAdminCap: '0xe9de82865a5a81fd1f65b968ef8ba1101cf6d195e5c1133e1463ddde88bbbadb',
    teeVerifierAdminCap: '0x5596772626feb77faafdf49544c0bb968d0e338f39e89bbf3d02d33698452a1d',
    packageUpgradeCap: '0x57bb108f36ee8c848a46444af60ff6c52ade4fa74adbb10bd0e821059558b813',
    packagePublisher: '0xfb64e69eb33d5fd21dea680aea62d6299d66dc4ce1f32958230c1a2f66eb4cc0'
  },
  devnet: {
    solverRegistryAdminCap: '',
    slashManagerAdminCap: '',
    teeVerifierAdminCap: '',
    packageUpgradeCap: '',
    packagePublisher: ''
  }
} as const;

/**
 * Module names within the package
 */
export const MODULES = {
  SOLVER_REGISTRY: 'solver_registry',
  SLASH_MANAGER: 'slash_manager',
  TEE_VERIFIER: 'tee_verifier',
  SEAL_POLICY_COORDINATOR: 'seal_policy_coordinator',
  REGISTRY: 'registry'
} as const;

/**
 * Registry constants
 */
export const REGISTRY_CONSTANTS = {
  MIN_INTENT_FEE: '1000000', // 0.001 SUI minimum fee
  PLATFORM_FEE_BPS: 1000, // 10% platform fee (in basis points)
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
  E_INTENT_REVOKED: 3001,
  E_SPC_UNAUTHORIZED: 3002,
  E_OUTSIDE_TIME_WINDOW: 3003,
  E_SPC_SOLVER_NOT_REGISTERED: 3004,
  E_SPC_INSUFFICIENT_STAKE: 3005,
  E_SPC_ATTESTATION_REQUIRED: 3006,
  E_NO_ENCLAVE_PK: 3007,

  // TEE Verifier (4xxx)
  E_NOT_CONFIGURED: 4001,
  E_INVALID_ATTESTATION: 4002,
  E_MEASUREMENT_MISMATCH: 4003,
  E_STALE_TIMESTAMP: 4004,
  E_DUPLICATE_RECORD: 4005,

  // Registry (6xxx)
  E_INVALID_BLOB_ID: 6001,
  E_UNAUTHORIZED_SOLVER: 6002,
  E_POLICY_VALIDATION_FAILED: 6003,
  E_REG_INTENT_REVOKED: 6004,
  E_REG_UNAUTHORIZED: 6005,
  E_INVALID_TIME_WINDOW: 6006,
  E_SOLUTION_ALREADY_SELECTED: 6007,
  E_INVALID_STATUS_TRANSITION: 6008,
  E_REG_ATTESTATION_REQUIRED: 6009,
  E_INSUFFICIENT_FEE: 6010,
  E_NO_FEE_TO_REFUND: 6011,

  // Slash Manager (6xxx) - Note: contracts use same range as registry
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
