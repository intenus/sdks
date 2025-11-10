import type { Intent } from '@intenus/common';

/**
 * OPTIONAL: Fluent API for building intents
 * Clients can construct Intent objects manually if preferred
 */
export class IntentBuilder {
  private intent: Partial<Intent>;
  
  constructor(userAddress: string) {
    this.intent = {
      intent_id: crypto.randomUUID(),
      user_address: userAddress,
      timestamp: Date.now(),
      metadata: {
        language: 'en',
        confidence: 1.0,
      },
      execution: {
        urgency: 'normal',
        privacy_level: 'public',
      },
    };
  }
  
  /**
   * Build a swap intent
   */
  swap(
    tokenIn: string,
    amountIn: string,
    tokenOut: string,
    slippageBps: number = 50
  ): this {
    this.intent.category = 'swap';
    this.intent.action = {
      type: 'swap_exact_in',
      params: { slippageBps },
    };
    this.intent.assets = {
      inputs: [{ asset_id: tokenIn, amount: amountIn }],
      outputs: [{ asset_id: tokenOut }],
    };
    this.intent.constraints = {
      max_slippage_bps: slippageBps,
    };
    return this;
  }
  
  /**
   * Set privacy level
   */
  private(isPrivate: boolean = true): this {
    if (!this.intent.execution) {
      this.intent.execution = {
        urgency: 'normal',
        privacy_level: 'public',
      };
    }
    this.intent.execution.privacy_level = isPrivate ? 'private' : 'public';
    return this;
  }
  
  /**
   * Set urgency
   */
  urgency(level: 'low' | 'normal' | 'high'): this {
    if (!this.intent.execution) {
      this.intent.execution = {
        urgency: 'normal',
        privacy_level: 'public',
      };
    }
    this.intent.execution.urgency = level;
    return this;
  }
  
  /**
   * Set deadline
   */
  deadline(deadlineMs: number): this {
    if (!this.intent.constraints) this.intent.constraints = {};
    this.intent.constraints.deadline_ms = deadlineMs;
    return this;
  }
  
  /**
   * Set minimum output
   */
  minOutput(assetId: string, amount: string): this {
    if (!this.intent.constraints) this.intent.constraints = {};
    if (!this.intent.constraints.min_output) this.intent.constraints.min_output = {};
    this.intent.constraints.min_output[assetId] = amount;
    return this;
  }
  
  /**
   * Build final intent
   */
  build(): Intent {
    // Validate required fields
    if (!this.intent.category) throw new Error('Category is required');
    if (!this.intent.action) throw new Error('Action is required');
    if (!this.intent.assets) throw new Error('Assets are required');
    
    return this.intent as Intent;
  }
}
