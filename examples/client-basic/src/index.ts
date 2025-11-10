/**
 * Basic Client Example using @intenus/client-sdk helpers
 * 
 * This example shows how to use the OPTIONAL SDK helpers.
 * Clients can use underlying SDKs directly if they prefer.
 */

import { IntentBuilder, PTBExecutor } from '@intenus/client-sdk';
import { SuiClient } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
import { SealClient } from '@mysten/seal';
import type { Intent, RankedPTB } from '@intenus/common';

interface ClientConfig {
  userAddress: string;
  wallet: any;
  suiUrl: string;
  walrusUrl: string;
  backendUrl: string;
  sealKeyServers: any[];
  sealPackageId: string;
}

class IntenusClient {
  private sui: SuiClient;
  private walrus: WalrusClient;
  private seal: SealClient;
  private executor: PTBExecutor;
  
  constructor(private config: ClientConfig) {
    // Direct SDK usage (no wrappers)
    this.sui = new SuiClient({ url: config.suiUrl });
    this.walrus = new WalrusClient({ url: config.walrusUrl });
    this.seal = new SealClient({
      serverConfigs: config.sealKeyServers,
      suiClient: this.sui,
    });
    
    // Use SDK helper for PTB execution (OPTIONAL)
    this.executor = new PTBExecutor(this.sui);
  }
  
  /**
   * Submit an intent using fluent builder (OPTIONAL)
   */
  async submitSwapIntent(
    tokenIn: string,
    amountIn: string,
    tokenOut: string,
    isPrivate: boolean = false
  ): Promise<string> {
    // Use SDK helper (optional)
    const intent = new IntentBuilder(this.config.userAddress)
      .swap(tokenIn, amountIn, tokenOut, 50)
      .private(isPrivate)
      .urgency('normal')
      .deadline(Date.now() + 300_000) // 5 minutes
      .build();
    
    console.log(`📝 Created intent: ${intent.intent_id}`);
    
    // Encrypt if private
    if (isPrivate) {
      return await this.submitPrivateIntent(intent);
    } else {
      return await this.submitPublicIntent(intent);
    }
  }
  
  /**
   * Submit intent manually (without SDK builder)
   */
  async submitManualIntent(
    tokenIn: string,
    amountIn: string,
    tokenOut: string
  ): Promise<string> {
    // Manual intent construction (no SDK helper)
    const intent: Intent = {
      intent_id: crypto.randomUUID(),
      user_address: this.config.userAddress,
      timestamp: Date.now(),
      category: 'swap',
      action: {
        type: 'swap_exact_in',
        params: { slippageBps: 50 },
      },
      assets: {
        inputs: [{ asset_id: tokenIn, amount: amountIn }],
        outputs: [{ asset_id: tokenOut }],
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
    
    return await this.submitPublicIntent(intent);
  }
  
  private async submitPublicIntent(intent: Intent): Promise<string> {
    // Store on Walrus (direct SDK usage)
    const { blobId } = await this.walrus.upload({
      content: JSON.stringify(intent),
      contentType: 'application/json',
      metadata: {
        user: intent.user_address,
        category: intent.category,
      },
    });
    
    // Notify backend (via API)
    const response = await fetch(`${this.config.backendUrl}/intents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent_id: intent.intent_id,
        walrus_blob_id: blobId,
        intent_hash: await this.hashIntent(intent),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit intent: ${response.statusText}`);
    }
    
    console.log(`✅ Public intent submitted: ${intent.intent_id}`);
    return intent.intent_id;
  }
  
  private async submitPrivateIntent(intent: Intent): Promise<string> {
    // Encrypt with Seal (direct SDK usage)
    const { encryptedObject, key } = await this.seal.encrypt({
      threshold: 2,
      packageId: this.config.sealPackageId,
      id: intent.intent_id,
      data: JSON.stringify(intent),
    });
    
    // Store encrypted data on Walrus
    const { blobId } = await this.walrus.upload({
      content: encryptedObject,
      contentType: 'application/octet-stream',
      metadata: {
        encrypted: true,
        user: intent.user_address,
      },
    });
    
    // Notify backend
    const response = await fetch(`${this.config.backendUrl}/intents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent_id: intent.intent_id,
        walrus_blob_id: blobId,
        is_encrypted: true,
        seal_policy_id: intent.intent_id,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit private intent: ${response.statusText}`);
    }
    
    console.log(`🔒 Private intent submitted: ${intent.intent_id}`);
    return intent.intent_id;
  }
  
