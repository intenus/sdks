/**
 * OPTIONAL: Helper for fetching batch data from Walrus
 * Solvers can use @intenus/walrus directly if preferred
 */

import type { Signer } from '@mysten/sui/cryptography';
import type { 
  WalrusBatchManifest, 
  Intent, 
  BatchIntent 
} from '@intenus/common';
import type { IntenusWalrusClient } from '@intenus/walrus';

export class WalrusBatchFetcher {
  constructor(private walrusClient: IntenusWalrusClient) {}
  
  /**
   * Fetch batch manifest from Walrus
   */
  async fetchBatchManifest(epoch: number): Promise<WalrusBatchManifest> {
    return this.walrusClient.batches.fetchManifest(epoch);
  }
  
  /**
   * Fetch and decrypt all intents from batch
   */
  async fetchIntents(
    manifest: WalrusBatchManifest,
    sealClient?: any // Type from @mysten/seal
  ): Promise<Intent[]> {
    const intents: Intent[] = [];
    
    for (const batchIntent of manifest.intents) {
      let intentData = batchIntent.intent_data;
      
      // Decrypt if needed
      if (batchIntent.is_encrypted && sealClient) {
        intentData = await sealClient.decrypt(
          intentData,
          batchIntent.seal_policy_id
        );
      }
      
      const intent: Intent = JSON.parse(intentData);
      intents.push(intent);
    }
    
    return intents;
  }
  
  /**
   * Store solution to Walrus (before submitting to backend)
   */
  async storeSolution(
    solutionId: string,
    batchId: string,
    ptbBytes: Uint8Array,
    signer: Signer
  ): Promise<string> {
    const path = `/solutions/${batchId}/${solutionId}.ptb`;
    const result = await this.walrusClient.storeRaw(
      path,
      Buffer.from(ptbBytes),
      1, // 1 epoch
      signer
    );
    return result.blob_id;
  }
  
  /**
   * Fetch user history for personalized solving
   */
  async fetchUserHistory(userAddress: string) {
    try {
      return await this.walrusClient.users.fetchHistory(userAddress);
    } catch (error) {
      // User history not found - return default
      return null;
    }
  }
  
  /**
   * Store batch archive after execution
   */
  async storeArchive(
    archive: any, // BatchArchive type
    signer: Signer
  ): Promise<string> {
    const result = await this.walrusClient.archives.storeArchive(archive, signer);
    return result.blob_id;
  }
}
