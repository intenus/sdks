/**
 * Advanced Solver Example WITHOUT using @intenus/solver-sdk
 * 
 * This example shows direct usage of underlying SDKs.
 * Demonstrates maximum flexibility and solver freedom.
 */

import Redis from 'ioredis';
import { WalrusClient } from '@mysten/walrus';
import { SuiClient } from '@mysten/sui/client';
import { TransactionBlock } from '@mysten/sui/transactions';
import { SealClient, SessionKey } from '@mysten/seal';
import type { Batch, Intent, SolutionSubmission, BatchManifest } from '@intenus/common';

interface AdvancedSolverConfig {
  redisUrl: string;
  walrusUrl: string;
  suiUrl: string;
  solverAddress: string;
  keypair: any;
  sealKeyServers: any[];
  sealPackageId: string;
}

/**
 * Advanced solver that uses underlying SDKs directly
 * Does NOT use @intenus/solver-sdk helpers
 * Demonstrates solver freedom
 */
class AdvancedSolver {
  private redis: Redis;
  private walrus: WalrusClient;
  private sui: SuiClient;
  private seal: SealClient;
  
  constructor(private config: AdvancedSolverConfig) {
    // Direct Redis connection (no SDK wrapper)
    this.redis = new Redis(config.redisUrl);
    
    // Direct Walrus client (no SDK wrapper)
    this.walrus = new WalrusClient({
      url: config.walrusUrl,
      auth: {
        type: 'sui',
        keypair: config.keypair,
      },
    });
    
    // Direct Sui client (no SDK wrapper)
    this.sui = new SuiClient({ url: config.suiUrl });
    
    // Direct Seal client (no SDK wrapper)
    this.seal = new SealClient({
      serverConfigs: config.sealKeyServers,
      suiClient: this.sui,
    });
  }
  
  async start(): Promise<void> {
    console.log('🚀 Starting Advanced Solver (no SDK helpers)...');
    
    // Custom Redis subscription (no SDK helper)
    await this.redis.subscribe('solver:batch:new');
    
    this.redis.on('message', async (channel, message) => {
      if (channel === 'solver:batch:new') {
        const batchInfo = JSON.parse(message);
        await this.handleBatch(batchInfo);
      }
    });
    
    console.log('✅ Advanced Solver started');
  }
  
  private async handleBatch(batchInfo: any): Promise<void> {
    try {
      console.log(`📦 Processing batch: ${batchInfo.batch_id}`);
      
      // 1. Custom batch fetching logic
      const manifest = await this.fetchBatchManifest(batchInfo);
      
      // 2. Custom intent decryption with Seal
      const intents = await this.fetchAndDecryptIntents(manifest);
      
      // 3. Custom solving strategy
      const solution = await this.customSolvingAlgorithm(intents);
      
      // 4. Custom PTB building
      const ptb = await this.buildCustomPTB(solution);
      
      // 5. Simulate for gas estimation
      const simulation = await this.sui.dryRunTransactionBlock({
        transactionBlock: await ptb.build(),
      });
      
      // 6. Custom solution submission
      await this.submitCustomSolution(batchInfo.batch_id, ptb, simulation);
      
    } catch (error) {
      console.error(`❌ Error processing batch:`, error);
    }
  }
  
  private async fetchBatchManifest(batchInfo: any): Promise<BatchManifest> {
    const manifestData = await this.walrus.download({
      path: batchInfo.walrus_manifest,
    });
    
    return JSON.parse(manifestData.toString());
  }
  
  private async fetchAndDecryptIntents(manifest: BatchManifest): Promise<Intent[]> {
    const intents: Intent[] = [];
    
    for (const ref of manifest.intents) {
      const encryptedData = await this.walrus.download({
        path: `/intents/${manifest.epoch}/${ref.intent_id}.json`,
      });
      
      if (ref.is_encrypted && ref.seal_policy_id) {
        // Decrypt using Seal SDK directly
        const sessionKey = await SessionKey.create({
          address: this.config.solverAddress,
          packageId: this.config.sealPackageId,
          ttlMin: 30,
        });
        
        const message = sessionKey.getPersonalMessage();
        const signature = await this.config.keypair.signPersonalMessage(message);
        sessionKey.setPersonalMessageSignature(signature);
        
        const decrypted = await this.seal.decrypt({
          data: encryptedData.toString(),
          sessionKey,
          txBytes: new Uint8Array(), // Context-specific
        });
        
        intents.push(JSON.parse(decrypted));
      } else {
        intents.push(JSON.parse(encryptedData.toString()));
      }
    }
    
    return intents;
  }
  
  private async customSolvingAlgorithm(intents: Intent[]): Promise<CustomSolution> {
    // Solver's proprietary algorithm
    // Could be ML-based, order book, etc.
    
    // Example: Advanced P2P matching with optimization
    const matches = this.advancedP2PMatching(intents);
    
    // Example: Multi-hop routing optimization
    const routes = await this.optimizeRoutes(intents);
    
    return {
      matches,
      routes,
      outcomes: this.calculateOutcomes(matches, routes),
    };
  }
  
