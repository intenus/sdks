/**
 * OPTIONAL: Helper for storing intents on Walrus
 * Clients can use @intenus/walrus directly if preferred
 */

import type { Signer } from '@mysten/sui/cryptography';
import type { Intent, StorageResult } from '@intenus/common';
import type { IntenusWalrusClient } from '@intenus/walrus';

export class WalrusIntentHelper {
  constructor(private walrusClient: IntenusWalrusClient) {}
  
  /**
   * Store intent to Walrus (after encryption if needed)
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
   * Fetch intent from Walrus (for verification)
   */
  async fetchIntent(intentId: string): Promise<Intent> {
    const path = `/intents/pending/${intentId}.json`;
    const buffer = await this.walrusClient.fetchRaw(path);
    return JSON.parse(buffer.toString());
  }
  
  /**
   * Store user preferences to Walrus
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
