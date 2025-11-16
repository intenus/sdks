import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import type { RankedPTB } from './types.js';

/**
 * OPTIONAL: Helper for executing ranked PTBs
 * Clients can use Sui SDK directly if preferred
 */
export class PTBExecutor {
  constructor(private suiClient: SuiClient) {}
  
  /**
   * Execute a ranked PTB
   */
  async execute(
    rankedPTB: RankedPTB,
    signer: any // Wallet signer
  ): Promise<string> {
    // Deserialize PTB
    const ptbBytes = Buffer.from(rankedPTB.ptb_bytes, 'base64');
    const txb = Transaction.from(ptbBytes);
    
    // Sign transaction
    const { signature } = await signer.signTransactionBlock({
      transactionBlock: txb,
    });
    
    // Execute on Sui
    const result = await this.suiClient.executeTransactionBlock({
      transactionBlock: await txb.build(),
      signature,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    if (result.effects?.status?.status !== 'success') {
      throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
    }
    
    return result.digest;
  }
  
  /**
   * Simulate PTB execution (dry run)
   */
  async simulate(rankedPTB: RankedPTB): Promise<any> {
    const ptbBytes = Buffer.from(rankedPTB.ptb_bytes, 'base64');
    const txb = Transaction.from(ptbBytes);
    
    return await this.suiClient.dryRunTransactionBlock({
      transactionBlock: await txb.build(),
    });
  }
  
  /**
   * Get gas estimation for PTB
   */
  async estimateGas(rankedPTB: RankedPTB): Promise<string> {
    const simulation = await this.simulate(rankedPTB);
    return simulation.effects.gasUsed.computationCost.toString();
  }
}
