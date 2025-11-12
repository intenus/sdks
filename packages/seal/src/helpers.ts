/**
 * Helper utilities for encryption and decryption workflows
 */

import { Signer } from '@mysten/sui/cryptography';
import type { IntenusSealClient } from './client.js';
import type {
  IntentEncryptionConfig,
  StrategyEncryptionConfig,
  HistoryEncryptionConfig,
  SolverCredentials,
  EncryptionResult
} from './types.js';
import { fromHex, toHex } from '@mysten/sui/utils';

/**
 * Encrypt intent data with sensible defaults for batch processing.
 * Automatically generates policy ID and handles JSON serialization.
 * 
 * @param client - Initialized Seal client
 * @param intentData - Intent data object (will be JSON serialized)
 * @param batchId - Batch identifier for grouping
 * @param signer - User's keypair
 * @param options - Optional encryption config overrides
 * @returns Encryption result with policy metadata
 */
export async function encryptIntentData(
  client: IntenusSealClient,
  intentData: any,
  batchId: string,
  signer: Signer,
  options?: Partial<IntentEncryptionConfig>
): Promise<EncryptionResult> {
  const protocolPackageId = client.getPackageId();
  const policyId = options?.policyId || generatePolicyId('intent', batchId);
  
  const config: IntentEncryptionConfig = {
    packageId: protocolPackageId,
    policyId,
    threshold: options?.threshold || client.getConfig().defaultThreshold || 2,
    batchId,
    solverWindow: options?.solverWindow || 5000,
    routerAccess: options?.routerAccess ?? true,
    autoRevokeTime: options?.autoRevokeTime,
    ttlMin: options?.ttlMin || 10
  };

  const data = new TextEncoder().encode(JSON.stringify(intentData));
  return client.encryptIntent(data, config, signer);
}

/**
 * Encrypt solver strategy with privacy protection.
 * Use this to keep solver algorithms and parameters confidential.
 * 
 * @param client - Seal client instance
 * @param strategyData - Strategy configuration object
 * @param solverId - Unique solver identifier
 * @param signer - Solver's keypair
 * @param options - Strategy-specific encryption options
 * @returns Encrypted strategy result
 */
export async function encryptStrategyData(
  client: IntenusSealClient,
  strategyData: any,
  solverId: string,
  signer: Signer,
  options?: Partial<StrategyEncryptionConfig>
): Promise<EncryptionResult> {
  const protocolPackageId = client.getPackageId();
  const policyId = generatePolicyId('strategy', solverId);
  
  const config: StrategyEncryptionConfig = {
    packageId: protocolPackageId,
    policyId,
    threshold: options?.threshold || client.getConfig().defaultThreshold || 2,
    routerAccess: options?.routerAccess ?? false,
    adminUnlockTime: options?.adminUnlockTime,
    isPublic: options?.isPublic ?? false,
    ttlMin: options?.ttlMin || 10
  };

  const data = new TextEncoder().encode(JSON.stringify(strategyData));
  return client.encryptStrategy(data, config, signer);
}

/**
 * Helper for history encryption with default config
 */
export async function encryptHistoryData(
  client: IntenusSealClient,
  historyData: any,
  userAddress: string,
  signer: Signer,
  options?: Partial<HistoryEncryptionConfig>
): Promise<EncryptionResult> {
  const protocolPackageId = client.getPackageId();
  const policyId = generatePolicyId('history', userAddress);
  
  const config: HistoryEncryptionConfig = {
    packageId: protocolPackageId,
    policyId,
    threshold: options?.threshold || client.getConfig().defaultThreshold || 2,
    routerAccessLevel: options?.routerAccessLevel || 1,
    userCanRevoke: options?.userCanRevoke ?? true,
    ttlMin: options?.ttlMin || 10
  };

  const data = new TextEncoder().encode(JSON.stringify(historyData));
  return client.encryptHistory(data, config, signer);
}

/**
 * Helper for intent decryption with JSON parsing
 */
export async function decryptIntentData(
  client: IntenusSealClient,
  encryptedData: Uint8Array,
  policyId: string,
  solverCredentials: SolverCredentials,
  signer: Signer,
  batchId?: string
): Promise<any> {
  const decryptedBytes = await client.decryptIntent(
    encryptedData,
    policyId,
    solverCredentials,
    signer,
    batchId
  );
  
  const decryptedText = new TextDecoder().decode(decryptedBytes);
  return JSON.parse(decryptedText);
}

