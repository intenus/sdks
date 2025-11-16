import { describe, it, expect, beforeAll } from 'vitest';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { IntenusWalrusClient } from '../src/client.js';
import type {
  IGSIntent,
  IGSSolution,
  ModelMetadata,
  IntentClassificationTrainingData,
  ClassificationFeedback,
} from '../src/types/index.js';

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

    const { secretKey } = decodeSuiPrivateKey(
      process.env.INTENUS_ADMIN_PRIVATE_KEY,
    );
    signer = Ed25519Keypair.fromSecretKey(secretKey);
  });

  it(
    'should store and retrieve a simple blob',
    async () => {
      if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
        return;
      }

      const testData = Buffer.from('Hello Walrus from Intenus SDK!');

      const storeResult = await client.storeRaw(
        testData,
        1, // 1 epoch
        signer,
      );

      expect(storeResult.blob_id).toBeDefined();
      expect(storeResult.size_bytes).toBe(testData.length);

      const fetchedData = await client.fetchRaw(storeResult.blob_id);
      expect(fetchedData.toString()).toBe(testData.toString());

      const exists = await client.exists(storeResult.blob_id);
      expect(exists).toBe(true);
    },
    90_000,
  );

  it(
    'should store and retrieve an intent (IGS-compliant)',
    async () => {
      if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
        return;
      }

      const now = Date.now();
      const userAddress = signer.getPublicKey().toSuiAddress();

      const intent: IGSIntent = {
        // Các field quản lý nội bộ (nếu type IGSIntent có thêm) – không trái với schema gốc
        id: `intent_${now}` as any,
        created_at: now as any,
        updated_at: now as any,
        status: 'pending' as any,
        tx_digest: null as any,

        // IGS core fields theo igs-intent-schema.json
        igs_version: '1.0.0',
        user_address: userAddress,
        intent_type: 'swap.exact_input',
        description: 'Swap SUI to USDC with basic constraints',

        object: {
          user_address: userAddress,
          created_ts: now,
          policy: {
            solver_access_window: {
              start_ms: now,
              end_ms: now + 5 * 60 * 1000,
            },
            auto_revoke_time: now + 60 * 60 * 1000,
            access_condition: {
              requires_solver_registration: true,
              min_solver_stake: '1000000000',
              requires_tee_attestation: false,
              expected_measurement: '',
              purpose: 'igs.intent.execution',
            },
          },
        },

        operation: {
          mode: 'exact_input',
          inputs: [
            {
              asset_id: 'native',
              asset_info: {
                symbol: 'SUI',
                decimals: 9,
                name: 'Sui',
              },
              amount: {
                type: 'exact',
                value: '1000000000', // 1 SUI (ví dụ)
              },
            },
          ],
          outputs: [
            {
              asset_id: 'native',
              asset_info: {
                symbol: 'USDC',
                decimals: 6,
                name: 'USD Coin',
              },
              amount: {
                type: 'range',
                min: '900000', // min 0.9 USDC
                max: '2000000',
              },
            },
          ],
          expected_outcome: {
            expected_outputs: [
              {
                asset_id: 'native',
                amount: '1000000',
              },
            ],
            expected_costs: {
              gas_estimate: '0.1',
              protocol_fees: '0.01',
              slippage_estimate: '0.5',
            },
            benchmark: {
              source: 'dex_aggregator',
              timestamp: now,
              confidence: 0.9,
            },
            market_price: {
              price: '1.0',
              price_asset: 'USDC',
            },
          },
        },

        constraints: {
          max_slippage_bps: 100, // 1%
          deadline_ms: now + 10 * 60 * 1000,
          max_inputs: [
            {
              asset_id: 'native',
              amount: '2000000000',
            },
          ],
          min_outputs: [
            {
              asset_id: 'native',
              amount: '900000',
            },
          ],
          max_gas_cost: {
            asset_id: 'native',
            amount: '50000000',
          },
          routing: {
            max_hops: 3,
            blacklist_protocols: [],
            whitelist_protocols: [],
          },
          limit_price: {
            price: '1.1',
            comparison: 'lte',
            price_asset: 'USDC',
          },
        },

        preferences: {
          optimization_goal: 'balanced',
          ranking_weights: {
            surplus_weight: 60,
            gas_cost_weight: 20,
            execution_speed_weight: 10,
            reputation_weight: 10,
          },
          execution: {
            mode: 'best_solution',
            show_top_n: 3,
          },
          privacy: {
            encrypt_intent: false,
            anonymous_execution: false,
          },
        },

        metadata: {
          original_input: {
            text: 'Swap 1 SUI to USDC with low slippage.',
            language: 'en',
            confidence: 0.95,
          },
          client: {
            name: 'intenus-sdk-tests',
            version: '1.0.0',
            platform: 'node',
          },
          warnings: [],
          clarifications: [],
          tags: ['test', 'integration', 'igs'],
        },
      } as any;

      const result = await client.intents.store(intent, 1, signer);
      expect(result.blob_id).toBeDefined();

      const fetched = await client.intents.fetch(result.blob_id);
      expect(fetched.user_address).toBe(intent.user_address);
      expect(fetched.intent_type).toBe(intent.intent_type);
      expect(fetched.operation.mode).toBe('exact_input');
    },
    120_000,
  );

  it(
    'should store and retrieve a solution',
    async () => {
      if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
        return;
      }

      const solution: IGSSolution = {
        solution_id: `solution_${Date.now()}`,
        intent_id: `intent_${Date.now()}`,
        solver_address: signer.getPublicKey().toSuiAddress(),
        submitted_at: Date.now(),
        ptb_bytes: '0xdeadbeef',
        ptb_hash: '0xhash',
        promised_outputs: [
          {
            asset_id: 'native',
            amount: '1000000',
          },
        ],
        estimated_gas: '0.1',
        estimated_slippage_bps: 50,
        surplus_calculation: {
          benchmark_value_usd: '1',
          solution_value_usd: '1.1',
          surplus_usd: '0.1',
          surplus_percentage: '10',
        },
        strategy_summary: {
          protocols_used: ['dex1', 'dex2'],
          total_hops: 2,
          execution_path: 'dex1 -> dex2',
        },
        compliance_score: 100,
      };

      const result = await client.solutions.store(solution, 1, signer);
      expect(result.blob_id).toBeDefined();

      const fetched = await client.solutions.fetch(result.blob_id);
      expect(fetched.solution_id).toBe(solution.solution_id);
      expect(fetched.intent_id).toBe(solution.intent_id);
    },
    120_000,
  );

  it(
    'should store and retrieve a dataset version (metadata + weights + training samples + feedback)',
    async () => {
      if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
        return;
      }

      const version = `v1.0.${Date.now()}`;

      const metadata: ModelMetadata = {
        model_id: 'intent_classifier',
        model_version: version,
        architecture: {
          type: 'neural_network',
          hyperparameters: {
            hidden_sizes: [128, 64],
          },
        },
        training: {
          dataset_version: 'v1.0.0',
          training_samples: 1000,
          validation_samples: 200,
          test_samples: 200,
          trained_at: Date.now(),
          training_duration_ms: 1000,
        },
        metrics: {
          accuracy: 0.9,
          precision: 0.9,
          recall: 0.9,
          f1_score: 0.88,
          per_class_metrics: {},
        },
        feature_importance: [],
        artifacts: {
          model_weights_ref: 'weights_ref',
          scaler_ref: 'scaler_ref',
          encoder_ref: 'encoder_ref',
        },
        status: 'deployed',
      };

      const weights = Buffer.from('fake-model-weights');

      const samples: IntentClassificationTrainingData[] = [
        {
          sample_id: 'sample_1',
          intent_metadata: {
            intent_id: 'intent_1',
            intent_type: 'swap.exact_input',
            created_at: Date.now(),
          },
          raw_features: {
            solver_window_ms: 5_000,
            user_decision_timeout_ms: 60_000,
            time_to_deadline_ms: 65_000,
            time_in_force: 'good_til_cancel',
            max_slippage_bps: 100,
            max_gas_cost_usd: 1,
            max_hops: 3,
            has_whitelist: false,
            has_blacklist: false,
            has_limit_price: false,
            optimization_goal: 'balanced',
            surplus_weight: 60,
            gas_cost_weight: 20,
            execution_speed_weight: 10,
            reputation_weight: 10,
            auto_execute: false,
            require_simulation: true,
            input_count: 1,
            output_count: 1,
            input_asset_types: ['native'],
            output_asset_types: ['stable'],
            input_value_usd: 100,
            expected_output_value_usd: 100,
            benchmark_source: 'dex_aggregator',
            benchmark_confidence: 0.9,
            expected_gas_usd: 0.1,
            expected_slippage_bps: 50,
            has_nlp_input: true,
            nlp_confidence: 0.95,
            client_platform: 'node',
            tag_count: 1,
          },
          ground_truth: {
            primary_category: 'swap',
            sub_category: 'exact_input',
            detected_priority: 'balanced',
            complexity_level: 'simple',
            risk_level: 'low',
          },
          label_info: {
            labeling_method: 'synthetic',
            labeled_by: 'test-suite',
            labeled_at: Date.now(),
            label_confidence: 0.9,
          },
          execution_outcome: {
            executed: true,
            chosen_solution_rank: 1,
            chosen_solution_id: 'solution_1',
            actual_metrics: {
              actual_output_usd: 100,
              actual_gas_cost_usd: 0.1,
              actual_execution_time_ms: 1000,
              actual_slippage_bps: 50,
            },
            user_satisfaction: 5,
            executed_at: Date.now(),
          },
          dataset_version: version,
          created_at: Date.now(),
          full_intent_ref: 'blob_1',
        },
        {
          sample_id: 'sample_2',
          intent_metadata: {
            intent_id: 'intent_2',
            intent_type: 'swap.exact_input',
            created_at: Date.now(),
          },
          raw_features: {
            solver_window_ms: 5_000,
            user_decision_timeout_ms: 60_000,
            time_to_deadline_ms: 65_000,
            time_in_force: 'good_til_cancel',
            max_slippage_bps: 100,
            max_gas_cost_usd: 1,
            max_hops: 3,
            has_whitelist: false,
            has_blacklist: false,
            has_limit_price: false,
            optimization_goal: 'balanced',
            surplus_weight: 60,
            gas_cost_weight: 20,
            execution_speed_weight: 10,
            reputation_weight: 10,
            auto_execute: false,
            require_simulation: true,
            input_count: 1,
            output_count: 1,
            input_asset_types: ['native'],
            output_asset_types: ['stable'],
            input_value_usd: 100,
            expected_output_value_usd: 100,
            benchmark_source: 'dex_aggregator',
            benchmark_confidence: 0.9,
            expected_gas_usd: 0.1,
            expected_slippage_bps: 50,
            has_nlp_input: true,
            nlp_confidence: 0.95,
            client_platform: 'node',
            tag_count: 1,
          },
          ground_truth: {
            primary_category: 'limit_order',
            sub_category: 'sell',
            detected_priority: 'output',
            complexity_level: 'simple',
            risk_level: 'low',
          },
          label_info: {
            labeling_method: 'synthetic',
            labeled_by: 'test-suite',
            labeled_at: Date.now(),
            label_confidence: 0.9,
          },
          execution_outcome: {
            executed: true,
            chosen_solution_rank: 1,
            chosen_solution_id: 'solution_2',
            actual_metrics: {
              actual_output_usd: 80,
              actual_gas_cost_usd: 0.1,
              actual_execution_time_ms: 1000,
              actual_slippage_bps: 100,
            },
            user_satisfaction: 4,
            executed_at: Date.now(),
          },
          dataset_version: version,
          created_at: Date.now(),
          full_intent_ref: 'blob_2',
        },
      ];

      const feedback: ClassificationFeedback[] = [
        {
          feedback_id: 'fb_1',
          intent_id: 'intent_1',
          predicted_classification: {
            primary_category: 'swap',
            sub_category: 'exact_input',
            detected_priority: 'balanced',
            complexity_level: 'simple',
            risk_level: 'low',
            confidence: 0.9,
            model_version: version,
          },
          actual_outcome: {
            executed: true,
            chosen_solution_rank: 1,
            chosen_solution_id: 'solution_1',
            actual_metrics: {
              actual_output_usd: 100,
              actual_gas_cost_usd: 0.1,
              actual_execution_time_ms: 1000,
              actual_slippage_bps: 50,
            },
            user_satisfaction: 5,
            executed_at: Date.now(),
          },
          best_strategy: 'balanced',
          corrected_classification: {
            primary_category: 'swap',
            sub_category: 'exact_input',
            detected_priority: 'balanced',
            complexity_level: 'simple',
            risk_level: 'low',
          },
          feedback_source: 'execution_outcome',
          created_at: Date.now(),
        },
      ];

      const builder = client.datasets.createVersion(version)
        .withMetadata(metadata)
        .withWeights(weights)
        .withTrainingSamples(samples)
        .withFeedback(feedback);

      const result = await client.datasets.storeVersion(builder, 1, signer);

      expect(result.blob_id).toBeDefined();
      expect(result.quilt_id).toBeDefined();
      expect(result.files.length).toBeGreaterThanOrEqual(4);

      // Cho Walrus có thời gian propagate
      await new Promise((resolve) => setTimeout(resolve, 10_000));

      const retrievedMetadata = await client.datasets.fetchMetadata(
        result.quilt_id,
      );
      expect(retrievedMetadata.model_id).toBe(metadata.model_id);
      expect(retrievedMetadata.model_version).toBe(version);

      const retrievedWeights = await client.datasets.fetchWeights(
        result.quilt_id,
      );
      expect(retrievedWeights.toString()).toBe(weights.toString());

      const retrievedSamples = await client.datasets.fetchTrainingSamples(
        result.quilt_id,
      );
      expect(retrievedSamples.length).toBe(samples.length);

      const retrievedFeedback = await client.datasets.fetchFeedback(
        result.quilt_id,
      );
      expect(retrievedFeedback.length).toBe(feedback.length);

      const files = await client.datasets.listFiles(result.quilt_id);
      expect(files).toEqual(
        expect.arrayContaining([
          'metadata.json',
          'weights.pkl',
          'training_samples.jsonl',
          'feedback.jsonl',
        ]),
      );
    },
    150_000,
  );

  it('should handle client reset', () => {
    if (!process.env.INTENUS_ADMIN_PRIVATE_KEY) {
      return;
    }

    client.reset();
    expect(client.getConfig()).toBeDefined();
  });
});
