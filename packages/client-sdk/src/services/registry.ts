/**
 * Registry Service - Manage Intent and Solution lifecycle
 * This is the core service for submitting intents and solutions
 */

import { Transaction } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { INTENUS_PACKAGE_ID, SHARED_OBJECTS, MODULES } from '../constants.js';
import type { IntenusClientConfig, TransactionResult } from '../types.js';

/**
 * Intent policy configuration (embedded in Intent)
 */
export interface IntentPolicyParams {
  solver_access_start_ms: number;
  solver_access_end_ms: number;
  auto_revoke_ms: number;
  requires_solver_registration: boolean;
  min_solver_stake: string;
  requires_attestation: boolean;
  min_solver_reputation_score: number;
}

/**
 * Intent status constants
 */
export const INTENT_STATUS = {
  PENDING: 0,
  BEST_SOLUTION_SELECTED: 1,
  EXECUTED: 2,
  REVOKED: 3,
} as const;

/**
 * Solution status constants
 */
export const SOLUTION_STATUS = {
  PENDING: 0,
  ATTESTED: 1,
  SELECTED: 2,
  EXECUTED: 3,
  REJECTED: 4,
} as const;

export class RegistryService {
  constructor(
    private suiClient: SuiClient,
    private config: IntenusClientConfig
  ) {}

