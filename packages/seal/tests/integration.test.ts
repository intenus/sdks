/**
 * Integration tests for Seal encryption/decryption
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { IntenusSealClient } from '../src/client.js';
import {
  encryptIntentData,
  decryptIntentData,
  encryptSolutionData,
  decryptSolutionData,
  generatePolicyId,
  validateEncryptionConfig,
  prepareDataForEncryption,
  parseDecryptedData
} from '../src/index.js';

describe('Seal Integration Tests (Testnet)', () => {
  let client: IntenusSealClient;
  let adminSigner: Ed25519Keypair;

  beforeAll(() => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    // Initialize Seal client
    client = new IntenusSealClient({
      network: 'testnet',
      defaultThreshold: 2,
      verifyKeyServers: false
    });

    // Setup admin signer
    const { secretKey: adminSecretKey } = decodeSuiPrivateKey(process.env.INTENUS_ADMIN_PRIVATE_KEY);
    adminSigner = Ed25519Keypair.fromSecretKey(adminSecretKey);
  });

  it('should initialize client with correct configuration', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const config = client.getConfig();
    expect(config.network).toBe('testnet');
    expect(config.defaultThreshold).toBe(2);
    expect(config.keyServers).toBeDefined();
    expect(config.keyServers!.length).toBeGreaterThan(0);
  });

  it('should get package ID for current network', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const packageId = client.getPackageId();
    expect(packageId).toBeDefined();
    expect(typeof packageId).toBe('string');
  });

  it('should encrypt intent data successfully', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const intentData = {
      action: 'swap',
      tokenIn: 'SUI',
      tokenOut: 'USDC',
      amountIn: '1000000',
      slippage: 0.01,
      deadline: Date.now() + 300000,
      userAddress: adminSigner.getPublicKey().toSuiAddress()
    };

    const batchId = `batch_${Date.now()}`;

    const encrypted = await encryptIntentData(
      client,
      intentData,
      batchId,
      adminSigner,
      {
        threshold: 2,
        solverWindow: 5000,
        routerAccess: true
      }
    );

    expect(encrypted.encryptedData).toBeDefined();
    expect(encrypted.encryptedData.length).toBeGreaterThan(0);
    expect(encrypted.policyId).toBeDefined();
    expect(encrypted.packageId).toBeDefined();
    expect(encrypted.threshold).toBe(2);
    expect(encrypted.backupKey).toBeDefined();

    console.log('[PASS] Intent encrypted successfully');
    console.log('  - Policy ID:', encrypted.policyId);
    console.log('  - Encrypted size:', encrypted.encryptedData.length, 'bytes');
  }, 60000);

  it.skip('should decrypt intent data (requires Intent object onchain)', async () => {
    // Requires Intent object created onchain
    // See README for setup instructions
  });

  it('should encrypt solution data successfully', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const solutionData = {
      solver_id: 'solver_001',
      routes: [{ dex: 'cetus', pool_id: '0x...' }],
      expected_output: '950000',
      confidence: 0.95,
      created_at: Date.now()
    };

    const solverId = 'solver_test';

    const encrypted = await encryptSolutionData(
      client,
      solutionData,
      solverId,
      adminSigner,
      {
        threshold: 2,
        isPublic: false
      }
    );

    expect(encrypted.encryptedData).toBeDefined();
    expect(encrypted.policyId).toBeDefined();
    expect(encrypted.backupKey).toBeDefined();

    console.log('[PASS] Solution encrypted successfully');
    console.log('  - Policy ID:', encrypted.policyId);
    console.log('  - Encrypted size:', encrypted.encryptedData.length, 'bytes');
  }, 60000);

  it.skip('should decrypt solution data (requires Solution object onchain)', async () => {
    // Requires Solution object created onchain
  });

  it('should create approval transactions correctly', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const intentObjectId = '0x123';

    // Intent approval transaction
    const intentTx = client.createIntentApprovalTx(intentObjectId);
    expect(intentTx).toBeDefined();

    console.log('[PASS] Intent approval transaction created');

    const solutionObjectId = '0x456';

    // Solution approval transaction
    const solutionTx = client.createSolutionApprovalTx(solutionObjectId);
    expect(solutionTx).toBeDefined();

    console.log('[PASS] Solution approval transaction created');
  });

  it('should manage session keys correctly', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const packageId = client.getPackageId() || '0x123';

    // Create session key
    const sessionKey = await client.getSessionKey(
      packageId,
      adminSigner,
      10 // 10 minutes TTL
    );

    expect(sessionKey).toBeDefined();
    console.log('[PASS] Session key created');

    // Session key should be cached
    const cachedSessionKey = await client.getSessionKey(
      packageId,
      adminSigner,
      10
    );

    expect(cachedSessionKey).toBe(sessionKey);
    console.log('[PASS] Session key caching works');

    // Clear session keys
    client.clearSessionKeys();
    console.log('[PASS] Session key management works');
  }, 60000);

  it('should handle multiple encryptions in parallel', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const batchId = `batch_parallel_${Date.now()}`;

    const intents = Array.from({ length: 5 }, (_, i) => ({
      action: 'swap',
      tokenIn: 'SUI',
      tokenOut: 'USDC',
      amountIn: `${(i + 1) * 1000000}`,
      slippage: 0.01,
      deadline: Date.now() + 300000
    }));

    const encryptionPromises = intents.map(intent =>
      encryptIntentData(client, intent, batchId, adminSigner)
    );

    const results = await Promise.all(encryptionPromises);

    expect(results).toHaveLength(5);
    results.forEach((result, i) => {
      expect(result.encryptedData).toBeDefined();
      expect(result.policyId).toBeDefined();
      console.log(`[PASS] Intent ${i + 1} encrypted (${result.encryptedData.length} bytes)`);
    });

    console.log('[PASS] Parallel encryption completed');
  }, 120000);

  it('should generate policy IDs correctly', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const intentPolicyId = generatePolicyId('intent', 'batch_123', 1699123456);
    expect(intentPolicyId).toBeDefined();
    expect(typeof intentPolicyId).toBe('string');

    const solutionPolicyId = generatePolicyId('solution', 'solver_001');
    expect(solutionPolicyId).toBeDefined();

    console.log('[PASS] Policy ID generation works');
    console.log('  - Intent policy:', intentPolicyId.substring(0, 20) + '...');
    console.log('  - Solution policy:', solutionPolicyId.substring(0, 20) + '...');
  });

  it('should handle encryption with different thresholds', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const intentData = { action: 'swap', amount: '1000' };
    const batchId = `batch_threshold_${Date.now()}`;

    // Threshold 1
    const encrypted1 = await encryptIntentData(
      client, intentData, batchId, adminSigner, { threshold: 1 }
    );
    expect(encrypted1.threshold).toBe(1);
    console.log('[PASS] Threshold 1 encryption:', encrypted1.encryptedData.length, 'bytes');

    // Threshold 2 (default)
    const encrypted2 = await encryptIntentData(
      client, intentData, batchId, adminSigner, { threshold: 2 }
    );
    expect(encrypted2.threshold).toBe(2);
    console.log('[PASS] Threshold 2 encryption:', encrypted2.encryptedData.length, 'bytes');
  }, 60000);

  it('should reject invalid threshold', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const intentData = { action: 'test' };
    const batchId = 'batch_invalid';

    await expect(
      encryptIntentData(client, intentData, batchId, adminSigner, { threshold: 999 })
    ).rejects.toThrow();

    console.log('[PASS] Invalid threshold rejected');
  });

  it('should validate encryption config correctly', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const validConfig = {
      packageId: '0x123',
      policyId: '0xabc',
      threshold: 2,
      batchId: 'batch_1',
      solverWindow: 5000,
      routerAccess: true
    };

    const invalidConfig = {
      packageId: '',
      policyId: '0xabc',
      threshold: 2
    };

    expect(validateEncryptionConfig(validConfig as any)).toBe(true);
    expect(validateEncryptionConfig(invalidConfig as any)).toBe(false);

    console.log('[PASS] Config validation works');
  });

  it('should prepare different data formats for encryption', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const stringData = prepareDataForEncryption('test string');
    expect(stringData).toBeInstanceOf(Uint8Array);

    const objectData = prepareDataForEncryption({ key: 'value' });
    expect(objectData).toBeInstanceOf(Uint8Array);

    const uint8Data = prepareDataForEncryption(new Uint8Array([1, 2, 3]));
    expect(uint8Data).toBeInstanceOf(Uint8Array);

    const numberData = prepareDataForEncryption(12345);
    expect(numberData).toBeInstanceOf(Uint8Array);

    console.log('[PASS] Data preparation handles all formats');
  });

  it('should parse decrypted data in different formats', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const testData = { key: 'value', number: 123 };
    const encoded = new TextEncoder().encode(JSON.stringify(testData));

    const parsedJson = parseDecryptedData(encoded, 'json');
    expect(parsedJson).toEqual(testData);

    const parsedString = parseDecryptedData(encoded, 'string');
    expect(parsedString).toBe(JSON.stringify(testData));

    const parsedBytes = parseDecryptedData(encoded, 'bytes');
    expect(parsedBytes).toEqual(encoded);

    console.log('[PASS] Data parsing works for all formats');
  });

  it('should generate unique policy IDs for same data', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const intentData = { action: 'swap', amount: '1000' };
    const batchId = 'batch_unique';

    const encrypted1 = await encryptIntentData(client, intentData, batchId, adminSigner);
    await new Promise(resolve => setTimeout(resolve, 10));
    const encrypted2 = await encryptIntentData(client, intentData, batchId, adminSigner);

    expect(encrypted1.policyId).not.toBe(encrypted2.policyId);
    console.log('[PASS] Unique policy IDs generated');
  }, 60000);
});
