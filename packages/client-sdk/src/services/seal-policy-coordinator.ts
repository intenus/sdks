/**
 * Seal Policy Coordinator Service - Simplified seal approval system
 * Manages access control for Intent and Solution decryption via Seal
 */

import { Transaction } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { INTENUS_PACKAGE_ID, SHARED_OBJECTS, MODULES } from '../constants.js';
import type { IntenusClientConfig, TransactionResult } from '../types.js';

export class SealPolicyCoordinatorService {
  constructor(
    private suiClient: SuiClient,
    private config: IntenusClientConfig
  ) {}

  /**
   * Create transaction to approve intent access for Seal decryption.
   * This transaction is used by Seal SDK to authorize decryption.
   * Following Nautilus pattern: enclave has blanket access.
   *
   * @param intentObjectId - Intent object ID
   * @returns Transaction for approval
   */
  createIntentApprovalTransaction(intentObjectId: string): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];

    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::${MODULES.SEAL_POLICY_COORDINATOR}::seal_approve_intent`,
      arguments: [
        tx.object(intentObjectId),
        tx.object(sharedObjects.enclaveConfig),
        tx.object(sharedObjects.solverRegistry),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Create transaction to approve solution access for Seal decryption.
   * This transaction is used by Seal SDK to authorize decryption.
   *
   * @param solutionObjectId - Solution object ID
   * @returns Transaction for approval
   */
  createSolutionApprovalTransaction(solutionObjectId: string): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];

    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::${MODULES.SEAL_POLICY_COORDINATOR}::seal_approve_solution`,
      arguments: [
        tx.object(solutionObjectId),
        tx.object(sharedObjects.enclaveConfig),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Update enclave public key (admin only).
   * The enclave public key is used to verify that calls come from the trusted enclave.
   *
   * @param newEnclavePk - New enclave public key (ed25519)
   * @param signer - Admin's keypair
   * @returns Transaction result
   */
  async updateEnclavePk(
    newEnclavePk: Uint8Array,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      const tx = new Transaction();

      tx.moveCall({
        target: `${packageId}::${MODULES.SEAL_POLICY_COORDINATOR}::update_enclave_pk`,
        arguments: [
          tx.object(sharedObjects.enclaveConfig),
          tx.pure.vector('u8', Array.from(newEnclavePk)),
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
        throw new Error(`Enclave PK update failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to update enclave PK: ${error.message}`);
    }
  }

  /**
   * Get enclave configuration.
   *
   * @returns Enclave config object data
   */
  async getEnclaveConfig(): Promise<any> {
    try {
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      if (!sharedObjects.enclaveConfig) {
        throw new Error('Enclave config not set for this network');
      }

      const result = await this.suiClient.getObject({
        id: sharedObjects.enclaveConfig,
        options: {
          showContent: true,
          showType: true
        }
      });

      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to get enclave config: ${error.message}`);
    }
  }
}
