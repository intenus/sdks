/**
 * An optional helper for storing intents on Walrus.
 *
 * This class provides a convenient wrapper around `@intenus/walrus` for common
 * intent-related storage operations. For more advanced use cases, it is recommended
 * to use the `IntenusWalrusClient` directly.
 */

import type { Signer } from '@mysten/sui/cryptography';
import type { Intent, StorageResult } from '@intenus/common';
import type { IntenusWalrusClient } from '@intenus/walrus';

export class WalrusIntentHelper {
  constructor(private walrusClient: IntenusWalrusClient) {}
  
  /**
   * Stores an intent on Walrus.
   *
   * The intent is stored at a temporary path and is expected to be moved into
   * a batch by a backend process. It can be stored in either plain or encrypted format.
   *
   * @param intent The intent object to store.
   * @param signer A Sui Signer for authenticating the write operation.
   * @param encrypted Whether the provided `encryptedData` should be used.
   * @param encryptedData The pre-encrypted intent data as a string.
   * @returns A promise that resolves to the storage result.
   */
  async storeIntent(
    intent: Intent,
    signer: Signer,
    encrypted: boolean = false,
    encryptedData?: string
  ): Promise<StorageResult> {
    const intentData = encrypted 
      ? encryptedData! 
      : JSON.stringify(intent);
    
    // Store to temporary location (backend will move to batch)
    const path = `/intents/pending/${intent.intent_id}.json`;
    return this.walrusClient.storeRaw(
      path,
      Buffer.from(intentData),
      1, // 1 epoch only (temporary)
      signer
    );
  }
  
  /**
   * Fetches a pending intent from Walrus for verification.
   *
   * @param blobId The blob ID of the intent to fetch.
   * @returns A promise that resolves to the fetched intent object.
   */
  async fetchIntent(blobId: string): Promise<Intent> {
    const buffer = await this.walrusClient.fetchRaw(blobId);
    return JSON.parse(buffer.toString());
  }
  
  /**
   * Stores a user's preferences on Walrus.
   *
   * @param userAddress The Sui address of the user.
   * @param preferences An object containing the user's preferences.
   * @param signer A Sui Signer for authenticating the write operation.
   * @returns A promise that resolves to the storage result.
   */
  async storeUserPreferences(
    userAddress: string,
    preferences: Record<string, any>,
    signer: Signer
  ): Promise<StorageResult> {
    const path = `/users/${userAddress}/preferences.json`;
    return this.walrusClient.storeRaw(
      path,
      Buffer.from(JSON.stringify(preferences)),
      30, // 30 epochs
      signer
    );
  }
}
