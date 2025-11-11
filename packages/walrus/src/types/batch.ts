/**
 * Batch storage types for Intenus Protocol
 */

import type { QuiltPatch } from './index.js';

export interface BatchIntent {
  intent_id: string;
  user_address: string;
  intent_data: string;
  is_encrypted: boolean;
  seal_policy_id: string | null;
  category: string;
  timestamp: number;
}

export interface BatchManifest {
  batch_id: string;
  epoch: number;
  intent_count: number;
  
  // All intents inline (no separate files)
  intents: BatchIntent[];
  
  // Aggregated metadata
  categories: Record<string, number>;
  estimated_value_usd: number;
  solver_deadline: number;
  created_at: number;
  
  // Solver requirements
  requirements: {
    min_tee_verification: boolean;
    min_stake_required: string;
    max_solutions_per_solver: number;
  };
  
  // Optional Quilt reference for large batches
  quilt_reference?: {
    blob_id: string;
    patches: QuiltPatch[];
  };
}
