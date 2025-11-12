/**
 * Seal Policy Service - Manage encryption policies and access control
 */

import { Transaction } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { INTENUS_PACKAGE_ID, SHARED_OBJECTS, MODULES } from '../constants.js';
import type { 
  IntenusClientConfig, 
  IntentPolicyConfig,
  StrategyPolicyConfig,
  HistoryPolicyConfig,
  PolicyType,
  TransactionResult
} from '../types.js';

export class SealPolicyService {
  constructor(
    private suiClient: SuiClient,
    private config: IntenusClientConfig
  ) {}

  /**
   * Create policy for intent encryption.
   * Controls solver access to encrypted user intents.
   * 
   * @param config - Intent policy configuration
   * @param signer - Policy creator's keypair
   * @returns Transaction result
   */
  async createIntentPolicy(
    config: IntentPolicyConfig,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${packageId}::${MODULES.SEAL_POLICY_COORDINATOR}::create_intent_policy`,
        arguments: [
          tx.object(sharedObjects.policyRegistry),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(config.policy_id))),
          tx.pure.u64(config.batch_id),
          tx.pure.u64(config.solver_access_start_ms),
          tx.pure.u64(config.solver_access_end_ms),
          tx.pure.bool(config.router_access_enabled),
          tx.pure.u64(config.auto_revoke_time),
          tx.pure.bool(config.requires_solver_registration),
          tx.pure.u64(config.min_solver_stake),
          tx.pure.bool(config.requires_tee_attestation),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(config.expected_measurement))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(config.purpose))),
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
        throw new Error(`Intent policy creation failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to create intent policy: ${error.message}`);
    }
  }

  /**
   * Create policy for solver strategy encryption.
   * Protects solver algorithms and parameters.
   * 
   * @param config - Strategy policy configuration
   * @param signer - Solver's keypair
   * @returns Transaction result
   */
  async createStrategyPolicy(
    config: StrategyPolicyConfig,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${packageId}::${MODULES.SEAL_POLICY_COORDINATOR}::create_solver_strategy_policy`,
        arguments: [
          tx.object(sharedObjects.policyRegistry),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(config.policy_id))),
          tx.pure.bool(config.router_can_access),
          tx.pure.u64(config.admin_unlock_time),
          tx.pure.bool(config.is_public),
          tx.pure.bool(config.requires_solver_registration),
          tx.pure.u64(config.min_solver_stake),
          tx.pure.bool(config.requires_tee_attestation),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(config.expected_measurement))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(config.purpose))),
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
        throw new Error(`Strategy policy creation failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to create strategy policy: ${error.message}`);
    }
  }

  /**
   * Create policy for user history encryption.
   * Controls access to user interaction analytics.
   * 
   * @param config - History policy configuration
   * @param signer - User's keypair
   * @returns Transaction result
   */
  async createHistoryPolicy(
    config: HistoryPolicyConfig,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${packageId}::${MODULES.SEAL_POLICY_COORDINATOR}::create_user_history_policy`,
        arguments: [
          tx.object(sharedObjects.policyRegistry),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(config.policy_id))),
          tx.pure.u8(config.router_access_level),
          tx.pure.bool(config.user_can_revoke),
          tx.pure.bool(config.requires_solver_registration),
          tx.pure.u64(config.min_solver_stake),
          tx.pure.bool(config.requires_tee_attestation),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(config.expected_measurement))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(config.purpose))),
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
        throw new Error(`History policy creation failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to create history policy: ${error.message}`);
    }
  }

  /**
   * Create transaction to approve intent access for solvers.
   * Used by Seal SDK for decryption authorization.
   * 
   * @param policyId - Policy identifier (as bytes)
   * @returns Transaction for approval
   */
  createIntentApprovalTransaction(policyId: string): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${packageId}::${MODULES.SEAL_POLICY_COORDINATOR}::seal_approve_intent`,
      arguments: [
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(policyId))),
        tx.object(sharedObjects.policyRegistry),
        tx.object(sharedObjects.solverRegistry),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Create transaction to approve strategy access.
   * Used by Seal SDK for strategy decryption.
   * 
   * @param policyId - Policy identifier (as bytes)
   * @returns Transaction for approval
   */
  createStrategyApprovalTransaction(policyId: string): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${packageId}::${MODULES.SEAL_POLICY_COORDINATOR}::seal_approve_strategy`,
      arguments: [
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(policyId))),
        tx.object(sharedObjects.policyRegistry),
        tx.object(sharedObjects.solverRegistry),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Create transaction to approve history access.
   * Used by Seal SDK for history decryption.
   * 
   * @param policyId - Policy identifier (as bytes)
   * @returns Transaction for approval
   */
  createHistoryApprovalTransaction(policyId: string): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${packageId}::${MODULES.SEAL_POLICY_COORDINATOR}::seal_approve_history`,
      arguments: [
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(policyId))),
        tx.object(sharedObjects.policyRegistry),
        tx.object(sharedObjects.solverRegistry)
      ]
    });

    return tx;
  }

  /**
   * Revoke a policy (owner only).
   * 
   * @param policyType - Type of policy to revoke
   * @param policyId - Policy identifier
   * @param signer - Policy owner's keypair
   * @returns Transaction result
   */
  async revokePolicy(
    policyType: PolicyType,
    policyId: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${packageId}::${MODULES.SEAL_POLICY_COORDINATOR}::revoke_policy`,
        arguments: [
          tx.object(sharedObjects.policyRegistry),
          tx.pure.u8(policyType),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(policyId)))
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
        throw new Error(`Policy revocation failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to revoke policy: ${error.message}`);
    }
  }

  /**
   * Auto-revoke expired policies in batch.
   * Can be called by anyone to clean up expired policies.
   * 
   * @param policyType - Type of policies to check
   * @param policyIds - List of policy IDs to check for expiration
   * @param signer - Any keypair (gas payer)
   * @returns Transaction result
   */
  async autoRevokeExpired(
    policyType: PolicyType,
    policyIds: string[],
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      const policyIdVectors = policyIds.map(id => 
        Array.from(new TextEncoder().encode(id))
      );
      
      tx.moveCall({
        target: `${packageId}::${MODULES.SEAL_POLICY_COORDINATOR}::auto_revoke_expired`,
        arguments: [
          tx.object(sharedObjects.policyRegistry),
          tx.pure.u8(policyType),
          tx.pure.vector('vector<u8>', policyIdVectors),
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
        throw new Error(`Auto-revoke failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to auto-revoke expired policies: ${error.message}`);
    }
  }
}
