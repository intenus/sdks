/**
 * Solver Registry Service - Manage solver registration and staking
 */

import { Transaction } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { INTENUS_PACKAGE_ID, SHARED_OBJECTS, MODULES } from '../constants.js';
import type { 
  IntenusClientConfig, 
  SolverProfile, 
  RegistryStats, 
  TransactionResult,
  IntenusClientError
} from '../types.js';

export class SolverRegistryService {
  constructor(
    private suiClient: SuiClient,
    private config: IntenusClientConfig
  ) {}

  /**
   * Register as a solver with minimum stake requirement.
   * 
   * @param stake - SUI coin object for staking
   * @param signer - Solver's keypair
   * @returns Transaction for registration
   */
  createRegisterTransaction(stake: string): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${packageId}::${MODULES.SOLVER_REGISTRY}::register_solver`,
      arguments: [
        tx.object(sharedObjects.solverRegistry),
        tx.object(stake),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Execute solver registration
   * 
   * @param stake - SUI coin object ID for staking
   * @param signer - Solver's keypair
   * @returns Transaction result
   */
  async registerSolver(
    stake: string, 
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const tx = this.createRegisterTransaction(stake);
      
      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showBalanceChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Registration failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges,
        balanceChanges: result.balanceChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to register solver: ${error.message}`);
    }
  }

  /**
   * Increase stake for existing solver
   * 
   * @param additionalStake - Additional SUI coin object ID
   * @param signer - Solver's keypair
   * @returns Transaction result
   */
  async increaseStake(
    additionalStake: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${packageId}::${MODULES.SOLVER_REGISTRY}::increase_stake`,
        arguments: [
          tx.object(sharedObjects.solverRegistry),
          tx.object(additionalStake)
        ]
      });

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showBalanceChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Stake increase failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges,
        balanceChanges: result.balanceChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to increase stake: ${error.message}`);
    }
  }

  /**
   * Initiate withdrawal process with cooldown
   * 
   * @param amount - Amount to withdraw in MIST
   * @param signer - Solver's keypair
   * @returns Transaction result
   */
  async initiateWithdrawal(
    amount: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${packageId}::${MODULES.SOLVER_REGISTRY}::initiate_withdrawal`,
        arguments: [
          tx.object(sharedObjects.solverRegistry),
          tx.pure.u64(amount),
          tx.object(sharedObjects.clock)
        ]
      });

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Withdrawal initiation failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to initiate withdrawal: ${error.message}`);
    }
  }

  /**
   * Complete withdrawal after cooldown period
   * 
   * @param amount - Amount to withdraw in MIST
   * @param signer - Solver's keypair
   * @returns Transaction result with returned coin
   */
  async completeWithdrawal(
    amount: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${packageId}::${MODULES.SOLVER_REGISTRY}::complete_withdrawal`,
        arguments: [
          tx.object(sharedObjects.solverRegistry),
          tx.object(sharedObjects.slashManager),
          tx.pure.u64(amount),
          tx.object(sharedObjects.clock)
        ]
      });

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showBalanceChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Withdrawal completion failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges,
        balanceChanges: result.balanceChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to complete withdrawal: ${error.message}`);
    }
  }

  /**
   * Get solver profile information
   * 
   * @param solverAddress - Solver's address
   * @returns Solver profile or null if not found
   */
  async getSolverProfile(solverAddress: string): Promise<SolverProfile | null> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${packageId}::${MODULES.SOLVER_REGISTRY}::get_solver_profile`,
            arguments: [
              tx.object(sharedObjects.solverRegistry),
              tx.pure.address(solverAddress)
            ]
          });
          return tx;
        })(),
        sender: solverAddress
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const [profileData] = result.results[0].returnValues;
        // Parse the returned profile data
        // This would need proper BCS deserialization in practice
        return this.parseProfileData(profileData);
      }

      return null;
    } catch (error: any) {
      console.warn(`Failed to get solver profile: ${error.message}`);
      return null;
    }
  }

  /**
   * Get solver stake amount
   * 
   * @param solverAddress - Solver's address
   * @returns Stake amount in MIST
   */
  async getSolverStake(solverAddress: string): Promise<string> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${packageId}::${MODULES.SOLVER_REGISTRY}::get_solver_stake`,
            arguments: [
              tx.object(sharedObjects.solverRegistry),
              tx.pure.address(solverAddress)
            ]
          });
          return tx;
        })(),
        sender: solverAddress
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const [stakeData] = result.results[0].returnValues;
        // Parse u64 from BCS
        return this.parseU64(stakeData);
      }

      return '0';
    } catch (error: any) {
      console.warn(`Failed to get solver stake: ${error.message}`);
      return '0';
    }
  }

  /**
   * Check if solver is active
   * 
   * @param solverAddress - Solver's address
   * @returns True if solver is active
   */
  async isSolverActive(solverAddress: string): Promise<boolean> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${packageId}::${MODULES.SOLVER_REGISTRY}::is_solver_active`,
            arguments: [
              tx.object(sharedObjects.solverRegistry),
              tx.pure.address(solverAddress)
            ]
          });
          return tx;
        })(),
        sender: solverAddress
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const [activeData] = result.results[0].returnValues;
        // Parse boolean from BCS
        return this.parseBoolean(activeData);
      }

      return false;
    } catch (error: any) {
      console.warn(`Failed to check solver status: ${error.message}`);
      return false;
    }
  }

  /**
   * Get registry statistics
   * 
   * @returns Registry stats (total solvers, min stake, cooldown)
   */
  async getRegistryStats(): Promise<RegistryStats> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${packageId}::${MODULES.SOLVER_REGISTRY}::get_registry_stats`,
            arguments: [
              tx.object(sharedObjects.solverRegistry)
            ]
          });
          return tx;
        })(),
        sender: '0x0' // Use dummy address for view functions
      });

      if (result.results?.[0]?.returnValues) {
        const [totalSolvers, minStake, cooldown] = result.results[0].returnValues;
        return {
          total_solvers: parseInt(this.parseU64(totalSolvers)),
          min_stake: this.parseU64(minStake),
          withdrawal_cooldown: parseInt(this.parseU64(cooldown))
        };
      }

      throw new Error('Failed to parse registry stats');
    } catch (error: any) {
      throw new Error(`Failed to get registry stats: ${error.message}`);
    }
  }

  // Helper methods for parsing BCS data
  private parseProfileData(data: any): SolverProfile {
    // This would need proper BCS deserialization
    // For now, return a mock structure
    return {
      solver_address: '0x0',
      stake_amount: '0',
      reputation_score: 0,
      total_batches_participated: 0,
      batches_won: 0,
      total_surplus_generated: '0',
      accuracy_score: 0,
      last_submission_epoch: 0,
      registration_timestamp: 0,
      status: 0,
      pending_withdrawal: undefined
    };
  }

  private parseU64(data: any): string {
    // Parse u64 from BCS bytes
    // This is a simplified implementation
    return '0';
  }

  private parseBoolean(data: any): boolean {
    // Parse boolean from BCS bytes
    return false;
  }
}
