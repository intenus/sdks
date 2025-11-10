import { describe, it, expect } from 'vitest';
import type { Intent, AssetSpec, Constraints } from './intent.js';

describe('Intent Types', () => {
  it('should create valid Intent object', () => {
    const intent: Intent = {
      intent_id: 'test-intent-123',
      user_address: '0x1234567890abcdef',
      timestamp: Date.now(),
      category: 'swap',
      action: {
        type: 'swap_exact_in',
        params: { slippageBps: 50 },
      },
      assets: {
        inputs: [{
          asset_id: '0x2::sui::SUI',
          amount: '1000000000',
        }],
        outputs: [{
          asset_id: '0x...::usdc::USDC',
        }],
      },
      constraints: {
        max_slippage_bps: 50,
        deadline_ms: Date.now() + 300_000,
      },
      execution: {
        urgency: 'normal',
        privacy_level: 'public',
      },
      metadata: {
        language: 'en',
        confidence: 1.0,
      },
    };

    expect(intent.intent_id).toBe('test-intent-123');
    expect(intent.category).toBe('swap');
    expect(intent.execution.urgency).toBe('normal');
    expect(intent.assets.inputs).toHaveLength(1);
    expect(intent.assets.outputs).toHaveLength(1);
  });

  it('should create valid AssetSpec with amount range', () => {
    const assetSpec: AssetSpec = {
      asset_id: '0x2::sui::SUI',
      chain_id: 'sui',
      amount_range: {
        min: '1000000',
        max: '10000000',
      },
    };

    expect(assetSpec.asset_id).toBe('0x2::sui::SUI');
    expect(assetSpec.amount_range?.min).toBe('1000000');
    expect(assetSpec.amount_range?.max).toBe('10000000');
  });

  it('should create valid Constraints object', () => {
    const constraints: Constraints = {
      max_slippage_bps: 100,
      max_price_impact_bps: 500,
      deadline_ms: Date.now() + 600_000,
      min_output: {
        '0x...::usdc::USDC': '900000',
      },
      custom_constraints: {
        max_hops: 3,
        preferred_dex: 'FlowX',
      },
    };

    expect(constraints.max_slippage_bps).toBe(100);
    expect(constraints.min_output?.['0x...::usdc::USDC']).toBe('900000');
    expect(constraints.custom_constraints?.max_hops).toBe(3);
  });
});
