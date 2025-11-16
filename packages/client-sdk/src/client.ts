/**
 * Main Intenus Protocol Client
 * Provides unified access to all protocol services
 */

import { SuiClient } from '@mysten/sui/client';
import { NETWORKS } from '@intenus/common';
import { INTENUS_PACKAGE_ID } from './constants.js';
import {
  SolverRegistryService,
  SealPolicyService,
  // BatchManagerService, // Removed - batch concept deprecated
  SlashManagerService
} from './services/index.js';
import type { IntenusClientConfig, IntenusClientError } from './types.js';
export class IntenusProtocolClient {
  public readonly suiClient: SuiClient;
  private config: IntenusClientConfig;

  // Service instances
  public readonly solvers: SolverRegistryService;
  public readonly policies: SealPolicyService;
  // public readonly batches: BatchManagerService; // Removed - batch concept deprecated
  public readonly slashing: SlashManagerService;

  constructor(config: IntenusClientConfig) {
    // Validate network
    const networkConfig = NETWORKS[config.network.toUpperCase() as keyof typeof NETWORKS];
    if (!networkConfig) {
      throw new Error(`Unknown network: ${config.network}`);
    }

    // Initialize Sui client
    this.suiClient = config.suiClient || new SuiClient({
      url: networkConfig.sui_rpc_url,
      network: config.network
    });

    // Store configuration
    this.config = {
      network: config.network,
      suiClient: this.suiClient,
      packageId: config.packageId || INTENUS_PACKAGE_ID[config.network]
    };

    // Validate package ID
    if (!this.config.packageId) {
      throw new Error(`Package ID not configured for network: ${config.network}`);
    }

    // Initialize services
    this.solvers = new SolverRegistryService(this.suiClient, this.config);
    this.policies = new SealPolicyService(this.suiClient, this.config);
    // this.batches = new BatchManagerService(this.suiClient, this.config); // Removed - batch concept deprecated
    this.slashing = new SlashManagerService(this.suiClient, this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): IntenusClientConfig {
    return { ...this.config };
  }

  /**
   * Get package ID for current network
   */
  getPackageId(): string {
    return this.config.packageId!;
  }

  /**
   * Get network name
   */
  getNetwork(): string {
    return this.config.network;
  }

  /**
   * Check if client is connected to the network
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.suiClient.getLatestSuiSystemState();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current epoch information
   */
  async getCurrentEpoch(): Promise<{
    epoch: string;
    epochStartTimestamp: string;
    epochDurationMs: string;
  }> {
    try {
      const systemState = await this.suiClient.getLatestSuiSystemState();
      return {
        epoch: systemState.epoch,
        epochStartTimestamp: systemState.epochStartTimestampMs,
        epochDurationMs: systemState.epochDurationMs
      };
    } catch (error: any) {
      throw new Error(`Failed to get epoch info: ${error.message}`);
    }
  }

  /**
   * Get protocol statistics across all services
   */
  async getProtocolStats(): Promise<{
    registry: {
      total_solvers: number;
      min_stake: string;
      withdrawal_cooldown: number;
    };
    current_batch?: {
      batch_id: string;
      intent_count: number;
      solver_count: number;
      status: number;
    };
    network: {
      epoch: string;
      timestamp: string;
    };
  }> {
    try {
      const [registryStats, epochInfo] = await Promise.all([
        this.solvers.getRegistryStats(),
        // this.batches.getCurrentBatch(), // Removed - batch concept deprecated
        this.getCurrentEpoch()
      ]);

      return {
        registry: registryStats,
        current_batch: undefined, // Removed - batch concept deprecated
        network: {
          epoch: epochInfo.epoch,
          timestamp: epochInfo.epochStartTimestamp
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get protocol stats: ${error.message}`);
    }
  }

  /**
   * Validate solver eligibility for participation
   */
  async validateSolverEligibility(solverAddress: string): Promise<{
    is_registered: boolean;
    is_active: boolean;
    stake_amount: string;
    has_slashes: boolean;
    total_slash_percentage: number;
    can_participate: boolean;
    reasons?: string[];
  }> {
    try {
      const [profile, isActive, hasSlashes, slashPercentage] = await Promise.all([
        this.solvers.getSolverProfile(solverAddress),
        this.solvers.isSolverActive(solverAddress),
        this.slashing.hasActiveSlashes(solverAddress),
        this.slashing.calculateTotalSlashPercentage(solverAddress)
      ]);

      const reasons: string[] = [];
      let canParticipate = true;

      if (!profile) {
        reasons.push('Solver not registered');
        canParticipate = false;
      }

      if (!isActive) {
        reasons.push('Solver not active');
        canParticipate = false;
      }

      if (hasSlashes) {
        reasons.push('Solver has active slashes');
        canParticipate = false;
      }

      if (slashPercentage >= 5000) { // 50% or more slashed
        reasons.push('Solver heavily slashed (≥50%)');
        canParticipate = false;
      }

      return {
        is_registered: !!profile,
        is_active: isActive,
        stake_amount: profile?.stake_amount || '0',
        has_slashes: hasSlashes,
        total_slash_percentage: slashPercentage,
        can_participate: canParticipate,
        reasons: reasons.length > 0 ? reasons : undefined
      };
    } catch (error: any) {
      throw new Error(`Failed to validate solver eligibility: ${error.message}`);
    }
  }

  /**
   * Get comprehensive solver dashboard data
   */
  async getSolverDashboard(solverAddress: string): Promise<{
    profile: any;
    eligibility: any;
    slash_records: any[];
    recent_batches: any[];
  }> {
    try {
      const [profile, eligibility, slashRecords] = await Promise.all([
        this.solvers.getSolverProfile(solverAddress),
        this.validateSolverEligibility(solverAddress),
        this.slashing.getSlashRecords(solverAddress)
      ]);

      // Get recent batch history - Removed: batch concept deprecated
      // const currentEpoch = parseInt((await this.getCurrentEpoch()).epoch);
      // const recentBatches = await this.batches.getBatchHistory(
      //   Math.max(0, currentEpoch - 10),
      //   currentEpoch
      // );

      return {
        profile,
        eligibility,
        slash_records: slashRecords,
        recent_batches: [] // Removed - batch concept deprecated
      };
    } catch (error: any) {
      throw new Error(`Failed to get solver dashboard: ${error.message}`);
    }
  }
}
