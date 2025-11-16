import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import type { RankedTx } from './types.js';

/**
 * OPTIONAL: Helper for executing ranked Txs
 * Clients can use Sui SDK directly if preferred
 */
export class TxExecutor {
  constructor(private suiClient: SuiClient) {}
  
  /**
   * Execute a ranked Tx
   */
  async execute(
    rankedTx: RankedTx,
    signer: any // Wallet signer
  ): Promise<string> {
    // Deserialize Tx
    const txBytes = Buffer.from(rankedTx.tx_bytes, 'base64');
    const txb = Transaction.from(txBytes);
    
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
   * Simulate Tx execution (dry run)
   */
  async simulate(rankedTx: RankedTx): Promise<any> {
    const txBytes = Buffer.from(rankedTx.tx_bytes, 'base64');
    const txb = Transaction.from(txBytes);
    
    return await this.suiClient.dryRunTransactionBlock({
      transactionBlock: await txb.build(),
    });
  }
  
  /**
   * Get gas estimation for Tx
   */
  async estimateGas(rankedTx: RankedTx): Promise<string> {
    const simulation = await this.simulate(rankedTx);
    return simulation.effects.gasUsed.computationCost.toString();
  }
}
