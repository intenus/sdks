import { describe, it, expect } from 'vitest';
import { IntentBuilder } from './intent-builder.js';

describe('IntentBuilder', () => {
  const userAddress = '0x1234567890abcdef';

  it('should build basic swap intent', () => {
    const intent = new IntentBuilder(userAddress)
      .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC', 50)
      .build();

    expect(intent.user_address).toBe(userAddress);
    expect(intent.category).toBe('swap');
    expect(intent.action.type).toBe('swap_exact_in');
    expect(intent.action.params.slippageBps).toBe(50);
    expect(intent.assets.inputs).toHaveLength(1);
    expect(intent.assets.inputs[0].asset_id).toBe('0x2::sui::SUI');
    expect(intent.assets.inputs[0].amount).toBe('1000000');
    expect(intent.assets.outputs).toHaveLength(1);
    expect(intent.assets.outputs[0].asset_id).toBe('0x...::usdc::USDC');
    expect(intent.constraints?.max_slippage_bps).toBe(50);
  });

  it('should set privacy level', () => {
    const intent = new IntentBuilder(userAddress)
      .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
      .private(true)
      .build();

    expect(intent.execution.privacy_level).toBe('private');
  });

  it('should set urgency level', () => {
    const intent = new IntentBuilder(userAddress)
      .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
      .urgency('high')
      .build();

    expect(intent.execution.urgency).toBe('high');
  });

  it('should set deadline', () => {
    const deadline = Date.now() + 300_000;
    const intent = new IntentBuilder(userAddress)
      .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
      .deadline(deadline)
      .build();

    expect(intent.constraints?.deadline_ms).toBe(deadline);
  });

  it('should set minimum output', () => {
    const intent = new IntentBuilder(userAddress)
      .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
      .minOutput('0x...::usdc::USDC', '900000')
      .build();

    expect(intent.constraints?.min_output?.['0x...::usdc::USDC']).toBe('900000');
  });

  it('should chain multiple configurations', () => {
    const deadline = Date.now() + 600_000;
    const intent = new IntentBuilder(userAddress)
      .swap('0x2::sui::SUI', '2000000', '0x...::usdc::USDC', 100)
      .private(true)
      .urgency('high')
      .deadline(deadline)
      .minOutput('0x...::usdc::USDC', '1800000')
      .build();

    expect(intent.execution.privacy_level).toBe('private');
    expect(intent.execution.urgency).toBe('high');
    expect(intent.constraints?.deadline_ms).toBe(deadline);
    expect(intent.constraints?.max_slippage_bps).toBe(100);
    expect(intent.constraints?.min_output?.['0x...::usdc::USDC']).toBe('1800000');
  });

  it('should throw error when building without required fields', () => {
    expect(() => {
      new IntentBuilder(userAddress).build();
    }).toThrow('Category is required');
  });

  it('should generate unique intent IDs', () => {
    const intent1 = new IntentBuilder(userAddress)
      .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
      .build();

    const intent2 = new IntentBuilder(userAddress)
      .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
      .build();

    expect(intent1.intent_id).not.toBe(intent2.intent_id);
  });

  it('should set default values correctly', () => {
    const intent = new IntentBuilder(userAddress)
      .swap('0x2::sui::SUI', '1000000', '0x...::usdc::USDC')
      .build();

    expect(intent.execution.urgency).toBe('normal');
    expect(intent.execution.privacy_level).toBe('public');
    expect(intent.metadata.language).toBe('en');
    expect(intent.metadata.confidence).toBe(1.0);
    expect(intent.timestamp).toBeGreaterThan(0);
  });
});
