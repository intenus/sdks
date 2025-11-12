/**
 * Integration tests for real Walrus testnet
 * Requires environment variables:
 * - INTENUS_ADMIN_PRIVATE_KEY
 * - INTENUS_ADMIN_PUBLIC_KEY
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { IntenusWalrusClient } from '../src/client.js';
import type { WalrusBatchManifest as BatchManifest } from '@intenus/common';

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

    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds

    let retrievedData: Buffer | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        retrievedData = await client.fetchRaw(storeResult.blob_id);
        break;
      } catch (error: any) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    expect(retrievedData).toBeDefined();
    expect(retrievedData!.toString()).toBe(testData.toString());

    const exists = await client.exists(storeResult.blob_id);
    expect(exists).toBe(true);
  }, 90000); // Increase timeout to 90 seconds

  it('should store and retrieve batch manifest', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const testManifest: BatchManifest = {
      batch_id: `test_batch_${Date.now()}`,
      epoch: Math.floor(Date.now() / 1000),
      intent_count: 2,
      intents: [
        {
          intent_id: 'intent_1',
          user_address: signer.getPublicKey().toSuiAddress(),
          intent_data: JSON.stringify({ action: 'swap', amount: '1000' }),
          is_encrypted: false,
          seal_policy_id: null,
          category: 'swap',
          timestamp: Date.now(),
        },
        {
          intent_id: 'intent_2',
          user_address: signer.getPublicKey().toSuiAddress(),
          intent_data: JSON.stringify({ action: 'lend', amount: '500' }),
          is_encrypted: false,
          seal_policy_id: null,
          category: 'lending',
          timestamp: Date.now(),
        },
      ],
      categories: { swap: 1, lending: 1 },
      estimated_value_usd: 1500,
      solver_deadline: Date.now() + 300000, // 5 minutes
      created_at: Date.now(),
      requirements: {
        min_tee_verification: false,
        min_stake_required: '1000000000', // 1 SUI
        max_solutions_per_solver: 3,
      },
    };

    const storeResult = await client.batches.storeManifest(testManifest, signer);
    expect(storeResult.blob_id).toBeDefined();

    await new Promise(resolve => setTimeout(resolve, 5000));

    let retrievedManifest: BatchManifest | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        retrievedManifest = await client.batches.fetchManifestById(storeResult.blob_id);
        break;
      } catch (error: any) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    expect(retrievedManifest).toBeDefined();
    expect(retrievedManifest!.batch_id).toBe(testManifest.batch_id);
    expect(retrievedManifest!.intents).toHaveLength(2);
    expect(retrievedManifest!.intent_count).toBe(2);
  }, 120000);

  it('should store and retrieve intents efficiently', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const testIntents = [
      {
        intent_id: 'intent_1',
        data: { action: 'swap', from: 'SUI', to: 'USDC', amount: '1000' },
        category: 'swap',
      },
      {
        intent_id: 'intent_2',
        data: { action: 'lend', protocol: 'Scallop', amount: '500' },
        category: 'lending',
      },
      {
        intent_id: 'intent_3',
        data: { action: 'stake', validator: 'validator_1', amount: '2000' },
        category: 'staking',
      },
    ];

    const batchId = `batch_${Date.now()}`;

    const result = await client.batches.storeIntents(
      testIntents,
      batchId,
      signer,
      1 // 1 epoch
    );

    expect(result.blobId).toBeDefined();
    expect(result.intentIds).toHaveLength(testIntents.length);

    await new Promise(resolve => setTimeout(resolve, 5000));

    let allIntents: any[] = [];
    
      try {
        allIntents = await client.batches.fetchIntents(result.blobId);
      } catch (error: any) {
        console.error(error);
      }
    
    expect(allIntents).toHaveLength(testIntents.length);

    const retrievedIntent1 = allIntents.find(intent => intent.intent_id === 'intent_1');
    expect(retrievedIntent1).toBeDefined();
    expect(retrievedIntent1!.data.action).toBe('swap');
    expect(retrievedIntent1!.category).toBe('swap');

    let individualIntent: any = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        individualIntent = await client.batches.fetchIntent(result.blobId, 'intent_1');
        break;
      } catch (error: any) {
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      }
    
    expect(individualIntent).toBeDefined();
    expect(individualIntent!.data.action).toBe('swap');
  }, 150000);

  it.only('should store and retrieve training dataset', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const version = `v1.0.${Date.now()}`;
    const features = Buffer.from('feature1,feature2,feature3\n1.0,2.0,3.0\n4.0,5.0,6.0');
    const labels = Buffer.from('label\n1\n0');

    const metadata = {
      batch_count: 10,
      intent_count: 100,
      execution_count: 95,
      feature_columns: ['feature1', 'feature2', 'feature3'],
      label_columns: ['label'],
      data_quality_score: 0.95,
      completeness: 0.98
    };

    const result = await client.training.storeDataset(
      version,
      features,
      labels,
      metadata,
      signer
    );

    expect(result.metadataResult.blob_id).toBeDefined();
    expect(result.featuresResult.blob_id).toBeDefined();
    expect(result.labelsResult.blob_id).toBeDefined();

    await new Promise(resolve => setTimeout(resolve, 10000));

    const retrievedMetadata = await client.training.fetchDatasetMetadata(result.metadataResult.blob_id);
    expect(retrievedMetadata.version).toBe(version);
    expect(retrievedMetadata.batch_count).toBe(10);
    expect(retrievedMetadata.features_blob_id).toBe(result.featuresResult.blob_id);

    const retrievedFeatures = await client.training.fetchDatasetFeatures(result.featuresResult.blob_id, version);
    expect(retrievedFeatures.toString()).toBe(features.toString());
  }, 120000);

  it('should store and retrieve ML model', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const modelName = 'user_preference_ranker';
    const version = `v1.0.${Date.now()}`;
    const modelData = Buffer.from('fake-onnx-model-data');

    const metadata = {
      model_type: 'user_preference',
      framework: 'pytorch',
      training_dataset_version: 'v1.0.0',
      training_duration_ms: 3600000,
      metrics: {
        accuracy: 0.92,
        precision: 0.89,
        recall: 0.94,
        f1_score: 0.91
      },
      config: {
        input_shape: [128],
        output_shape: [1],
        hyperparameters: {
          learning_rate: 0.001,
          batch_size: 32
        }
      }
    };

    const result = await client.training.storeModel(
      modelName,
      version,
      modelData,
      metadata,
      signer
    );

    expect(result.metadataResult.blob_id).toBeDefined();
    expect(result.modelResult.blob_id).toBeDefined();

    await new Promise(resolve => setTimeout(resolve, 10000));

    const retrievedMetadata = await client.training.fetchModelMetadata(result.metadataResult.blob_id);
    expect(retrievedMetadata.name).toBe(modelName);
    expect(retrievedMetadata.version).toBe(version);
    expect(retrievedMetadata.metrics.accuracy).toBe(0.92);
    expect(retrievedMetadata.model_blob_id).toBe(result.modelResult.blob_id);

    const retrievedModel = await client.training.fetchModel(result.modelResult.blob_id, modelName, version);
    expect(retrievedModel.toString()).toBe(modelData.toString());
  }, 120000);

  it('should store and retrieve training data points', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const dataPoints = [
      {
        id: 'point_1',
        features: { surplus: 100, gas: 50, slippage: 0.5 },
        labels: { rating: 5, selected: true }
      },
      {
        id: 'point_2',
        features: { surplus: 80, gas: 60, slippage: 1.0 },
        labels: { rating: 4, selected: true }
      },
      {
        id: 'point_3',
        features: { surplus: 50, gas: 70, slippage: 2.0 },
        labels: { rating: 3, selected: false }
      }
    ];

    const datasetVersion = `v1.0.${Date.now()}`;

    const result = await client.training.storeTrainingData(
      dataPoints,
      datasetVersion,
      signer,
      1
    );

    expect(result.blobId).toBeDefined();
    expect(result.dataPointIds).toHaveLength(3);

    await new Promise(resolve => setTimeout(resolve, 20000));

    let retrievedPoints: any[] = [];
    const maxRetries = 5;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        retrievedPoints = await client.training.fetchTrainingData(result.blobId);
        break;
      } catch (error: any) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    expect(retrievedPoints).toHaveLength(3);

    const point1 = retrievedPoints.find(p => p.id === 'point_1');
    expect(point1).toBeDefined();
    expect(point1!.features.surplus).toBe(100);
    expect(point1!.labels.rating).toBe(5);
  }, 150000);

  it('should handle client reset', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    client.reset();
    expect(client.getConfig()).toBeDefined();
  });
});
