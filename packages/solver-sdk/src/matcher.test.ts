import { describe, it, expect } from 'vitest';
import { P2PMatcher } from './matcher.js';
import type { Intent } from '@intenus/common';

describe('P2PMatcher', () => {
  const matcher = new P2PMatcher();

  const createSwapIntent = (
    id: string,
    userAddress: string,
    inputAsset: string,
    inputAmount: string,
    outputAsset: string
  ): Intent => ({
    intent_id: id,
    user_address: userAddress,
    timestamp: Date.now(),
    category: 'swap',
    action: {
      type: 'swap_exact_in',
      params: {},
    },
    assets: {
      inputs: [{ asset_id: inputAsset, amount: inputAmount }],
      outputs: [{ asset_id: outputAsset }],
    },
    constraints: {},
    execution: {
      urgency: 'normal',
      privacy_level: 'public',
    },
    metadata: {
      language: 'en',
      confidence: 1.0,
    },
  });

  it('should find exact P2P match', () => {
    const intent1 = createSwapIntent(
      'intent-1',
      '0x111',
      '0x2::sui::SUI',
      '1000000',
      '0x...::usdc::USDC'
    );

    const intent2 = createSwapIntent(
      'intent-2', 
      '0x222',
      '0x...::usdc::USDC',
      '1000000',
      '0x2::sui::SUI'
    );

    const matches = matcher.findMatches([intent1, intent2]);

    expect(matches).toHaveLength(1);
    expect(matches[0].intent1.intent_id).toBe('intent-1');
    expect(matches[0].intent2.intent_id).toBe('intent-2');
    expect(matches[0].match_type).toBe('exact');
    expect(matches[0].surplus).toBe('0');
  });

  it('should find partial P2P match', () => {
    const intent1 = createSwapIntent(
      'intent-1',
      '0x111', 
      '0x2::sui::SUI',
      '1000000',
      '0x...::usdc::USDC'
    );

    const intent2 = createSwapIntent(
      'intent-2',
      '0x222',
      '0x...::usdc::USDC', 
      '2000000', // Different amount
      '0x2::sui::SUI'
    );

    const matches = matcher.findMatches([intent1, intent2]);

    expect(matches).toHaveLength(1);
    expect(matches[0].match_type).toBe('partial');
  });

  it('should not match incompatible intents', () => {
    const intent1 = createSwapIntent(
      'intent-1',
      '0x111',
      '0x2::sui::SUI', 
      '1000000',
      '0x...::usdc::USDC'
    );

    const intent2 = createSwapIntent(
      'intent-2',
      '0x222',
      '0x2::sui::SUI', // Same input asset
      '1000000',
      '0x...::weth::WETH' // Different output asset
    );

    const matches = matcher.findMatches([intent1, intent2]);

    expect(matches).toHaveLength(0);
  });

  it('should handle empty intent list', () => {
    const matches = matcher.findMatches([]);
    expect(matches).toHaveLength(0);
  });

  it('should filter non-swap intents', () => {
    const swapIntent = createSwapIntent(
      'intent-1',
      '0x111',
      '0x2::sui::SUI',
      '1000000', 
      '0x...::usdc::USDC'
    );

    const lendIntent: Intent = {
      ...swapIntent,
      intent_id: 'intent-2',
      category: 'lend', // Not a swap
    };

    const matches = matcher.findMatches([swapIntent, lendIntent]);
    expect(matches).toHaveLength(0);
  });
});
