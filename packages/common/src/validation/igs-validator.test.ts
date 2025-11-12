/**
 * Tests for IGS AJV Validator
 */

import { describe, it, expect } from 'vitest';
import { 
  validateIGSIntent,
  isValidIGSIntent,
  assertValidIGSIntent,
  validateIGSJSON,
  parseIGSIntent,
  IGSSchemaValidator
} from './igs-validator.js';
import { EXAMPLE_SIMPLE_SWAP, EXAMPLE_LIMIT_ORDER } from '../types/igs.js';
import type { IGSIntent } from '../types/igs.js';

describe('IGS AJV Validator', () => {
  describe('validateIGSIntent', () => {
    it('should validate correct IGS intent (simple swap)', () => {
      const result = validateIGSIntent(EXAMPLE_SIMPLE_SWAP);
      
      expect(result.valid).toBe(true);
      expect(result.compliance_score).toBeGreaterThan(80);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate correct IGS intent (limit order)', () => {
      const result = validateIGSIntent(EXAMPLE_LIMIT_ORDER);
      
      expect(result.valid).toBe(true);
      expect(result.compliance_score).toBeGreaterThan(80);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject intent with missing required fields', () => {
      const invalidIntent = {
        igs_version: '1.0.0',
        // Missing required fields
      };

      const result = validateIGSIntent(invalidIntent as any);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === 'MISSING_REQUIRED_FIELD')).toBe(true);
    });

    it('should reject intent with invalid version', () => {
      const invalidIntent = {
        ...EXAMPLE_SIMPLE_SWAP,
        igs_version: '2.0.0' // Invalid version
      };

      const result = validateIGSIntent(invalidIntent as any);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_CONSTANT_VALUE')).toBe(true);
    });

    it('should reject intent with invalid intent_type', () => {
      const invalidIntent = {
        ...EXAMPLE_SIMPLE_SWAP,
        intent_type: 'invalid.type' // Invalid enum value
      };

      const result = validateIGSIntent(invalidIntent as any);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_ENUM_VALUE')).toBe(true);
    });

    it('should reject intent with invalid asset_id pattern', () => {
      const invalidIntent = {
        ...EXAMPLE_SIMPLE_SWAP,
        operation: {
          ...EXAMPLE_SIMPLE_SWAP.operation,
          inputs: [{
            ...EXAMPLE_SIMPLE_SWAP.operation.inputs[0],
            asset_id: 'invalid_asset_id' // Invalid pattern
          }]
        }
      };

      const result = validateIGSIntent(invalidIntent as any);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_PATTERN')).toBe(true);
    });

    it('should reject intent with invalid amount type', () => {
      const invalidIntent = {
        ...EXAMPLE_SIMPLE_SWAP,
        operation: {
          ...EXAMPLE_SIMPLE_SWAP.operation,
          inputs: [{
            ...EXAMPLE_SIMPLE_SWAP.operation.inputs[0],
            amount: {
              type: 'invalid_type', // Invalid amount type
              value: '100'
            }
          }]
        }
      };

      const result = validateIGSIntent(invalidIntent as any);
      
      expect(result.valid).toBe(false);
    });

    it('should reject intent with expired deadline', () => {
      const expiredIntent = {
        ...EXAMPLE_SIMPLE_SWAP,
        timing: {
          ...EXAMPLE_SIMPLE_SWAP.timing,
          absolute_deadline: Date.now() - 1000 // Past deadline
        },
        constraints: {
          ...EXAMPLE_SIMPLE_SWAP.constraints,
          deadline: Date.now() - 1000 // Past deadline
        }
      };

      const result = validateIGSIntent(expiredIntent);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'EXPIRED_DEADLINE')).toBe(true);
    });

    it('should generate warnings for unusual values', () => {
      const unusualIntent = {
        ...EXAMPLE_SIMPLE_SWAP,
        constraints: {
          ...EXAMPLE_SIMPLE_SWAP.constraints,
          max_slippage_bps: 1500 // 15% slippage - unusual
        }
      };

      const result = validateIGSIntent(unusualIntent);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('unusually high'))).toBe(true);
    });
  });

  describe('isValidIGSIntent', () => {
    it('should return true for valid intent', () => {
      expect(isValidIGSIntent(EXAMPLE_SIMPLE_SWAP)).toBe(true);
      expect(isValidIGSIntent(EXAMPLE_LIMIT_ORDER)).toBe(true);
    });

    it('should return false for invalid intent', () => {
      const invalidIntent = { invalid: 'data' };
      expect(isValidIGSIntent(invalidIntent)).toBe(false);
    });

    it('should work as type guard', () => {
      const unknownData: unknown = EXAMPLE_SIMPLE_SWAP;
      
      if (isValidIGSIntent(unknownData)) {
        // TypeScript should recognize this as IGSIntent
        expect(unknownData.igs_version).toBe('1.0.0');
        expect(unknownData.intent_type).toBe('swap.exact_input');
      }
    });
  });

  describe('assertValidIGSIntent', () => {
    it('should not throw for valid intent', () => {
      expect(() => assertValidIGSIntent(EXAMPLE_SIMPLE_SWAP)).not.toThrow();
    });

    it('should throw for invalid intent', () => {
      const invalidIntent = { invalid: 'data' };
      expect(() => assertValidIGSIntent(invalidIntent)).toThrow('Invalid IGS Intent');
    });

    it('should work as assertion function', () => {
      const unknownData: unknown = EXAMPLE_SIMPLE_SWAP;
      
      assertValidIGSIntent(unknownData);
      // TypeScript should recognize this as IGSIntent after assertion
      expect(unknownData.igs_version).toBe('1.0.0');
    });
  });

  describe('validateIGSJSON', () => {
    it('should validate unknown JSON data', () => {
      const jsonData: unknown = EXAMPLE_SIMPLE_SWAP;
      const result = validateIGSJSON(jsonData);
      
      expect(result.valid).toBe(true);
    });

    it('should reject invalid JSON data', () => {
      const invalidData: unknown = { some: 'invalid', data: 123 };
      const result = validateIGSJSON(invalidData);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('parseIGSIntent', () => {
    it('should parse valid JSON string', () => {
      const jsonString = JSON.stringify(EXAMPLE_SIMPLE_SWAP);
      const result = parseIGSIntent(jsonString);
      
      expect(result.validation.valid).toBe(true);
      expect(result.intent).toBeDefined();
      expect(result.intent?.igs_version).toBe('1.0.0');
    });

    it('should handle invalid JSON string', () => {
      const invalidJson = '{ invalid json }';
      const result = parseIGSIntent(invalidJson);
      
      expect(result.validation.valid).toBe(false);
      expect(result.intent).toBeUndefined();
      expect(result.validation.errors.some(e => e.code === 'JSON_PARSE_ERROR')).toBe(true);
    });

    it('should handle valid JSON but invalid IGS', () => {
      const invalidIGS = JSON.stringify({ some: 'data' });
      const result = parseIGSIntent(invalidIGS);
      
      expect(result.validation.valid).toBe(false);
      expect(result.intent).toBeUndefined();
    });
  });

  describe('Business Logic Validation', () => {
    it('should detect intent type and operation mode mismatch', () => {
      const mismatchIntent = {
        ...EXAMPLE_SIMPLE_SWAP,
        intent_type: 'swap.exact_output' as const,
        operation: {
          ...EXAMPLE_SIMPLE_SWAP.operation,
          mode: 'exact_input' as const
        }
      };

      const result = validateIGSIntent(mismatchIntent);
      
      expect(result.valid).toBe(true); // Still valid, but has warning
      expect(result.warnings.some(w => w.includes('mismatch'))).toBe(true);
    });

    it('should detect ranking weights that do not sum to 100', () => {
      const badWeightsIntent = {
        ...EXAMPLE_SIMPLE_SWAP,
        preferences: {
          ...EXAMPLE_SIMPLE_SWAP.preferences,
          ranking_weights: {
            surplus_weight: 60,
            gas_cost_weight: 30,
            execution_speed_weight: 20, // Total = 110
            reputation_weight: 0
          }
        }
      };

      const result = validateIGSIntent(badWeightsIntent);
      
      expect(result.valid).toBe(true); // Still valid, but has warning
      expect(result.warnings.some(w => w.includes('sum to'))).toBe(true);
    });

    it('should require limit_price for limit orders', () => {
      const { limit_price, ...constraintsWithoutLimitPrice } = EXAMPLE_LIMIT_ORDER.constraints;
      const limitOrderWithoutPrice = {
        ...EXAMPLE_LIMIT_ORDER,
        constraints: constraintsWithoutLimitPrice
      };

      const result = validateIGSIntent(limitOrderWithoutPrice as any);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_LIMIT_PRICE')).toBe(true);
    });

    it('should warn about low benchmark confidence', () => {
      const lowConfidenceIntent = {
        ...EXAMPLE_SIMPLE_SWAP,
        operation: {
          ...EXAMPLE_SIMPLE_SWAP.operation,
          expected_outcome: {
            ...EXAMPLE_SIMPLE_SWAP.operation.expected_outcome,
            benchmark: {
              ...EXAMPLE_SIMPLE_SWAP.operation.expected_outcome.benchmark,
              confidence: 0.5 // Low confidence
            }
          }
        }
      };

      const result = validateIGSIntent(lowConfidenceIntent);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('Low benchmark confidence'))).toBe(true);
    });
  });

  describe('Compliance Scoring', () => {
    it('should give high score for perfect intent', () => {
      const result = validateIGSIntent(EXAMPLE_SIMPLE_SWAP);
      expect(result.compliance_score).toBeGreaterThan(90);
    });

    it('should reduce score for errors', () => {
      const invalidIntent = {
        ...EXAMPLE_SIMPLE_SWAP,
        igs_version: '2.0.0' // Invalid version
      };

      const result = validateIGSIntent(invalidIntent as any);
      expect(result.compliance_score).toBeLessThan(80);
    });

    it('should reduce score for warnings', () => {
      const warningIntent = {
        ...EXAMPLE_SIMPLE_SWAP,
        constraints: {
          ...EXAMPLE_SIMPLE_SWAP.constraints,
          max_slippage_bps: 1500 // High slippage warning
        }
      };

      const result = validateIGSIntent(warningIntent);
      expect(result.compliance_score).toBeLessThan(100);
      expect(result.compliance_score).toBeGreaterThan(80);
    });
  });

  describe('AJV Error Mapping', () => {
    it('should map AJV errors to IGS error codes correctly', () => {
      const result = IGSSchemaValidator.validate({});
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_REQUIRED_FIELD')).toBe(true);
    });

    it('should provide readable error messages', () => {
      const result = IGSSchemaValidator.validate({
        igs_version: '1.0.0',
        intent_type: 'invalid_type'
      });
      
      expect(result.valid).toBe(false);
      const enumError = result.errors.find(e => e.code === 'INVALID_ENUM_VALUE');
      expect(enumError?.message).toContain('Must be one of');
    });
  });
});
