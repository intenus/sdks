/**
 * Constants for Intenus Protocol
 */

/**
 * Package IDs for different networks
 */
export const INTENUS_PACKAGE_ID = {
  mainnet: '',
  testnet: '0x993c7635b44582e9c47c589c759239d3e1ce787811af5bfa0056aa253caa394a',
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
    solverRegistry: '0xf71c16414b66054dfe9ebca5f22f8076a8294715d5a3e4ae4b2b4e0cd5d7e64a',
    slashManager: '0x1d023609156241468439e933c094dba4982d35292b0dd21c66cf85cc8f53b283',
    teeVerifier: '0xf0867b65374e34905b7737432e93d53722b08bc39cd621740b685a366272f857',
    enclaveConfig: '0xe525e478d2448b4e895d744b31f9fa7cab599f6ce5c36b6b24dab2f9c54ad0fd',
    treasury: '0x1aa5d3878fac1e2b10bf471bd1cbef6868ca1d04643c24c3d3b358d762f34f53',
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
    solverRegistryAdminCap: '0xaf69f4d0fa49c43bfa9bfe382467eacd33ead8e2bb36aeb6fcb8f1df36d60909',
    slashManagerAdminCap: '0xbe3b9146c100a38b106161c2d03e91432e8a608e1873ce1f894e576c63e70ea0',
    teeVerifierAdminCap: '0x392ea4b56d73d59cb32e132fa7f610a7fb5f1e97d0983af6bfced645bea59e9f',
    packageUpgradeCap: '0xa25adda6a6965df626313123b48c067a342c21127932b4c2f7ba83dcfb71c288',
    packagePublisher: '0x01741371472c4a88b2a8670c72f4ad96285eb13ddfa51c1b8abe3a76dd128014'
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
