/**
 * Constants and default configurations for Seal operations
 */

import type { KeyServerConfig } from './types.js';

/**
 * Intenus Protocol package IDs by network.
 * Update these after deploying smart contracts.
 */
export const INTENUS_PACKAGE_ID = {
  mainnet: '',
  testnet: '0x83b321c90dcbc37ab51c65f577b01d88fdd640ce8bd79fe205cfb169fadd381a',
  devnet: ''
} as const;

/**
 * Shared object IDs for protocol contracts.
 * These are created during contract deployment and remain constant per network.
 */
export const SHARED_OBJECTS = {
  mainnet: {
    policyRegistry: '',
    solverRegistry: '',
    batchManager: '',
    slashManager: '',
    teeVerifier: '',
    clock: '0x6'
  },
  testnet: {
    policyRegistry: '0x44f14a883d639302e7708535525a79a847be9a5b0a6ba39e886bbb9ab06d4f7f',
    solverRegistry: '0x8322967aa080cafdac99c5e2de42611c066aeb7f55458d6f415826fd00721c52',
    batchManager: '0x2c510fc0e8aa21b1f8112242ba74b817f5092dc5a7e23bc480fa6eb477695bd4',
    slashManager: '0xd2364ea78617f496fe02dc439b365f12a961317768156cc1ba24e54eaeaf378e',
    teeVerifier: '0x861871ec1bd7ac5e3559f68723ba2c76bf4ce6f2f88e3bf0ba131715e0397ae6',
    clock: '0x6'
  },
  devnet: {
    policyRegistry: '',
    solverRegistry: '',
    batchManager: '',
    slashManager: '',
    teeVerifier: '',
    clock: '0x6'
  }
} as const;

export const DEFAULT_KEY_SERVERS: Record<string, KeyServerConfig[]> = {
  mainnet: [
    {
      objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
      weight: 1
    },
    {
      objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
      weight: 1
    }
  ],
  testnet: [
    {
      objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
      weight: 1
    },
    {
      objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
      weight: 1
    }
  ],
  devnet: [
    {
      objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
      weight: 1
    }
  ]
};

export const DEFAULT_CONFIG = {
  threshold: 2,
  ttlMin: 10,
  verifyKeyServers: false
} as const;

export const POLICY_MODULES = {
  SOLVER_REGISTRY: 'solver_registry',
  SEAL_POLICY_COORDINATOR: 'seal_policy_coordinator',
  BATCH_MANAGER: 'batch_manager'
} as const;

export const SEAL_APPROVE_FUNCTIONS = {
  INTENT: 'seal_approve_intent',
  STRATEGY: 'seal_approve_strategy', 
  HISTORY: 'seal_approve_history'
} as const;

export const ERROR_CODES = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  SESSION_KEY_FAILED: 'SESSION_KEY_FAILED',
  POLICY_NOT_FOUND: 'POLICY_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_THRESHOLD: 'INVALID_THRESHOLD',
  KEY_SERVER_ERROR: 'KEY_SERVER_ERROR'
} as const;
