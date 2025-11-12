/**
 * Integration tests for Seal encryption/decryption
 * Requires environment variables:
 * - INTENUS_ADMIN_PRIVATE_KEY
 * - INTENUS_ADMIN_PRIVATE_KEY (optional, for solver tests)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { IntenusSealClient } from '../src/client.js';
import {
  encryptIntentData,
  decryptIntentData,
  encryptStrategyData,
  decryptStrategyData,
  encryptHistoryData,
  decryptHistoryData,
  createSolverCredentials,
  generatePolicyId,
  parsePolicyId,
  validateEncryptionConfig,
  prepareDataForEncryption,
  parseDecryptedData
} from '../src/index.js';

describe('Seal Integration Tests (Testnet)', () => {
  let client: IntenusSealClient;
  let adminSigner: Ed25519Keypair;
  let solverSigner: Ed25519Keypair;

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

    // Setup solver signer (use admin key if solver key not provided)
    if (process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      const { secretKey: solverSecretKey } = decodeSuiPrivateKey(process.env.INTENUS_ADMIN_PRIVATE_KEY);
      solverSigner = Ed25519Keypair.fromSecretKey(solverSecretKey);
    } else {
      solverSigner = adminSigner;
    }
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

    // Prepare intent data
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

    // Encrypt intent
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
    console.log('  - Backup key:', encrypted.backupKey ? 'Generated' : 'None');
  }, 60000);

  // NOTE: Decryption tests skipped - requires onchain policy creation and solver registration
  it.skip('should decrypt intent data (requires onchain setup)', async () => {
    // Requires:
    // 1. Create intent policy onchain via seal_policy_coordinator::create_intent_policy
    // 2. Register solver via solver_registry::register_solver  
    // 3. Ensure policy time window is valid
    // See: packages/seal/README.md for setup instructions
  });

  it('should encrypt strategy data successfully', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    // Prepare strategy data
    const strategyData = {
      algorithm: 'intent_routing_v2',
      version: '2.1.0',
      parameters: {
        max_gas_price: '1000000000',
        min_surplus_threshold: '100000',
        preferred_protocols: ['deepbook', 'turbos', 'cetus'],
        optimization_target: 'surplus'
      },
      weights: {
        gas_weight: 0.3,
        surplus_weight: 0.5,
        reputation_weight: 0.2
      },
      created_at: Date.now(),
      solver_id: solverSigner.getPublicKey().toSuiAddress()
    };

    const solverId = 'solver_strategy_test';

    // Encrypt strategy
    const encrypted = await encryptStrategyData(
      client,
      strategyData,
      solverId,
      solverSigner,
      {
        threshold: 2,
        routerAccess: false,
        isPublic: false
      }
    );

    expect(encrypted.encryptedData).toBeDefined();
    expect(encrypted.policyId).toBeDefined();
    expect(encrypted.backupKey).toBeDefined();

    console.log('[PASS] Strategy encrypted successfully');
    console.log('  - Policy ID:', encrypted.policyId);
    console.log('  - Encrypted size:', encrypted.encryptedData.length, 'bytes');
  }, 60000);

  it.skip('should decrypt strategy data (requires onchain setup)', async () => {
    // Requires strategy policy created onchain
  });

  it('should encrypt user history data successfully', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    // Prepare history data
    const historyData = {
      user_address: adminSigner.getPublicKey().toSuiAddress(),
      total_intents: 150,
      successful_executions: 142,
      failed_executions: 8,
      total_volume_usd: 125000,
      preferred_categories: {
        swap: 85,
        lending: 40,
        staking: 25
      },
      favorite_protocols: ['deepbook', 'scallop', 'navi'],
      average_intent_value_usd: 833,
      last_active: Date.now(),
      reputation_score: 0.95
    };

    const userAddress = adminSigner.getPublicKey().toSuiAddress();

    // Encrypt history
    const encrypted = await encryptHistoryData(
      client,
      historyData,
      userAddress,
      adminSigner,
      {
        threshold: 2,
        routerAccessLevel: 1,
        userCanRevoke: true
      }
    );

    expect(encrypted.encryptedData).toBeDefined();
    expect(encrypted.policyId).toBeDefined();
    expect(encrypted.backupKey).toBeDefined();

    console.log('[PASS] History encrypted successfully');
    console.log('  - Policy ID:', encrypted.policyId);
    console.log('  - Encrypted size:', encrypted.encryptedData.length, 'bytes');
  }, 60000);

  it.skip('should decrypt user history data (requires onchain setup)', async () => {
    // Requires history policy created onchain
  });

  it('should create approval transactions correctly', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const policyId = generatePolicyId('intent', 'batch_123');
    const solverCredentials = createSolverCredentials(
      'solver_001',
      solverSigner.getPublicKey().toSuiAddress(),
      'test_registry'
    );

    // Intent approval transaction
    const intentTx = client.createIntentApprovalTx(
      policyId,
      solverCredentials,
      'batch_123'
    );
    expect(intentTx).toBeDefined();

    // Strategy approval transaction
    const strategyTx = client.createStrategyApprovalTx(
      policyId,
      solverCredentials
    );
    expect(strategyTx).toBeDefined();

    // History approval transaction
    const historyTx = client.createHistoryApprovalTx(
      policyId,
      adminSigner.getPublicKey().toSuiAddress(),
      1
    );
    expect(historyTx).toBeDefined();

    console.log('[PASS] All approval transactions created successfully');
  });

  it('should manage session keys correctly', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const packageId = client.getPackageId() || '0x123'; // Use dummy if not set

    // Create session key
    const sessionKey = await client.getSessionKey(
      packageId,
      adminSigner,
      10 // 10 minutes TTL
    );

    expect(sessionKey).toBeDefined();

    console.log('[PASS] Session key created successfully');

    // Session key should be cached
    const cachedSessionKey = await client.getSessionKey(
      packageId,
      adminSigner,
      10
    );

    expect(cachedSessionKey).toBe(sessionKey);
    console.log('[PASS] Session key caching works');

    // Remove session key
    client.removeSessionKey(packageId, adminSigner.getPublicKey().toSuiAddress());

    // Clear all session keys
    client.clearSessionKeys();

    console.log('[PASS] Session key management works correctly');
  }, 60000);

  it('should handle multiple encryptions in parallel', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const batchId = `batch_parallel_${Date.now()}`;

    // Create multiple intent data
    const intents = Array.from({ length: 5 }, (_, i) => ({
      action: 'swap',
      tokenIn: 'SUI',
      tokenOut: 'USDC',
      amountIn: `${(i + 1) * 1000000}`,
      slippage: 0.01,
      deadline: Date.now() + 300000
    }));

    // Encrypt all intents in parallel
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

    console.log('[PASS] Parallel encryption completed successfully');
  }, 120000);

  it('should generate and parse policy IDs correctly', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const intentPolicyId = generatePolicyId('intent', 'batch_123', 1699123456);
    expect(intentPolicyId).toBeDefined();
    expect(typeof intentPolicyId).toBe('string');

    const strategyPolicyId = generatePolicyId('strategy', 'solver_001');
    expect(strategyPolicyId).toBeDefined();

    const historyPolicyId = generatePolicyId('history', 'user_address');
    expect(historyPolicyId).toBeDefined();

    console.log('[PASS] Policy ID generation works');
    console.log('  - Intent policy:', intentPolicyId.substring(0, 20) + '...');
    console.log('  - Strategy policy:', strategyPolicyId.substring(0, 20) + '...');
    console.log('  - History policy:', historyPolicyId.substring(0, 20) + '...');
  });

  it('should handle client reset', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    client.clearSessionKeys();
    
    const config = client.getConfig();
    expect(config).toBeDefined();
    expect(config.network).toBe('testnet');

    console.log('[PASS] Client reset successful');
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

  it('should reject invalid threshold (exceeds key servers)', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const intentData = { action: 'test' };
    const batchId = 'batch_invalid';

    await expect(
      encryptIntentData(client, intentData, batchId, adminSigner, { threshold: 999 })
    ).rejects.toThrow();

    console.log('[PASS] Invalid threshold rejected correctly');
  });

  it('should handle encryption with minimal data', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const minimalData = { id: '1' };
    const batchId = 'batch_minimal';

    const encrypted = await encryptIntentData(
      client, minimalData, batchId, adminSigner
    );

    expect(encrypted.encryptedData).toBeDefined();
    expect(encrypted.encryptedData.length).toBeGreaterThan(0);
    console.log('[PASS] Minimal data encrypted:', encrypted.encryptedData.length, 'bytes');
  }, 60000);

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
    console.log('  - Policy 1:', encrypted1.policyId.substring(0, 20) + '...');
    console.log('  - Policy 2:', encrypted2.policyId.substring(0, 20) + '...');
  }, 60000);

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

    const invalidConfig1 = {
      packageId: '',
      policyId: '0xabc',
      threshold: 2,
      batchId: 'batch_1',
      solverWindow: 5000,
      routerAccess: true
    };

    const invalidConfig2 = {
      packageId: '0x123',
      policyId: '',
      threshold: 2,
      batchId: 'batch_1',
      solverWindow: 5000,
      routerAccess: true
    };

    expect(validateEncryptionConfig(validConfig as any)).toBe(true);
    expect(validateEncryptionConfig(invalidConfig1 as any)).toBe(false);
    expect(validateEncryptionConfig(invalidConfig2 as any)).toBe(false);

    console.log('[PASS] Encryption config validation works correctly');
  });

  it('should prepare different data formats for encryption', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    // String data
    const stringData = prepareDataForEncryption('test string');
    expect(stringData).toBeInstanceOf(Uint8Array);

    // Object data
    const objectData = prepareDataForEncryption({ key: 'value' });
    expect(objectData).toBeInstanceOf(Uint8Array);

    // Already Uint8Array
    const uint8Data = prepareDataForEncryption(new Uint8Array([1, 2, 3]));
    expect(uint8Data).toBeInstanceOf(Uint8Array);

    // Number
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

    // Parse as JSON
    const parsedJson = parseDecryptedData(encoded, 'json');
    expect(parsedJson).toEqual(testData);

    // Parse as string
    const parsedString = parseDecryptedData(encoded, 'string');
    expect(parsedString).toBe(JSON.stringify(testData));

    // Parse as bytes
    const parsedBytes = parseDecryptedData(encoded, 'bytes');
    expect(parsedBytes).toEqual(encoded);

    console.log('[PASS] Decrypted data parsing works for all formats');
  });

  it('should handle custom policy IDs', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const customPolicyId = generatePolicyId('intent', 'custom_batch_999', 1234567890);
    const intentData = { action: 'test' };

    const encrypted = await encryptIntentData(
      client,
      intentData,
      'batch_999',
      adminSigner,
      { policyId: customPolicyId }
    );

    expect(encrypted.policyId).toBe(customPolicyId);

    // Parse it back
    const parsed = parsePolicyId(customPolicyId);
    expect(parsed).toBeDefined();
    expect(parsed!.type).toBe('intent');
    expect(parsed!.identifier).toBe('custom_batch_999');
    expect(parsed!.timestamp).toBe(1234567890);

    console.log('[PASS] Custom policy IDs work correctly');
  }, 60000);

  it('should create solver credentials with correct format', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const credentials = createSolverCredentials(
      'solver_test',
      '0x123abc',
      'registry_xyz'
    );

    expect(credentials.solverId).toBe('solver_test');
    expect(credentials.privateKey).toBe('0x123abc');
    expect(credentials.registryId).toBe('registry_xyz');

    console.log('[PASS] Solver credentials created correctly');
  });

  it('should manage session keys for same package multiple times', async () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    const packageId = client.getPackageId() || '0x83b321c90dcbc37ab51c65f577b01d88fdd640ce8bd79fe205cfb169fadd381a';

    // Create session key
    const session1 = await client.getSessionKey(packageId, adminSigner, 10);
    expect(session1).toBeDefined();

    // Get cached session key
    const session2 = await client.getSessionKey(packageId, adminSigner, 10);
    expect(session2).toBe(session1);

    // Remove specific session
    client.removeSessionKey(packageId, adminSigner.getPublicKey().toSuiAddress());

    // Create new session after removal
    const session3 = await client.getSessionKey(packageId, adminSigner, 10);
    expect(session3).toBeDefined();
    expect(session3).not.toBe(session1);

    console.log('[PASS] Session key lifecycle management works');
  }, 60000);
});

