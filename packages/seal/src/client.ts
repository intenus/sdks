/**
 * Main client for Seal encryption/decryption operations
 * Handles session management and policy-based access control
 */

import type {
  IntenusSealConfig,
  IntentEncryptionConfig,
  SolutionEncryptionConfig,
  EncryptionResult,
  DecryptionRequest,
} from './types.js';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { SealClient, SessionKey } from '@mysten/seal';
import { NETWORKS } from '@intenus/common';
import { fromHex } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { Signer } from '@mysten/sui/cryptography';

import {
  DEFAULT_KEY_SERVERS,
  DEFAULT_CONFIG,
  INTENUS_PACKAGE_ID,
  SHARED_OBJECTS,
  POLICY_MODULES,
  SEAL_APPROVE_FUNCTIONS,
  ERROR_CODES
} from './constants.js';

import { IntenusSealError } from './types.js';

export class IntenusSealClient {
  public readonly suiClient: SuiClient;
  public readonly sealClient: SealClient;
  private config: IntenusSealConfig;
  private sessionKeys: Map<string, SessionKey> = new Map();

  constructor(config: IntenusSealConfig) {
    const networkConfig = NETWORKS[config.network.toUpperCase() as keyof typeof NETWORKS];
    
    if (!networkConfig) {
      throw new IntenusSealError(
        `Unknown network: ${config.network}`,
        ERROR_CODES.INVALID_CONFIG
      );
    }

    this.suiClient = config.suiClient || new SuiClient({
      url: getFullnodeUrl(config.network)
    });

    const keyServers = config.keyServers || DEFAULT_KEY_SERVERS[config.network];
    const threshold = config.defaultThreshold || DEFAULT_CONFIG.threshold;

    if (threshold > keyServers.length) {
      throw new IntenusSealError(
        `Threshold ${threshold} cannot exceed number of key servers ${keyServers.length}`,
        ERROR_CODES.INVALID_THRESHOLD
      );
    }

    this.sealClient = config.sealClient || new SealClient({
      suiClient: this.suiClient,
      serverConfigs: keyServers.map(server => ({
        objectId: server.objectId,
        weight: server.weight,
        ...(server.apiKeyName && server.apiKey && {
          apiKeyName: server.apiKeyName,
          apiKey: server.apiKey
        })
      })),
      verifyKeyServers: config.verifyKeyServers ?? DEFAULT_CONFIG.verifyKeyServers
    });

    this.config = {
      ...config,
      keyServers,
      defaultThreshold: threshold
    };
  }

  /**
   * Create or retrieve cached session key for a package.
   * Session keys are cached per package and signer address to avoid repeated wallet confirmations.
   * 
   * @param packageId - Smart contract package ID
   * @param signer - User's keypair for signing
   * @param ttlMin - Time-to-live in minutes (default: 10)
   * @returns Session key instance
   */
  async getSessionKey(
    packageId: string,
    signer: Signer,
    ttlMin: number = DEFAULT_CONFIG.ttlMin
  ): Promise<SessionKey> {
    const cacheKey = `${packageId}-${signer.toSuiAddress()}`;
    
    if (this.sessionKeys.has(cacheKey)) {
      return this.sessionKeys.get(cacheKey)!;
    }

    try {
      const sessionKey = await SessionKey.create({
        address: signer.toSuiAddress(),
        packageId: packageId,
        ttlMin,
        suiClient: this.suiClient
      });

      const message = sessionKey.getPersonalMessage();
      const { signature } = await signer.signPersonalMessage(message);
      sessionKey.setPersonalMessageSignature(signature);

      this.sessionKeys.set(cacheKey, sessionKey);
      return sessionKey;
    } catch (error: any) {
      throw new IntenusSealError(
        `Failed to create session key: ${error.message}`,
        ERROR_CODES.SESSION_KEY_FAILED,
        error
      );
    }
  }

  /**
   * Encrypt intent data for authorized solvers.
   * 
   * @param data - Intent data as byte array
   * @param config - Encryption configuration including policy and threshold
   * @param signer - User's keypair
   * @returns Encrypted data with policy metadata and backup key
   */
  async encryptIntent(
    data: Uint8Array,
    config: IntentEncryptionConfig,
    signer: Signer
  ): Promise<EncryptionResult> {
    try {
      const { encryptedObject, key } = await this.sealClient.encrypt({
        threshold: config.threshold,
        packageId: config.packageId,
        id: config.policyId,
        data
      });

      return {
        encryptedData: encryptedObject,
        backupKey: key,
        policyId: config.policyId,
        packageId: config.packageId,
        threshold: config.threshold
      };
    } catch (error: any) {
      throw new IntenusSealError(
        `Failed to encrypt intent: ${error.message}`,
        ERROR_CODES.ENCRYPTION_FAILED,
        error
      );
    }
  }