  private async buildCustomPTB(solution: CustomSolution): Promise<TransactionBlock> {
    // Direct PTB construction using Sui SDK
    const ptb = new TransactionBlock();
    
    // Custom gas optimization
    ptb.setGasBudget(this.calculateOptimalGas(solution));
    
    // Add transactions based on solution
    for (const match of solution.matches) {
      // Direct P2P transfer
      const [coin1] = ptb.splitCoins(ptb.gas, [ptb.pure(match.amount1)]);
      ptb.transferObjects([coin1], ptb.pure(match.user2));
      
      const [coin2] = ptb.splitCoins(ptb.gas, [ptb.pure(match.amount2)]);
      ptb.transferObjects([coin2], ptb.pure(match.user1));
    }
    
    for (const route of solution.routes) {
      // Custom protocol interactions
      await this.addProtocolCall(ptb, route);
    }
    
    return ptb;
  }
  
  private async submitCustomSolution(
    batchId: string,
    ptb: TransactionBlock,
    simulation: any
  ): Promise<void> {
    const ptbBytes = await ptb.build();
    const ptbHash = await this.hashBytes(ptbBytes);
    
    // Upload to Walrus
    const { blobId } = await this.walrus.upload({
      content: ptbBytes,
      contentType: 'application/octet-stream',
      metadata: {
        solver: this.config.solverAddress,
        batch_id: batchId,
      },
    });
    
    // Custom submission format
    const submission: SolutionSubmission = {
      solution_id: crypto.randomUUID(),
      batch_id: batchId,
      solver_address: this.config.solverAddress,
      ptb_hash: ptbHash,
      walrus_blob_id: blobId,
      outcomes: this.buildOutcomes(),
      total_surplus_usd: this.calculateTotalSurplus(),
      estimated_gas: simulation.effects.gasUsed.computationCost.toString(),
      estimated_slippage_bps: this.estimateSlippage(),
      submitted_at: Date.now(),
      // Custom fields (optional)
      strategy_summary: {
        p2p_matches: this.countP2PMatches(),
        protocol_routes: this.getProtocolsList(),
        unique_techniques: 'ML-optimized routing',
      },
    };
    
    // Direct Redis publish (no SDK helper)
    await this.redis.publish(
      `solver:solution:${batchId}`,
      JSON.stringify(submission)
    );
    
    console.log(`✅ Solution submitted: ${submission.solution_id}`);
  }
  
  // Custom helper methods...
  private advancedP2PMatching(intents: Intent[]): P2PMatch[] {
    // Proprietary matching algorithm
    console.log(`🔄 Running advanced P2P matching on ${intents.length} intents`);
    return [];
  }
  
  private async optimizeRoutes(intents: Intent[]): Promise<Route[]> {
    // Proprietary routing optimization
    console.log(`🛣️ Optimizing routes for ${intents.length} intents`);
    return [];
  }
  
  private calculateOutcomes(matches: P2PMatch[], routes: Route[]): any[] {
    return [];
  }
  
  private calculateOptimalGas(solution: CustomSolution): number {
    return 1000000; // Mock gas budget
  }
  
  private async addProtocolCall(ptb: TransactionBlock, route: Route): Promise<void> {
    // Custom protocol integration
  }
  
  private buildOutcomes(): any[] {
    return [];
  }
  
  private calculateTotalSurplus(): string {
    return '0';
  }
  
  private estimateSlippage(): number {
    return 50; // 0.5%
  }
  
  private countP2PMatches(): number {
    return 0;
  }
  
  private getProtocolsList(): string[] {
    return ['FlowX', 'Cetus'];
  }
  
  private async hashBytes(bytes: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return Buffer.from(hashBuffer).toString('hex');
  }
  
  async stop(): Promise<void> {
    await this.redis.quit();
    console.log('🛑 Advanced Solver stopped');
  }
}

// Type definitions for custom solver
interface CustomSolution {
  matches: P2PMatch[];
  routes: Route[];
  outcomes: any[];
}

interface P2PMatch {
  user1: string;
  user2: string;
  amount1: string;
  amount2: string;
}

interface Route {
  protocol: string;
  path: string[];
  amount: string;
}

// Usage
async function main() {
  const solver = new AdvancedSolver({
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    walrusUrl: process.env.WALRUS_URL || 'https://walrus.testnet.walrus.site',
    suiUrl: process.env.SUI_URL || 'https://fullnode.testnet.sui.io:443',
    solverAddress: process.env.SOLVER_ADDRESS || '0x...',
    keypair: null, // Load from env
    sealKeyServers: [],
    sealPackageId: process.env.SEAL_PACKAGE_ID || '0x...',
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