  /**
   * Poll for solutions
   */
  async waitForSolutions(intentId: string): Promise<RankedPTB[]> {
    console.log(`⏳ Waiting for solutions for intent: ${intentId}`);
    
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    while (attempts < maxAttempts) {
      const response = await fetch(
        `${this.config.backendUrl}/intents/${intentId}/solutions`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.ranked_ptbs && data.ranked_ptbs.length > 0) {
          console.log(`🎯 Received ${data.ranked_ptbs.length} solutions`);
          return data.ranked_ptbs;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Timeout waiting for solutions');
  }
  
  /**
   * Execute selected solution using SDK helper
   */
  async executeSolution(rankedPTB: RankedPTB): Promise<string> {
    console.log(`🚀 Executing solution from solver: ${rankedPTB.solver_address}`);
    console.log(`💰 Expected surplus: $${rankedPTB.total_surplus_usd}`);
    console.log(`⛽ Estimated gas: ${rankedPTB.estimated_gas}`);
    
    // Use SDK helper (optional)
    const txDigest = await this.executor.execute(
      rankedPTB,
      this.config.wallet
    );
    
    console.log(`✅ Transaction executed: ${txDigest}`);
    return txDigest;
  }
  
  /**
   * Execute solution manually (without SDK helper)
   */
  async executeManualSolution(rankedPTB: RankedPTB): Promise<string> {
    // Manual execution using Sui SDK directly
    const ptbBytes = Buffer.from(rankedPTB.ptb_bytes, 'base64');
    const txb = TransactionBlock.from(ptbBytes);
    
    // Sign transaction
    const { signature } = await this.config.wallet.signTransactionBlock({
      transactionBlock: txb,
    });
    
    // Execute on Sui
    const result = await this.sui.executeTransactionBlock({
      transactionBlock: txb,
      signature,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    if (result.effects?.status?.status !== 'success') {
      throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
    }
    
    console.log(`✅ Manual execution completed: ${result.digest}`);
    return result.digest;
  }
  
  private async hashIntent(intent: Intent): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(intent));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Buffer.from(hashBuffer).toString('hex');
  }
}

// Usage examples
async function main() {
  const client = new IntenusClient({
    userAddress: process.env.USER_ADDRESS || '0x...',
    wallet: getWallet(), // Mock wallet
    suiUrl: process.env.SUI_URL || 'https://fullnode.testnet.sui.io:443',
    walrusUrl: process.env.WALRUS_URL || 'https://walrus.testnet.walrus.site',
    backendUrl: process.env.BACKEND_URL || 'https://api.intenus.io',
    sealKeyServers: [],
    sealPackageId: process.env.SEAL_PACKAGE_ID || '0x...',
  });
  
  try {
    // Example 1: Using SDK helpers
    console.log('\n🔧 Example 1: Using SDK helpers');
    const intentId1 = await client.submitSwapIntent(
      '0x2::sui::SUI',
      '1000000000', // 1 SUI
      '0x...::usdc::USDC',
      false // public
    );
    
    // Example 2: Manual intent construction
    console.log('\n🔧 Example 2: Manual intent construction');
    const intentId2 = await client.submitManualIntent(
      '0x2::sui::SUI',
      '2000000000', // 2 SUI
      '0x...::usdc::USDC'
    );
    
    // Wait for solutions
    console.log('\n⏳ Waiting for solutions...');
    const solutions = await client.waitForSolutions(intentId1);
    
    // Display solutions
    console.log(`\n📊 Received ${solutions.length} solutions:`);
    solutions.forEach((s, i) => {
      console.log(`  ${i + 1}. Solver: ${s.solver_address.slice(0, 8)}...`);
      console.log(`     Surplus: $${s.total_surplus_usd}`);
      console.log(`     Gas: ${s.estimated_gas}`);
      console.log(`     Reason: ${s.why_ranked.primary_reason}`);
    });
    
    // Execute best solution using SDK helper
    console.log('\n🚀 Executing best solution with SDK helper...');
    const best = solutions[0];
    const txDigest1 = await client.executeSolution(best);
    
    // Execute manually (alternative)
    if (solutions.length > 1) {
      console.log('\n🚀 Executing second solution manually...');
      const second = solutions[1];
      const txDigest2 = await client.executeManualSolution(second);
    }
    
    console.log('\n✅ All done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function getWallet(): any {
  // Mock wallet implementation
  return {
    signTransactionBlock: async ({ transactionBlock }: any) => {
      return { signature: 'mock-signature' };
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
