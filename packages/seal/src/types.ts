/**
 * Type definitions for Intenus Seal SDK
 */

import { SealClient, SealError, SessionKey } from "@mysten/seal";
import { SuiClient } from "@mysten/sui/client";

/**
 * Configuration for initializing Seal client
 */
export interface IntenusSealConfig {
  network: 'mainnet' | 'testnet';
  suiClient?: SuiClient;
  sealClient?: SealClient;
  keyServers?: KeyServerConfig[];
  verifyKeyServers?: boolean;
  defaultThreshold?: number;
}

/**
 * Key server configuration with optional API authentication
 */
export interface KeyServerConfig {
  objectId: string;
  weight: number;
  apiKeyName?: string;
  apiKey?: string;
}

/**
 * Base configuration for Seal policies
 */
export interface SealPolicyConfig {
  packageId: string;
  policyId: string;
  threshold: number;
  ttlMin?: number;
}

/**
 * Intent encryption config with batch and time window settings
 */
export interface IntentEncryptionConfig extends SealPolicyConfig {
  batchId: string;
  solverWindow: number;
  routerAccess: boolean;
  autoRevokeTime?: number;
}

/**
 * Solution encryption config for solver solutions
 */
export interface SolutionEncryptionConfig extends SealPolicyConfig {
  isPublic: boolean;
}

/**
 * Result from encryption operations
 */
export interface EncryptionResult {
  encryptedData: Uint8Array;
  backupKey?: Uint8Array;
  policyId: string;
  packageId: string;
  threshold: number;
}

/**
 * Request for decryption with session key and approval transaction
 */
export interface DecryptionRequest {
  encryptedData: Uint8Array;
  sessionKey: SessionKey;
  txBytes: Uint8Array;
}

export interface PolicyType {
  INTENT: 'intent';
  SOLUTION: 'solution';
}

export const POLICY_TYPES: PolicyType = {
  INTENT: 'intent',
  SOLUTION: 'solution'
} as const;

export type PolicyTypeValue = PolicyType[keyof PolicyType];


export class IntenusSealError extends Error implements SealError {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'IntenusSealError';
  }
}
