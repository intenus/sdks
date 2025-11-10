/**
 * Batch structure (from backend)
 */
export interface Batch {
  batch_id: string;
  epoch: number;
  start_time: number;
  end_time: number;
  solver_deadline: number;
  intent_ids: string[];
  intent_count: number;
  categories: Record<string, number>;
  estimated_value_usd: number;
  status: BatchStatus;
}

export enum BatchStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PUBLISHED = 'published',
  SOLVING = 'solving',
  SOLVED = 'solved',
  RANKING = 'ranking',
  READY = 'ready',
  EXECUTED = 'executed',
  ARCHIVED = 'archived',
}

/**
 * Batch manifest on Walrus (for solvers)
 */
export interface BatchManifest {
  batch_id: string;
  epoch: number;
  intent_count: number;
  intents: IntentReference[];
  solver_deadline: number;
  requirements: BatchRequirements;
}

export interface IntentReference {
  intent_id: string;
  walrus_blob_id: string;
  intent_hash: string;
  category: string;
  is_encrypted: boolean;
  seal_policy_id?: string;
}

export interface BatchRequirements {
  min_tee_verification: boolean;
  max_solutions_per_solver: number;
  min_stake_required: string;
}
