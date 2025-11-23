/**
 * Type definitions for Intenus Protocol Client SDK
 */

import type { SuiClient } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import type { Transaction } from '@mysten/sui/transactions';

/**
 * Configuration for Intenus Protocol client
 */
export interface IntenusClientConfig {
  network: 'mainnet' | 'testnet' | 'devnet';
  suiClient?: SuiClient;
  packageId?: string;
}

/**
 * Solver profile information
 */
export interface SolverProfile {
  solver_address: string;
  stake_amount: string;
  reputation_score: number;
  total_batches_participated: number;
  batches_won: number;
  total_surplus_generated: string;
  accuracy_score: number;
  last_submission_epoch: number;
  registration_timestamp: number;
  status: SolverStatus;
  pending_withdrawal?: string;
}

/**
 * Solver status enumeration
 */
export enum SolverStatus {
  ACTIVE = 0,
  SLASHED = 1,
  UNSTAKING = 3
}

/**
 * Ranked Programmable Transaction Block
 */
export interface RankedTx {
  tx_bytes: string; // Base64 encoded Tx
  rank: number;
  solver_address: string;
  solution_id: string;
  estimated_surplus: string;
  gas_budget: string;
}

/**
 * Batch summary information
 */
export interface BatchSummary {
  batch_id: string;
  epoch: number;
  intent_count: number;
  total_value_usd: string;
  solver_count: number;
  winning_solver?: string;
  winning_solution_id?: string;
  total_surplus_generated: string;
  status: BatchStatus;
  created_at: number;
  executed_at?: number;
}

/**
 * Batch status enumeration
 */
export enum BatchStatus {
  OPEN = 0,
  SOLVING = 1,
  RANKING = 2,
  EXECUTED = 3
}

/**
 * Slash evidence structure
 */
export interface SlashEvidence {
  batch_id: number;
  solution_id: string;
  solver_address: string;
  severity: SlashSeverity;
  reason_code: number;
  reason_message: string;
  failure_context: string;
  attestation: string;
  attestation_timestamp: number;
  tee_measurement: string;
}

/**
 * Slash severity levels
 */
export enum SlashSeverity {
  MINOR = 1,      // 5% slash
  SIGNIFICANT = 2, // 20% slash
  MALICIOUS = 3   // 100% slash
}

/**
 * Slash record (soulbound NFT)
 */
export interface SlashRecord {
  id: string;
  solver_address: string;
  batch_id: number;
  solution_id: string;
  severity: SlashSeverity;
  reason: string;
  slash_percentage_bps: number;
  created_at: number;
  appealed: boolean;
  appeal_approved: boolean;
}

/**
 * Appeal information
 */
export interface Appeal {
  id: string;
  slash_id: string;
  solver_address: string;
  reason: string;
  counter_evidence: string;
  created_at: number;
  status: AppealStatus;
}

/**
 * Appeal status enumeration
 */
export enum AppealStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2
}

/**
 * Policy types
 */
export enum PolicyType {
  INTENT = 0,
  STRATEGY = 1,
  USER_HISTORY = 2
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  total_solvers: number;
  min_stake: string;
  withdrawal_cooldown: number;
}

/**
 * Transaction result with object changes
 */
export interface TransactionResult {
  digest: string;
  effects: any;
  objectChanges?: any[] | null;
  balanceChanges?: any[] | null;
}

/**
 * Error class for Intenus client operations
 */
export class IntenusClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'IntenusClientError';
  }
}
