/**
 * Encrypted Storage Service
 * Combines Walrus storage with Seal encryption for secure data storage
 */

import type { Signer } from '@mysten/sui/cryptography';
import type { IntenusWalrusClient } from '../client.js';
import type { StorageResult } from '../types/index.js';
import { BaseStorageService } from './base.js';
import {
  IntenusSealClient,
  type IntentEncryptionConfig,
  type SolutionEncryptionConfig,
  type EncryptionResult
} from '@intenus/seal';
import { WalrusStorageError } from '../types/index.js';

export interface EncryptedStorageResult extends StorageResult {
  encryption: EncryptionResult;
}

export class EncryptedStorageService extends BaseStorageService {
  private sealClient: IntenusSealClient | null = null;

  constructor(client: IntenusWalrusClient) {
    super(client);
  }

  /**
   * Initialize Seal client for encryption operations
   * Must be called before using encrypted storage
   */
  initializeSeal(sealClient: IntenusSealClient): void {
    this.sealClient = sealClient;
  }

  /**
   * Store encrypted intent data
   * Encrypts data with Seal then stores to Walrus
   *
   * @param data - Intent data to encrypt and store
   * @param config - Seal encryption configuration
   * @param epochs - Walrus storage duration
   * @param signer - User's keypair for both encryption and storage
   * @returns Storage result with encryption metadata
   */
  async storeEncryptedIntent(
    data: any,
    config: IntentEncryptionConfig,
    epochs: number,
    signer: Signer
  ): Promise<EncryptedStorageResult> {
    if (!this.sealClient) {
      throw new WalrusStorageError(
        'Seal client not initialized. Call initializeSeal() first.',
        'SEAL_NOT_INITIALIZED'
      );
    }

    try {
      // Prepare data for encryption
      const dataBytes = new TextEncoder().encode(JSON.stringify(data));

      // Encrypt with Seal
      const encryptionResult = await this.sealClient.encryptIntent(
        dataBytes,
        config,
        signer
      );

      // Store encrypted data to Walrus
      const storageResult = await this.client.walrusClient.writeBlob({
        blob: encryptionResult.encryptedData,
        epochs,
        deletable: true,
        signer,
      });

      return {
        blob_id: storageResult.blobId,
        size_bytes: encryptionResult.encryptedData.length,
        created_at: Date.now(),
        epochs,
        encryption: encryptionResult,
      };
    } catch (error: any) {
      throw new WalrusStorageError(
        `Failed to store encrypted intent: ${error.message}`,
        'ENCRYPTED_INTENT_STORE_ERROR'
      );
    }
  }

  /**
   * Store encrypted solution data
   * Encrypts solution with Seal then stores to Walrus
   *
   * @param data - Solution data to encrypt and store
   * @param config - Seal solution encryption config
   * @param epochs - Walrus storage duration
   * @param signer - Solver's keypair
   * @returns Storage result with encryption metadata
   */
  async storeEncryptedSolution(
    data: any,
    config: SolutionEncryptionConfig,
    epochs: number,
    signer: Signer
  ): Promise<EncryptedStorageResult> {
    if (!this.sealClient) {
      throw new WalrusStorageError(
        'Seal client not initialized. Call initializeSeal() first.',
        'SEAL_NOT_INITIALIZED'
      );
    }

    try {
      // Prepare data for encryption
      const dataBytes = new TextEncoder().encode(JSON.stringify(data));

      // Encrypt with Seal
      const encryptionResult = await this.sealClient.encryptSolution(
        dataBytes,
        config,
        signer
      );

      // Store encrypted data to Walrus
      const storageResult = await this.client.walrusClient.writeBlob({
        blob: encryptionResult.encryptedData,
        epochs,
        deletable: true,
        signer,
      });

      return {
        blob_id: storageResult.blobId,
        size_bytes: encryptionResult.encryptedData.length,
        created_at: Date.now(),
        epochs,
        encryption: encryptionResult,
      };
    } catch (error: any) {
      throw new WalrusStorageError(
        `Failed to store encrypted solution: ${error.message}`,
        'ENCRYPTED_SOLUTION_STORE_ERROR'
      );
    }
  }

