import type { Intent } from '@intenus/common';

/**
 * OPTIONAL: Reference P2P matcher implementation
 * Solvers can implement their own or use this
 */
export interface P2PMatch {
  intent1: Intent;
  intent2: Intent;
  matched_asset: string;
  amount1: string;
  amount2: string;
  match_type: 'exact' | 'partial';
  surplus: string;
}

export class P2PMatcher {
  /**
   * Find P2P matches in a batch of intents
   * This is a REFERENCE implementation - solvers should optimize
   */
  findMatches(intents: Intent[]): P2PMatch[] {
    const matches: P2PMatch[] = [];
    const swapIntents = intents.filter(i => i.category === 'swap');
    
    // Simple O(n²) matching - solvers should use better algorithms
    for (let i = 0; i < swapIntents.length; i++) {
      for (let j = i + 1; j < swapIntents.length; j++) {
        const match = this.tryMatch(swapIntents[i], swapIntents[j]);
        if (match) matches.push(match);
      }
    }
    
    return matches;
  }
  
  private tryMatch(intent1: Intent, intent2: Intent): P2PMatch | null {
    const input1 = intent1.assets.inputs[0];
    const output1 = intent1.assets.outputs[0];
    const input2 = intent2.assets.inputs[0];
    const output2 = intent2.assets.outputs[0];
    
    // Check if intent1's output = intent2's input and vice versa
    if (output1.asset_id === input2.asset_id && output2.asset_id === input1.asset_id) {
      // Found a match!
      const amount1 = input1.amount || '0';
      const amount2 = input2.amount || '0';
      
      return {
        intent1,
        intent2,
        matched_asset: output1.asset_id,
        amount1,
        amount2,
        match_type: amount1 === amount2 ? 'exact' : 'partial',
        surplus: '0', // P2P = 0 slippage
      };
    }
    
    return null;
  }
}
