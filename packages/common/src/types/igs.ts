/**
 * Intenus General Standard (IGS) v1.0.0
 * Zod schemas for IGS Intent and Solution with full JSON Schema draft-07 compliance
 *
 * IGS Intent: Full intent specification stored in Walrus
 * IGS Solution: Minimal solver submission (solver_address + tx_bytes)
 */

import { z } from 'zod';

// ============================================================================
// IGS Object Schema (On-chain Sui object that references Walrus blob)
// ============================================================================

const IGSAccessConditionSchema = z.object({
  requires_solver_registration: z.boolean(),
  min_solver_stake: z.string().regex(/^[0-9]+$/),
  requires_tee_attestation: z.boolean(),
  expected_measurement: z.string(),
  purpose: z.string().max(200),
});

const IGSSolverAccessWindowSchema = z.object({
  start_ms: z.number().min(0),
  end_ms: z.number().min(0),
});

const IGSPolicySchema = z.object({
  solver_access_window: IGSSolverAccessWindowSchema,
  auto_revoke_time: z.number().min(0),
  access_condition: IGSAccessConditionSchema,
});

const IGSObjectSchema = z.object({
  user_address: z.string().regex(/^0x[a-fA-F0-9]{1,64}$/),
  created_ts: z.number().min(0),
  policy: IGSPolicySchema,
});

// ============================================================================
// IGS Amount Types (exact, range, all)
// ============================================================================

const IGSAmountExactSchema = z.object({
  type: z.literal('exact'),
  value: z.string().regex(/^[0-9]+$/),
});

const IGSAmountRangeSchema = z.object({
  type: z.literal('range'),
  min: z.string().regex(/^[0-9]+$/),
  max: z.string().regex(/^[0-9]+$/),
});

const IGSAmountAllSchema = z.object({
  type: z.literal('all'),
});

const IGSAmountSchema = z.union([
  IGSAmountExactSchema,
  IGSAmountRangeSchema,
  IGSAmountAllSchema,
]);

// ============================================================================
// IGS Asset Flow (inputs/outputs)
// ============================================================================

const IGSAssetInfoSchema = z.object({
  symbol: z.string().min(1).max(20).regex(/^[A-Z0-9]+$/),
  decimals: z.number().min(0).max(18),
  name: z.string().max(100).optional(),
});

const IGSAssetFlowSchema = z.object({
  asset_id: z.string().regex(/^(0x[a-fA-F0-9]{1,64}::[a-zA-Z0-9_]+::[a-zA-Z0-9_]+|native)$/),
  asset_info: IGSAssetInfoSchema.optional(),
  amount: IGSAmountSchema,
});

// ============================================================================
// IGS Expected Outcome
// ============================================================================

const IGSExpectedOutputSchema = z.object({
  asset_id: z.string(),
  amount: z.string().regex(/^[0-9]+$/),
});

const IGSExpectedCostsSchema = z.object({
  gas_estimate: z.string().regex(/^[0-9]+(\.[0-9]+)?$/).optional(),
  protocol_fees: z.string().regex(/^[0-9]+(\.[0-9]+)?$/).optional(),
  slippage_estimate: z.string().regex(/^[0-9]+(\.[0-9]+)?$/).optional(),
});

