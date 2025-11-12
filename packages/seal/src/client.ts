/**
 * Main client for Seal encryption/decryption operations
 * Handles session management and policy-based access control
 */

import type {
  IntenusSealConfig,
  IntentEncryptionConfig,
  StrategyEncryptionConfig,
  HistoryEncryptionConfig,
  EncryptionResult,
  DecryptionRequest,
  SolverCredentials,
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
   * Encrypt solver strategy or algorithm data.
   * Keeps solver strategies private with configurable access control.
   * 
   * @param data - Strategy data as byte array
   * @param config - Strategy encryption config
   * @param signer - Solver's keypair
   * @returns Encrypted strategy with policy metadata
   */
  async encryptStrategy(
    data: Uint8Array,
    config: StrategyEncryptionConfig,
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
        `Failed to encrypt strategy: ${error.message}`,
        ERROR_CODES.ENCRYPTION_FAILED,
        error
      );
    }
  }

  /**
   * Encrypt user interaction history for analytics while preserving privacy.
   * 
   * @param data - User history data as byte array
   * @param config - History encryption config with access levels
   * @param signer - User or backend service keypair
   * @returns Encrypted history with policy metadata
   */
  async encryptHistory(
    data: Uint8Array,
    config: HistoryEncryptionConfig,
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
        `Failed to encrypt history: ${error.message}`,
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
   * Build transaction to approve intent access for solvers.
   * Calls seal_approve_intent on the protocol contract.
   * 
   * @param policyId - Hex-encoded policy identifier
   * @param solverCredentials - Solver identity credentials
   * @param batchId - Optional batch identifier for context
   * @returns Transaction ready for signing
   */
  createIntentApprovalTx(
    policyId: string,
    solverCredentials: SolverCredentials,
    batchId?: string
  ): Transaction {
    const protocolPackageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];
    const tx = new Transaction();

    tx.moveCall({
      target: `${protocolPackageId}::${POLICY_MODULES.SEAL_POLICY_COORDINATOR}::${SEAL_APPROVE_FUNCTIONS.INTENT}`,
      arguments: [
        tx.pure.vector("u8", fromHex(policyId)),
        tx.object(sharedObjects.policyRegistry),
        tx.object(sharedObjects.solverRegistry),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Create transaction for seal_approve_strategy
   */
  createStrategyApprovalTx(
    policyId: string,
    solverCredentials: SolverCredentials
  ): Transaction {
    const protocolPackageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];
    const tx = new Transaction();

    tx.moveCall({
      target: `${protocolPackageId}::${POLICY_MODULES.SEAL_POLICY_COORDINATOR}::${SEAL_APPROVE_FUNCTIONS.STRATEGY}`,
      arguments: [
        tx.pure.vector("u8", fromHex(policyId)),
        tx.object(sharedObjects.policyRegistry),
        tx.object(sharedObjects.solverRegistry),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Create transaction for seal_approve_history
   */
  createHistoryApprovalTx(
    policyId: string,
    userAddress: string,
    accessLevel?: number
  ): Transaction {
    const protocolPackageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];
    const tx = new Transaction();

    tx.moveCall({
      target: `${protocolPackageId}::${POLICY_MODULES.SEAL_POLICY_COORDINATOR}::${SEAL_APPROVE_FUNCTIONS.HISTORY}`,
      arguments: [
        tx.pure.vector("u8", fromHex(policyId)),
        tx.object(sharedObjects.policyRegistry),
        tx.object(sharedObjects.solverRegistry)
      ]
    });

    return tx;
  }

  /**
   * Decrypt intent data if solver is authorized by policy.
   * Automatically handles session key creation and approval transaction building.
   * 
   * @param encryptedData - Encrypted intent bytes
   * @param policyId - Policy identifier for access control
   * @param solverCredentials - Solver identity
   * @param signer - Solver's keypair
   * @param batchId - Optional batch context
   * @returns Decrypted intent data
   */
  async decryptIntent(
    encryptedData: Uint8Array,
    policyId: string,
    solverCredentials: SolverCredentials,
    signer: Signer,
    batchId?: string
  ): Promise<Uint8Array> {
    const protocolPackageId = INTENUS_PACKAGE_ID[this.config.network];
    const sessionKey = await this.getSessionKey(protocolPackageId, signer);
    
    const tx = this.createIntentApprovalTx(policyId, solverCredentials, batchId);
    const txBytes = await tx.build({ client: this.suiClient, onlyTransactionKind: true });

    return this.decrypt({
      encryptedData,
      sessionKey,
      txBytes
    });
  }

  /**
   * Decrypt strategy data for authorized solver
   */
  async decryptStrategy(
    encryptedData: Uint8Array,
    policyId: string,
    solverCredentials: SolverCredentials,
    signer: Signer
  ): Promise<Uint8Array> {
    const protocolPackageId = INTENUS_PACKAGE_ID[this.config.network];
    const sessionKey = await this.getSessionKey(protocolPackageId, signer);
    
    const tx = this.createStrategyApprovalTx(policyId, solverCredentials);
    const txBytes = await tx.build({ client: this.suiClient, onlyTransactionKind: true });

    return this.decrypt({
      encryptedData,
      sessionKey,
      txBytes
    });
  }

  /**
   * Decrypt history data for authorized user/router
   */
  async decryptHistory(
    encryptedData: Uint8Array,
    policyId: string,
    userAddress: string,
    signer: Signer,
    accessLevel?: number
  ): Promise<Uint8Array> {
    const protocolPackageId = INTENUS_PACKAGE_ID[this.config.network];
    const sessionKey = await this.getSessionKey(protocolPackageId, signer);
    
    const tx = this.createHistoryApprovalTx(policyId, userAddress, accessLevel);
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
