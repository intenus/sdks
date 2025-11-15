/**
 * Integration tests for Walrus storage
 * NOTE: Batch/Archive tests removed - focus on Intent/Solution/ML storage
 * Requires environment variables:
 * - INTENUS_ADMIN_PRIVATE_KEY
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { IntenusWalrusClient } from '../src/client.js';

describe('Walrus Integration Tests (Testnet)', () => {
  let client: IntenusWalrusClient;
  let signer: Ed25519Keypair;
  
  beforeAll(() => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    client = new IntenusWalrusClient({
      network: 'testnet',
    });

    const { secretKey } = decodeSuiPrivateKey(process.env.INTENUS_ADMIN_PRIVATE_KEY);
    signer = Ed25519Keypair.fromSecretKey(secretKey);
  });

  it('should store and retrieve a simple blob', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const testData = Buffer.from('Hello Walrus from Intenus SDK!');
    const testPath = '/test/simple-blob.txt';

    const storeResult = await client.storeRaw(
      testPath,
      testData,
      1, // 1 epoch
      signer
    );

    expect(storeResult.blob_id).toBeDefined();
    expect(storeResult.size_bytes).toBe(testData.length);

    // Fetch the blob back
    const fetchedData = await client.fetchRaw(storeResult.blob_id);
    expect(fetchedData.toString()).toBe(testData.toString());
  });

  // TODO: Add tests for:
  // - client.intents.store() and fetch()
  // - client.solutions.store() and fetch()
  // - client.ml.storeFeedback() and fetch()
  // - client.ml.storeTrainingSample() and fetch()
  // - client.ml.storeModelMetadata() and fetch()
  // - client.ml.storeModelWeights() and fetch()
});