  /**
   * Store any encrypted data with custom encryption config
   * Generic method for custom use cases
   *
   * @param data - Data to encrypt and store
   * @param encryptedData - Pre-encrypted data from Seal
   * @param epochs - Walrus storage duration
   * @param signer - User's keypair
   * @param encryptionMetadata - Encryption metadata to include in result
   * @returns Storage result with encryption metadata
   */
  async storeEncrypted(
    encryptedData: Uint8Array,
    epochs: number,
    signer: Signer,
    encryptionMetadata: EncryptionResult
  ): Promise<EncryptedStorageResult> {
    try {
      const storageResult = await this.client.walrusClient.writeBlob({
        blob: encryptedData,
        epochs,
        deletable: true,
        signer,
      });

      return {
        blob_id: storageResult.blobId,
        size_bytes: encryptedData.length,
        created_at: Date.now(),
        epochs,
        encryption: encryptionMetadata,
      };
    } catch (error: any) {
      throw new WalrusStorageError(
        `Failed to store encrypted data: ${error.message}`,
        'ENCRYPTED_STORE_ERROR'
      );
    }
  }

  /**
   * Fetch and decrypt intent data
   * Retrieves from Walrus and decrypts with Seal
   *
   * @param blobId - Walrus blob ID
   * @param intentObjectId - Intent object ID for Seal access control
   * @param signer - Solver's keypair
   * @returns Decrypted intent data
   */
  async fetchDecryptedIntent(
    blobId: string,
    intentObjectId: string,
    signer: Signer
  ): Promise<any> {
    if (!this.sealClient) {
      throw new WalrusStorageError(
        'Seal client not initialized. Call initializeSeal() first.',
        'SEAL_NOT_INITIALIZED'
      );
    }

    try {
      // Fetch encrypted data from Walrus
      const encryptedData = await this.client.walrusClient.readBlob({ blobId });

      // Decrypt with Seal
      const decryptedBytes = await this.sealClient.decryptIntent(
        encryptedData,
        intentObjectId,
        signer
      );

      // Parse JSON
      const decryptedText = new TextDecoder().decode(decryptedBytes);
      return JSON.parse(decryptedText);
    } catch (error: any) {
      throw new WalrusStorageError(
        `Failed to fetch and decrypt intent: ${error.message}`,
        'ENCRYPTED_INTENT_FETCH_ERROR'
      );
    }
  }

  /**
   * Fetch and decrypt solution data
   * Retrieves from Walrus and decrypts with Seal
   *
   * @param blobId - Walrus blob ID
   * @param solutionObjectId - Solution object ID for Seal access control
   * @param signer - Authorized keypair
   * @returns Decrypted solution data
   */
  async fetchDecryptedSolution(
    blobId: string,
    solutionObjectId: string,
    signer: Signer
  ): Promise<any> {
    if (!this.sealClient) {
      throw new WalrusStorageError(
        'Seal client not initialized. Call initializeSeal() first.',
        'SEAL_NOT_INITIALIZED'
      );
    }

    try {
      // Fetch encrypted data from Walrus
      const encryptedData = await this.client.walrusClient.readBlob({ blobId });

      // Decrypt with Seal
      const decryptedBytes = await this.sealClient.decryptSolution(
        encryptedData,
        solutionObjectId,
        signer
      );

      // Parse JSON
      const decryptedText = new TextDecoder().decode(decryptedBytes);
      return JSON.parse(decryptedText);
    } catch (error: any) {
      throw new WalrusStorageError(
        `Failed to fetch and decrypt solution: ${error.message}`,
        'ENCRYPTED_SOLUTION_FETCH_ERROR'
      );
    }
  }

  /**
   * Fetch encrypted data without decryption
   * Useful when you want to decrypt separately or pass to another system
   *
   * @param blobId - Walrus blob ID
   * @returns Encrypted data as Uint8Array
   */
  async fetchEncrypted(blobId: string): Promise<Uint8Array> {
    try {
      return await this.client.walrusClient.readBlob({ blobId });
    } catch (error: any) {
      throw new WalrusStorageError(
        `Failed to fetch encrypted data: ${error.message}`,
        'ENCRYPTED_FETCH_ERROR'
      );
    }
  }
}
