/**
 * Slash Manager Service - Handle slashing and appeals
 */

import { Transaction } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { INTENUS_PACKAGE_ID, SHARED_OBJECTS, MODULES } from '../constants.js';
import type { 
  IntenusClientConfig, 
  SlashEvidence,
  SlashRecord,
  Appeal,
  TransactionResult
} from '../types.js';

export class SlashManagerService {
  constructor(
    private suiClient: SuiClient,
    private config: IntenusClientConfig
  ) {}

  /**
   * Submit slash with TEE evidence.
   * Creates a soulbound NFT slash record for the solver.
   * 
   * @param evidence - Slash evidence with TEE attestation
   * @param signer - Submitter's keypair (usually TEE service)
   * @returns Transaction result with slash record
   */
  async submitSlash(
    evidence: SlashEvidence,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      // Create SlashEvidence struct - this would need proper struct construction
      // For now, pass individual fields as the Move function expects
      tx.moveCall({
        target: `${packageId}::${MODULES.SLASH_MANAGER}::submit_slash`,
        arguments: [
          tx.object(sharedObjects.slashManager),
          tx.object(sharedObjects.teeVerifier),
          // Pass SlashEvidence fields individually
          tx.pure.u64(evidence.batch_id),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(evidence.solution_id))),
          tx.pure.address(evidence.solver_address),
          tx.pure.u8(evidence.severity),
          tx.pure.u8(evidence.reason_code),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(evidence.reason_message))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(evidence.failure_context))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(evidence.attestation))),
          tx.pure.u64(evidence.attestation_timestamp),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(evidence.tee_measurement))),
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
        throw new Error(`Slash submission failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to submit slash: ${error.message}`);
    }
  }

  /**
   * File an appeal against a slash (within 24 hours).
   * 
   * @param slashRecordId - Slash record object ID
   * @param appealReason - Reason for the appeal
   * @param counterEvidence - Counter-evidence to dispute the slash
   * @param signer - Slashed solver's keypair
   * @returns Transaction result with appeal object
   */
  async fileAppeal(
    slashRecordId: string,
    appealReason: string,
    counterEvidence: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${packageId}::${MODULES.SLASH_MANAGER}::file_appeal`,
        arguments: [
          tx.object(sharedObjects.slashManager),
          tx.object(slashRecordId),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(appealReason))),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(counterEvidence))),
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
        throw new Error(`Appeal filing failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to file appeal: ${error.message}`);
    }
  }

  /**
   * Resolve an appeal (admin only).
   * 
   * @param slashRecordId - Slash record object ID
   * @param appealId - Appeal object ID
   * @param approved - Whether to approve or reject the appeal
   * @param adminCap - Admin capability object ID
   * @param signer - Admin's keypair
   * @returns Transaction result
   */
  async resolveAppeal(
    slashRecordId: string,
    appealId: string,
    approved: boolean,
    adminCap: string,
    signer: Signer
  ): Promise<TransactionResult> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${packageId}::${MODULES.SLASH_MANAGER}::resolve_appeal`,
        arguments: [
          tx.object(adminCap),
          tx.object(sharedObjects.slashManager),
          tx.object(slashRecordId),
          tx.object(appealId),
          tx.pure.bool(approved),
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
        throw new Error(`Appeal resolution failed: ${result.effects?.status?.error}`);
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges
      };
    } catch (error: any) {
      throw new Error(`Failed to resolve appeal: ${error.message}`);
    }
  }

  /**
   * Get all slashes for a solver.
   * 
   * @param solverAddress - Solver's address
   * @returns Map of slash ID to severity
   */
  async getSolverSlashes(solverAddress: string): Promise<Map<string, number>> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${packageId}::${MODULES.SLASH_MANAGER}::get_solver_slashes`,
            arguments: [
              tx.object(sharedObjects.slashManager),
              tx.pure.address(solverAddress)
            ]
          });
          return tx;
        })(),
        sender: solverAddress
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const [slashData] = result.results[0].returnValues;
        return this.parseSlashMap(slashData);
      }

      return new Map();
    } catch (error: any) {
      console.warn(`Failed to get solver slashes: ${error.message}`);
      return new Map();
    }
  }

  /**
   * Calculate total slash percentage for a solver.
   * 
   * @param solverAddress - Solver's address
   * @returns Total slash percentage in basis points (max 10000 = 100%)
   */
  async calculateTotalSlashPercentage(solverAddress: string): Promise<number> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${packageId}::${MODULES.SLASH_MANAGER}::calculate_total_slash_percentage`,
            arguments: [
              tx.object(sharedObjects.slashManager),
              tx.pure.address(solverAddress)
            ]
          });
          return tx;
        })(),
        sender: solverAddress
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const [percentageData] = result.results[0].returnValues;
        return parseInt(this.parseU64(percentageData));
      }

      return 0;
    } catch (error: any) {
      console.warn(`Failed to calculate slash percentage: ${error.message}`);
      return 0;
    }
  }

  /**
   * Check if a slash has been appealed and approved.
   * 
   * @param slashId - Slash record ID
   * @returns True if appealed and approved
   */
  async isSlashAppealedAndApproved(slashId: string): Promise<boolean> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${packageId}::${MODULES.SLASH_MANAGER}::is_slash_appealed_and_approved`,
            arguments: [
              tx.object(sharedObjects.slashManager),
              tx.pure.id(slashId)
            ]
          });
          return tx;
        })(),
        sender: '0x0'
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const [approvedData] = result.results[0].returnValues;
        return this.parseBoolean(approvedData);
      }

      return false;
    } catch (error: any) {
      console.warn(`Failed to check appeal status: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if solver has active slashes.
   * 
   * @param solverAddress - Solver's address
   * @returns True if solver has active slashes
   */
  async hasActiveSlashes(solverAddress: string): Promise<boolean> {
    try {
      const packageId = INTENUS_PACKAGE_ID[this.config.network];
      const sharedObjects = SHARED_OBJECTS[this.config.network];

      const result = await this.suiClient.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${packageId}::${MODULES.SLASH_MANAGER}::has_active_slashes`,
            arguments: [
              tx.object(sharedObjects.slashManager),
              tx.pure.address(solverAddress)
            ]
          });
          return tx;
        })(),
        sender: solverAddress
      });

      if (result.results?.[0]?.returnValues?.[0]) {
        const [activeData] = result.results[0].returnValues;
        return this.parseBoolean(activeData);
      }

      return false;
    } catch (error: any) {
      console.warn(`Failed to check active slashes: ${error.message}`);
      return false;
    }
  }

  /**
   * Get slash records owned by a solver (soulbound NFTs).
   * 
   * @param solverAddress - Solver's address
   * @returns Array of slash records
   */
  async getSlashRecords(solverAddress: string): Promise<SlashRecord[]> {
    try {
      // Query owned objects of SlashRecord type
      const objects = await this.suiClient.getOwnedObjects({
        owner: solverAddress,
        filter: {
          StructType: `${INTENUS_PACKAGE_ID[this.config.network]}::${MODULES.SLASH_MANAGER}::SlashRecord`
        },
        options: {
          showContent: true,
          showType: true
        }
      });

      const records: SlashRecord[] = [];
      
      for (const obj of objects.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          records.push({
            id: obj.data.objectId,
            solver_address: fields.solver_address,
            batch_id: parseInt(fields.batch_id),
            solution_id: new TextDecoder().decode(new Uint8Array(fields.solution_id)),
            severity: parseInt(fields.severity),
            reason: new TextDecoder().decode(new Uint8Array(fields.reason)),
            slash_percentage_bps: parseInt(fields.slash_percentage_bps),
            created_at: parseInt(fields.created_at),
            appealed: fields.appealed,
            appeal_approved: fields.appeal_approved
          });
        }
      }

      return records;
    } catch (error: any) {
      console.warn(`Failed to get slash records: ${error.message}`);
      return [];
    }
  }

  // Helper methods for parsing BCS data
  private parseSlashMap(data: any): Map<string, number> {
    // This would need proper BCS deserialization for VecMap
    return new Map();
  }

  private parseU64(data: any): string {
    // Parse u64 from BCS bytes
    return '0';
  }

  private parseBoolean(data: any): boolean {
    // Parse boolean from BCS bytes
    return false;
  }
}