/**
 * Helper for strategy decryption with JSON parsing
 */
export async function decryptStrategyData(
  client: IntenusSealClient,
  encryptedData: Uint8Array,
  policyId: string,
  solverCredentials: SolverCredentials,
  signer: Signer
): Promise<any> {
  const decryptedBytes = await client.decryptStrategy(
    encryptedData,
    policyId,
    solverCredentials,
    signer
  );
  
  const decryptedText = new TextDecoder().decode(decryptedBytes);
  return JSON.parse(decryptedText);
}

/**
 * Helper for history decryption with JSON parsing
 */
export async function decryptHistoryData(
  client: IntenusSealClient,
  encryptedData: Uint8Array,
  policyId: string,
  userAddress: string,
  signer: Signer,
  accessLevel?: number
): Promise<any> {
  const decryptedBytes = await client.decryptHistory(
    encryptedData,
    policyId,
    userAddress,
    signer,
    accessLevel
  );
  
  const decryptedText = new TextDecoder().decode(decryptedBytes);
  return JSON.parse(decryptedText);
}

/**
 * Generate unique policy identifier from type and context.
 * Returns hex-encoded string suitable for Seal operations.
 * 
 * @param type - Policy type (intent, strategy, or history)
 * @param identifier - Context identifier (batch ID, solver ID, etc)
 * @param timestamp - Optional timestamp (defaults to now)
 * @returns Hex-encoded policy ID
 */
export function generatePolicyId(
  type: 'intent' | 'strategy' | 'history',
  identifier: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  const id = `${type}_${identifier}_${ts}`;
  return toHex(new TextEncoder().encode(id));
}

/**
 * Parse policy ID to extract information
 */
export function parsePolicyId(policyId: string): {
  type: string;
  identifier: string;
  timestamp: number;
} | null {
  try {
    const decoded = new TextDecoder().decode(fromHex(policyId));
    const parts = decoded.split('_');
    
    if (parts.length >= 3) {
      const type = parts[0];
      const timestamp = parseInt(parts[parts.length - 1]);
      const identifier = parts.slice(1, -1).join('_');
      
      return {
        type,
        identifier,
        timestamp
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Create solver credentials for authentication.
 * 
 * @param solverId - Unique solver identifier
 * @param privateKey - Solver's private key
 * @param registryId - Solver registry object ID
 * @returns Solver credentials object
 */
export function createSolverCredentials(
  solverId: string,
  privateKey: string,
  registryId: string
): SolverCredentials {
  return {
    solverId,
    privateKey,
    registryId
  };
}

/**
 * Validate encryption configuration before use.
 * Checks for required fields and valid threshold values.
 * 
 * @param config - Encryption configuration to validate
 * @returns True if config is valid
 */
export function validateEncryptionConfig(
  config: IntentEncryptionConfig | StrategyEncryptionConfig | HistoryEncryptionConfig
): boolean {
  if (!config.packageId || !config.policyId) {
    return false;
  }
  
  if (config.threshold < 1) {
    return false;
  }
  
  return true;
}

/**
 * Convert various data formats to Uint8Array for encryption.
 * Handles strings, objects, numbers, and existing byte arrays.
 * 
 * @param data - Data in any format
 * @returns Data as Uint8Array
 */
export function prepareDataForEncryption(data: any): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }
  
  if (typeof data === 'string') {
    return new TextEncoder().encode(data);
  }
  
  if (typeof data === 'object') {
    return new TextEncoder().encode(JSON.stringify(data));
  }
  
  return new TextEncoder().encode(String(data));
}

/**
 * Parse decrypted bytes into desired format.
 * 
 * @param decryptedBytes - Decrypted data as byte array
 * @param format - Target format: 'json', 'string', or 'bytes'
 * @returns Parsed data in specified format
 */
export function parseDecryptedData(
  decryptedBytes: Uint8Array,
  format: 'string' | 'json' | 'bytes' = 'json'
): any {
  switch (format) {
    case 'string':
      return new TextDecoder().decode(decryptedBytes);
    
    case 'json':
      const text = new TextDecoder().decode(decryptedBytes);
      return JSON.parse(text);
    
    case 'bytes':
      return decryptedBytes;
    
    default:
      return decryptedBytes;
  }
}
