/**
 * Helper utilities for encryption and decryption workflows
 */

import { Signer } from '@mysten/sui/cryptography';
import type { IntenusSealClient } from './client.js';
import type {
  IntentEncryptionConfig,
  SolutionEncryptionConfig,
  EncryptionResult
} from './types.js';
import { toHex } from '@mysten/sui/utils';

/**
 * Encrypt intent data with sensible defaults.
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
 * Encrypt solver solution with privacy protection.
 * Use this to keep solver solutions confidential.
 *
 * @param client - Seal client instance
 * @param solutionData - Solution data object
 * @param solverId - Unique solver identifier
 * @param signer - Solver's keypair
 * @param options - Solution-specific encryption options
 * @returns Encrypted solution result
 */
export async function encryptSolutionData(
  client: IntenusSealClient,
  solutionData: any,
  solverId: string,
  signer: Signer,
  options?: Partial<SolutionEncryptionConfig>
): Promise<EncryptionResult> {
  const protocolPackageId = client.getPackageId();
  const policyId = generatePolicyId('solution', solverId);

  const config: SolutionEncryptionConfig = {
    packageId: protocolPackageId,
    policyId,
    threshold: options?.threshold || client.getConfig().defaultThreshold || 2,
    isPublic: options?.isPublic ?? false,
    ttlMin: options?.ttlMin || 10
  };

  const data = new TextEncoder().encode(JSON.stringify(solutionData));
  return client.encryptSolution(data, config, signer);
}

/**
 * Helper for intent decryption with JSON parsing
 */
export async function decryptIntentData(
  client: IntenusSealClient,
  encryptedData: Uint8Array,
  intentObjectId: string,
  signer: Signer
): Promise<any> {
  const decryptedBytes = await client.decryptIntent(
    encryptedData,
    intentObjectId,
    signer
  );

  const decryptedText = new TextDecoder().decode(decryptedBytes);
  return JSON.parse(decryptedText);
}

/**
 * Helper for solution decryption with JSON parsing
 */
export async function decryptSolutionData(
  client: IntenusSealClient,
  encryptedData: Uint8Array,
  solutionObjectId: string,
  signer: Signer
): Promise<any> {
  const decryptedBytes = await client.decryptSolution(
    encryptedData,
    solutionObjectId,
    signer
  );

  const decryptedText = new TextDecoder().decode(decryptedBytes);
  return JSON.parse(decryptedText);
}

/**
 * Generate unique policy identifier from type and context.
 * Returns hex-encoded string suitable for Seal operations.
 *
 * @param type - Policy type (intent or solution)
 * @param identifier - Context identifier (batch ID, solver ID, etc)
 * @param timestamp - Optional timestamp (defaults to now)
 * @returns Hex-encoded policy ID
 */
export function generatePolicyId(
  type: 'intent' | 'solution',
  identifier: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  const id = `${type}_${identifier}_${ts}`;
  return toHex(new TextEncoder().encode(id));
}

/**
 * Validate encryption configuration before use.
 * Checks for required fields and valid threshold values.
 *
 * @param config - Encryption configuration to validate
 * @returns True if config is valid
 */
export function validateEncryptionConfig(
  config: IntentEncryptionConfig | SolutionEncryptionConfig
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
