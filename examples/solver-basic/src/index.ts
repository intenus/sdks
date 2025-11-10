/**
 * Basic Solver Example using @intenus/solver-sdk helpers
 * 
 * This example shows how to use the OPTIONAL SDK helpers.
 * Solvers can implement everything from scratch if they prefer.
 */

import { SolverListener, SolutionBuilder, P2PMatcher } from '@intenus/solver-sdk';
import { SuiClient } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
import type { Batch, Intent, SolutionOutcome, BatchManifest } from '@intenus/common';

interface SolverConfig {
  redisUrl: string;
  walrusUrl: string;
  suiUrl: string;
  solverAddress: string;
}

class BasicSolver {
  private listener: SolverListener;
  private walrus: WalrusClient;
  private sui: SuiClient;
  private matcher: P2PMatcher;
  
  constructor(private config: SolverConfig) {
    // Use SDK helper for Redis (OPTIONAL)
    this.listener = new SolverListener(config.redisUrl);
    
    // Use Walrus SDK directly (NOT wrapped)
    this.walrus = new WalrusClient({ url: config.walrusUrl });
    
    // Use Sui SDK directly (NOT wrapped)
    this.sui = new SuiClient({ url: config.suiUrl });
    
    // Use SDK helper for P2P matching (OPTIONAL)
    this.matcher = new P2PMatcher();
  }
  
  async start(): Promise<void> {
    console.log('🚀 Starting Basic Solver...');
    
    // Subscribe to batches using SDK helper
    this.listener.onNewBatch(async (batch) => {
      console.log(`📦 New batch: ${batch.batch_id}`);
      await this.solveBatch(batch);
    });
    
    // Send heartbeat every 30s using SDK helper
    setInterval(() => {
      this.listener.sendHeartbeat(this.config.solverAddress);
    }, 30_000);
    
    console.log('✅ Basic Solver started');
  }
  
  private async solveBatch(batch: Batch): Promise<void> {
    try {
      // 1. Fetch intents from Walrus (direct SDK usage)
      const intents = await this.fetchIntents(batch);
      
      // 2. Find P2P matches using SDK helper
      const matches = this.matcher.findMatches(intents);
      console.log(`🔄 Found ${matches.length} P2P matches`);
      
      // 3. Build solution using SDK helper
      const builder = new SolutionBuilder(batch.batch_id, this.config.solverAddress);
      
      // Add P2P matches to solution
      for (const match of matches) {
        const outcome = this.createP2POutcome(match.intent1, match.intent2);
        builder.addOutcome(outcome);
      }
      
      // Handle remaining intents with DEX routing
      const unmatched = intents.filter(intent => 
        !matches.some(m => m.intent1.intent_id === intent.intent_id || m.intent2.intent_id === intent.intent_id)
      );
      
      for (const intent of unmatched) {
        const outcome = await this.solveDEXIntent(intent);
        builder.addOutcome(outcome);
      }
      
      // 4. Build PTB using SDK helper
      const { submission, ptbBytes } = await builder.build();
      
      // 5. Upload to Walrus (direct SDK usage)
      const { blobId } = await this.walrus.upload({
        content: ptbBytes,
        contentType: 'application/octet-stream',
        metadata: {
          solver: this.config.solverAddress,
          batch_id: batch.batch_id,
        },
      });
      
      // 6. Submit solution using SDK helper
      await this.listener.submitSolution({
        ...submission,
        walrus_blob_id: blobId,
      });
      
      console.log(`✅ Solution submitted: ${submission.solution_id}`);
      
    } catch (error) {
      console.error(`❌ Error solving batch ${batch.batch_id}:`, error);
    }
  }
  
  private async fetchIntents(batch: Batch): Promise<Intent[]> {
    // Direct Walrus SDK usage - no wrapper
    const manifestData = await this.walrus.download({
      path: `/batches/${batch.epoch}/manifest.json`,
    });
    
    const manifest: BatchManifest = JSON.parse(manifestData.toString());
    const intents: Intent[] = [];
    
    for (const ref of manifest.intents) {
      const intentData = await this.walrus.download({
        path: `/intents/${batch.epoch}/${ref.intent_id}.json`,
      });
      
      intents.push(JSON.parse(intentData.toString()));
    }
    
    return intents;
  }
  
  private createP2POutcome(intent1: Intent, intent2: Intent): SolutionOutcome {
    return {
      intent_id: intent1.intent_id,
      expected_output: intent1.assets.outputs,
      surplus_claimed: '0', // P2P = zero slippage
      execution_path: 'P2P',
    };
  }
  
  private async solveDEXIntent(intent: Intent): Promise<SolutionOutcome> {
    // Simple DEX routing logic
    // In real implementation, use DEX aggregator APIs
    
    return {
      intent_id: intent.intent_id,
      expected_output: intent.assets.outputs.map(output => ({
        asset_id: output.asset_id,
        amount: output.amount || '1000000', // Mock amount
      })),
      surplus_claimed: '100', // Mock surplus
      execution_path: 'DEX:FlowX',
    };
  }
  
  async stop(): Promise<void> {
    await this.listener.close();
    console.log('🛑 Basic Solver stopped');
  }
}

// Usage
async function main() {
  const solver = new BasicSolver({
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    walrusUrl: process.env.WALRUS_URL || 'https://walrus.testnet.walrus.site',
    suiUrl: process.env.SUI_URL || 'https://fullnode.testnet.sui.io:443',
    solverAddress: process.env.SOLVER_ADDRESS || '0x...',
  });
  
  await solver.start();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await solver.stop();
    process.exit(0);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
