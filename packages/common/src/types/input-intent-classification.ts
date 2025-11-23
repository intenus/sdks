/**
 * Input Intent Classification Schema
 * Types and Zod schemas for intent classification features
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export enum TimeInForce {
  immediate = "immediate",
  good_til_cancel = "good_til_cancel",
  fill_or_kill = "fill_or_kill"
}

export enum OptimizationGoal {
  maximize_output = "maximize_output",
  minimize_gas = "minimize_gas",
  fastest_execution = "fastest_execution",
  balanced = "balanced"
}

export enum AssetType {
  native = "native",
  stable = "stable",
  volatile = "volatile"
}

// ============================================================================
// ZOD SCHEMAS FOR ENUMS
// ============================================================================

export const TimeInForceSchema = z.enum([
  "immediate",
  "good_til_cancel",
  "fill_or_kill"
]);

export const OptimizationGoalSchema = z.enum([
  "maximize_output",
  "minimize_gas",
  "fastest_execution",
  "balanced"
]);

export const AssetTypeSchema = z.enum([
  "native",
  "stable",
  "volatile"
]);

// ============================================================================
// INPUT INTENT CLASSIFICATION SCHEMA
// ============================================================================

export const InputIntentClassificationSchema = z.object({
  // Numerical features
  solver_window_ms: z.number().int().min(0),
  user_decision_timeout_ms: z.number().int().min(0),
  time_to_deadline_ms: z.number().int().min(0),
  max_slippage_bps: z.number().int().min(0).max(10000),
  max_gas_cost_usd: z.number().min(0),
  max_hops: z.number().int().min(1).max(10),
  surplus_weight: z.number().int().min(0).max(100),
  gas_cost_weight: z.number().int().min(0).max(100),
  execution_speed_weight: z.number().int().min(0).max(100),
  reputation_weight: z.number().int().min(0).max(100),
  input_count: z.number().int().min(1),
  output_count: z.number().int().min(1),
  input_value_usd: z.number().min(0),
  expected_output_value_usd: z.number().min(0),
  benchmark_confidence: z.number().min(0).max(1),
  expected_gas_usd: z.number().min(0),
  expected_slippage_bps: z.number().int().min(0).max(10000),
  nlp_confidence: z.number().min(0).max(1),
  tag_count: z.number().int().min(0),

  // Categorical features (enums)
  time_in_force: TimeInForceSchema,
  optimization_goal: OptimizationGoalSchema,
  benchmark_source: z.string().min(1).max(100), // coingecko, 1inch, paraswap, internal, etc.
  client_platform: z.string().min(1).max(100), // web, mobile, api, bot

  // Array features
  input_asset_types: z.array(AssetTypeSchema).min(1),
  output_asset_types: z.array(AssetTypeSchema).min(1),

  // Boolean features
  has_whitelist: z.boolean(),
  has_blacklist: z.boolean(),
  has_limit_price: z.boolean(),
  require_simulation: z.boolean(),
  has_nlp_input: z.boolean(),
});

// ============================================================================
// TYPESCRIPT TYPES (INFERRED FROM ZOD)
// ============================================================================

export type InputIntentClassification = z.infer<typeof InputIntentClassificationSchema>;
export type TimeInForceType = z.infer<typeof TimeInForceSchema>;
export type OptimizationGoalType = z.infer<typeof OptimizationGoalSchema>;
export type AssetTypeType = z.infer<typeof AssetTypeSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate an InputIntentClassification against the schema
 */
export function validateInputIntentClassification(
  data: unknown
): { success: true; data: InputIntentClassification } | { success: false; errors: z.ZodError } {
  const result = InputIntentClassificationSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Check if data is a valid InputIntentClassification
 */
export function isValidInputIntentClassification(data: unknown): data is InputIntentClassification {
  return InputIntentClassificationSchema.safeParse(data).success;
}

/**
 * Assert that data is a valid InputIntentClassification (throws on error)
 */
export function assertValidInputIntentClassification(data: unknown): asserts data is InputIntentClassification {
  const result = InputIntentClassificationSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid InputIntentClassification: ${result.error.message}`);
  }
}