  /**
   * Encrypt solver solution data.
   * Keeps solver solutions private with configurable access control.
   *
   * @param data - Solution data as byte array
   * @param config - Solution encryption config
   * @param signer - Solver's keypair
   * @returns Encrypted solution with policy metadata
   */
  async encryptSolution(
    data: Uint8Array,
    config: SolutionEncryptionConfig,
    signer: Signer
  ): Promise<EncryptionResult> {
    try {
      const { encryptedObject, key } = await this.sealClient.encrypt({
        threshold: config.threshold,
        packageId: config.packageId,
        id: config.policyId,
        data
      });

      return {
        encryptedData: encryptedObject,
        backupKey: key,
        policyId: config.policyId,
        packageId: config.packageId,
        threshold: config.threshold
      };
    } catch (error: any) {
      throw new IntenusSealError(
        `Failed to encrypt solution: ${error.message}`,
        ERROR_CODES.ENCRYPTION_FAILED,
        error
      );
    }
  }

  /**
   * Decrypt data using session key and approval transaction.
   * Transaction must call appropriate seal_approve function for access verification.
   * 
   * @param request - Decryption request with encrypted data and session key
   * @returns Decrypted data as byte array
   */
  async decrypt(request: DecryptionRequest): Promise<Uint8Array> {
    try {
      const decryptedBytes = await this.sealClient.decrypt({
        data: request.encryptedData,
        sessionKey: request.sessionKey,
        txBytes: request.txBytes
      });

      return decryptedBytes;
    } catch (error: any) {
      throw new IntenusSealError(
        `Failed to decrypt data: ${error.message}`,
        ERROR_CODES.DECRYPTION_FAILED,
        error
      );
    }
  }

  /**
   * Build transaction to approve intent access.
   * Calls seal_approve_intent on the protocol contract.
   *
   * @param intentObjectId - Intent object ID
   * @returns Transaction ready for signing
   */
  createIntentApprovalTx(
    intentObjectId: string
  ): Transaction {
    const protocolPackageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];
    const tx = new Transaction();

    tx.moveCall({
      target: `${protocolPackageId}::${POLICY_MODULES.SEAL_POLICY_COORDINATOR}::${SEAL_APPROVE_FUNCTIONS.INTENT}`,
      arguments: [
        tx.object(intentObjectId),
        tx.object(sharedObjects.enclaveConfig),
        tx.object(sharedObjects.solverRegistry),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Create transaction for seal_approve_solution
   */
  createSolutionApprovalTx(
    solutionObjectId: string
  ): Transaction {
    const protocolPackageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];
    const tx = new Transaction();

    tx.moveCall({
      target: `${protocolPackageId}::${POLICY_MODULES.SEAL_POLICY_COORDINATOR}::${SEAL_APPROVE_FUNCTIONS.SOLUTION}`,
      arguments: [
        tx.object(solutionObjectId),
        tx.object(sharedObjects.enclaveConfig),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Decrypt intent data if solver is authorized.
   * Automatically handles session key creation and approval transaction building.
   *
   * @param encryptedData - Encrypted intent bytes
   * @param intentObjectId - Intent object ID for access control
   * @param signer - Solver's keypair
   * @returns Decrypted intent data
   */
  async decryptIntent(
    encryptedData: Uint8Array,
    intentObjectId: string,
    signer: Signer
  ): Promise<Uint8Array> {
    const protocolPackageId = INTENUS_PACKAGE_ID[this.config.network];
    const sessionKey = await this.getSessionKey(protocolPackageId, signer);

    const tx = this.createIntentApprovalTx(intentObjectId);
    const txBytes = await tx.build({ client: this.suiClient, onlyTransactionKind: true });

    return this.decrypt({
      encryptedData,
      sessionKey,
      txBytes
    });
  }

  /**
   * Decrypt solution data for authorized solver
   */
  async decryptSolution(
    encryptedData: Uint8Array,
    solutionObjectId: string,
    signer: Signer
  ): Promise<Uint8Array> {
    const protocolPackageId = INTENUS_PACKAGE_ID[this.config.network];
    const sessionKey = await this.getSessionKey(protocolPackageId, signer);

    const tx = this.createSolutionApprovalTx(solutionObjectId);
    const txBytes = await tx.build({ client: this.suiClient, onlyTransactionKind: true });

    return this.decrypt({
      encryptedData,
      sessionKey,
      txBytes
    });
  }

  /**
   * Get network configuration
   */
  getConfig(): IntenusSealConfig {
    return { ...this.config };
  }

  /**
   * Get Intenus Protocol package ID for current network
   */
  getPackageId(): string {
    return INTENUS_PACKAGE_ID[this.config.network];
  }

  /**
   * Clear cached session keys
   */
  clearSessionKeys(): void {
    this.sessionKeys.clear();
  }

  /**
   * Remove specific session key from cache
   */
  removeSessionKey(packageId: string, signerAddress: string): void {
    const cacheKey = `${packageId}-${signerAddress}`;
    this.sessionKeys.delete(cacheKey);
  }
}