const IGSBenchmarkSchema = z.object({
  source: z.enum(['dex_aggregator', 'oracle', 'manual', 'calculated']).optional(),
  timestamp: z.number().min(0).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const IGSMarketPriceSchema = z.object({
  price: z.string().regex(/^[0-9]+(\.[0-9]+)?$/),
  price_asset: z.string(),
});

const IGSExpectedOutcomeSchema = z.object({
  expected_outputs: z.array(IGSExpectedOutputSchema).min(1),
  expected_costs: IGSExpectedCostsSchema.optional(),
  benchmark: IGSBenchmarkSchema.optional(),
  market_price: IGSMarketPriceSchema.optional(),
});

// ============================================================================
// IGS Operation
// ============================================================================

const IGSOperationSchema = z.object({
  mode: z.enum(['exact_input', 'exact_output', 'limit_order']),
  inputs: z.array(IGSAssetFlowSchema).min(1).max(10),
  outputs: z.array(IGSAssetFlowSchema).min(1).max(10),
  expected_outcome: IGSExpectedOutcomeSchema.optional(),
});

// ============================================================================
// IGS Constraints
// ============================================================================

const IGSMaxInputSchema = z.object({
  asset_id: z.string(),
  amount: z.string().regex(/^[0-9]+$/),
});

const IGSMinOutputSchema = z.object({
  asset_id: z.string(),
  amount: z.string().regex(/^[0-9]+$/),
});

const IGSMaxGasCostSchema = z.object({
  asset_id: z.string(),
  amount: z.string().regex(/^[0-9]+$/),
});

const IGSRoutingSchema = z.object({
  max_hops: z.number().min(1).max(10).optional(),
  blacklist_protocols: z.array(z.string()).optional(),
  whitelist_protocols: z.array(z.string()).optional(),
});

const IGSLimitPriceSchema = z.object({
  price: z.string().regex(/^[0-9]+(\.[0-9]+)?$/),
  comparison: z.enum(['gte', 'lte']),
  price_asset: z.string(),
});

const IGSConstraintsSchema = z.object({
  max_slippage_bps: z.number().min(0).max(10000).optional(),
  deadline_ms: z.number().min(0).optional(),
  max_inputs: z.array(IGSMaxInputSchema).optional(),
  min_outputs: z.array(IGSMinOutputSchema).optional(),
  max_gas_cost: IGSMaxGasCostSchema.optional(),
  routing: IGSRoutingSchema.optional(),
  limit_price: IGSLimitPriceSchema.optional(),
});

// ============================================================================
// IGS Preferences
// ============================================================================

const IGSRankingWeightsSchema = z.object({
  surplus_weight: z.number().min(0).max(100).default(60),
  gas_cost_weight: z.number().min(0).max(100).default(20),
  execution_speed_weight: z.number().min(0).max(100).default(10),
  reputation_weight: z.number().min(0).max(100).default(10),
});

const IGSExecutionPreferencesSchema = z.object({
  mode: z.enum(['best_solution', 'top_n_with_best_incentive']).default('best_solution').optional(),
  show_top_n: z.number().min(1).max(10).default(3).optional(),
});

const IGSPrivacyPreferencesSchema = z.object({
  encrypt_intent: z.boolean().default(false).optional(),
  anonymous_execution: z.boolean().default(false).optional(),
});

const IGSPreferencesSchema = z.object({
  optimization_goal: z.enum(['maximize_output', 'minimize_gas', 'fastest_execution', 'balanced']).default('balanced').optional(),
  ranking_weights: IGSRankingWeightsSchema.optional(),
  execution: IGSExecutionPreferencesSchema.optional(),
  privacy: IGSPrivacyPreferencesSchema.optional(),
});

// ============================================================================
// IGS Metadata
// ============================================================================

const IGSOriginalInputSchema = z.object({
  text: z.string().max(1000),
  language: z.string().regex(/^[a-z]{2}$/),
  confidence: z.number().min(0).max(1),
});

const IGSClientSchema = z.object({
  name: z.string(),
  version: z.string(),
  platform: z.string(),
});

const IGSMetadataSchema = z.object({
  original_input: IGSOriginalInputSchema.optional(),
  client: IGSClientSchema.optional(),
  warnings: z.array(z.string()).optional(),
  clarifications: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// IGS Intent Type
// ============================================================================

export const IGSIntentTypeSchema = z.enum([
  'swap.exact_input',
  'swap.exact_output',
  'limit.sell',
  'limit.buy',
]);

// ============================================================================
// FULL IGS INTENT SCHEMA
// ============================================================================

export const IGSIntentSchema = z.object({
  // Core required fields
  igs_version: z.literal('1.0.0'),
  object: IGSObjectSchema,
  user_address: z.string().regex(/^0x[a-fA-F0-9]{1,64}$/),
  intent_type: IGSIntentTypeSchema,
  operation: IGSOperationSchema,

  // Optional fields
  description: z.string().min(1).max(500).optional(),
  constraints: IGSConstraintsSchema.optional(),
  preferences: IGSPreferencesSchema.optional(),
  metadata: IGSMetadataSchema.optional(),
});

// ============================================================================
// IGS SOLUTION SCHEMA (Minimal solver submission)
// ============================================================================

export const IGSSolutionSchema = z.object({
  solver_address: z.string().regex(/^0x[a-fA-F0-9]{1,64}$/),
  tx_bytes: z.string().min(1),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type IGSIntent = z.infer<typeof IGSIntentSchema>;
export type IGSSolution = z.infer<typeof IGSSolutionSchema>;
export type IGSIntentType = z.infer<typeof IGSIntentTypeSchema>;

// Component types (exported for use in builders and other SDKs)
export type IGSObject = z.infer<typeof IGSObjectSchema>;
export type IGSOperation = z.infer<typeof IGSOperationSchema>;
export type IGSConstraints = z.infer<typeof IGSConstraintsSchema>;
export type IGSPreferences = z.infer<typeof IGSPreferencesSchema>;
export type IGSMetadata = z.infer<typeof IGSMetadataSchema>;
export type IGSAssetFlow = z.infer<typeof IGSAssetFlowSchema>;
export type IGSAmount = z.infer<typeof IGSAmountSchema>;
export type IGSExpectedOutcome = z.infer<typeof IGSExpectedOutcomeSchema>;
export type IGSRankingWeights = z.infer<typeof IGSRankingWeightsSchema>;
export type IGSExecutionPreferences = z.infer<typeof IGSExecutionPreferencesSchema>;
export type IGSPrivacyPreferences = z.infer<typeof IGSPrivacyPreferencesSchema>;
export type IGSRouting = z.infer<typeof IGSRoutingSchema>;
export type IGSLimitPrice = z.infer<typeof IGSLimitPriceSchema>;
export type IGSPolicy = z.infer<typeof IGSPolicySchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate an IGS intent against the schema
 */
export function validateIGSIntent(data: unknown): { success: true; data: IGSIntent } | { success: false; errors: z.ZodError } {
  const result = IGSIntentSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate an IGS solution against the schema
 */
export function validateIGSSolution(data: unknown): { success: true; data: IGSSolution } | { success: false; errors: z.ZodError } {
  const result = IGSSolutionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// ============================================================================
// BACKWARD COMPATIBILITY TYPES
// ============================================================================

/**
 * Validation error structure (for AJV validator compatibility)
 */
export interface IGSValidationError {
  code: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validation result structure (for AJV validator compatibility)
 */
export interface IGSValidationResult {
  valid: boolean;
  errors: IGSValidationError[];
  warnings: string[];
  compliance_score?: number;
}

// Placeholder types for backward compatibility (will be removed after full migration)
export type IGSRankedSolution = any;
export type IGSSolutionSubmission = any;