  /**
   * Create transaction to submit a new intent with embedded policy parameters.
   * The actual intent content (operation, constraints) is stored in Walrus.
   *
   * @param blobId - Walrus blob ID containing the IGS intent
   * @param policy - Policy parameters for access control
   * @param fee - SUI coin object ID for intent fee (minimum MIN_INTENT_FEE)
   * @returns Transaction for intent submission
   */
  submitIntentTransaction(
    blobId: string,
    policy: IntentPolicyParams,
    fee: string
  ): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];

    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::${MODULES.REGISTRY}::submit_intent`,
      arguments: [
        tx.pure.string(blobId),
        tx.pure.u64(policy.solver_access_start_ms),
        tx.pure.u64(policy.solver_access_end_ms),
        tx.pure.u64(policy.auto_revoke_ms),
        tx.pure.bool(policy.requires_solver_registration),
        tx.pure.u64(policy.min_solver_stake),
        tx.pure.bool(policy.requires_attestation),
        tx.pure.u64(policy.min_solver_reputation_score),
        tx.object(fee),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Submit a new intent with embedded policy parameters.
   * The actual intent content (operation, constraints) is stored in Walrus.
   *
   * @param blobId - Walrus blob ID containing the IGS intent
   * @param policy - Policy parameters for access control
   * @param fee - SUI coin object ID for intent fee (minimum MIN_INTENT_FEE)
   * @param signer - User's keypair
   * @returns Transaction result with created Intent object
   */
  async submitIntent(
    blobId: string,
    policy: IntentPolicyParams,
    fee: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const tx = this.submitIntentTransaction(blobId, policy, fee);

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Intent submission failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to submit intent: ${error.message}`);
    }
  }

  /**
   * Create transaction to submit a solution for an intent.
   * The actual solution content (PTB, surplus calculation) is stored in Walrus.
   *
   * @param intentObjectId - Intent object ID
   * @param blobId - Walrus blob ID containing the IGS solution
   * @returns Transaction for solution submission
   */
  submitSolutionTransaction(
    intentObjectId: string,
    blobId: string
  ): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];

    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::${MODULES.REGISTRY}::submit_solution`,
      arguments: [
        tx.object(intentObjectId),
        tx.object(sharedObjects.solverRegistry),
        tx.pure.string(blobId),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Submit a solution for an intent.
   * The actual solution content (PTB, surplus calculation) is stored in Walrus.
   *
   * @param intentObjectId - Intent object ID
   * @param blobId - Walrus blob ID containing the IGS solution
   * @param signer - Solver's keypair
   * @returns Transaction result with created Solution object
   */
  async submitSolution(
    intentObjectId: string,
    blobId: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const tx = this.submitSolutionTransaction(intentObjectId, blobId);

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Solution submission failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to submit solution: ${error.message}`);
    }
  }

  /**
   * Create transaction to attest a solution with enclave signature.
   * Called by enclave after validating the solution off-chain.
   *
   * @param solutionObjectId - Solution object ID
   * @param intentObjectId - Intent object ID
   * @param inputHash - Hash of input data (intent + constraints)
   * @param outputHash - Hash of output data (solution + surplus)
   * @param measurement - Enclave measurement (PCR values)
   * @param signature - Signature from enclave
   * @param timestampMs - Attestation timestamp
   * @returns Transaction for solution attestation
   */
  attestSolutionTransaction(
    solutionObjectId: string,
    intentObjectId: string,
    inputHash: Uint8Array,
    outputHash: Uint8Array,
    measurement: Uint8Array,
    signature: Uint8Array,
    timestampMs: number
  ): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];

    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::${MODULES.REGISTRY}::attest_solution`,
      arguments: [
        tx.object(solutionObjectId),
        tx.object(intentObjectId),
        tx.pure.vector('u8', Array.from(inputHash)),
        tx.pure.vector('u8', Array.from(outputHash)),
        tx.pure.vector('u8', Array.from(measurement)),
        tx.pure.vector('u8', Array.from(signature)),
        tx.pure.u64(timestampMs),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Attest a solution with enclave signature.
   * Called by enclave after validating the solution off-chain.
   *
   * @param solutionObjectId - Solution object ID
   * @param intentObjectId - Intent object ID
   * @param inputHash - Hash of input data (intent + constraints)
   * @param outputHash - Hash of output data (solution + surplus)
   * @param measurement - Enclave measurement (PCR values)
   * @param signature - Signature from enclave
   * @param timestampMs - Attestation timestamp
   * @param signer - Enclave's keypair
   * @returns Transaction result
   */
  async attestSolution(
    solutionObjectId: string,
    intentObjectId: string,
    inputHash: Uint8Array,
    outputHash: Uint8Array,
    measurement: Uint8Array,
    signature: Uint8Array,
    timestampMs: number,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const tx = this.attestSolutionTransaction(
        solutionObjectId,
        intentObjectId,
        inputHash,
        outputHash,
        measurement,
        signature,
        timestampMs
      );

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Solution attestation failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to attest solution: ${error.message}`);
    }
  }

  /**
   * Create transaction to select the best solution for an intent.
   * User selects from attested solutions (typically ranked by AI off-chain).
   *
   * @param intentObjectId - Intent object ID
   * @param solutionId - ID of the selected solution
   * @returns Transaction for solution selection
   */
  selectBestSolutionTransaction(
    intentObjectId: string,
    solutionId: string
  ): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];

    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::${MODULES.REGISTRY}::select_best_solution`,
      arguments: [
        tx.object(intentObjectId),
        tx.pure.id(solutionId),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Select the best solution for an intent.
   * User selects from attested solutions (typically ranked by AI off-chain).
   *
   * @param intentObjectId - Intent object ID
   * @param solutionId - ID of the selected solution
   * @param signer - User's keypair (intent owner)
   * @returns Transaction result
   */
  async selectBestSolution(
    intentObjectId: string,
    solutionId: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const tx = this.selectBestSolutionTransaction(intentObjectId, solutionId);

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Solution selection failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to select solution: ${error.message}`);
    }
  }

  /**
   * Create transaction to execute the selected solution.
   * User executes the best solution after selection.
   *
   * @param intentObjectId - Intent object ID
   * @param solutionObjectId - Solution object ID
   * @returns Transaction for solution execution
   */
  executeSolutionTransaction(
    intentObjectId: string,
    solutionObjectId: string
  ): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];

    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::${MODULES.REGISTRY}::execute_solution`,
      arguments: [
        tx.object(intentObjectId),
        tx.object(solutionObjectId),
        tx.object(sharedObjects.treasury),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Execute the selected solution.
   * User executes the best solution after selection.
   *
   * @param intentObjectId - Intent object ID
   * @param solutionObjectId - Solution object ID
   * @param signer - User's keypair (intent owner)
   * @returns Transaction result
   */
  async executeSolution(
    intentObjectId: string,
    solutionObjectId: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const tx = this.executeSolutionTransaction(intentObjectId, solutionObjectId);

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Solution execution failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to execute solution: ${error.message}`);
    }
  }

  /**
   * Create transaction to reject a solution with reason (for slashing mechanism).
   * Called when attestation fails or solution violates constraints.
   *
   * @param solutionObjectId - Solution object ID
   * @param reason - Rejection reason
   * @returns Transaction for solution rejection
   */
  rejectSolutionTransaction(
    solutionObjectId: string,
    reason: string
  ): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];

    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::${MODULES.REGISTRY}::reject_solution`,
      arguments: [
        tx.object(solutionObjectId),
        tx.object(sharedObjects.solverRegistry),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(reason))),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Reject a solution with reason (for slashing mechanism).
   * Called when attestation fails or solution violates constraints.
   *
   * @param solutionObjectId - Solution object ID
   * @param reason - Rejection reason
   * @param signer - Authorized keypair
   * @returns Transaction result
   */
  async rejectSolution(
    solutionObjectId: string,
    reason: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const tx = this.rejectSolutionTransaction(solutionObjectId, reason);

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Solution rejection failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to reject solution: ${error.message}`);
    }
  }

  /**
   * Create transaction to revoke an intent (only owner can revoke).
   *
   * @param intentObjectId - Intent object ID
   * @returns Transaction for intent revocation
   */
  revokeIntentTransaction(intentObjectId: string): Transaction {
    const packageId = INTENUS_PACKAGE_ID[this.config.network];
    const sharedObjects = SHARED_OBJECTS[this.config.network];

    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::${MODULES.REGISTRY}::revoke_intent`,
      arguments: [
        tx.object(intentObjectId),
        tx.object(sharedObjects.clock)
      ]
    });

    return tx;
  }

  /**
   * Revoke an intent (only owner can revoke).
   *
   * @param intentObjectId - Intent object ID
   * @param signer - User's keypair (intent owner)
   * @returns Transaction result
   */
  async revokeIntent(
    intentObjectId: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const tx = this.revokeIntentTransaction(intentObjectId);

      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(`Intent revocation failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to revoke intent: ${error.message}`);
    }
  }

  /**
   * Get intent object data.
   *
   * @param intentObjectId - Intent object ID
   * @returns Intent object data
   */
  async getIntent(intentObjectId: string): Promise<any> {
    try {
      const result = await this.suiClient.getObject({
        id: intentObjectId,
        options: {
          showContent: true,
          showOwner: true,
          showType: true
        }
      });

      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to get intent: ${error.message}`);
    }
  }

  /**
   * Get solution object data.
   *
   * @param solutionObjectId - Solution object ID
   * @returns Solution object data
   */
  async getSolution(solutionObjectId: string): Promise<any> {
    try {
      const result = await this.suiClient.getObject({
        id: solutionObjectId,
        options: {
          showContent: true,
          showOwner: true,
          showType: true
        }
      });

      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to get solution: ${error.message}`);
    }
  }
}
